import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, useContext, useEffect, useState } from "react"

const KEY = "ledger:v2"
const SEED_DUMMY_DATA = true
 
const ago = (hours) => new Date(Date.now() - hours * 3600000).toISOString()
 
// Positive balance = they owe you ("you'll get"), negative = you owe them ("you'll give")
const SEED_PEOPLE = [
  { id: 1, name: "Rahul Sharma" },
  { id: 2, name: "Priya Nair" },
  { id: 3, name: "Amit Verma" },
  { id: 4, name: "Sneha Reddy" },
  { id: 5, name: "Karthik" },
  { id: 6, name: "Neha Gupta" },
]
 
const SEED_ENTRIES = [
  { id: 101, personId: 1, type: "gave", amount: 3000, note: "Trip share", createdAt: ago(72) },
  { id: 102, personId: 1, type: "got", amount: 500, note: "Part payment", createdAt: ago(2) },
  { id: 103, personId: 2, type: "got", amount: 1200, note: "Dinner split", createdAt: ago(28) },
  { id: 104, personId: 3, type: "gave", amount: 8000, note: "Laptop loan", createdAt: ago(300) },
  { id: 105, personId: 4, type: "got", amount: 450, note: "Cab fare", createdAt: ago(340) },
  { id: 106, personId: 5, type: "gave", amount: 1500, note: "Concert tickets", createdAt: ago(380) },
  { id: 107, personId: 6, type: "got", amount: 3200, note: "Rent share", createdAt: ago(420) },
]

let lastId =  0
const nextId = () => {
  const now = Date.now()
  lastId = now > lastId ? now : lastId + 1
  return lastId
}

const LedgerContext = createContext(null)

export function LedgerProvider({ children }){

  const [data, setData] = useState({ people : [], entries : [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {

    AsyncStorage.getItem(KEY).then(
      (raw) => {
        const saved = raw ? JSON.parse(raw) : null
        if (saved && Array.isArray(saved.people) && Array.isArray(saved.entries)){
          setData({ people : saved.people.filter(Boolean), entries : saved.entries.filter(Boolean)})
        } else if( SEED_DUMMY_DATA ) {
          setData({ people : SEED_PEOPLE, entries : SEED_ENTRIES })
        }
      }
    )
    .catch(() => {})
    .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {})
  }, [data, loaded])

  const addPerson = (name) =>{
    const person = { id : nextId(), name : name.trim()}
    setData((data) = ({ ...data, people : [...data.people, person]}))
    return person.id
  }

  const addEntry = (personId, { type, amount, note }) => {
    const entry = {
      id: nextId(),
      personId, 
      type,
      amount,
      note : note ?? "",
      createdAt : new Date().toISOString(),
    }
    setData(data => ({...data, entries : [...data.entries, entry]}))
    return entry.id
  }

  const updateEntry = (id, patch) => {
    setData(data => (
      {
        ...data,
        entries : data.entries.map((e) => (e?.id === id ? { ...e, ...patch} : e)),
      }
    ))
  }

  const deleteEntry = (id) => {
    setData(data => ({...data, entries : data.entries.filter((e) => e?.id !== id)}))
  }

  const deletePerson = (id) => {
    setData( data => (
      {
        ...data,
        people : data.people.filter((p) => p?.id !== id),
        entries : data.entries.filter((e) => e?.personId !== id)
      }
    ))
  }

  return (
    <LedgerContext.Provider
      value={{
        people: data.people,
        entries: data.entries,
        loaded,
        addPerson,
        addEntry,
        updateEntry,
        deleteEntry,
        deletePerson,
      }}
      >
        {children}
    </LedgerContext.Provider>
  )

}

export function useLedger(){
  const ctx = useContext(LedgerContext)
  if (!ctx) throw new Error("useLedger must be inside <LedgerProvider> ")
  return ctx 
}
