import type { Reminder, ReminderInput } from '../types';
import { request } from './client';

interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: { email, password } }),
};

export const remindersApi = {
  list: async (token: string) =>
    (await request<{ reminders: Reminder[] }>('/api/reminders', { token })).reminders,
  create: async (token: string, input: ReminderInput) =>
    (await request<{ reminder: Reminder }>('/api/reminders', { method: 'POST', body: input, token })).reminder,
  update: async (token: string, id: string, input: ReminderInput) =>
    (await request<{ reminder: Reminder }>(`/api/reminders/${id}`, { method: 'PUT', body: input, token })).reminder,
  remove: (token: string, id: string) =>
    request<void>(`/api/reminders/${id}`, { method: 'DELETE', token }),
};
