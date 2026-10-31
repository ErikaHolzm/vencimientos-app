import { createNavigationContainerRef, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { reminderIdFromData } from './lib/notificationTarget';
import { AccountScreen } from './screens/AccountScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DetailScreen } from './screens/DetailScreen';
import { FormScreen } from './screens/FormScreen';
import { HomeScreen } from './screens/HomeScreen';
import { useAuth } from './state/AuthContext';
import { useReminders } from './state/RemindersContext';
import { colors } from './theme';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Detail: { id: string };
  Account: undefined;
  /** Sin id = recordatorio nuevo; con id = edición; con id y renew = renovación (nueva fecha). */
  Form: { id?: string; renew?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Permite navegar desde fuera de las pantallas (por ejemplo, cuando la persona toca una notificación). */
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ground } };

/**
 * Abre el detalle del recordatorio cuando la persona toca una notificación, con la app abierta,
 * en segundo plano o cerrada (en ese caso el sistema guarda el toque y lo leemos al arrancar).
 * No dibuja nada: solo reacciona.
 */
function NotificationOpener({ ready }: { ready: boolean }) {
  const response = Notifications.useLastNotificationResponse();
  const { reminders } = useReminders();
  // Qué notificación ya se abrió, para no volver a abrirla cada vez que cambia la lista.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !response) return;
    // Solo el toque normal sobre la notificación (no otras acciones).
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const key = response.notification.request.identifier;
    if (handled.current === key) return;

    const id = reminderIdFromData(response.notification.request.content.data);
    if (!id) {
      handled.current = key;
      return;
    }
    // Si la lista todavía no cargó (o el recordatorio ya no existe) no hay nada que abrir: se espera.
    if (!reminders.some((r) => r.id === id)) return;

    handled.current = key;
    navigationRef.navigate('Detail', { id });
  }, [ready, response, reminders]);

  return null;
}

export function Navigation() {
  const { status } = useAuth();
  const [ready, setReady] = useState(false);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme} ref={navigationRef} onReady={() => setReady(true)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'signedIn' ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="Form" component={FormScreen} options={{ presentation: 'modal' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
      {/* Las notificaciones programadas solo existen en el teléfono, no en la web. */}
      {Platform.OS !== 'web' && status === 'signedIn' ? <NotificationOpener ready={ready} /> : null}
    </NavigationContainer>
  );
}
