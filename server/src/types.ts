export const CATEGORIES = ['licencia', 'seguro', 'vehiculo', 'documento', 'salud', 'otro'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  /** Sube cada vez que se cierra sesión o se cambia la contraseña: invalida los tokens anteriores. */
  tokenVersion: number;
  createdAt: Date;
}

/** Datos que el usuario puede enviar al crear o editar un recordatorio. */
export interface ReminderInput {
  title: string;
  category: Category;
  /** Fecha de vencimiento en formato AAAA-MM-DD (sin hora ni zona horaria). */
  dueDate: string;
  /** Cuántos días antes del vencimiento se avisa. Ej: [30, 7, 1] */
  remindDaysBefore: number[];
}

export interface Reminder extends ReminderInput {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
