import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Header({ setMenu }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex flex-row p-3 justify-between"
    >
      
      <Text className="font-serif text-4xl font-bold text-white">Coffer</Text>
      
      <Pressable
      onPress={setMenu}>
        <Ionicons name="menu" color="#ffffff" size={34} className="text-white"></Ionicons>
      </Pressable>
      
    </View>
  );
}

export default Header;