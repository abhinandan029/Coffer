import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dayHeading, dayKey, initials, money, round2, signed, timeLabel } from "../constants/ledger";

import { useLedger } from "../contexts/LedgerContext";
import useLedgerExtras from "../hooks/useLedger";

const MAX_AMOUNT = 10000000;

// Keeps digits and one decimal point, with at most two decimal places
const cleanAmount = (text) => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

const ratioOf = (x) =>
  Math.min(Math.max(x?.width && x?.height ? x.width / x.height : 0.75, 0.5), 1.6);

// The picker's copy can be cleared by Android, so keep our own copy of the picture
async function keepImage(uri) {
  try {
    const dest = new File(Paths.document, `ledger-${Date.now()}.jpg`);
    await Promise.resolve(new File(uri).copy(dest));
    return dest.uri;
  } catch {
    return uri;
  }
}

// History with one person: a bubble for every entry, note and screenshot
export default function ChatScreen({ personId, onClose }) {
  return (
    <Modal
      visible={personId != null}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
          onPress={onClose}
        />
        {personId != null ? <Body key={personId} personId={personId} onClose={onClose} /> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Body({ personId, onClose }) {
  const insets = useSafeAreaInsets();
  const { people, entries, addEntry, updateEntry, deleteEntry } = useLedger();
  const { extras, loaded, addExtra, deleteExtra } = useLedgerExtras();
  const person = people.find((p) => p?.id === personId);

  const [sheet, setSheet] = useState(null); // null | { type, entry?, image? }
  const [item, setItem] = useState(null); // a note or screenshot opened for viewing
  const [text, setText] = useState("");
  const [kb, setKb] = useState(0);
  const scrollRef = useRef(null);
  const stickToEnd = useRef(true); // jump to the newest item on open and after adding
  const pendingAttach = useRef(null); // a screenshot waiting for its new entry to appear

  // Lift the input bar above the keyboard (Android modals don't resize on their own)
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKb(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Screenshots attached to entries, by entry id
  const attachments = useMemo(() => {
    const map = new Map();
    extras.forEach((x) => {
      if (x?.kind === "attachment") map.set(x.entryId, x);
    });
    return map;
  }, [extras]);

  // A new entry with a screenshot: link them as soon as the entry shows up in the list
  useEffect(() => {
    const p = pendingAttach.current;
    if (!p) return;
    const created = entries.find((e) => e?.personId === personId && !p.before.has(e.id));
    if (created) {
      pendingAttach.current = null;
      addExtra(personId, {
        kind: "attachment",
        entryId: created.id,
        uri: p.image.uri,
        width: p.image.width,
        height: p.image.height,
      });
    }
  }, [entries]);

  // Entries (with the balance after each) merged with notes and screenshots, oldest first
  const { merged, balance } = useMemo(() => {
    let running = 0;
    const entryItems = entries
      .filter((e) => e?.personId === personId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((e) => {
        running = round2(running + signed(e));
        return { ...e, kind: "entry", running };
      });
    const extraItems = extras.filter((x) => x.personId === personId && x.kind !== "attachment");
    const all = [...entryItems, ...extraItems].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    return { merged: all, balance: entryItems.length ? entryItems[entryItems.length - 1].running : 0 };
  }, [entries, extras, personId]);

  const groups = useMemo(() => {
    const out = [];
    merged.forEach((e) => {
      const key = dayKey(e.createdAt);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(e);
      else out.push({ key, label: dayHeading(e.createdAt), items: [e] });
    });
    return out;
  }, [merged]);

  if (!person) return null;

  const summaryText =
    balance > 0
      ? `You'll get ${money(balance)}`
      : balance < 0
      ? `You'll give ${money(balance)}`
      : "All settled up";
  const summaryColor =
    balance > 0 ? "text-lime-300" : balance < 0 ? "text-red-400" : "text-neutral-400";

  const sendMessage = () => {
    const t = text.trim();
    if (!t) return;
    stickToEnd.current = true;
    addExtra(personId, { kind: "note", text: t });
    setText("");
  };

  const attachScreenshot = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      const uri = await keepImage(asset.uri);
      stickToEnd.current = true;
      addExtra(personId, { kind: "image", uri, width: asset.width, height: asset.height });
    } catch {
      // picker closed or failed: nothing to add
    }
  };

  const saveEntry = ({ type, amount, note, image }) => {
    if (sheet.entry) {
      updateEntry(sheet.entry.id, { type, amount, note });

      const existing = attachments.get(sheet.entry.id);
      if (existing && (!image || image.uri !== existing.uri)) deleteExtra(existing.id);
      if (image && (!existing || image.uri !== existing.uri)) {
        addExtra(personId, {
          kind: "attachment",
          entryId: sheet.entry.id,
          uri: image.uri,
          width: image.width,
          height: image.height,
        });
      }
    } else {
      stickToEnd.current = true;
      if (image) pendingAttach.current = { before: new Set(entries.map((e) => e?.id)), image };
      addEntry(personId, { type, amount, note });
    }
    setSheet(null);
  };

  return (
    <View className="overflow-hidden rounded-t-3xl bg-black" style={{ height: "95%" }}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-neutral-800 bg-neutral-900 px-4 pb-3 pt-4">
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-700">
          <Text className="font-semibold text-white">{initials(person.name)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-white" numberOfLines={1}>
            {person.name}
          </Text>
          <Text className={`text-sm font-semibold ${summaryColor}`}>{summaryText}</Text>
        </View>
      </View>

      {/* Thread: the only part that scrolls */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-32"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (stickToEnd.current && loaded) {
            scrollRef.current?.scrollToEnd({ animated: false });
            stickToEnd.current = false;
          }
        }}
      >
        {groups.length === 0 && (
          <Text className="mt-14 text-center text-neutral-500">
            Nothing here yet. Type a message, attach a screenshot, or tap + to add an entry.
          </Text>
        )}

        {groups.map((group) => (
          <View key={group.key} className="gap-3">
            <Text className="self-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-400">
              {group.label}
            </Text>

            {group.items.map((e) => {
              // Text note
              if (e.kind === "note") {
                return (
                  <View key={e.id} className="w-full items-end">
                    <Pressable
                      onPress={() => setItem(e)}
                      className="max-w-[78%] gap-1 rounded-2xl rounded-br-md bg-neutral-800 px-4 py-2.5"
                    >
                      <Text className="text-base text-white">{e.text}</Text>
                      <Text className="self-end text-[11px] text-neutral-500">
                        {timeLabel(e.createdAt)}
                      </Text>
                    </Pressable>
                  </View>
                );
              }

              // Screenshot on its own
              if (e.kind === "image") {
                return (
                  <View key={e.id} className="w-full items-end">
                    <Pressable
                      onPress={() => setItem(e)}
                      className="rounded-2xl rounded-br-md bg-neutral-800 p-1"
                    >
                      <Image
                        source={{ uri: e.uri }}
                        style={{ width: 220, aspectRatio: ratioOf(e), borderRadius: 14 }}
                        resizeMode="cover"
                      />
                      <Text className="self-end px-2 pb-1 pt-1 text-[11px] text-neutral-500">
                        {timeLabel(e.createdAt)}
                      </Text>
                    </Pressable>
                  </View>
                );
              }

              // Ledger entry, with its screenshot if it has one
              const gave = e.type === "gave";
              const att = attachments.get(e.id);
              return (
                <View key={e.id} className={`w-full ${gave ? "items-end" : "items-start"}`}>
                  <Pressable
                    onPress={() => setSheet({ type: e.type, entry: e, image: att ?? null })}
                    className={`max-w-[78%] gap-1 rounded-2xl border px-4 py-3 ${
                      gave
                        ? "rounded-br-md border-lime-300/30 bg-lime-300/15"
                        : "rounded-bl-md border-red-400/30 bg-red-400/15"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        gave ? "text-lime-300" : "text-red-300"
                      }`}
                    >
                      {gave ? "You gave" : "You got"}
                    </Text>
                    <Text className="text-2xl font-bold text-white">{money(e.amount)}</Text>
                    {!!e.note && <Text className="text-sm text-neutral-300">{e.note}</Text>}

                    {!!att && (
                      <Pressable
                        onPress={() => setItem({ ...att, kind: "image", readOnly: true })}
                        className="mt-1"
                      >
                        <Image
                          source={{ uri: att.uri }}
                          style={{ width: 200, aspectRatio: ratioOf(att), borderRadius: 12 }}
                          resizeMode="cover"
                        />
                      </Pressable>
                    )}

                    <View className="flex-row items-center justify-between gap-6">
                      <Text className="text-[11px] text-neutral-400">{timeLabel(e.createdAt)}</Text>
                      <Text className="text-[11px] text-neutral-300">
                        Balance {e.running < 0 ? "-" : ""}
                        {money(e.running)}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Input bar: screenshot, message, add entry */}
      <View
        className="absolute left-0 right-0 flex-row items-end gap-2 border-t border-neutral-900 bg-black px-3 pt-2"
        style={{
          bottom: Platform.OS === "android" && kb > 0 ? kb : 0,
          paddingBottom: kb > 0 ? 8 : insets.bottom + 8,
        }}
      >
        <Pressable
          onPress={attachScreenshot}
          className="h-12 w-12 items-center justify-center rounded-full bg-neutral-800"
        >
          <Ionicons name="image-outline" size={22} color="#d4d4d4" />
        </Pressable>

        <View className="min-h-[48px] flex-1 flex-row items-center rounded-3xl bg-neutral-800 pl-4 pr-1">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor="#737373"
            multiline
            maxLength={300}
            className="flex-1 py-2 text-base text-white"
            style={{ maxHeight: 96 }}
          />
          {!!text.trim() && (
            <Pressable
              onPress={sendMessage}
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="send" size={18} color="black" />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => setSheet({ type: "gave", image: null })}
          className="h-12 w-12 items-center justify-center rounded-full bg-lime-300"
        >
          <Ionicons name="add" size={28} color="black" />
        </Pressable>
      </View>

      {sheet && (
        <EntrySheet
          key={sheet.entry ? sheet.entry.id : "new"}
          sheet={sheet}
          onClose={() => setSheet(null)}
          onSave={saveEntry}
          onDelete={() => {
            const att = attachments.get(sheet.entry.id);
            if (att) deleteExtra(att.id);
            deleteEntry(sheet.entry.id);
            setSheet(null);
          }}
        />
      )}

      {item && (
        <ItemSheet
          item={item}
          onClose={() => setItem(null)}
          onDelete={() => {
            deleteExtra(item.id);
            setItem(null);
          }}
        />
      )}
    </View>
  );
}

// View a note or screenshot. Stand-alone ones can be deleted here; an entry's screenshot is changed in its entry.
function ItemSheet({ item, onClose, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0 justify-center bg-black/90 px-5">
      {item.kind === "image" ? (
        <Image
          source={{ uri: item.uri }}
          style={{ width: "100%", height: "70%" }}
          resizeMode="contain"
        />
      ) : (
        <View className="rounded-3xl bg-neutral-900 p-5">
          <Text className="text-base text-white">{item.text}</Text>
        </View>
      )}

      <View className="mt-5">
        {confirmDelete ? (
          <View className="gap-3">
            <Text className="text-center text-sm text-neutral-300">
              Delete this {item.kind === "image" ? "screenshot" : "note"}? This can't be undone.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmDelete(false)}
                className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
              >
                <Text className="font-semibold text-white">Keep</Text>
              </Pressable>
              <Pressable onPress={onDelete} className="flex-1 items-center rounded-2xl bg-red-500 py-3">
                <Text className="font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-3">
            {!item.readOnly && (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                className="items-center justify-center rounded-2xl bg-red-500/15 px-4 py-3"
              >
                <Ionicons name="trash-outline" size={20} color="#f87171" />
              </Pressable>
            )}
            <Pressable onPress={onClose} className="flex-1 items-center rounded-2xl bg-white py-3">
              <Text className="font-semibold text-black">Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// Add or edit one entry. Drawn inside the screen, near the top, so the keyboard never covers it.
function EntrySheet({ sheet, onClose, onSave, onDelete }) {
  const editing = !!sheet.entry;
  const [type, setType] = useState(sheet.type);
  const [amount, setAmount] = useState(editing ? String(sheet.entry.amount) : "");
  const [note, setNote] = useState(editing ? sheet.entry.note ?? "" : "");
  const [image, setImage] = useState(sheet.image ?? null); // { uri, width, height, fresh? }
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pickImage = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (picked.canceled) return;
      const a = picked.assets[0];
      setImage({ uri: a.uri, width: a.width, height: a.height, fresh: true });
    } catch {
      // picker closed or failed: keep what we had
    }
  };

  const save = async () => {
    if (saving) return;
    const n = round2(parseFloat(amount));
    if (!(n > 0)) return setError("Enter an amount greater than 0");
    if (n > MAX_AMOUNT) return setError("That amount looks too large");

    setSaving(true);
    // Copy a newly picked picture into the app only now, so cancelling leaves nothing behind
    const finalImage = image?.fresh ? { ...image, uri: await keepImage(image.uri), fresh: false } : image;
    onSave({ type, amount: n, note: note.trim(), image: finalImage });
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0 items-center bg-black/70 px-6 pt-24">
      <View className="w-full gap-4 rounded-3xl bg-neutral-900 p-5">
        <Text className="text-lg font-semibold text-white">
          {editing ? "Edit entry" : "New entry"}
        </Text>

        <View className="flex-row gap-1 rounded-2xl bg-neutral-800 p-1">
          {[
            ["gave", "You gave", "bg-lime-300"],
            ["got", "You got", "bg-red-400"],
          ].map(([key, label, active]) => (
            <Pressable
              key={key}
              onPress={() => setType(key)}
              className={`flex-1 items-center rounded-xl py-2 ${type === key ? active : ""}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  type === key ? "text-black" : "text-neutral-300"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="gap-1">
          <View className="flex-row items-center rounded-2xl bg-neutral-800 px-4">
            <Text className="text-xl font-bold text-white">₹</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(cleanAmount(t));
                setError(null);
              }}
              autoFocus={!editing}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#737373"
              className="flex-1 py-3 pl-2 text-xl text-white"
            />
          </View>
          {!!error && <Text className="text-xs text-red-400">{error}</Text>}
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          maxLength={50}
          placeholder="Note (optional)"
          placeholderTextColor="#737373"
          className="rounded-2xl bg-neutral-800 px-4 py-3 text-base text-white"
        />

        {/* Screenshot */}
        {image ? (
          <View className="flex-row items-center gap-3 rounded-2xl bg-neutral-800 p-2">
            <Image source={{ uri: image.uri }} style={{ width: 56, height: 56, borderRadius: 10 }} />
            <Text className="flex-1 text-sm text-neutral-300">Screenshot attached</Text>
            <Pressable onPress={pickImage} hitSlop={8}>
              <Text className="text-sm font-semibold text-lime-300">Change</Text>
            </Pressable>
            <Pressable onPress={() => setImage(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color="#a3a3a3" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickImage}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-neutral-800 py-3"
          >
            <Ionicons name="image-outline" size={18} color="#d4d4d4" />
            <Text className="font-semibold text-neutral-200">Attach screenshot</Text>
          </Pressable>
        )}

        {confirmDelete ? (
          <View className="gap-3">
            <Text className="text-center text-sm text-neutral-300">
              Delete this entry? This can't be undone.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmDelete(false)}
                className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
              >
                <Text className="font-semibold text-white">Keep</Text>
              </Pressable>
              <Pressable onPress={onDelete} className="flex-1 items-center rounded-2xl bg-red-500 py-3">
                <Text className="font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-3">
            {editing ? (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                className="items-center justify-center rounded-2xl bg-red-500/15 px-4 py-3"
              >
                <Ionicons name="trash-outline" size={20} color="#f87171" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-2xl bg-neutral-800 py-3"
            >
              <Text className="font-semibold text-white">Cancel</Text>
            </Pressable>
            <Pressable onPress={save} className="flex-1 items-center rounded-2xl bg-lime-300 py-3">
              <Text className="font-semibold text-black">Save</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}