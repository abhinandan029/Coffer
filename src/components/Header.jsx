import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Header({ transparent = false }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={
        transparent
          ? "absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between p-4"
          : "flex-row items-center justify-between bg-black p-4"
      }
      style={transparent ? { paddingTop: insets.top + 16 } : undefined}
    >
      <Text className="font-serif text-4xl font-bold text-white">Coffer</Text>

      <Pressable onPress={() => console.log("menu pressed")}>
        <Ionicons name="menu" size={32} color="white" />
      </Pressable>
    </View>
  );
}

export default Header;