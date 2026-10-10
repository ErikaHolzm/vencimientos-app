import { StyleSheet, Text, View } from 'react-native';
import { daysUntil, formatDate } from '../lib/dates';
import { URGENT_DAYS, countdownHero, getStatus } from '../lib/status';
import { colors, fonts, radius } from '../theme';
import type { Reminder } from '../types';

/** Tarjeta oscura con el próximo vencimiento y un resumen. Se muestra solo si hay recordatorios. */
export function HeroCard({ reminders }: { reminders: Reminder[] }) {
  const items = reminders
    .map((r) => ({ reminder: r, days: daysUntil(r.dueDate) }))
    .sort((a, b) => a.days - b.days);
  const next = items.find((i) => i.days >= 0) ?? items[0];
  if (!next) return null;

  const status = getStatus(next.days);
  const countdown = countdownHero(next.days);
  const overdue = items.filter((i) => i.days < 0).length;
  const urgent = items.filter((i) => i.days >= 0 && i.days <= URGENT_DAYS).length;
  const fine = items.filter((i) => i.days > URGENT_DAYS).length;
  const dateLabel = `${next.days < 0 ? 'Venció el' : 'Vence el'} ${formatDate(next.reminder.dueDate)}`;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Próximo vencimiento</Text>
        <View style={[styles.pill, { backgroundColor: status.heroBg }]}>
          <Text style={[styles.pillText, { color: status.heroFg }]}>{status.label}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.title}>{next.reminder.title}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countValue}>{countdown.value}</Text>
        {countdown.unit ? <Text style={styles.countUnit}>{countdown.unit}</Text> : null}
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <Stat value={overdue} label="Vencidos" />
        <Stat value={urgent} label="Urgentes" />
        <Stat value={fine} label="Al día" />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.hero, borderRadius: radius.xl, padding: 22, gap: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.heroMuted,
  },
  pill: { height: 28, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center' },
  pillText: { fontFamily: fonts.bold, fontSize: 13 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.white },
  date: { fontFamily: fonts.regular, fontSize: 14, color: colors.heroMuted, marginTop: 4 },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  countValue: { fontFamily: fonts.extrabold, fontSize: 56, lineHeight: 62, color: colors.white },
  countUnit: { fontFamily: fonts.semibold, fontSize: 15, color: colors.heroMuted },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)' },
  stats: { flexDirection: 'row' },
  stat: { flex: 1 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.white },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.heroMuted, marginTop: 2 },
});
