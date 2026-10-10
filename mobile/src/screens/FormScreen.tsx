import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { DateField } from '../components/DateField';
import { Field, SectionLabel } from '../components/Field';
import { CATEGORIES, REMIND_OPTIONS } from '../categories';
import { addDays, dueDateRange, suggestRenewalDate, toISO } from '../lib/dates';
import type { RootStackParamList } from '../navigation';
import { useReminders } from '../state/RemindersContext';
import { colors, fonts } from '../theme';
import type { Category } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

/** Sirve para crear (sin id), editar (con id) y renovar (con id y renew: propone una nueva fecha). */
export function FormScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { reminders, create, update } = useReminders();
  const editing = route.params?.id ? reminders.find((r) => r.id === route.params?.id) : undefined;
  const renewing = Boolean(editing && route.params?.renew);

  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'licencia');
  const [dueDate, setDueDate] = useState(
    editing
      ? renewing
        ? suggestRenewalDate(editing.dueDate)
        : editing.dueDate
      : toISO(addDays(new Date(), 30)),
  );
  const [remind, setRemind] = useState<number[]>(editing?.remindDaysBefore ?? [15, 7, 1]);
  const [busy, setBusy] = useState(false);

  const canSave = title.trim().length > 0;
  const range = dueDateRange();

  const toggleRemind = (days: number) =>
    setRemind((current) => (current.includes(days) ? current.filter((d) => d !== days) : [...current, days]));

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    const input = { title: title.trim(), category, dueDate, remindDaysBefore: remind };
    try {
      if (editing) await update(editing.id, input);
      else await create(input);
      // Al renovar se vuelve a la lista (el detalle viejo ya no es lo que se quiere ver).
      if (renewing) navigation.popToTop();
      else navigation.goBack();
    } catch (err) {
      setBusy(false);
      Alert.alert('No se pudo guardar', err instanceof Error ? err.message : 'Probá de nuevo.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={styles.cancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {renewing ? 'Renovar recordatorio' : editing ? 'Editar recordatorio' : 'Nuevo recordatorio'}
        </Text>
        <View style={{ width: 92 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="¿Qué vence?"
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Renovar libreta de conducir"
          maxLength={120}
          returnKeyType="done"
        />

        <View style={styles.group}>
          <SectionLabel>Categoría</SectionLabel>
          <View style={styles.wrap}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                icon={c.icon}
                selected={category === c.id}
                onPress={() => setCategory(c.id)}
              />
            ))}
          </View>
        </View>

        <DateField
          label={renewing ? 'Nueva fecha de vencimiento' : 'Fecha de vencimiento'}
          value={dueDate}
          onChange={setDueDate}
          minimumDate={range.min}
          maximumDate={range.max}
        />

        <View style={styles.group}>
          <SectionLabel>Avisarme antes</SectionLabel>
          <View style={styles.wrap}>
            {REMIND_OPTIONS.map((o) => (
              <Chip key={o.days} label={o.label} selected={remind.includes(o.days)} onPress={() => toggleRemind(o.days)} />
            ))}
          </View>
          <Text style={styles.help}>Vas a recibir una notificación a las 9:00 en cada momento seleccionado.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button
          label={renewing ? 'Guardar renovación' : editing ? 'Guardar cambios' : 'Guardar recordatorio'}
          onPress={() => void save()}
          disabled={!canSave}
          loading={busy}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cancel: { minWidth: 92, height: 44, justifyContent: 'center', paddingHorizontal: 12 },
  cancelText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary },
  headerTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  content: { padding: 20, gap: 26 },
  group: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  help: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.ground,
  },
});
