import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const CURRENCY = "₹";

// amount > 0: they owe you (you'll get), amount < 0: you owe them (you'll give)
const PEOPLE = [
  { id: 1, name: "Rahul Sharma", amount: 2500, note: "Trip share", updated: "Today" },
  { id: 2, name: "Priya Nair", amount: -1200, note: "Dinner split", updated: "Yesterday" },
  { id: 3, name: "Amit Verma", amount: 8000, note: "Laptop loan", updated: "Mon, 6 Oct" },
  { id: 4, name: "Sneha Reddy", amount: -450, note: "Cab fare", updated: "Sun, 5 Oct" },
  { id: 5, name: "Karthik", amount: 1500, note: "Concert tickets", updated: "Fri, 3 Oct" },
  { id: 6, name: "Neha Gupta", amount: -3200, note: "Rent share", updated: "Wed, 1 Oct" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "get", label: "You'll get" },
  { key: "give", label: "You'll give" },
];

const money = (n) => `${CURRENCY}${Math.abs(n).toLocaleString("en-IN")}`;

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Ledger() {
  const [filter, setFilter] = useState("all");

  const toGet = PEOPLE.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0);
  const toGive = PEOPLE.filter((p) => p.amount < 0).reduce((s, p) => s + -p.amount, 0);
  const net = toGet - toGive;

  const visible = PEOPLE.filter((p) => {
    if (filter === "get") return p.amount > 0;
    if (filter === "give") return p.amount < 0;
    return true;
  });

  return (
    <ScrollView contentContainerClassName="p-4 pb-32 gap-5">
      {/* Net balance */}
      <View className="rounded-3xl bg-neutral-900 p-5">
        <Text className="text-sm text-neutral-400">Net balance</Text>
        <Text
          className={`mt-1 text-4xl font-bold ${
            net >= 0 ? "text-lime-300" : "text-red-400"
          }`}
        >
          {net >= 0 ? "+" : "-"}
          {money(net)}
        </Text>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-neutral-800 p-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="arrow-down-circle" size={16} color="#bef264" />
              <Text className="text-xs text-neutral-400">You'll get</Text>
            </View>
            <Text className="mt-1 text-lg font-semibold text-white">{money(toGet)}</Text>
          </View>

          <View className="flex-1 rounded-2xl bg-neutral-800 p-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="arrow-up-circle" size={16} color="#f87171" />
              <Text className="text-xs text-neutral-400">You'll give</Text>
            </View>
            <Text className="mt-1 text-lg font-semibold text-white">{money(toGive)}</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View className="flex-row gap-2">
        {FILTERS.map(({ key, label }) => {
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
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* People list */}
      {visible.length === 0 ? (
        <Text className="mt-8 text-center text-neutral-500">Nothing here.</Text>
      ) : (
        <View className="overflow-hidden rounded-3xl bg-neutral-900">
          {visible.map((p, i) => {
            const getting = p.amount > 0;
            return (
              <View
                key={p.id}
                className={`flex-row items-center gap-3 p-4 ${
                  i > 0 ? "border-t border-neutral-800" : ""
                }`}
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-700">
                  <Text className="font-semibold text-white">{initials(p.name)}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-base font-semibold text-white">{p.name}</Text>
                  <Text className="text-xs text-neutral-400">
                    {p.note} · {p.updated}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    className={`text-base font-semibold ${
                      getting ? "text-lime-300" : "text-red-400"
                    }`}
                  >
                    {money(p.amount)}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    {getting ? "you'll get" : "you'll give"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}