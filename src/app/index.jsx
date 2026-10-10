import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header.jsx";
import NavBar from "../components/NavBar.jsx";

import Expenses from "../screens/Expenses.jsx";
import Ledger from "../screens/Ledger.jsx";
import Scanner from "../screens/Scanner.jsx";

const screens = {
  expenses: Expenses,
  ledger: Ledger,
  scanner: Scanner,
};

export default function App() {
  const [tab, setTab] = useState("expenses");
  const Screen = screens[tab];

  return (
    <SafeAreaView 
    className="flex-1 bg-black">
      <Header transparent={tab === "scanner"} />

      <View className="flex-1">
        <Screen onClose={() => setTab("expenses")} />
      </View>

      <NavBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}