import request from 'supertest';
import { createApp } from '../src/app';
import type { AppConfig } from '../src/config';
import { InMemoryReminderRepo, InMemoryUserRepo } from '../src/repositories/memory';

export const testConfig: AppConfig = {
  jwtSecret: 't'.repeat(40),
  jwtTtlSeconds: 3600,
  bcryptCost: 4, // bajo a propósito: los tests no necesitan un hash lento
  corsOrigins: [],
  rateLimitEnabled: false,
  trustProxyHops: 0,
};

/** App completa con repositorios en memoria: no necesita MongoDB. */
export function buildApp(overrides: Partial<AppConfig> = {}) {
  return createApp({
    users: new InMemoryUserRepo(),
    reminders: new InMemoryReminderRepo(),
    config: { ...testConfig, ...overrides },
  });
}

export type TestApp = ReturnType<typeof buildApp>;

export const PASSWORD = 'una-contrasena-larga-123';

/** Registra un usuario y devuelve su token. */
export async function registerUser(app: TestApp, email: string): Promise<string> {
  const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  return res.body.token as string;
}

/** Fecha AAAA-MM-DD a tantos días de hoy (negativo = pasado). Así los tests no dependen del día en que se corren. */
export function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const validReminder = {
  title: 'Renovar libreta de conducir',
  category: 'licencia',
  dueDate: isoDaysFromNow(60),
  remindDaysBefore: [1, 30, 7],
};
