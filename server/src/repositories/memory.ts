import { randomUUID } from 'crypto';
import { DuplicateEmailError } from '../errors';
import type { Reminder, ReminderInput, User } from '../types';
import type { ReminderRepo, UserRepo } from './types';

/** Implementación en memoria: se usa en los tests (rápida y sin base de datos). */
export class InMemoryUserRepo implements UserRepo {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    if (await this.findByEmail(data.email)) throw new DuplicateEmailError();
    const user: User = { id: randomUUID(), email: data.email, passwordHash: data.passwordHash, createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }
}

export class InMemoryReminderRepo implements ReminderRepo {
  private readonly reminders = new Map<string, Reminder>();

  async listByUser(userId: string): Promise<Reminder[]> {
    return [...this.reminders.values()]
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async create(userId: string, data: ReminderInput): Promise<Reminder> {
    const now = new Date();
    const reminder: Reminder = { id: randomUUID(), userId, ...data, createdAt: now, updatedAt: now };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async update(userId: string, id: string, data: ReminderInput): Promise<Reminder | null> {
    const current = this.reminders.get(id);
    if (!current || current.userId !== userId) return null;
    const updated: Reminder = { ...current, ...data, updatedAt: new Date() };
    this.reminders.set(id, updated);
    return updated;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const current = this.reminders.get(id);
    if (!current || current.userId !== userId) return false;
    return this.reminders.delete(id);
  }
}
