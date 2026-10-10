import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryInfo } from '../categories';
import { daysUntil, formatDate } from '../lib/dates';
import { countdownTile, getStatus } from '../lib/status';
import { colors, fonts, radius } from '../theme';
import type { Reminder } from '../types';

interface Props {
  reminder: Reminder;
  onPress: () => void;
}

export function ReminderCard({ reminder, onPress }: Props) {
  const days = daysUntil(reminder.dueDate);
  const status = getStatus(days);
  const tile = countdownTile(days);
  const category = categoryInfo(reminder.category);
  const dateLabel = `${days < 0 ? 'Venció el' : 'Vence el'} ${formatDate(reminder.dueDate)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${reminder.title}. ${status.label}. ${dateLabel}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.icon, { backgroundColor: status.bg }]}>
        <Feather name={category.icon} size={22} color={status.fg} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{reminder.title}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
      <View style={[styles.tile, { backgroundColor: status.bg }]}>
        <Text style={[styles.tileValue, { color: status.fg }]}>{tile.value}</Text>
        <Text style={[styles.tileUnit, { color: status.fg }]}>{tile.unit}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: colors.ink },
  date: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 3 },
  tile: { width: 68, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontFamily: fonts.extrabold, fontSize: 20 },
  tileUnit: { fontFamily: fonts.bold, fontSize: 11, marginTop: 3 },
});
