// src/services/smsService.js
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { parseBankSms } from '../utils/parseBankSms';

const SmsReader = Platform.OS === 'android' ? requireNativeModule('SmsReader') : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function requestSmsPermission() {
  if (Platform.OS !== 'android') return false;

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ]);
      console.log('[SMS] permission result:', JSON.stringify(res));
      return Object.values(res).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
    } catch (e) {
      if (String(e).includes('not attached to an Activity')) {
        await sleep(500); // Activity not ready yet, wait and retry
        continue;
      }
      throw e;
    }
  }
  return false;
}

// Call when a payment is made THROUGH Coffer. The bank's SMS for the same amount
// (arriving within ttlMinutes) is then ignored, so it is not added a second time.
export function registerAppPayment(amount, ttlMinutes = 15) {
  if (!SmsReader || !(Number(amount) > 0)) return;
  try {
    SmsReader.registerAppPayment(Number(amount), ttlMinutes * 60 * 1000);
    console.log(`[SMS] ignoring bank SMS for ₹${amount} for ${ttlMinutes} min`);
  } catch (e) {
    console.warn('[SMS] registerAppPayment failed:', e);
  }
}

// The native receiver catches every bank debit SMS, even when the app is closed,
// and queues it. Here we pick the queue up when the app opens and while it is open.
// Returns a stop function.
export function startSmsListener(onTransaction) {
  if (!SmsReader) return () => {};

  let busy = false;
  const drain = async () => {
    if (busy) return;
    busy = true;
    try {
      const items = await SmsReader.drainQueue();
      if (items.length) console.log(`[SMS] picked up ${items.length} queued message(s)`);
      items.forEach((m) => {
        const tx = parseBankSms({ body: m.body, address: m.address, date: m.date });
        console.log('[SMS] queued message parsed:', tx ? 'YES' : 'NO (rejected by parser)');
        if (tx) onTransaction(tx);
      });
    } catch (e) {
      console.warn('[SMS] drain failed:', e);
    } finally {
      busy = false;
    }
  };

  drain(); // anything that arrived while the app was closed
  const timer = setInterval(drain, 3000); // new ones while the app is open
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') drain();
  });

  console.log('[SMS] listener started');
  return () => {
    clearInterval(timer);
    sub.remove();
  };
}