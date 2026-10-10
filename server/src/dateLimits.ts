/** Hasta cuánto tiempo atrás se permite cargar un vencimiento (algo que ya venció hace poco sigue siendo útil). */
export const MAX_DAYS_IN_PAST = 365;
/** Hasta cuántos años hacia adelante (un pasaporte o una cédula pueden vencer en 10 o más años). */
export const MAX_YEARS_AHEAD = 50;

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Rango de fechas de vencimiento permitido, como texto AAAA-MM-DD (se pueden comparar como texto).
 * Se deja 1 día de margen de cada lado: así no se rechaza una fecha válida solo porque
 * el teléfono y el servidor estén en zonas horarias distintas.
 */
export function dueDateBounds(now: Date = new Date()): { min: string; max: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  return {
    min: toISODate(new Date(Date.UTC(year, month, day - MAX_DAYS_IN_PAST - 1))),
    max: toISODate(new Date(Date.UTC(year + MAX_YEARS_AHEAD, month, day + 1))),
  };
}
