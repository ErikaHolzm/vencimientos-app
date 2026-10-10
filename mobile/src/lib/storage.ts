import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'vencimientos.token';

/**
 * Dónde se guarda la sesión:
 * - En el teléfono: en el almacén seguro del sistema (Keychain en iPhone).
 * - En la web ese almacén no existe. Se usa sessionStorage, que se borra al cerrar la pestaña
 *   (más conservador que localStorage, que dejaría el token guardado para siempre).
 */
const web = {
  get: () => {
    try {
      return window.sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      window.sessionStorage.setItem(KEY, token);
    } catch {
      // sin almacenamiento disponible: la sesión dura solo mientras la app está abierta
    }
  },
  clear: () => {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // nada que borrar
    }
  },
};

export const tokenStorage = {
  async get(): Promise<string | null> {
    return Platform.OS === 'web' ? web.get() : SecureStore.getItemAsync(KEY);
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') web.set(token);
    else await SecureStore.setItemAsync(KEY, token);
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') web.clear();
    else await SecureStore.deleteItemAsync(KEY);
  },
};
