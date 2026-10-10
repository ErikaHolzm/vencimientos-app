import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { categoryInfo, remindLabel } from '../categories';
import { addDays, daysUntil, formatDate, parseISO, startOfDay, toISO } from '../lib/dates';
import { dueText, getStatus } from '../lib/status';
import type { RootStackParamList } from '../navigation';
import { useReminders } from '../state/RemindersContext';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { reminders, remove } = useReminders();
  const [busy, setBusy] = useState(false);
  const reminder = reminders.find((r) => r.id === route.params.id);

  // Si se borró (o todavía no cargó), no hay nada que mostrar.
  if (!reminder) {
    return (
      <View style={styles.screen}>
        <Header onBack={() => navigation.goBack()} topInset={insets.top} />
      </View>
    );
  }

  const days = daysUntil(reminder.dueDate);
  const status = getStatus(days);
  const category = categoryInfo(reminder.category);
  const today = startOfDay(new Date());
  const due = parseISO(reminder.dueDate);
  const notices = [...reminder.remindDaysBefore]
    .sort((a, b) => b - a)
    .map((n) => {
      const date = addDays(due, -n);
      return { key: String(n), label: remindLabel(n), date, sent: date < today };
    });

  const deleteReminder = async () => {
    setBusy(true);
    try {
      await remove(reminder.id);
      navigation.goBack();
    } catch (err) {
      setBusy(false);
      Alert.alert('No se pudo eliminar', err instanceof Error ? err.message : 'Probá de nuevo.');
    }
  };

  const confirmDelete = () =>
    Alert.alert('Eliminar recordatorio', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteReminder() },
    ]);

  return (
    <View style={styles.screen}>
      <Header
        onBack={() => navigation.goBack()}
        onEdit={() => navigation.navigate('Form', { id: reminder.id })}
        topInset={insets.top}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <View style={[styles.bigIcon, { backgroundColor: status.bg }]}>
            <Feather name={category.icon} size={30} color={status.fg} />
          </View>
          <Text style={styles.title}>{reminder.title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: status.bg }]}>
              <Text style={[styles.pillText, { color: status.fg }]}>{status.label}</Text>
            </View>
            <Text style={styles.category}>{category.label}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Fecha de vencimiento</Text>
          <Text style={styles.bigDate}>{formatDate(reminder.dueDate)}</Text>
          <Text style={[styles.dueText, { color: status.fg }]}>{dueText(days)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Avisos</Text>
          <View style={styles.noticesCard}>
            {notices.length === 0 ? (
              <Text style={styles.empty}>Este recordatorio no tiene avisos.</Text>
            ) : (
              notices.map((n, index) => (
                <View key={n.key} style={[styles.noticeRow, index > 0 && styles.noticeDivider]}>
                  <View style={[styles.dot, { backgroundColor: n.sent ? '#98A2B3' : colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeLabel}>{n.label}</Text>
                    <Text style={styles.noticeDate}>{formatDate(toISO(n.date))}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: n.sent ? '#EEF0F3' : colors.primarySoft }]}>
                    <Text style={[styles.pillText, { color: n.sent ? '#475467' : colors.primary }]}>
                      {n.sent ? 'Enviado' : 'Programado'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          label="Renovar con nueva fecha"
          onPress={() => navigation.navigate('Form', { id: reminder.id, renew: true })}
          disabled={busy}
        />
        <Button label="Eliminar recordatorio" variant="danger" onPress={confirmDelete} loading={busy} />
      </View>
    </View>
  );
}

function Header({ onBack, onEdit, topInset }: { onBack: () => void; onEdit?: () => void; topInset: number }) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 8 }]}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver" style={styles.roundButton}>
        <Feather name="chevron-left" size={22} color={colors.ink} />
      </Pressable>
      {onEdit ? (
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Editar" style={styles.roundButton}>
          <Feather name="edit-2" size={19} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 4 },
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
  titleBlock: { gap: 14, alignItems: 'flex-start' },
  bigIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: { height: 28, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center' },
  pillText: { fontFamily: fonts.bold, fontSize: 13 },
  category: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 4,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  bigDate: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
  dueText: { fontFamily: fonts.semibold, fontSize: 14 },
  section: { gap: 10 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  noticesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  noticeDivider: { borderTopWidth: 1, borderTopColor: '#EEF0F3' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  noticeLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  noticeDate: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, paddingVertical: 16 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.ground,
  },
});
