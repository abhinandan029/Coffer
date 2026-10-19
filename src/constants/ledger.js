export const CURRENCY = "₹";

export const money = (n) => `${CURRENCY}${Math.abs(n).toLocaleString("en-IN")}`

export const initials = (name) => (
  String(name)
  .split(" ")
  .filter(Boolean)
  .map(w => w[0])
  .slice(0, 2)
  .join("")
  .toUpperCase()
)

const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0);
  return x
}

export const dayKey = (iso) => startOfDay(iso).getTime()

export const dayHeading = (iso) => {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(iso)) / 86400000)
  if ( diff === 0) return "Today"
  if ( diff === 1) return "Yesterday"
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday : "short",
    day : "numeric",
    month : "short"
  })
}

export const timeLabel = (iso) => (
  new Date(iso).toLocaleTimeString("en-IN", { hour : "numeric", minute : "2-digit"})
)

export const round2 = (n) => Math.round(n * 100) / 100

export const signed = (entry) => (entry.type === "gave" ? entry.amount : -entry.amount)
