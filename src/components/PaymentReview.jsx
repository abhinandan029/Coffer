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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PAY_APPS } from "../constants/expenses";
import { money } from "../utils/format";
import { isValidUpiId } from "../utils/upi";

const MAX_AMOUNT = 100000; // typical per-payment UPI limit; some banks and apps differ

const cleanAmount = (text) => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

// Outer shell: owns the Modal. The body only exists while there is a draft.
export default function PaymentReview({ draft, onClose, onContinue }) {
  return (
    <Modal visible={!!draft} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
          onPress={onClose}
        />
        {draft ? (
          <ReviewBody draft={draft} onClose={onClose} onContinue={onContinue} />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReviewBody({ draft, onClose, onContinue }) {
  const insets = useSafeAreaInsets();
  const scanned = draft.source === "scan";
  const amountLocked = scanned && draft.amount != null;

  const [upiId, setUpiId] = useState(draft.payeeUpiId ?? "");
  const [name, setName] = useState(draft.payeeName ?? "");
  const [amount, setAmount] = useState(draft.amount != null ? String(draft.amount) : "");
  const [note, setNote] = useState(draft.note ?? "");
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  // appKey is null on Android (system chooser) or "gpay" | "phonepe" | "paytm" on iOS
  const submit = async (appKey = null) => {
    if (paying) return;

    const id = upiId.trim();
    const n = Math.round(parseFloat(amount) * 100) / 100;
    const next = {};

    if (!isValidUpiId(id)) next.upiId = "Enter a valid UPI ID, like name@bank";
    if (!(n > 0)) next.amount = "Enter an amount greater than 0";
    else if (n > MAX_AMOUNT) next.amount = `Amount can't be more than ${money(MAX_AMOUNT)}`;

    setErrors(next);
    if (Object.keys(next).length) return;

    setPayError(null);
    setPaying(true);

    const error = await onContinue(
      {
        source: draft.source,
        payeeUpiId: id,
        payeeName: name.trim() || id.split("@")[0],
        amount: n,
        note: note.trim(),
      },
      appKey
    );

    // On success the parent closes this sheet, so only handle the failure case
    if (error) {
      setPayError(error);
      setPaying(false);
    }
  };

  return (
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
          <Text className="text-xl font-semibold text-white">Review payment</Text>
          <Text className="text-xs text-neutral-400">
            {scanned ? "Scanned from QR code" : "Entered manually"}
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
            onChangeText={(t) => setAmount(cleanAmount(t))}
            editable={!amountLocked}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#737373"
            className="min-w-[60px] text-4xl font-bold text-white"
          />
        </View>
        {amountLocked && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="lock-closed" size={12} color="#a3a3a3" />
            <Text className="text-xs text-neutral-400">Amount set by the QR code</Text>
          </View>
        )}
        {!!errors.amount && <Text className="text-xs text-red-400">{errors.amount}</Text>}
      </View>

      {/* Pay to */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-neutral-400">Pay to (UPI ID)</Text>
        <TextInput
          value={upiId}
          onChangeText={(t) => setUpiId(t.trim())}
          editable={!scanned}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="name@bank"
          placeholderTextColor="#737373"
          className={`rounded-2xl bg-neutral-800 px-4 py-3 text-base ${
            scanned ? "text-neutral-400" : "text-white"
          }`}
        />
        {!!errors.upiId && <Text className="text-xs text-red-400">{errors.upiId}</Text>}
      </View>

      {/* Name */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-neutral-400">Payee name (optional)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={40}
          placeholder="e.g. Third Wave Coffee"
          placeholderTextColor="#737373"
          className="rounded-2xl bg-neutral-800 px-4 py-3 text-base text-white"
        />
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

      <Text className="text-xs text-neutral-500">
        Check the UPI ID before continuing. UPI payments can't be reversed by this app.
      </Text>

      {!!payError && <Text className="text-sm text-red-400">{payError}</Text>}

      {/* Actions */}
      {Platform.OS === "ios" ? (
        <View className="gap-3">
          <Text className="text-sm font-semibold text-neutral-400">Pay with</Text>
          <View className="flex-row gap-2">
            {Object.entries(PAY_APPS).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => submit(key)}
                disabled={paying}
                className={`flex-1 items-center rounded-2xl bg-lime-300 py-3 ${
                  paying ? "opacity-50" : ""
                }`}
              >
                <Text className="font-semibold text-black">{label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            className="items-center rounded-2xl bg-neutral-800 py-3"
          >
            <Text className="font-semibold text-white">Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 items-center justify-center rounded-2xl bg-neutral-800 py-3"
          >
            <Text className="font-semibold text-white">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => submit(null)}
            disabled={paying}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-lime-300 py-3 ${
              paying ? "opacity-50" : ""
            }`}
          >
            <Text className="font-semibold text-black">Pay with UPI app</Text>
            <Ionicons name="arrow-forward" size={18} color="black" />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}