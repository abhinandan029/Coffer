import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";

export default function ContactsList({ select, contacts, fetching, onClose }){
  return (
    <Modal visible={select} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center"
      >
        {/* Background Overlay */}
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
          onPress={onClose}
        />
        
        {fetching ? (
          <View className="rounded-3xl bg-neutral-900 mx-10 p-10 justify-center items-center gap-3">
            <ActivityIndicator size="large" color="#bef264" />
            <Text className="text-neutral-400 text-sm font-medium">Loading device contacts...</Text>
          </View>
        ) : contacts ? (
          <Body contacts={contacts} onClose={onClose}/>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Body({ contacts, onClose }) {
  const PAGE_SIZE = 20;
  const [searchQuery, setSearchQuery] = useState("");
  
  const [visibleContacts, setVisibleContacts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 1. Compute filtered contacts based on the search query input
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Reset lazy loading windows whenever the user types into search or context changes
  useEffect(() => {
    setVisibleContacts(filteredContacts.slice(0, PAGE_SIZE));
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, contacts]);

  // 3. Lazy load sequential blocks from the filtered sub-array
  const loadMoreContacts = () => {
    if (visibleCount >= filteredContacts.length) return;

    const nextCount = visibleCount + PAGE_SIZE;
    setVisibleContacts(filteredContacts.slice(0, nextCount));
    setVisibleCount(nextCount);
  };

  return (
    <View
      style={{ height : "70%", flexGrow : 0}}
      className="rounded-3xl bg-neutral-900 mx-5 p-5 gap-4"
    >
      {/* Modal Header */}
      <View className="flex flex-row justify-between items-center">
        <Text className="text-white text-3xl font-bold">Contacts</Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close" color="#ffffff" size={30} />
        </Pressable>
      </View>

      {/* Search Input Bar Field */}
      <View className="flex-row items-center bg-neutral-800 rounded-2xl px-4 py-1 gap-2">
        <Ionicons name="search" color="#a3a3a3" size={20} />
        <TextInput
          className="flex-1 text-white py-2 text-base"
          placeholder="Search contacts..."
          placeholderTextColor="#737373"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" color="#a3a3a3" size={18} />
          </Pressable>
        )}
      </View>
      
      {/* Optimized Lazy Loading List layout */}
      <FlatList
        data={visibleContacts}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3 pb-2"
        initialNumToRender={PAGE_SIZE}
        windowSize={5}
        onEndReached={loadMoreContacts}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <View className="flex bg-neutral-800 rounded-2xl px-4 py-3 gap-0.5">
            <Text className="text-white text-lg font-semibold">{item.name}</Text>
            <Text className="text-white/50 text-sm">
              {item.numbers && item.numbers.length > 0 ? item.numbers[0] : 'No number'}
            </Text>
          </View>
        )}
        ListFooterComponent={
          visibleCount < filteredContacts.length ? (
            <ActivityIndicator size="small" color="#bef264" style={{ marginVertical: 10 }} />
          ) : null
        }
        ListEmptyComponent={
          <Text className="text-neutral-500 text-center py-10">No matches found.</Text>
        }
      />
    </View>
  );
}
