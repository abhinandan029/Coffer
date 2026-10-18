import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, payVia } from "../constants/expenses";
import { dayLabel, money } from "../utils/format";

// Tapping outside does nothing, so an accidental tap can't dismiss it.
// The Android back button counts as "Decide later".
export default function ConfirmPayment({ expense, onResolve, onLater, onEdit }) {
  return (
    <Modal visible={!!expense} transparent animationType="slide" onRequestClose={onLater}>
      <View className="flex-1 justify-end bg-black/70">
        {expense ? (
          <Body
            key={expense.id}
            expense={expense}
            onResolve={onResolve}
            onLater={onLater}
            onEdit={onEdit}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function Body({ expense, onResolve, onLater, onEdit }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState("ask"); // "ask" | "category"

  return (
    <View
      className="gap-4 rounded-t-3xl bg-neutral-900 px-5 pt-5"
      style={{ paddingBottom: (Platform.OS === "ios" ? insets.bottom : 0) + 16 }}
    >
      {step === "ask" ? (
        <>
          <View className="items-center gap-2">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-lime-300/15">
              <Ionicons name="help" size={28} color="#bef264" />
            </View>
            <Text className="text-xl font-semibold text-white">
              Did the payment go through?
            </Text>
          </View>

          <View className="gap-1 rounded-2xl bg-neutral-800 p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-base font-semibold text-white" numberOfLines={1}>
                {expense.payeeName}
              </Text>
              <Text className="text-xl font-bold text-white">{money(expense.amount)}</Text>
            </View>
            <Text className="text-xs text-neutral-400">
              {payVia(expense)} · {dayLabel(expense.createdAt)}
            </Text>
            {!!expense.note && (
              <Text className="text-xs text-neutral-400" numberOfLines={1}>
                {expense.note}
              </Text>
            )}

            {/* Opens the expense sheet to fix the amount, note or category */}
            {!!onEdit && (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                className="mt-2 flex-row items-center gap-1 self-end rounded-xl bg-neutral-700 px-3 py-1.5"
              >
                <Ionicons name="pencil" size={14} color="#d4d4d4" />
                <Text className="text-xs font-semibold text-neutral-200">Edit details</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setStep("category")}
            className="items-center rounded-2xl bg-lime-300 py-3.5"
          >
            <Text className="font-semibold text-black">Yes, it went through</Text>
          </Pressable>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => onResolve({ status: "CANCELLED" })}
              className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
            >
              <Text className="font-semibold text-white">I cancelled it</Text>
            </Pressable>
            <Pressable
              onPress={() => onResolve({ status: "FAILED" })}
              className="flex-1 items-center rounded-2xl bg-red-500/15 py-3"
            >
              <Text className="font-semibold text-red-400">It failed</Text>
            </Pressable>
          </View>

          <Pressable onPress={onLater} className="items-center py-1">
            <Text className="text-md text-neutral-200">Decide later</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View className="gap-1">
            <Text className="text-xl font-semibold text-white">What was it for?</Text>
            <Text className="text-sm text-neutral-400">
              {expense.payeeName} · {money(expense.amount)}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <Pressable
                key={key}
                onPress={() => onResolve({ status: "CONFIRMED", category: key })}
                className="flex-row items-center gap-2 rounded-full bg-neutral-800 px-4 py-3"
              >
                <Ionicons name={cat.icon} size={18} color={cat.color} />
                <Text className="text-sm font-semibold text-neutral-100">{cat.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => onResolve({ status: "CONFIRMED" })}
            className="items-center py-1"
          >
            <Text className="text-sm text-neutral-400">Skip for now</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}