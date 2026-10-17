import { Stack } from 'expo-router';
import '../global.css';

// TEMP: replace with your real "add expense" logic once detection works
const seen = new Set();
function saveTransaction(tx) {
  if (seen.has(tx.id)) return; // skip duplicates
  seen.add(tx.id);
  console.log('Detected transaction:', tx);
}

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}