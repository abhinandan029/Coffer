// src/services/notifications.js
// Local notifications (no server). Fired when an SMS expense is detected.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show the notification even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let ready = false;

// Call once (creates the Android channel and asks for permission)
export async function setupNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expenses', {
      name: 'Detected expenses',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  ready = status === 'granted';
  return ready;
}

export async function notifyExpenseDetected({ amount, merchant }) {
  if (!ready) return;
  const amt = Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Expense detected',
      body: `₹${amt} spent at ${merchant ?? 'Unknown'}. Tap to review.`,
      data: { screen: 'expenses' },
    },
    // null = fire immediately; on Android the channel must be given
    trigger: Platform.OS === 'android' ? { channelId: 'expenses' } : null,
  });
}