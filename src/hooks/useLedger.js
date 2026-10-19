import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "ledger-extras:v1";

// Text notes and screenshots shown in a person's chat. They never affect the balance.
export default function useLedgerExtras() {
  const [extras, setExtras] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? JSON.parse(raw) : null;
        if (Array.isArray(saved)) setExtras(saved.filter(Boolean));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(extras)).catch(() => {});
  }, [extras, loaded]);

  const addExtra = (personId, data) =>
    setExtras((list) => [
      ...list,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        personId,
        createdAt: new Date().toISOString(),
        ...data,
      },
    ]);

  const deleteExtra = (id) => setExtras((list) => list.filter((x) => x && x.id !== id));

  return { extras, loaded, addExtra, deleteExtra };
}