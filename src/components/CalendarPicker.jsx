import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// A single-date picker panel. It isn't a Modal, so it can sit inside another sheet.
export default function CalendarPicker({ value, onPick, onClose }) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  const year = month.getFullYear();
  const m = month.getMonth();
  const offset = new Date(year, m, 1).getDay();
  const total = new Date(year, m + 1, 0).getDate();

  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => new Date(year, m, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const atCurrentMonth = year === today.getFullYear() && m === today.getMonth();
  const selectedTime = startOfDay(value).getTime();
  const todayTime = today.getTime();

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center px-6">
      {/* Backdrop: tap outside the card to close */}
      <Pressable
        className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
        onPress={onClose}
      />

      <View className="w-full rounded-3xl bg-neutral-900 p-5">
        {/* Title */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-white">Select date</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        {/* Month navigation */}
        <View className="mb-2 flex-row items-center justify-between">
          <Pressable onPress={() => setMonth(new Date(year, m - 1, 1))} className="p-2">
            <Ionicons name="chevron-back" size={20} color="white" />
          </Pressable>
          <Text className="font-semibold text-white">
            {MONTH_NAMES[m]} {year}
          </Text>
          <Pressable
            onPress={() => setMonth(new Date(year, m + 1, 1))}
            disabled={atCurrentMonth}
            className={`p-2 ${atCurrentMonth ? "opacity-30" : ""}`}
          >
            <Ionicons name="chevron-forward" size={20} color="white" />
          </Pressable>
        </View>

        {/* Weekday header */}
        <View className="flex-row">
          {WEEK.map((w, i) => (
            <View key={i} style={{ width: `${100 / 7}%` }} className="items-center py-1">
              <Text className="text-xs text-neutral-500">{w}</Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        {weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              const cellStyle = { width: `${100 / 7}%`, height: 44 };
              if (!day) return <View key={di} style={cellStyle} />;

              const t = day.getTime();
              const isFuture = t > todayTime;
              const isSelected = t === selectedTime;
              const isToday = t === todayTime;

              return (
                <Pressable
                  key={di}
                  onPress={() => onPick(day)}
                  disabled={isFuture}
                  style={cellStyle}
                  className="items-center justify-center"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      isSelected
                        ? "bg-lime-300"
                        : isToday
                        ? "border border-neutral-500"
                        : ""
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? "font-bold text-black"
                          : isFuture
                          ? "text-neutral-600"
                          : "text-white"
                      }`}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Shortcut */}
        <Pressable
          onPress={() => onPick(today)}
          className="mt-3 items-center rounded-2xl bg-neutral-800 py-3"
        >
          <Text className="font-semibold text-white">Today</Text>
        </Pressable>
      </View>
    </View>
  );
}