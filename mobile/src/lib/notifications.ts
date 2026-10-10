import * as Notifications from 'expo-notifications';
import type { Reminder } from '../types';
import { planNotifications } from './notificationPlan';

// Qué hacer si llega una notificación con la app abierta: mostrarla igual.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Deja programadas exactamente las notificaciones que corresponden a la lista actual.
 * Es la forma más simple de mantenerlo consistente: borra todo y vuelve a programar.
 */
export async function syncNotifications(reminders: Reminder[]): Promise<void> {
  if (!(await ensurePermission())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const item of planNotifications(reminders)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: item.title, body: item.body, data: { reminderId: item.reminderId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date },
    });
  }
}

export async function clearNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
