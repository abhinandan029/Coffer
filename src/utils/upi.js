const UPI_ID = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/

export const isValidUpiId = (id) => UPI_ID.test((id ?? "").trim());

export function parseUpiUri(raw){
  if( typeof raw !== "string" ) return null
  const text = raw.trim()
  if ( !/^upi:\/\/pay\?/i.test(text)) return null

  const params = {}

  text.slice(text.indexOf("?") +  1).split("&").forEach((pair) => {
    if (!pair) return
    const i = pair.indexOf("=")
    const key = ( i === -1 ? pair : pair.slice(0, i).toLowerCase())
    const val = i === -1 ? "" : pair.slice(i + 1)
    try {
      params[key] = decodeURIComponent(val.replace(/\+/g, " "))
    }
    catch {
      params[key] = val 
    }
  })

  const upiId = (params.pa ?? "").trim()
  if ( !isValidUpiId(upiId) ) return null
  if ( params.cu && params.cu.toUpperCase() !== "INR" ) return null

  const amount = Math.round(parseFloat(params.am) * 100) / 100

  const mc = (params.mc ?? "").trim();

  return {
    source : "scan",
    kind : mc && mc !== "0000" ? "merchant" : "personal",
    payeeUpiId : upiId,
    payeeName : (params.pn ?? "").trim(),
    amount : amount > 0 ? amount : null,
    note : (params.tn ?? "").trim().slice(0, 50), 
  }

}

const IOS_SCHEMES = {
  gpay: "gpay://upi/pay",
  phonepe: "phonepe://pay",
  paytm: "paytmmp://pay",
};

// appKey = null opens the generic upi://pay link (Android chooser)
export function buildPayUrl({ payeeUpiId, payeeName, amount, note }, appKey = null) {
  const query = [
    `pa=${encodeURIComponent(payeeUpiId)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${amount.toFixed(2)}`,
    "cu=INR",
  ];
  if (note) query.push(`tn=${encodeURIComponent(note)}`);

  const base = (appKey && IOS_SCHEMES[appKey]) || "upi://pay";
  return `${base}?${query.join("&")}`;
}

const OPEN_SCHEMES = {
  gpay: "gpay://",
  phonepe: "phonepe://",
  paytm: "paytmmp://",
};

export const openAppUrl = (appKey) => OPEN_SCHEMES[appKey];