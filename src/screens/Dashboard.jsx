import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const CURRENCY = "₹";
const BUDGET = 25000;

const CATEGORIES = {
  food: { label: "Food", icon: "fast-food", color: "#fb923c" },
  transport: { label: "Transport", icon: "car", color: "#60a5fa" },
  shopping: { label: "Shopping", icon: "bag-handle", color: "#f472b6" },
  bills: { label: "Bills", icon: "flash", color: "#facc15" },
  fun: { label: "Fun", icon: "game-controller", color: "#a78bfa" },
};

const EXPENSES = [
  { id: 1, title: "Coffee & sandwich", category: "food", amount: 320, date: "Today" },
  { id: 2, title: "Auto to office", category: "transport", amount: 150, date: "Today" },
  { id: 3, title: "Headphones", category: "shopping", amount: 2499, date: "Today" },
  { id: 4, title: "Groceries", category: "food", amount: 1840, date: "Yesterday" },
  { id: 5, title: "Electricity bill", category: "bills", amount: 2150, date: "Yesterday" },
  { id: 6, title: "Movie tickets", category: "fun", amount: 700, date: "Yesterday" },
  { id: 7, title: "Cab ride", category: "transport", amount: 420, date: "Mon, 6 Oct" },
  { id: 8, title: "Internet plan", category: "bills", amount: 999, date: "Mon, 6 Oct" },
  { id: 9, title: "Dinner with friends", category: "food", amount: 1650, date: "Sun, 5 Oct" },
  { id: 10, title: "New T-shirt", category: "shopping", amount: 1199, date: "Sun, 5 Oct" },
];

const money = (n) => `${CURRENCY}${n.toFixed(2)}`;

function groupByDate(list) {
  const groups = [];
  list.forEach((item) => {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  });
  return groups;
}

export default function Dashboard() {
  const [filter, setFilter] = useState("all");

  const total = EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  const percent = Math.min((total / BUDGET) * 100, 100);

  const visible =
    filter === "all" ? EXPENSES : EXPENSES.filter((e) => e.category === filter);
  const groups = groupByDate(visible);

  return (
    <ScrollView contentContainerClassName="p-4 pb-32 gap-5">
      {/* Summary card */}
      <View className="rounded-3xl bg-neutral-900 p-5">
        <Text className="text-sm text-neutral-400">Spent this month</Text>
        <Text className="mt-1 text-4xl font-bold text-white">{money(total)}</Text>

        <View className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-700">
          <View
            className="h-2 rounded-full bg-lime-300"
            style={{ width: `${percent}%` }}
          />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs text-neutral-400">{Math.round(percent)}% of budget</Text>
          <Text className="text-xs text-neutral-400">
            {money(Math.max(BUDGET - total, 0))} left
          </Text>
        </View>
      </View>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {[["all", { label: "All" }], ...Object.entries(CATEGORIES)].map(
          ([key, cat]) => {
            const selected = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                className={`rounded-full px-4 py-2 ${
                  selected ? "bg-white" : "bg-neutral-900"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? "text-black" : "text-neutral-300"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      {/* Expense list grouped by day */}
      {groups.length === 0 && (
        <Text className="mt-8 text-center text-neutral-500">No expenses here yet.</Text>
      )}

      {groups.map((group) => (
        <View key={group.date} className="gap-2">
          <Text className="text-sm font-semibold text-neutral-400">{group.date}</Text>

          <View className="overflow-hidden rounded-3xl bg-neutral-900">
            {group.items.map((item, i) => {
              const cat = CATEGORIES[item.category];
              return (
                <View
                  key={item.id}
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
                    <Text className="text-base font-semibold text-white">{item.title}</Text>
                    <Text className="text-xs text-neutral-400">{cat.label}</Text>
                  </View>

                  <Text className="text-base font-semibold text-white">
                    -{money(item.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}