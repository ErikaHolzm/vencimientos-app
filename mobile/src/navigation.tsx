import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AccountScreen } from './screens/AccountScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DetailScreen } from './screens/DetailScreen';
import { FormScreen } from './screens/FormScreen';
import { HomeScreen } from './screens/HomeScreen';
import { useAuth } from './state/AuthContext';
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

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ground } };

export function Navigation() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
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
    </NavigationContainer>
  );
}
