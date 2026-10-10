import type { Reminder, ReminderInput, User } from '../types';

/**
 * Los repositorios son la única capa que conoce la base de datos.
 * Las rutas dependen de estas interfaces, no de MongoDB: por eso en los tests
 * se usa una versión en memoria y en producción la de MongoDB.
 */
export interface UserRepo {
  findByEmail(email: string): Promise<User | null>;
  /** Lanza DuplicateEmailError si el email ya existe. */
  create(data: { email: string; passwordHash: string }): Promise<User>;
}

export interface ReminderRepo {
  /** Siempre filtra por usuario: nadie puede leer recordatorios ajenos. */
  listByUser(userId: string): Promise<Reminder[]>;
  create(userId: string, data: ReminderInput): Promise<Reminder>;
  /** Devuelve null si no existe o si pertenece a otro usuario. */
  update(userId: string, id: string, data: ReminderInput): Promise<Reminder | null>;
  /** Devuelve false si no existe o si pertenece a otro usuario. */
  remove(userId: string, id: string): Promise<boolean>;
}
