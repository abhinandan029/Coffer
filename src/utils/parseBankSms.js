// src/utils/parseBankSms.js
// Turns a raw bank SMS into { type, amount, merchant, ... } or null.

const AMOUNT = /(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i;
const DEBIT = /\b(debited|spent|withdrawn|paid|purchase|sent|txn of)\b/i;
const CREDIT = /\b(credited|received|deposited|refund(?:ed)?)\b/i;
const IGNORE = /\b(otp|one time password|offer|loan|pre-?approved|cashback offer)\b/i;

// Bank senders look like "VM-HDFCBK", "AX-SBIINB", "JD-ICICIB"
const BANK_SENDER = /^[A-Z]{2}-[A-Z0-9]{3,8}$/i;

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return String(h);
}

export function parseBankSms({ body, address, date }) {
  if (!body || !address) return null;
  const DEBUG_ALLOW_ANY_SENDER = true; // TODO: set false before release
  if (!DEBUG_ALLOW_ANY_SENDER && !BANK_SENDER.test(address)) return null;   // skip friends / random numbers
  if (IGNORE.test(body)) return null;

  const amt = body.match(AMOUNT);
  if (!amt) return null;

  const isDebit = DEBIT.test(body);
  const isCredit = CREDIT.test(body);
  if (isDebit === isCredit) return null; // neither or both -> ambiguous, skip

  const merchant =
    body
      .match(/(?:\bat\b|\bto\b|\bfrom\b|VPA|info:?)\s+([A-Za-z0-9@._ -]{3,30})/i)?.[1]
      ?.trim() ?? null;

  const account = body.match(/(?:a\/c|acct?|card)\D{0,6}(\d{3,6})/i)?.[1] ?? null;

  return {
    id: simpleHash(`${address}|${body}`), // same SMS => same id (use for dedupe)
    type: isDebit ? 'debit' : 'credit',
    amount: parseFloat(amt[1].replace(/,/g, '')),
    merchant,
    account,
    sender: address,
    date: new Date(date).toISOString(),
    raw: body,
  };
}