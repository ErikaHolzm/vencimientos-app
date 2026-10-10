import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '../types';
import { planNotifications } from './notificationPlan';

// Las notificaciones programadas en el teléfono no existen en la web: allí estas funciones no hacen nada.
const SUPPORTED = Platform.OS !== 'web';

// Qué hacer si llega una notificación con la app abierta: mostrarla igual.
if (SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

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
  if (!SUPPORTED) return;
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
  if (!SUPPORTED) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
