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

/** Qué pasó al sincronizar: ok, la persona no dio permiso, o la plataforma no soporta avisos (web). */
export type SyncResult = 'ok' | 'denied' | 'unsupported';

/**
 * Cola de operaciones: cada una espera a que termine la anterior, así nunca se pisan
 * (por ejemplo, dos sincronizaciones seguidas dejando avisos duplicados).
 */
let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);
  // La cola sigue andando aunque una tarea falle; el error igual le llega a quien la pidió.
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
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
export function syncNotifications(reminders: Reminder[]): Promise<SyncResult> {
  return enqueue<SyncResult>(async () => {
    if (!SUPPORTED) return 'unsupported';

    const plan = planNotifications(reminders);
    // Solo se pide permiso si hay algo para avisar: no tiene sentido molestar a quien todavía no cargó nada.
    if (plan.length > 0 && !(await ensurePermission())) return 'denied';

    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const item of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body, data: { reminderId: item.reminderId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date },
      });
    }
    return 'ok';
  });
}

export function clearNotifications(): Promise<void> {
  return enqueue(async () => {
    if (!SUPPORTED) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  });
}
