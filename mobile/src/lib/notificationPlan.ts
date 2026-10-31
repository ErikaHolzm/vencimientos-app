import type { Reminder } from '../types';
import { addDays, formatDate, parseISO } from './dates';

/** iOS guarda como máximo 64 notificaciones locales pendientes: dejamos un margen. */
export const MAX_SCHEDULED = 60;
/** Hora local a la que llegan los avisos. */
export const NOTIFY_HOUR = 9;

export interface PlannedNotification {
  reminderId: string;
  title: string;
  body: string;
  date: Date;
}

function bodyFor(daysBefore: number, dueDate: string): string {
  if (daysBefore === 0) return 'Vence hoy.';
  if (daysBefore === 1) return 'Vence mañana.';
  return `Vence en ${daysBefore} días (${formatDate(dueDate)}).`;
}

/** Momento exacto en que llega el aviso de "daysBefore días antes" de un vencimiento: ese día, a las NOTIFY_HOUR. */
export function noticeDate(due: Date, daysBefore: number): Date {
  const day = addDays(due, -daysBefore);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), NOTIFY_HOUR, 0, 0);
}

/**
 * Decide QUÉ notificaciones programar. Es una función pura (no toca el sistema),
 * por eso se puede testear fácil. Ignora avisos que ya pasaron y se queda con los más cercanos.
 */
export function planNotifications(reminders: Reminder[], now: Date = new Date()): PlannedNotification[] {
  const planned: PlannedNotification[] = [];

  for (const reminder of reminders) {
    const due = parseISO(reminder.dueDate);
    for (const daysBefore of reminder.remindDaysBefore) {
      const date = noticeDate(due, daysBefore);
      if (date.getTime() <= now.getTime()) continue;
      planned.push({
        reminderId: reminder.id,
        title: reminder.title,
        body: bodyFor(daysBefore, reminder.dueDate),
        date,
      });
    }
  }

  return planned.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, MAX_SCHEDULED);
}

/**
 * De los avisos elegidos para un vencimiento, cuáles ya no se van a enviar porque su hora ya pasó.
 * Sirve para avisarle a la persona en el formulario, antes de guardar.
 */
export function pastNotices(dueDate: string, remindDaysBefore: number[], now: Date = new Date()): number[] {
  const due = parseISO(dueDate);
  return remindDaysBefore.filter((daysBefore) => noticeDate(due, daysBefore).getTime() <= now.getTime());
}
