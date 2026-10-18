// src/components/SmsSync.jsx
// Picks up bank debit SMS (caught natively, even while the app was closed)
// and saves them as PENDING expenses. The notification itself is shown natively.
import { useEffect, useRef } from 'react';
import { useExpenses } from '../contexts/ExpensesContext';
import { setupNotifications } from '../services/notifications';
import { requestSmsPermission, startSmsListener } from '../services/smsService';

const DUPLICATE_WINDOW_MS = 10000; // ignore the exact same SMS arriving twice within 10s

export default function SmsSync() {
  const { loaded, addExpense } = useExpenses();

  // Keep the latest addExpense for the long-lived listener
  const addRef = useRef(addExpense);
  addRef.current = addExpense;

  // id -> time we last handled it (only to catch double delivery)
  const recent = useRef(new Map());

  useEffect(() => {
    if (!loaded) return; // wait until saved expenses are loaded

    let stop = () => {};
    let cancelled = false;

    const save = (tx) => {
      console.log('[SMS] parsed:', tx.type, tx.amount, tx.merchant);

      if (tx.type !== 'debit') {
        console.log('[SMS] skipped: not a debit');
        return;
      }

      const now = Date.now();
      const last = recent.current.get(tx.id);
      if (last && now - last < DUPLICATE_WINDOW_MS) {
        console.log('[SMS] skipped: duplicate delivery');
        return;
      }
      recent.current.set(tx.id, now);

      addRef.current({
        amount: tx.amount,
        payeeName: tx.merchant ?? 'Unknown',
        payeeUpiId: null,
        note: '',
        category: null,
        source: 'sms',
        app: null,
        status: 'PENDING',
        needsConfirm: true, 
        createdAt: tx.date, 
        smsId: tx.id,
      });
      console.log('[SMS] saved as PENDING expense');
    };

    const timer = setTimeout(async () => {
      try {
        // Only asks for notification permission; the notification is fired natively
        await setupNotifications().catch((e) => console.warn('[Notify] setup failed:', e));

        const granted = await requestSmsPermission();
        
        if (!granted || cancelled) return;
        stop = startSmsListener(save);
      } catch (e) {
        console.warn('SMS sync failed:', e);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stop();
    };
  }, [loaded]);

  return null;
}