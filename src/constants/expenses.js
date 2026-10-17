export const CURRENCY = "₹"
export const BUDGET = 25000

export const CATEGORIES = {
  food : {label : "Food", icon : "fast-food", color : "#fb923c"},
  transport : {label : "Transport", icon : "car", color : "#60a5fa"},
  shopping : {label : "Shopping", icon : "bag-handle", color : "#f472b6"},
  bills : {label : "Bills", icon : "flash", color : "#facc15"},
  fun : {label : "Fun", icon : "game-controller", color : "#a78bfa"},
  other : {label : "Other", icon : "ellipsis-horizontal-circle", color : "#9ca3af"}
}

export const UNCATEGORIZED = {
  label : "Uncategorized",
  icon : "help-circle",
  color : "#9ca3af",
}

export const STATUS = {
  PENDING : {label : "Pending", badge : "bg-amber-400/20", text : "text-amber-400"},
  CONFIRMED : {label : "Confirmed", badge : "bg-lime-300/20", text : "text-lime-300"},
  FAILED : {label : "Failed", badge : "bg-red-400/20", text : "text-red-400"},
  CANCELLED : {label : "Cancelled", badge : "bg-neutral-700", text : "text-neutral-100"}
}

export const PAY_APPS = {
  gpay : "Google Pay",
  phonepe : "PhonePe",
  paytm : "Paytm",
}

const ago = ( days, hour, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const payVia = (e) => {
  return e.source === "cash" ? "Cash" : e.app ? PAY_APPS[e.app] : "UPI";
}