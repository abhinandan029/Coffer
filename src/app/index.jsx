import { useEffect, useRef, useState } from "react";
import { AppState, Linking, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PAY_APPS } from "../constants/expenses";
import { ExpensesProvider, useExpenses } from "../contexts/ExpensesContext";
import { buildPayUrl } from "../utils/upi";

import ConfirmPayment from "../components/ConfirmPayment";
import Header from "../components/Header.jsx";
import NavBar from "../components/NavBar.jsx";
import PaymentReview from "../components/PaymentReview";

import Expenses from "../screens/Expenses.jsx";
import Ledger from "../screens/Ledger.jsx";
import Scanner from "../screens/Scanner.jsx";

const screens = {
  expenses: Expenses,
  ledger: Ledger,
  scanner: Scanner,
};

function Main() {
  const [tab, setTab] = useState("expenses");
  const Screen = screens[tab];

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

  const confirmExpense = expenses.find((e) => e?.id === confirmId) ?? null;

  // Returns null on success, or an error message for the review sheet to show
  const handlePay = async (payment, appKey) => {
    const personal = payment.kind === "personal";

    // Save first, so the expense isn't lost if the phone closes this app while the UPI app is open
    const id = addExpense({
      amount: payment.amount,
      payeeName: payment.payeeName,
      payeeUpiId: payment.payeeUpiId,
      note: payment.note,
      source: payment.source,
      payeeType: payment.kind,
      app: personal ? null : appKey,
      needsConfirm: true,
    });

    if (personal) {
      // No payment details are passed. This only opens the UPI app chooser.
      // If nothing opens, the user opens their UPI app themselves; the expense is saved either way.
      Linking.openURL("upi://pay").catch(() => {});
      setPayDraft(null);
      setTab("expenses");
      return null;
    }

    try {
      await Linking.openURL(buildPayUrl(payment, appKey));
      setPayDraft(null);
      setTab("expenses");
      return null;
    } catch {
      deleteExpense(id); // nothing was started, so don't leave a pending entry behind
      return appKey
        ? `Couldn't open ${PAY_APPS[appKey]}. Is it installed?`
        : "No UPI app found on this phone.";
    }
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
      <Header transparent={tab === "scanner"} />

      <View className="flex-1">
        <Screen
          onClose={() => setTab("expenses")}
          onScanned={setPayDraft}
          onManual={startManual}
          paused={!!payDraft}
          onReviewPending={reviewPending}
        />
      </View>

      <NavBar active={tab} onChange={setTab} />

      <PaymentReview
        draft={payDraft}
        onClose={() => setPayDraft(null)}
        onContinue={handlePay}
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
      <Main />
    </ExpensesProvider>
  );
}