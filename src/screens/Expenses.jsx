import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import AddExpense from "../components/AddExpense";
import CalendarFilter from "../components/CalendarFilter";
import ExpenseSheet from "../components/ExpenseSheet";
import {
  CATEGORIES,
  STATUS,
  UNCATEGORIZED,
  payVia,
} from "../constants/expenses";
import { useExpenses } from "../contexts/ExpensesContext";
import useBudget from "../hooks/useBudget";
import { dayKey, dayLabel, isThisMonth, money, rangeLabel } from "../utils/format";

// One entry per calendar day, in the order the (already sorted) list arrives
function groupByDay(list) {
  const map = new Map();
  list.forEach((item) => {
    const key = dayKey(item.createdAt);
    if (!map.has(key)) map.set(key, { key, label: dayLabel(item.createdAt), items: [] });
    map.get(key).items.push(item);
  });
  return [...map.values()];
}

const inRange = (iso, range) => {
  if (!range.start) return true;
  const day = new Date(iso);
  day.setHours(0, 0, 0, 0);
  const lo = range.start.getTime();
  const hi = (range.end ?? range.start).getTime();
  return day.getTime() >= lo && day.getTime() <= hi;
};

export default function Expenses({ onReviewPending }) {
  const [filter, setFilter] = useState("all");
  const [range, setRange] = useState({ start: null, end: null });
  const [calOpen, setCalOpen] = useState(false);

  const { budget, setBudget } = useBudget();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const { expenses, loaded, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [selectedId, setSelectedId] = useState(null);

  const [adding, setAdding] = useState(false);

  const openEditor = () => {
    setDraft(String(budget));
    setEditing(true);
  };

  if (!loaded) return null;

  const selectedExpense = expenses.find((e) => e?.id === selectedId) ?? null;

  // Payments waiting for a "Did it go through?" answer
  const awaiting = expenses.filter((e) => e?.needsConfirm).length;

  const saveBudget = () => {
    const n = parseInt(draft.replace(/[^0-9]/g, ""), 10);
    if (n > 0) setBudget(n);
    setEditing(false);
  };

  // Summary card always covers the current month, regardless of filters
  const thisMonth = expenses.filter((e) => isThisMonth(e.createdAt));
  const sum = (status) =>
    thisMonth.filter((e) => e.status === status).reduce((s, e) => s + e.amount, 0);
  const spent = sum("CONFIRMED");
  const pending = sum("PENDING");
  const percent = Math.min((spent / budget) * 100, 100);

  const visible = expenses
    .filter((e) => (filter === "all" || e.category === filter) && inRange(e.createdAt, range))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const groups = groupByDay(visible);

  const markedKeys = new Set(expenses.map((e) => dayKey(e.createdAt)));
  const hasRange = !!range.start;

  return (
    <ScrollView
      contentContainerClassName="p-4 pb-32 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Needs-confirmation banner */}
      {awaiting > 0 && (
        <Pressable
          onPress={onReviewPending}
          className="flex-row items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4"
        >
          <Ionicons name="help-circle" size={22} color="#fbbf24" />
          <View className="flex-1">
            <Text className="font-semibold text-amber-200">
              {awaiting === 1
                ? "1 payment needs confirmation"
                : `${awaiting} payments need confirmation`}
            </Text>
            <Text className="text-xs text-amber-200/70">
              Tap to confirm whether they went through
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fbbf24" />
        </Pressable>
      )}

      {/* Budget editor */}
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View className="flex-1 items-center bg-black/70 px-6 pt-40">
          <View className="w-full gap-4 rounded-3xl bg-neutral-900 p-5">
            <Text className="text-lg font-semibold text-white">Monthly budget</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              placeholder="e.g. 25000"
              placeholderTextColor="#737373"
              className="rounded-2xl bg-neutral-800 px-4 py-3 text-xl text-white"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditing(false)}
                className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
              >
                <Text className="font-semibold text-white">Cancel</Text>
              </Pressable>
              <Pressable onPress={saveBudget} className="flex-1 items-center rounded-2xl bg-lime-300 py-3">
                <Text className="font-semibold text-black">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar filter */}
      <CalendarFilter
        visible={calOpen}
        onClose={() => setCalOpen(false)}
        value={range}
        markedKeys={markedKeys}
        onApply={(r) => {
          setRange(r);
          setCalOpen(false);
        }}
      />

      {/* Log a payment made outside Coffer */}
      <AddExpense
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(data) => {
          addExpense(data);
          setAdding(false);
        }}
      />

      {/* Expense details: changing the status by hand also clears the "needs confirmation" flag */}
      <ExpenseSheet
        expense={selectedExpense}
        onClose={() => setSelectedId(null)}
        onChange={(patch) =>
          selectedExpense &&
          updateExpense(
            selectedExpense.id,
            "status" in patch ? { ...patch, needsConfirm: false } : patch
          )
        }
        onDelete={() => {
          if (!selectedExpense) return;
          deleteExpense(selectedExpense.id);
          setSelectedId(null);
        }}
      />

      {/* Summary card: only confirmed expenses count toward the total */}
      <View className="rounded-3xl bg-neutral-900 p-5">
        <Text className="text-sm text-neutral-400">Spent this month</Text>

        <View className="mt-1 flex-row items-baseline">
          <Text className="text-4xl font-bold text-white">{money(spent)}</Text>
          <Text className="ml-1 text-base text-neutral-200">/ {money(budget)}</Text>
        </View>

        {pending > 0 && (
          <Text className="mt-1 text-xs text-amber-300">
            + {money(pending)} pending confirmation
          </Text>
        )}

        <View className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-700">
          <View className="h-2 rounded-full bg-lime-300" style={{ width: `${percent}%` }} />
        </View>

        <Text className="my-2 ml-auto text-sm text-neutral-200">
          {money(Math.max(budget - spent, 0))} left
        </Text>

        <View className="ml-auto flex-row items-center gap-2">
          <Pressable
            onPress={openEditor}
            hitSlop={8}
            className="flex-row items-center gap-1 rounded-xl bg-neutral-700 px-2 py-1"
          >
            <Ionicons name="pencil" size={20} color="white" />
            <Text className="text-sm text-neutral-200">Edit Budget</Text>
          </Pressable>

          <Pressable
            onPress={() => setAdding(true)}
            hitSlop={8}
            className="flex-row items-center gap-1 rounded-xl bg-lime-300 px-2 py-1"
          >
            <Ionicons name="add" size={20} color="black" />
            <Text className="text-sm text-black">Add Expense</Text>
          </Pressable>
        </View>
      </View>

      {/* Filters: calendar button + category chips */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setCalOpen(true)}
          className={`h-10 w-10 items-center justify-center rounded-full border border-white/40 ${
            hasRange ? "bg-lime-300" : "bg-neutral-800"
          }`}
        >
          <Ionicons
            name={hasRange ? "calendar" : "calendar-outline"}
            size={20}
            color={hasRange ? "black" : "#d4d4d4"}
          />
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerClassName="gap-2"
        >
          {[["all", { label: "All" }], ...Object.entries(CATEGORIES)].map(([key, cat]) => {
            const isSelected = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                className={`rounded-full px-4 py-2 ${isSelected ? "bg-white" : "bg-neutral-800"}`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? "text-black" : "text-neutral-300"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active date range chip (tap to clear) */}
      {hasRange && (
        <Pressable
          onPress={() => setRange({ start: null, end: null })}
          className="flex-row items-center gap-2 self-start rounded-full bg-lime-300/20 px-3 py-1.5"
        >
          <Ionicons name="calendar" size={14} color="#bef264" />
          <Text className="text-xs font-semibold text-lime-300">{rangeLabel(range)}</Text>
          <Ionicons name="close" size={14} color="#bef264" />
        </Pressable>
      )}

      {groups.length === 0 && (
        <Text className="mt-8 text-center text-neutral-500">
          {expenses.length === 0
            ? "No expenses yet. Scan a QR code to add your first one."
            : "No expenses match these filters."}
        </Text>
      )}

      {/* One header per day, with that day's confirmed total */}
      {groups.map((group) => {
        const dayTotal = group.items
          .filter((e) => e.status === "CONFIRMED")
          .reduce((s, e) => s + e.amount, 0);

        return (
          <View key={group.key} className="gap-2">
            <View className="flex-row items-center justify-between px-3">
              <Text className="text-sm font-semibold text-neutral-400">{group.label}</Text>
              {dayTotal > 0 && (
                <Text className="text-xs text-neutral-200">{money(dayTotal)}</Text>
              )}
            </View>

            <View className="overflow-hidden rounded-3xl bg-neutral-900">
              {group.items.map((item, i) => {
                const cat = CATEGORIES[item.category] ?? UNCATEGORIZED;
                const status = STATUS[item.status];
                const counted = item.status === "CONFIRMED" || item.status === "PENDING";
                const via = payVia(item);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedId(item.id)}
                    className={`flex-row items-center gap-3 p-4 ${
                      i > 0 ? "border-t border-neutral-800" : ""
                    }`}
                  >
                    <View
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{ backgroundColor: cat.color + "33" }}
                    >
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-base font-semibold text-white" numberOfLines={1}>
                        {item.payeeName}
                      </Text>
                      <Text className="text-xs text-neutral-400" numberOfLines={1}>
                        {cat.label} · {via}
                      </Text>
                    </View>

                    <View className="items-end gap-1">
                      <Text
                        className={`text-base font-semibold ${
                          counted ? "text-white" : "text-neutral-500 line-through"
                        }`}
                      >
                        -{money(item.amount)}
                      </Text>
                      <View className={`rounded-full px-2 py-0.5 ${status.badge}`}>
                        <Text className={`text-[10px] font-semibold ${status.text}`}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}