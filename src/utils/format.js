import { CURRENCY } from "../constants/expenses";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const money = (n) => `${CURRENCY}${n.toLocaleString("en-IN")}`;

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function dayLabel(iso) {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function isThisMonth(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export const keyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const dayKey = (iso) => keyOf(new Date(iso));

const short = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

export function rangeLabel({ start, end }) {
  if (!start) return "";
  if (!end || start.getTime() === end.getTime()) return short(start);
  return `${short(start)} – ${short(end)}`;
}