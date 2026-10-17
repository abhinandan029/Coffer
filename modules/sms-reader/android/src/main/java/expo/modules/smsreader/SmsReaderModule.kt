package expo.modules.smsreader

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsReaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SmsReader")

    // Returns (and clears) the SMS the background receiver queued while the app was closed
    AsyncFunction("drainQueue") {
      val ctx = appContext.reactContext ?: throw Exception("React context not available")
      SmsQueue.drain(ctx)
    }

    // Tell the receiver a payment of `amount` was just made through Coffer,
    // so the bank's SMS for it (within ttlMs) is ignored instead of added again.
    Function("registerAppPayment") { amount: Double, ttlMs: Double ->
      val ctx = appContext.reactContext ?: throw Exception("React context not available")
      AppPayments.register(ctx, amount, ttlMs.toLong())
    }
  }
}