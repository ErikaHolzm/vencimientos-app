import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { remindersApi } from '../api';
import { ApiError } from '../api/client';
import { syncNotifications } from '../lib/notifications';
import type { Reminder, ReminderInput } from '../types';
import { useAuth } from './AuthContext';

interface RemindersValue {
  reminders: Reminder[];
  loading: boolean;
  /** Mensaje de error de la última carga (null si salió bien). */
  error: string | null;
  /** true si hay avisos para programar pero el teléfono no dio permiso de notificaciones. */
  notificationsBlocked: boolean;
  refresh: () => Promise<void>;
  create: (input: ReminderInput) => Promise<void>;
  update: (id: string, input: ReminderInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const RemindersContext = createContext<RemindersValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Pasa a true cuando la lista se cargó bien al menos una vez. Hasta entonces no se tocan los avisos del teléfono. */
  const [loaded, setLoaded] = useState(false);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);

  /** Si el servidor dice 401 (token vencido), se cierra la sesión. */
  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) void logout();
    },
    [logout],
  );

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setReminders(await remindersApi.list(token));
      setLoaded(true);
      setError(null);
    } catch (err) {
      handleAuthError(err);
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Al iniciar sesión se cargan; al cerrarla se vacía la lista.
  useEffect(() => {
    if (token) void refresh();
    else {
      setReminders([]);
      setLoaded(false);
      setNotificationsBlocked(false);
    }
  }, [token, refresh]);

  // Cada vez que cambia la lista se reprograman los avisos del teléfono,
  // pero solo después de haberla cargado bien: si la carga falla, no se borran los avisos que ya había.
  useEffect(() => {
    if (!token || !loaded) return;
    syncNotifications(reminders)
      .then((result) => setNotificationsBlocked(result === 'denied'))
      .catch(() => undefined);
  }, [token, loaded, reminders]);

  /** Las operaciones relanzan el error para que la pantalla muestre el mensaje. */
  const guarded = useCallback(
    async <T,>(action: (t: string) => Promise<T>): Promise<T> => {
      if (!token) throw new ApiError(401, 'Sesión no iniciada');
      try {
        return await action(token);
      } catch (err) {
        handleAuthError(err);
        throw err;
      }
    },
    [token, handleAuthError],
  );

  const create = useCallback(
    async (input: ReminderInput) => {
      const created = await guarded((t) => remindersApi.create(t, input));
      setReminders((prev) => [...prev, created]);
    },
    [guarded],
  );

  const update = useCallback(
    async (id: string, input: ReminderInput) => {
      const updated = await guarded((t) => remindersApi.update(t, id, input));
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [guarded],
  );

  const remove = useCallback(
    async (id: string) => {
      await guarded((t) => remindersApi.remove(t, id));
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    [guarded],
  );

  const value = useMemo(
    () => ({ reminders, loading, error, notificationsBlocked, refresh, create, update, remove }),
    [reminders, loading, error, notificationsBlocked, refresh, create, update, remove],
  );
  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersValue {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders debe usarse dentro de <RemindersProvider>');
  return ctx;
}
