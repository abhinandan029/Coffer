import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BUDGET } from "../constants/expenses";

const KEY = "budget:v1";

export default function useBudget() {
  const [budget, setBudgetState] = useState(BUDGET);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const n = Number(raw);
        if (n > 0) setBudgetState(n);
      })
      .catch(() => {});
  }, []);

  const setBudget = (n) => {
    setBudgetState(n);
    AsyncStorage.setItem(KEY, String(n)).catch(() => {});
  };

  return { budget, setBudget };
}