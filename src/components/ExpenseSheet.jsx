import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { CATEGORIES, PAY_APPS, STATUS } from "../constants/expenses";
import { dayLabel, money } from "../utils/format";

// Keeps digits and one decimal point, with at most two decimal places
const cleanAmount = (text) => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

// Outer shell: owns the Modal. The body is only mounted when there is an expense.
export default function ExpenseSheet({ expense, onClose, onChange, onDelete }) {
  return (
    <Modal visible={!!expense} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        {/* Backdrop: tap outside the sheet to close */}
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
          onPress={onClose}
        />

        {expense ? (
          <SheetBody
            key={expense.id}
            expense={expense}
            onClose={onClose}
            onChange={onChange}
            onDelete={onDelete}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetBody({ expense, onClose, onChange, onDelete }) {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState(null); // null | "amount" | "delete"
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState(expense.note ?? "");

  const openAmount = () => {
    setDraft(String(expense.amount));
    setMode("amount");
  };

  const saveAmount = () => {
    const n = Math.round(parseFloat(draft) * 100) / 100;
    if (n > 0) onChange({ amount: n });
    setMode(null);
  };

  const time = new Date(expense.createdAt).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <ScrollView
        style={{ maxHeight: "88%", flexGrow : 0 }}
        className="rounded-t-3xl bg-neutral-900"
        contentContainerClassName="gap-4 px-5 pt-5"
        contentContainerStyle={{
          paddingBottom: (Platform.OS === "ios" ? insets.bottom : 0) + 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header: payee, date, and tappable amount */}
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-semibold text-white" numberOfLines={1}>
              {expense.payeeName}
            </Text>
            <Text className="text-xs text-neutral-400">
              {dayLabel(expense.createdAt)} · {time}
            </Text>
          </View>

          <Pressable
            onPress={openAmount}
            className="flex-row items-center gap-2 rounded-2xl bg-neutral-800 px-3 py-2"
          >
            <Text className="text-2xl font-bold text-white">-{money(expense.amount)}</Text>
            <Ionicons name="pencil" size={16} color="#d4d4d4" />
          </Pressable>
        </View>

        {/* Details */}
        <View className="gap-2 rounded-2xl bg-neutral-800 p-4">
          <Row label="Paid via">
            <Text className="text-sm text-white">
              {expense.app ? PAY_APPS[expense.app] : "Cash"}
            </Text>
          </Row>
          {!!expense.payeeUpiId && (
            <Row label="UPI ID">
              <Text className="text-sm text-white">{expense.payeeUpiId}</Text>
            </Row>
          )}
        </View>

        {/* Note */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-neutral-400">Note</Text>
            <Text className="text-xs text-neutral-500">{noteDraft.length}/50</Text>
          </View>
          <TextInput
            value={noteDraft}
            onChangeText={(t) => {
              setNoteDraft(t);
              onChange({ note: t });
            }}
            maxLength={50}
            returnKeyType="done"
            placeholder="Add a note"
            placeholderTextColor="#737373"
            className="rounded-2xl bg-neutral-800 px-4 py-3 text-base text-white"
          />
        </View>

        {/* Status picker */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-neutral-400">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(STATUS).map(([key, s]) => {
              const isSelected = expense.status === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => onChange({ status: key })}
                  className={`rounded-full border px-3 py-2 ${s.badge} ${
                    isSelected ? "border-white" : "border-transparent"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${s.text}`}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Category picker */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-neutral-400">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const isSelected = expense.category === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => onChange({ category: key })}
                  className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${
                    isSelected ? "bg-white" : "bg-neutral-800"
                  }`}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isSelected ? "black" : cat.color}
                  />
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

        {/* Actions */}
        <View className="mt-1 flex-row gap-3">
          <Pressable
            onPress={() => setMode("delete")}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-red-500/15 py-3"
          >
            <Ionicons name="trash-outline" size={18} color="#f87171" />
            <Text className="font-semibold text-red-400">Delete</Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            className="flex-1 items-center justify-center rounded-2xl bg-white py-3"
          >
            <Text className="font-semibold text-black">Done</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit amount dialog */}
      {mode === "amount" && (
        <View className="absolute bottom-0 left-0 right-0 top-0 items-center bg-black/70 px-6 pt-40">
          <View className="w-full gap-4 rounded-3xl bg-neutral-900 p-5">
            <Text className="text-lg font-semibold text-white">Edit amount</Text>
            <TextInput
              value={draft}
              onChangeText={(t) => setDraft(cleanAmount(t))}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor="#737373"
              className="rounded-2xl bg-neutral-800 px-4 py-3 text-xl text-white"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setMode(null)}
                className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
              >
                <Text className="font-semibold text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveAmount}
                className="flex-1 items-center rounded-2xl bg-lime-300 py-3"
              >
                <Text className="font-semibold text-black">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Delete confirmation dialog */}
      {mode === "delete" && (
        <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-black/70 px-6">
          <View className="w-full items-center gap-3 rounded-3xl bg-neutral-900 p-6">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
              <Ionicons name="trash-outline" size={28} color="#f87171" />
            </View>
            <Text className="text-lg font-semibold text-white">Delete this expense?</Text>
            <Text className="text-center text-sm text-neutral-400">
              {expense.payeeName} · {money(expense.amount)} will be removed. This can't be
              undone.
            </Text>
            <View className="mt-2 w-full flex-row gap-3">
              <Pressable
                onPress={() => setMode(null)}
                className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
              >
                <Text className="font-semibold text-white">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                className="flex-1 items-center rounded-2xl bg-red-500 py-3"
              >
                <Text className="font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

function Row({ label, children }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm text-neutral-400">{label}</Text>
      {children}
    </View>
  );
}