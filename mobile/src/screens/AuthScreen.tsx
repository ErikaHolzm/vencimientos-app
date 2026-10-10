import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../api/client';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { useAuth } from '../state/AuthContext';
import { colors, fonts } from '../theme';

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await register(email.trim(), password);
      else await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.');
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vencimientos</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Creá tu cuenta para guardar tus recordatorios.'
              : 'Ingresá para ver tus recordatorios.'}
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@ejemplo.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder={isRegister ? 'Mínimo 10 caracteres' : 'Tu contraseña'}
            secureTextEntry
            autoCapitalize="none"
            textContentType={isRegister ? 'newPassword' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            onSubmitEditing={() => canSubmit && void submit()}
          />

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button
            label={isRegister ? 'Crear cuenta' : 'Ingresar'}
            onPress={() => void submit()}
            disabled={!canSubmit}
            loading={busy}
          />
        </View>

        <Pressable onPress={switchMode} accessibilityRole="button" style={styles.switch}>
          <Text style={styles.switchText}>
            {isRegister ? '¿Ya tenés cuenta? ' : '¿Todavía no tenés cuenta? '}
            <Text style={styles.switchLink}>{isRegister ? 'Ingresá' : 'Registrate'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: 24, gap: 36 },
  header: { gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -0.5, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.muted },
  form: { gap: 20 },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  switch: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  switchText: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  switchLink: { fontFamily: fonts.bold, color: colors.primary },
});
