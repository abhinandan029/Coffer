import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

export default function Menu({ menu, onClose }){
  return (
    <Modal visible={menu} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-end"
      >
        <Pressable
        className="absolute bottom-0 left-0 right-0 top-0 bg-black/70"
        onPress={onClose}
        />
        
        {menu ? <Body onClose={onClose} /> : null}

      </KeyboardAvoidingView>
    </Modal>
  )
}

function Body({ onClose }){

  const menuList = [
    { label : "Savings", icon : "cash"},
    { label : "Settings", icon : "settings"}
  ]

  return (
    <ScrollView 
    style={{ maxHeight : "60%", flexGrow : 0}}
    className="rounded-t-3xl bg-neutral-900"
    contentContainerClassName="gap-4 px-5 pt-5"
    contentContainerStyle={{
      paddingBottom: (Platform.OS === "ios" ? insets.bottom : 0) + 16,
    }}
    keyboardShouldPersistTaps="handled"
    >

      <View className="flex flex-row items-center justify-center mb-2">

        <Pressable
        onPress={onClose}>
          <Ionicons name="arrow-down-circle" color="#ffffff" size={34} />
        </Pressable>

      </View>

      <View className="gap-2">
        {
          menuList.map(item => {
            return(
              <Pressable
              key={item.label}
              className="flex flex-row items-center bg-neutral-800 gap-2 px-4 py-2 rounded-xl">
                <Ionicons name={item.icon} color="#ffffff" size={24} />
                <Text className="text-white text-2xl" >{item.label}</Text> 
              </Pressable>
            )
          })
        }
      </View>

      <View
      className="self-center mt-10">
        <Text className="text-white">Coffer v.1.0.0</Text>
      </View>
      
    </ScrollView>
  )
}