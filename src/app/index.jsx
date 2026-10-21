import { useEffect, useRef, useState } from "react";
import { AppState, Linking, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpensesProvider, useExpenses } from "../contexts/ExpensesContext";
import { LedgerProvider } from "../contexts/LedgerContext";

import AddExpense from "../components/AddExpense";
import ConfirmPayment from "../components/ConfirmPayment";
import ExpenseSheet from "../components/ExpenseSheet";
import Header from "../components/Header.jsx";
import Menu from "../components/Menu";
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

  const [menu, setMenu] = useState(false)

  const { expenses, loaded, addExpense, updateExpense, deleteExpense } = useExpenses();

  const [payDraft, setPayDraft] = useState(null);

  // --- Payment return detection ---
  const [confirmId, setConfirmId] = useState(null);
  // Set while the expense sheet is open on top of the confirm sheet (the "Edit details" button)
  const [editingId, setEditingId] = useState(null);

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
  const editExpense = (expenses ?? []).find((e) => e?.id === editingId) ?? null;

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
      <Header setMenu={() => setMenu(true)}/>

      <Menu 
        menu={menu} 
        onClose={() => setMenu(false)}
      />

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

      {/* Hidden while the expense sheet is open, and shown again (with the edits) after it closes */}
      <ConfirmPayment
        expense={editingId ? null : confirmExpense}
        onResolve={(patch) => {
          updateExpense(confirmId, { ...patch, needsConfirm: false });
          setConfirmId(null);
        }}
        onLater={() => {
          snoozed.current.add(confirmId);
          setConfirmId(null);
        }}
        onEdit={() => setEditingId(confirmId)}
      />

      {/* Edits are saved as you make them, like on the Expenses screen */}
      <ExpenseSheet
        expense={editExpense}
        onClose={() => {
          // If the status was changed by hand, it no longer needs the "did it go through?" question
          if (editExpense && !editExpense.needsConfirm) setConfirmId(null);
          setEditingId(null);
        }}
        onChange={(patch) => {
            if(!editExpense) return ;
            const next = "status" in patch ? { ...patch, needsConfirm : patch.status === "PENDING"} : patch;
            updateExpense(editExpense.id, next)
          }
        }
        onDelete={() => {
          if (!editExpense) return;
          deleteExpense(editExpense.id);
          setEditingId(null);
          setConfirmId(null);
        }}
      />
    </SafeAreaView>
  );
}

export default function Index() {
  return (
    <ExpensesProvider>
      <LedgerProvider>
        <SmsSync />
        <Main />
      </LedgerProvider>
    </ExpensesProvider>
  );
}