import { Ionicons } from '@react-native-vector-icons/ionicons';

import { Pressable, Text, View } from "react-native";

function Header(){

  return (
    <View className="fixed top-0">
      
      <View className="flex flex-row justify-between bg-black p-4">
        <Text className="text-white text-4xl font-serif font-bold">Coffer</Text>

        <Pressable 
        onPress={() => console.log("menu pressed")}>
          <Ionicons name="menu" size={32} color="white" />
        </Pressable>

      </View>


    </View>
  )
}

export default Header