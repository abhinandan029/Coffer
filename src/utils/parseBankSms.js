// Set true only to test with texts from a normal phone number
const ALLOW_ANY_SENDER = false;

const CURRENCY_AMOUNT = /(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i;

const VERB_AMOUNT = /\b(?:debited|spent|paid|withdrawn|sent|deducted)\s+(?:by|for|of|with)?\s*([\d,]+(?:\.\d{1,2})?)/i;

const DEBIT = /\b(debited|debit(?!\s+card)|dr|spent|withdrawn|paid|purchase|sent|deducted|txn of)\b/i;
const CREDIT = /\b(credited|cr|received|deposited|refund(?:ed)?)\b/i;
const IGNORE = /\b(otp|one time password|offer|loan|pre-?approved|cashback offer)\b/i;

const isBankSender = (address) => /[A-Za-z]/.test(address);

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return String(h);
}

export function parseBankSms({ body, address, date }) {
  if (!body || !address) return null;
  if (!ALLOW_ANY_SENDER && !isBankSender(address)) return null;
  if (IGNORE.test(body)) return null;

  const amt = body.match(CURRENCY_AMOUNT) ?? body.match(VERB_AMOUNT);
  if (!amt) return null;

  // "Dr. from a/c ... and Cr. to merchant" is a debit: whichever word comes first wins
  const d = body.search(DEBIT);
  const c = body.search(CREDIT);
  const isDebit = d >= 0 && (c < 0 || d < c);
  const isCredit = c >= 0 && (d < 0 || c < d);
  if (!isDebit && !isCredit) return null;

  // Prefer a UPI id ("to name@bank"), else a name after at/to/from
  const upi = body.match(/(?:\bto\b|\bfrom\b|VPA)\s+([A-Za-z0-9._-]+@[A-Za-z0-9]+)/i)?.[1];
  const named = body
    .match(
      /(?:\bat\b|\bto\b|\bfrom\b|info:?)\s+([A-Za-z0-9][A-Za-z0-9&._ -]{2,29}?)(?=\s+(?:on|via|ref\w*|using|avl\w*|upi)\b|[.,:;]|$)/i
    )?.[1]
    ?.trim();
  const merchant = upi ?? named ?? null;

  const account = body.match(/(?:a\/c|acct?|card)\s*(?:no\.?)?\s*[X*]*(\d{3,6})/i)?.[1] ?? null;

  return {
    id: simpleHash(`${address}|${body}`), // same SMS => same id
    type: isDebit ? 'debit' : 'credit',
    amount: parseFloat(amt[1].replace(/,/g, '')),
    merchant,
    account,
    sender: address,
    date: new Date(date).toISOString(),
    raw: body,
  };
}