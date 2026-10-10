import { useState } from "react";
import { Linking, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PAY_APPS } from "../constants/expenses";
import { ExpensesProvider, useExpenses } from "../contexts/ExpensesContext";
import { buildPayUrl } from "../utils/upi";


import Header from "../components/Header.jsx";
import NavBar from "../components/NavBar.jsx";

import Expenses from "../screens/Expenses.jsx";
import Ledger from "../screens/Ledger.jsx";
import Scanner from "../screens/Scanner.jsx";

import PaymentReview from "../components/PaymentReview";

const screens = {
  expenses: Expenses,
  ledger: Ledger,
  scanner: Scanner,
};

function Main() {
  const [tab, setTab] = useState("expenses");
  const Screen = screens[tab];

  const { addExpense, deleteExpense } = useExpenses();

  const [payDraft, setPayDraft] = useState(null);

  const handlePay = async (payment, appKey) => {
  
    const id = addExpense({
      amount: payment.amount,
      payeeName: payment.payeeName,
      payeeUpiId: payment.payeeUpiId,
      note: payment.note,
      source: payment.source,
      app: appKey,
    });

    try {
      await Linking.openURL(buildPayUrl(payment, appKey));
      setPayDraft(null);
      setTab("expenses"); // so the pending expense is what you see when you come back
      return null;
    } catch {
      deleteExpense(id); // nothing was started, so don't leave a pending entry behind
      return appKey
        ? `Couldn't open ${PAY_APPS[appKey]}. Is it installed?`
        : "No UPI app found on this phone.";
    }
  };

  const startManual = () =>
    setPayDraft({ source: "manual", payeeUpiId: "", payeeName: "", amount: null, note: "" });

  return (
    <SafeAreaView 
    className="flex-1 bg-black">
      <Header transparent={tab === "scanner"} />

      <View className="flex-1">
        <Screen
          onClose={() => setTab("expenses")}
          onScanned={setPayDraft}
          onManual={startManual}
          paused={!!payDraft}
        />
      </View>

      <NavBar active={tab} onChange={setTab} />

      <PaymentReview
        draft={payDraft}
        onClose={() => setPayDraft(null)}
        onContinue={handlePay}
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