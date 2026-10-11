import { Ionicons } from "@react-native-vector-icons/ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { findUpiQr } from "../utils/qrFromImage";
import { parseUpiUri } from "../utils/upi";

export default function ScannerScreen({ onClose, onScanned, onManual, paused }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);

  const [picking, setPicking] = useState(false);

  const [hint, setHint] = useState(null);
  const lastBad = useRef(0);
  const hintTimer = useRef(null);

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

  const handleScan = ({ data }) => {
    if (paused) return;

    const parsed = parseUpiUri(data);
    if (parsed) {
      onScanned(parsed);
      return;
    }

    // Not a UPI QR: show a hint, but at most once every 2 seconds
    const now = Date.now();
    if (now - lastBad.current < 2000) return;
    lastBad.current = now;
    setHint("That's not a UPI QR code");
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 2000);
  };

  const pickFromGallery = async () => {
    if (picking || paused) return;
    setPicking(true);

    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });
      if (picked.canceled) return;

      const { payment, sawQr } = await findUpiQr(picked.assets[0].uri);

      if (payment) onScanned(payment);
      else showHint(sawQr ? "That's not a UPI QR code" : "No QR code found. Try a clearer image");
    } catch {
      showHint("Couldn't read that image");
    } finally {
      setPicking(false);
    }
  };

  const showHint = (text) => {
    setHint(text);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 3500);
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={paused ? undefined : handleScan}
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

        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={pickFromGallery}
            disabled={picking}
            className="flex-row items-center gap-2 rounded-full bg-white/15 px-5 py-3"
          >
            <Ionicons name="image-outline" size={18} color="white" />
            <Text className="font-semibold text-white">
              {picking ? "Reading..." : "Upload QR"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onManual}
            className="flex-row items-center gap-2 rounded-full bg-white/15 px-5 py-3"
          >
            <Ionicons name="keypad-outline" size={18} color="white" />
            <Text className="font-semibold text-white">Enter UPI ID</Text>
          </Pressable>
        </View>

      </View>

      {/* Result card */}
      {hint && (
        <View className="absolute left-0 right-0 items-center px-6" style={{ bottom: 160 }}>
          <View className="rounded-2xl bg-black/70 px-4 py-2">
            <Text className="text-center text-white">{hint}</Text>
          </View>
        </View>
      )}

    </View>
  );
}