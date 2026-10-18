import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

const items = [
  { label: "expenses", icon: "wallet" },
  { label: "add", icon: "add" },
  { label: "ledger", icon: "book" },
];

const layout = LinearTransition.duration(250).easing(Easing.linear);

function NavBar({ active,onChange, onAdd }) {

  return (
    <Animated.View
      layout={layout}
      style={{
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        padding: 6,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#2e2e2e",
        borderWidth: 1,
        borderColor: "#6b6b6b",
        elevation: 12,
      }}
    >
      {items.map(({ label, icon }) => {
        // Scanner: always a round button
        if (label === "add") {
          return (
            <Animated.View key={label} layout={layout} style={{ marginHorizontal: 4 }}>
              <Pressable onPress={onAdd} className="rounded-full bg-lime-300 p-3">
                <Ionicons name="add" size={30} color="black" />
              </Pressable>
            </Animated.View>
          );
        }

        const isActive = active === label;

        return (
          <Animated.View
            key={label}
            layout={layout}
            style={{
              overflow: "hidden",
              borderRadius: 999,
              backgroundColor: isActive ? "white" : "transparent",
            }}
          >
            <Pressable
              onPress={() => onChange(label)}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons
                name={icon}
                size={24}
                color={isActive ? "black" : "#a3a3a3"}
              />
              {isActive && (
                <Text
                  numberOfLines={1}
                  className="ml-2 font-semibold capitalize text-black"
                >
                  {label}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

export default NavBar;