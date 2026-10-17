import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { keyOf, rangeLabel } from "../utils/format";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function CalendarFilter({ visible, onClose, value, onApply, markedKeys }) {
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState(new Date());

  // Reset the draft each time the sheet opens
  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    const base = value.start ?? new Date();
    setMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [visible]);

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

  const todayTime = startOfDay(new Date()).getTime();
  const lo = draft.start;
  const hi = draft.end ?? draft.start;

  // First tap sets the start, second tap sets the end, a third tap starts over
  const pick = (day) => {
    const { start, end } = draft;
    if (!start || end) setDraft({ start: day, end: null });
    else if (day < start) setDraft({ start: day, end: start });
    else setDraft({ start, end: day });
  };

  const preset = (kind) => {
    const t = startOfDay(new Date());
    if (kind === "today") setDraft({ start: t, end: t });
    if (kind === "week")
      setDraft({ start: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6), end: t });
    if (kind === "month")
      setDraft({ start: new Date(t.getFullYear(), t.getMonth(), 1), end: t });
    setMonth(new Date(t.getFullYear(), t.getMonth(), 1));
  };

  const apply = () => {
    if (!draft.start) onApply({ start: null, end: null });
    else onApply({ start: draft.start, end: draft.end ?? draft.start });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <View className="rounded-t-3xl bg-neutral-900 p-5 pb-8">
          {/* Title and selection summary */}
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-white">Filter by date</Text>
              <Text className="text-xs text-neutral-400">
                {draft.start ? rangeLabel({ start: draft.start, end: draft.end }) : "Tap a day or two days for a range"}
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>

          {/* Quick presets */}
          <View className="mb-4 flex-row gap-2">
            {[["today", "Today"], ["week", "Last 7 days"], ["month", "This month"]].map(
              ([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => preset(key)}
                  className="rounded-full bg-neutral-800 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-neutral-200">{label}</Text>
                </Pressable>
              )
            )}
          </View>

          {/* Month navigation */}
          <View className="mb-2 flex-row items-center justify-between">
            <Pressable onPress={() => setMonth(new Date(year, m - 1, 1))} className="p-2">
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            <Text className="font-semibold text-white">
              {MONTH_NAMES[m]} {year}
            </Text>
            <Pressable onPress={() => setMonth(new Date(year, m + 1, 1))} className="p-2">
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
                const edge = lo && (t === lo.getTime() || t === hi.getTime());
                const inside = lo && t >= lo.getTime() && t <= hi.getTime();
                const isToday = t === todayTime;
                const marked = markedKeys?.has(keyOf(day));

                return (
                  <Pressable
                    key={di}
                    onPress={() => pick(day)}
                    style={cellStyle}
                    className={`items-center justify-center ${
                      inside && !edge ? "bg-lime-300/20" : ""
                    }`}
                  >
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        edge ? "bg-lime-300" : isToday ? "border border-neutral-500" : ""
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          edge ? "font-bold text-black" : "text-white"
                        }`}
                      >
                        {day.getDate()}
                      </Text>
                      {marked && (
                        <View
                          className={`absolute bottom-1 h-1 w-1 rounded-full ${
                            edge ? "bg-black" : "bg-lime-300"
                          }`}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Actions */}
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={() => onApply({ start: null, end: null })}
              className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
            >
              <Text className="font-semibold text-white">Clear</Text>
            </Pressable>
            <Pressable onPress={apply} className="flex-1 items-center rounded-2xl bg-lime-300 py-3">
              <Text className="font-semibold text-black">Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}