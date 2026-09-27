import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleGentleReminder(lastVisitAt: number) {
  // Off by default; only if user explicitly enables in Settings (not implemented here — caller checks toggle)
  // Max once every several days, never urgency
  const daysSince = (Date.now() - lastVisitAt) / 86_400_000;
  if (daysSince < 4) return; // only if 4+ days since last real visit
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: '', body: "It's been a while.", sound: false },
    trigger: { seconds: 60 * 60 * 24 * 4, repeats: false }, // approximate 4-day cadence, never urgent
  });
}
