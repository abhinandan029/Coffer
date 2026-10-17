import { useEffect, useRef, useState } from "react";
import { AppState, Linking, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpensesProvider, useExpenses } from "../contexts/ExpensesContext";

import AddExpense from "../components/AddExpense";
import ConfirmPayment from "../components/ConfirmPayment";
import Header from "../components/Header.jsx";
import NavBar from "../components/NavBar.jsx";
import SmsSync from "../components/SmsSync";

import Expenses from "../screens/Expenses.jsx";
import Ledger from "../screens/Ledger.jsx";

const screens = {
  expenses: Expenses,
  ledger: Ledger,
};

function Main() {
  const [tab, setTab] = useState("expenses");
  const Screen = screens[tab];

  const [adding , setAdding] = useState(false)

  const { expenses, loaded, addExpense, updateExpense, deleteExpense } = useExpenses();

  const [payDraft, setPayDraft] = useState(null);

  // --- Payment return detection ---
  const [confirmId, setConfirmId] = useState(null);
  const snoozed = useRef(new Set()); // "Decide later" ids, until the app restarts
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses; // lets the listener below always see the latest list

  const checkPending = () => {
    const next = expensesRef.current.find(
      (e) => e?.needsConfirm && !snoozed.current.has(e.id)
    );
    if (next) setConfirmId(next.id);
  };

  // Reopens the confirmation sheet for the first unanswered payment (used by the banner)
  const reviewPending = () => {
    const next = expensesRef.current.find((e) => e?.needsConfirm);
    if (next) {
      snoozed.current.delete(next.id);
      setConfirmId(next.id);
    }
  };

  // App start (covers the phone closing Coffer while the UPI app was open)
  useEffect(() => {
    if (loaded) checkPending();
  }, [loaded]);

  // Coming back to the app from the UPI app
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPending();
    });
    return () => sub.remove();
  }, []);

  const confirmExpense = (expenses ?? []).find((e) => e?.id === confirmId) ?? null;

  // Returns null on success, or an error message for the review sheet to show
  const handlePay = (data) => {
    addExpense({
      ...data,
      source: "manual",
      payeeType: "personal",
      app: null,
      status: "PENDING",
      needsConfirm: true,
    });
    Linking.openURL("upi://pay").catch(() => {});
    setAdding(false);
    setTab("expenses");
  };

  const startManual = () =>
    setPayDraft({
      source: "manual",
      kind: "personal",
      payeeUpiId: "",
      payeeName: "",
      amount: null,
      note: "",
    }
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Header />

      <View className="flex-1">
        <Screen
          onClose={() => setTab("expenses")}
          onReviewPending={reviewPending}
          onAdd={() => setAdding(true)}
        />
      </View>

      <NavBar active={tab} onChange={setTab} onAdd={() => setAdding(true)}/>

      <AddExpense
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(data) => {
          addExpense(data);
          setAdding(false);
        }}
        onPay={handlePay}
      />

      <ConfirmPayment
        expense={confirmExpense}
        onResolve={(patch) => {
          updateExpense(confirmId, { ...patch, needsConfirm: false });
          setConfirmId(null);
        }}
        onLater={() => {
          snoozed.current.add(confirmId);
          setConfirmId(null);
        }}
      />
    </SafeAreaView>
  );
}

export default function Index() {
  return (
    <ExpensesProvider>
      <SmsSync />
      <Main />
    </ExpensesProvider>
  );
}