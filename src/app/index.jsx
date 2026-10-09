import { SafeAreaView } from "react-native-safe-area-context";

import Dashboard from "../components/Dashboard.jsx";
import Header from "../components/Header.jsx";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-black">

      <Header />
      <Dashboard />
    </SafeAreaView>
    
  );
}
