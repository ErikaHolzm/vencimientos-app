const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const MS_PER_DAY = 86_400_000;

/**
 * Las fechas de vencimiento viajan como texto "AAAA-MM-DD" (sin hora ni zona horaria).
 * Se interpretan siempre en la zona horaria local para que "vence el 15" sea el 15 en tu celular.
 */
export function parseISO(value: string): Date {
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

/** Días que faltan para la fecha (negativo si ya pasó, 0 si es hoy). */
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  return Math.round((parseISO(isoDate).getTime() - startOfDay(now).getTime()) / MS_PER_DAY);
}

// Rango permitido para el vencimiento. Tiene que coincidir con el del servidor (server/src/dateLimits.ts).
export const MAX_DAYS_IN_PAST = 365;
export const MAX_YEARS_AHEAD = 50;

/** Fecha mínima y máxima que se pueden elegir para un vencimiento. */
export function dueDateRange(now: Date = new Date()): { min: Date; max: Date } {
  const today = startOfDay(now);
  return {
    min: addDays(today, -MAX_DAYS_IN_PAST),
    max: new Date(today.getFullYear() + MAX_YEARS_AHEAD, today.getMonth(), today.getDate()),
  };
}

/** "15 dic 2026" */
export function formatDate(isoDate: string): string {
  const d = parseISO(isoDate);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Viernes 9 de octubre" */
export function formatToday(now: Date = new Date()): string {
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} de ${MONTHS_LONG[now.getMonth()]}`;
}
