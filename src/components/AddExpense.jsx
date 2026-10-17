import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES } from "../constants/expenses";
import { dayLabel } from "../utils/format";
import CalendarPicker from "./CalendarPicker";

const MAX_AMOUNT = 10000000;

const cleanAmount = (text) => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Outer shell: the form only exists while the sheet is open, so it starts fresh each time
export default function AddExpense({ visible, onClose, onSave }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
          onPress={onClose}
        />
        {visible ? <Body onClose={onClose} onSave={onSave} /> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Body({ onClose, onSave }) {
  const insets = useSafeAreaInsets();
  const today = startOfToday();

  const [amount, setAmount] = useState("");
  const [how, setHow] = useState("cash"); // "cash" | "upi"
  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [date, setDate] = useState(today);
  const [pickingDate, setPickingDate] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);

  const isToday = date.getTime() >= today.getTime();

  const openCalendar = () => {
    Keyboard.dismiss();
    setPickingDate(true);
  };

  const save = () => {
    const n = Math.round(parseFloat(amount) * 100) / 100;
    if (!(n > 0)) return setError("Enter an amount greater than 0");
    if (n > MAX_AMOUNT) return setError("That amount looks too large");

    // Today keeps the current time; past days use midday so they sort sensibly
    const when = new Date(date);
    if (isToday) {
      const now = new Date();
      when.setHours(now.getHours(), now.getMinutes(), 0, 0);
    } else {
      when.setHours(12, 0, 0, 0);
    }

    onSave({
      amount: n,
      payeeName: name.trim() || (how === "cash" ? "Cash payment" : "UPI payment"),
      payeeUpiId: null,
      note: note.trim(),
      category,
      source: how === "cash" ? "cash" : "manual",
      app: null,
      status: "CONFIRMED",
      needsConfirm: false,
      createdAt: when.toISOString(),
    });
  };

  return (
    <>
      <ScrollView
        style={{ maxHeight: "92%", flexGrow: 0 }}
        className="rounded-t-3xl bg-neutral-900"
        contentContainerClassName="gap-4 px-5 pt-5"
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "ios" ? insets.bottom : 0) + 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-semibold text-white">Log a payment</Text>
            <Text className="text-xs text-neutral-400">
              For payments you already made, outside Coffer
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        {/* Amount */}
        <View className="items-center gap-1 rounded-2xl bg-neutral-800 px-4 py-5">
          <View className="flex-row items-center">
            <Text className="text-4xl font-bold text-white">₹</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(cleanAmount(t));
                setError(null);
              }}
              autoFocus
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#737373"
              className="min-w-[60px] text-4xl font-bold text-white"
            />
          </View>
          {!!error && <Text className="text-xs text-red-400">{error}</Text>}
        </View>

        {/* Cash / UPI */}
        <View className="flex-row gap-1 rounded-2xl bg-neutral-800 p-1">
          {[
            ["cash", "Cash"],
            ["upi", "UPI (paid elsewhere)"],
          ].map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setHow(key)}
              className={`flex-1 items-center rounded-xl py-2 ${how === key ? "bg-white" : ""}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  how === key ? "text-black" : "text-neutral-300"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Paid to */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-neutral-400">Paid to (optional)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={40}
            placeholder="e.g. Chai stall"
            placeholderTextColor="#737373"
            className="rounded-2xl bg-neutral-800 px-4 py-3 text-base text-white"
          />
        </View>

        {/* Category */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-neutral-400">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const isSelected = category === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setCategory(isSelected ? null : key)}
                  className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${
                    isSelected ? "bg-white" : "bg-neutral-800"
                  }`}
                >
                  <Ionicons name={cat.icon} size={16} color={isSelected ? "black" : cat.color} />
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? "text-black" : "text-neutral-200"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-neutral-400">Date</Text>
          <Pressable
            onPress={openCalendar}
            className="flex-row items-center justify-between rounded-2xl bg-neutral-800 px-4 py-3"
          >
            <Text className="text-base font-semibold text-white">
              {dayLabel(date.toISOString())}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#d4d4d4" />
          </Pressable>
        </View>

        {/* Note */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-neutral-400">Note</Text>
            <Text className="text-xs text-neutral-500">{note.length}/50</Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={50}
            placeholder="Add a note"
            placeholderTextColor="#737373"
            className="rounded-2xl bg-neutral-800 px-4 py-3 text-base text-white"
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 items-center justify-center rounded-2xl bg-neutral-800 py-3"
          >
            <Text className="font-semibold text-white">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={save}
            className="flex-1 items-center justify-center rounded-2xl bg-lime-300 py-3"
          >
            <Text className="font-semibold text-black">Save</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Calendar panel, drawn inside this sheet instead of as a second Modal */}
      {pickingDate && (
        <CalendarPicker
          value={date}
          onPick={(d) => {
            setDate(d);
            setPickingDate(false);
          }}
          onClose={() => setPickingDate(false)}
        />
      )}
    </>
  );
}