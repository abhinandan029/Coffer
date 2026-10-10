import { Ionicons } from "@react-native-vector-icons/ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export default function ScannerScreen({ onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [result, setResult] = useState(null);

  // Permission status still loading
  if (!permission) return <View className="flex-1 bg-black" />;

  // Permission not granted yet
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-black px-8">
        <Ionicons name="camera-outline" size={56} color="white" />
        <Text className="text-center text-lg text-white">
          Camera access is needed to scan.
        </Text>
        <Pressable
          onPress={permission.canAskAgain ? requestPermission : Linking.openSettings}
          className="rounded-2xl bg-white px-6 py-3"
        >
          <Text className="font-semibold">
            {permission.canAskAgain ? "Allow camera" : "Open settings"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleScan = ({ type, data }) => {
    if (result) return; // ignore repeat detections
    setResult({ type, data });
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "code128"],
        }}
        onBarcodeScanned={result ? undefined : handleScan}
      />

      {/* Top bar */}
      <View className="absolute bottom-40 right-10">
        <Pressable
          onPress={() => setTorch((t) => !t)}
          className="rounded-full bg-black/50 p-2"
        >
          <Ionicons
            name={torch ? "flash" : "flash-off"}
            size={28}
            color="white"
          />
        </Pressable>
      </View>

      {/* Scan frame */}
      <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center">
        <View className="h-64 w-64">
          <View className="absolute left-0 top-0 h-10 w-10 rounded-tl-3xl border-l-4 border-t-4 border-white" />
          <View className="absolute right-0 top-0 h-10 w-10 rounded-tr-3xl border-r-4 border-t-4 border-white" />
          <View className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-3xl border-b-4 border-l-4 border-white" />
          <View className="absolute bottom-0 right-0 h-10 w-10 rounded-br-3xl border-b-4 border-r-4 border-white" />
        </View>
        <Text className="mt-6 text-white">Align the code inside the frame</Text>
      </View>

      {/* Result card (sits above the floating navbar) */}
      {result && (
        <View className="absolute bottom-36 left-6 right-6 gap-3 rounded-3xl bg-white p-4">
          <Text className="text-xs uppercase text-gray-400">{result.type}</Text>
          <Text className="text-base font-semibold" numberOfLines={3}>
            {result.data}
          </Text>
          <Pressable
            onPress={() => setResult(null)}
            className="items-center rounded-2xl bg-black py-3"
          >
            <Text className="font-semibold text-white">Scan again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}