export const CURRENCY = "₹"
export const BUDGET = 25000

export const CATEGORIES = {
  food : {label : "Food", icon : "fast-food", color : "#fb923c"},
  transport : {label : "Transport", icon : "car", color : "#60a5fa"},
  shopping : {label : "Shopping", icon : "bag-handle", color : "#f472b6"},
  bills : {label : "Bills", icon : "flash", color : "#facc15"},
  fun : {label : "Fun", icon : "game-controller", color : "#a78bfa"}
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
  CANCELLED : {label : "Cancelled", badge : "bg-neutral-700", text : "text-neutral-700"}
}

export const PAY_APPS = {
  gpay : "Google Pay",
  phonepe : "PhonePe",
  paytm : "Paytm",
}

const ago = ( days, hour, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.getHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const DUMMY_EXPENSES = [
  { id: 1, amount: 320, payeeName: "Third Wave Coffee", payeeUpiId: "thirdwave@okaxis", note: "Coffee & sandwich", category: "food", source: "scan", app: "gpay", createdAt: ago(0, 9, 15), status: "CONFIRMED" },
  { id: 2, amount: 150, payeeName: "Ravi (auto)", payeeUpiId: "ravi.auto@ybl", note: "Auto to office", category: "transport", source: "manual", app: "phonepe", createdAt: ago(0, 8, 40), status: "CONFIRMED" },
  { id: 3, amount: 2499, payeeName: "Croma", payeeUpiId: "croma@icici", note: "Headphones", category: null, source: "scan", app: "paytm", createdAt: ago(0, 13, 5), status: "PENDING" },
  { id: 4, amount: 1840, payeeName: "Nature's Basket", payeeUpiId: "naturesbasket@hdfcbank", note: "Groceries", category: "food", source: "scan", app: "phonepe", createdAt: ago(1, 19, 30), status: "CONFIRMED" },
  { id: 5, amount: 2150, payeeName: "BESCOM", payeeUpiId: "bescom@sbi", note: "Electricity bill", category: "bills", source: "manual", app: "gpay", createdAt: ago(1, 11, 0), status: "CONFIRMED" },
  { id: 6, amount: 700, payeeName: "PVR Cinemas", payeeUpiId: "pvr@axisbank", note: "Movie tickets", category: null, source: "scan", app: "gpay", createdAt: ago(2, 20, 10), status: "FAILED" },
  { id: 7, amount: 420, payeeName: "City Cabs", payeeUpiId: "citycabs@ybl", note: "Cab ride", category: null, source: "scan", app: "phonepe", createdAt: ago(3, 18, 0), status: "CANCELLED" },
  { id: 8, amount: 60, payeeName: "Chai stall", payeeUpiId: null, note: "Chai & snacks", category: "food", source: "cash", app: null, createdAt: ago(3, 16, 0), status: "CONFIRMED" },
  { id: 9, amount: 1650, payeeName: "Dinner with friends", payeeUpiId: "friend@paytm", note: "Dinner split", category: "food", source: "manual", app: "paytm", createdAt: ago(5, 21, 0), status: "CONFIRMED" },
]; 