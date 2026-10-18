package expo.modules.smsreader

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

// Decides whether an SMS is a bank debit worth notifying about.
// Keep in sync with src/utils/parseBankSms.js
object SmsFilter {
  // Set true only to test with texts from a normal phone number
  const val ALLOW_ANY_SENDER = false

  private val LETTER = Regex("[A-Za-z]")
  private val CURRENCY_AMOUNT =
    Regex("(?:rs\\.?|inr|₹)\\s?([\\d,]+(?:\\.\\d{1,2})?)", RegexOption.IGNORE_CASE)
  // Fallback for banks that write "debited by 500.0" with no currency symbol
  private val VERB_AMOUNT = Regex(
    "\\b(?:debited|spent|paid|withdrawn|sent|deducted)\\s+(?:by|for|of|with)?\\s*([\\d,]+(?:\\.\\d{1,2})?)",
    RegexOption.IGNORE_CASE
  )
  private val DEBIT = Regex(
    "\\b(debited|debit(?!\\s+card)|dr|spent|withdrawn|paid|purchase|sent|deducted|txn of)\\b",
    RegexOption.IGNORE_CASE
  )
  private val CREDIT = Regex(
    "\\b(credited|cr|received|deposited|refund(?:ed)?)\\b",
    RegexOption.IGNORE_CASE
  )
  private val IGNORE = Regex(
    "\\b(otp|one time password|offer|loan|pre-?approved|cashback offer)\\b",
    RegexOption.IGNORE_CASE
  )

  // amount is non-null only for a debit we should act on; reason is for the log
  class Result(val amount: String?, val reason: String)

  fun check(address: String, body: String): Result {
    // Bank senders are alphanumeric IDs; a plain phone number has no letters
    if (!ALLOW_ANY_SENDER && !LETTER.containsMatchIn(address)) {
      return Result(null, "ignored: sender is a phone number")
    }
    if (IGNORE.containsMatchIn(body)) return Result(null, "ignored: otp/offer/loan text")

    val amount = CURRENCY_AMOUNT.find(body)?.groupValues?.get(1)
      ?: VERB_AMOUNT.find(body)?.groupValues?.get(1)
      ?: return Result(null, "ignored: no amount found")

    // "debited from a/c ... credited to merchant" is a debit: whichever word comes first wins
    val d = DEBIT.find(body)?.range?.first ?: -1
    val c = CREDIT.find(body)?.range?.first ?: -1
    val isDebit = d >= 0 && (c < 0 || d < c)

    return if (isDebit) Result(amount, "debit of $amount accepted")
    else Result(null, "ignored: not a debit")
  }
}

// Payments made through Coffer itself. The bank's SMS for these must be ignored,
// otherwise the same payment would be added twice.
object AppPayments {
  private const val PREFS = "sms_reader_app_payments"
  private const val KEY = "items"

  private fun load(raw: String?): JSONArray {
    return try {
      JSONArray(raw ?: "[]")
    } catch (e: Exception) {
      JSONArray()
    }
  }

  // Called from the app when a payment is made through Coffer
  @Synchronized
  fun register(ctx: Context, amount: Double, ttlMs: Long) {
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = load(prefs.getString(KEY, "[]"))
    val now = System.currentTimeMillis()

    val kept = JSONArray()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      if (o.optLong("until") > now) kept.put(o) // drop expired ones
    }
    val entry = JSONObject()
    entry.put("amount", amount)
    entry.put("until", now + ttlMs)
    kept.put(entry)

    prefs.edit().putString(KEY, kept.toString()).commit()
  }

  // True (and uses up one entry) if this SMS amount matches a recent in-app payment
  @Synchronized
  fun consumeIfMatches(ctx: Context, amount: Double): Boolean {
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = load(prefs.getString(KEY, "[]"))
    val now = System.currentTimeMillis()

    var matched = false
    val kept = JSONArray()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      if (o.optLong("until") <= now) continue // expired
      if (!matched && Math.abs(o.optDouble("amount") - amount) < 0.01) {
        matched = true // use it up, do not keep
        continue
      }
      kept.put(o)
    }

    prefs.edit().putString(KEY, kept.toString()).commit()
    return matched
  }
}

// Tiny on-device queue so the app can pick up SMS that arrived while it was closed
object SmsQueue {
  private const val PREFS = "sms_reader_queue"
  private const val KEY = "pending"

  @Synchronized
  fun add(ctx: Context, address: String, body: String, date: Long) {
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = try {
      JSONArray(prefs.getString(KEY, "[]") ?: "[]")
    } catch (e: Exception) {
      JSONArray()
    }
    val o = JSONObject()
    o.put("address", address)
    o.put("body", body)
    o.put("date", date)
    arr.put(o)
    prefs.edit().putString(KEY, arr.toString()).commit()
  }

  @Synchronized
  fun drain(ctx: Context): List<Map<String, Any?>> {
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = try {
      JSONArray(prefs.getString(KEY, "[]") ?: "[]")
    } catch (e: Exception) {
      JSONArray()
    }
    prefs.edit().remove(KEY).commit()

    val out = ArrayList<Map<String, Any?>>()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      val item = HashMap<String, Any?>()
      item["address"] = o.optString("address")
      item["body"] = o.optString("body")
      item["date"] = o.optLong("date").toDouble()
      out.add(item)
    }
    return out
  }
}

object SmsNotifier {
  private const val CHANNEL = "expenses_native"

  @Suppress("DEPRECATION")
  fun show(ctx: Context, amount: String) {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= 26) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL, "Detected expenses", NotificationManager.IMPORTANCE_HIGH)
      )
    }

    val builder = if (Build.VERSION.SDK_INT >= 26) {
      Notification.Builder(ctx, CHANNEL)
    } else {
      Notification.Builder(ctx)
    }

    builder
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle("Expense detected")
      .setContentText("₹" + amount + " spent. Tap to review.")
      .setAutoCancel(true)

    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
    if (launch != null) {
      val pi = PendingIntent.getActivity(
        ctx, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
      )
      builder.setContentIntent(pi)
    }

    nm.notify(System.currentTimeMillis().toInt(), builder.build())
  }
}

// Woken by Android for every incoming SMS, even when the app is not running
class SmsBackgroundReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    val msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    if (msgs == null || msgs.isEmpty()) return

    val address = msgs[0].originatingAddress ?: return
    val sb = StringBuilder()
    for (m in msgs) {
      sb.append(m.messageBody ?: "")
    }
    val body = sb.toString()

    // Logs only the sender and the decision, never the message text
    val result = SmsFilter.check(address, body)
    Log.d("CofferSms", "from=$address -> ${result.reason}")

    val amount = result.amount ?: return

    // Paid through Coffer? Then the app already has this payment: ignore the bank's SMS.
    val amountValue = amount.replace(",", "").toDoubleOrNull()
    if (amountValue != null && AppPayments.consumeIfMatches(context, amountValue)) {
      Log.d("CofferSms", "from=$address -> ignored: matches a payment made in Coffer")
      return
    }

    SmsQueue.add(context, address, body, System.currentTimeMillis())
    SmsNotifier.show(context, amount)
  }
}