import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { confirmDestructive, showMessage } from '../lib/dialogs';
import type { RootStackParamList } from '../navigation';
import { useAuth } from '../state/AuthContext';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

const MIN_PASSWORD = 10;

/** Cambiar la contraseña y borrar la cuenta. Ambas acciones piden la contraseña actual. */
export function AccountScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { changePassword, deleteAccount } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [changing, setChanging] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canChange = current.length > 0 && next.length >= MIN_PASSWORD && next !== current;

  const submitChange = async () => {
    if (!canChange) return;
    setChanging(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      showMessage('Contraseña actualizada', 'Se cerró la sesión en los demás dispositivos.');
    } catch (err) {
      showMessage('No se pudo cambiar', err instanceof Error ? err.message : 'Probá de nuevo.');
    } finally {
      setChanging(false);
    }
  };

  const submitDelete = async () => {
    if (deletePassword.length === 0) return;
    const confirmed = await confirmDestructive(
      'Eliminar cuenta',
      'Se borran tu cuenta y todos tus recordatorios. Esta acción no se puede deshacer.',
      'Eliminar',
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      // Al borrarse la cuenta se cierra la sesión y la navegación vuelve sola al inicio de sesión.
    } catch (err) {
      setDeleting(false);
      showMessage('No se pudo eliminar', err instanceof Error ? err.message : 'Probá de nuevo.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.roundButton}
        >
          <Feather name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Mi cuenta</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
          <Field
            label="Contraseña actual"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
          />
          <Field
            label="Contraseña nueva"
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
          />
          <Button label="Cambiar contraseña" onPress={() => void submitChange()} disabled={!canChange} loading={changing} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Eliminar cuenta</Text>
          <Text style={styles.help}>
            Borra tu cuenta y todos tus recordatorios del servidor. Para confirmar, ingresá tu contraseña.
          </Text>
          <Field
            label="Contraseña"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
          />
          <Button
            label="Eliminar mi cuenta"
            variant="danger"
            onPress={() => void submitDelete()}
            disabled={deletePassword.length === 0}
            loading={deleting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, gap: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  help: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted },
});
