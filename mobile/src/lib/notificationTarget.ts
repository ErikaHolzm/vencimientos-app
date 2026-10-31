/**
 * Saca el id del recordatorio de los datos que viajan dentro de una notificación.
 * Devuelve null si no vienen, o si no son un texto válido: esos datos no se pueden dar por buenos.
 */
export function reminderIdFromData(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const id = (data as { reminderId?: unknown }).reminderId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
