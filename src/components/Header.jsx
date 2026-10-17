import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex flex-row p-3 justify-between"
    >
      <Text className="font-serif text-4xl font-bold text-white">Coffer</Text>
    </View>
  );
}

export default Header;