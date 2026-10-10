import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, useContext, useEffect, useState } from "react"
import { DUMMY_EXPENSES } from "../constants/expenses.js"

const KEY = "expenses:v2"
const SEED_DUMMY_DATA = true

const ExpensesContext = createContext(null)

export function ExpensesProvider({ children }) {
  const [expenses, setExpenses] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(KEY)
    .then((raw) => {
      const saved = raw ? JSON.parse(raw) : null
      if (Array.isArray(saved)) setExpenses(saved.filter(Boolean))
      else if (SEED_DUMMY_DATA) setExpenses(DUMMY_EXPENSES)
    })
    .catch(() => {})
    .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(expenses)).catch(() => {})
  }, [expenses, loaded])

  const addExpense = (data) => {
    const expense = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: "PENDING",
      category: null,
      ...data,
    }
    setExpenses((list) => [expense, ...list])
    return expense.id
  }

  const updateExpense = (id, patch) => {
    setExpenses((list) => list.map((e) => (e?.id === id ? { ...e, ...patch } : e)))
  }

  const deleteExpense = (id) => {
    setExpenses((list) => list.filter((e) => e?.id !== id))
  }

  return (
    <ExpensesContext.Provider
      value={{ expenses, loaded, addExpense, updateExpense, deleteExpense }}
    >
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error("useExpenses must be used inside <ExpensesProvider>")
  return ctx
}