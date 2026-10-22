import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import ChatScreen from "../components/ChatScreen";
import ContactsList from "../components/ContactsList";

import { dayHeading, initials, money, round2, signed } from "../constants/ledger";

import { useLedger } from "../contexts/LedgerContext";

import { fetchContacts } from "../utils/fetchContacts";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "get", label: "You'll get" },
  { key: "give", label: "You'll give" },
];

export default function Ledger() {
  const { people = [], entries = [], loaded } = useLedger();

  const [contacts, setContacts] = useState([]);
  const [fetching, setFetching] = useState(false)
  const [select, setSelect] = useState(false)

  const [filter, setFilter] = useState("all");
  const [chat, setChat] = useState(null); // id of the person whose thread is open

  const handleFetchContacts = async () => {
    setSelect(true)
    setFetching(true)
    
    const result = await fetchContacts()
    setFetching(false)

    if( result.success ){
      setContacts(result.data)
    }
    else{
      setSelect(false)
      Alert.alert('Permission Denied', 'Please allow contact permission in phone setting to add a person.')
    }
  }

  // One row per person: balance from their entries, newest activity first
  const rows = useMemo(
    () =>
      people
        .filter(Boolean)
        .map((p) => {
          const mine = entries
            .filter((e) => e?.personId === p.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const last = mine[0];
          return {
            id: p.id,
            name: p.name,
            amount: round2(mine.reduce((s, e) => s + signed(e), 0)),
            note: last ? last.note || (last.type === "gave" ? "You gave" : "You got") : "No entries yet",
            updated: last ? dayHeading(last.createdAt) : "",
            at: last ? new Date(last.createdAt).getTime() : 0,
          };
        })
        .sort((a, b) => b.at - a.at),
    [people, entries]
  );

  if (!loaded) return null;

  const toGet = rows.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0);
  const toGive = rows.filter((p) => p.amount < 0).reduce((s, p) => s + -p.amount, 0);
  const net = round2(toGet - toGive);

  const visible = rows.filter((p) => {
    if (filter === "get") return p.amount > 0;
    if (filter === "give") return p.amount < 0;
    return true;
  });

  return (
    <>
      <ScrollView contentContainerClassName="p-4 pb-32 gap-5">
        {/* Net balance */}
        <View className="relative rounded-3xl bg-neutral-900 p-5">
          <Text className="text-sm text-neutral-400">Net balance</Text>
          <Text
            className={`mt-1 text-4xl font-bold ${
              net > 0 ? "text-lime-300" : net < 0 ? "text-red-400" : "text-white"
            }`}
          >
            {net > 0 ? "+" : net < 0 ? "-" : ""}
            {money(net)}
          </Text>

          <Pressable
          className="absolute right-5 top-5 bg-neutral-700 rounded-xl p-2"
          onPress={handleFetchContacts}>
            <Ionicons name="person-add" color="#ffffff" size={28} />
          </Pressable>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-neutral-800 p-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="arrow-down-circle" size={16} color="#bef264" />
                <Text className="text-xs text-neutral-400">You'll get</Text>
              </View>
              <Text className="mt-1 text-lg font-semibold text-white">{money(toGet)}</Text>
            </View>

            <View className="flex-1 rounded-2xl bg-neutral-800 p-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="arrow-up-circle" size={16} color="#f87171" />
                <Text className="text-xs text-neutral-400">You'll give</Text>
              </View>
              <Text className="mt-1 text-lg font-semibold text-white">{money(toGive)}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2">
          {FILTERS.map(({ key, label }) => {
            const selected = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                className={`rounded-full px-4 py-2 ${selected ? "bg-white" : "bg-neutral-900"}`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? "text-black" : "text-neutral-300"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* People list */}
        {visible.length === 0 ? (
          <Text className="mt-8 text-center text-neutral-500">Nothing here.</Text>
        ) : (
          <View className="overflow-hidden rounded-3xl bg-neutral-900">
            {visible.map((p, i) => {
              const getting = p.amount > 0;
              const settled = p.amount === 0;
              return (
                <Pressable
                  key={p.id}
                  className={`flex-row items-center gap-3 p-4 ${
                    i > 0 ? "border-t border-neutral-800" : ""
                  }`}
                  onPress={() => setChat(p.id)}
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-700">
                    <Text className="font-semibold text-white">{initials(p.name)}</Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-base font-semibold text-white">{p.name}</Text>
                    <Text className="text-xs text-neutral-400" numberOfLines={1}>
                      {p.note}
                      {p.updated ? ` · ${p.updated}` : ""}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`text-base font-semibold ${
                        settled ? "text-neutral-400" : getting ? "text-lime-300" : "text-red-400"
                      }`}
                    >
                      {money(p.amount)}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {settled ? "settled" : getting ? "you'll get" : "you'll give"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {
        select && 
        <ContactsList 
          select={select}
          fetching={fetching}
          contacts={contacts}
          onClose={() => setSelect(false)}
        />
      }

      <ChatScreen personId={chat} onClose={() => setChat(null)} />
    </>
  );
}