import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_DAYS = 4;
const DAY_SECONDS = 24 * 60 * 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gentle-reminder', {
      name: 'Gentle reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 160],
      sound: null,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelGentleReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleGentleReminder(lastVisitAt: number): Promise<void> {
  if (Platform.OS === 'web') return;

  // There is only one reminder in Decay. Replacing it keeps the schedule
  // correct after a visit without leaving stale notifications behind.
  await cancelGentleReminder();
  const elapsedSeconds = Math.max(0, (Date.now() - lastVisitAt) / 1000);
  const remainingSeconds = Math.max(
    60,
    Math.ceil(REMINDER_DAYS * DAY_SECONDS - elapsedSeconds),
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Decay',
      body: 'Your companion is still here.',
      sound: false,
      data: { kind: 'gentle-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: remainingSeconds,
      repeats: false,
    },
  });
}