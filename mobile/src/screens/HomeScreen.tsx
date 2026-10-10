import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { HeroCard } from '../components/HeroCard';
import { ReminderCard } from '../components/ReminderCard';
import { daysUntil, formatToday } from '../lib/dates';
import { FILTERS, matchesFilter, type Filter } from '../lib/status';
import type { RootStackParamList } from '../navigation';
import { useAuth } from '../state/AuthContext';
import { useReminders } from '../state/RemindersContext';
import { colors, fonts, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { reminders, loading, error, refresh } = useReminders();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () =>
      reminders
        .map((reminder) => ({ reminder, days: daysUntil(reminder.dueDate) }))
        .filter((item) => matchesFilter(filter, item.days))
        .sort((a, b) => a.days - b.days),
    [reminders, filter],
  );

  const isEmpty = reminders.length === 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.today}>{formatToday()}</Text>
            <Text style={styles.title}>Vencimientos</Text>
          </View>
          <Pressable
            onPress={() => void logout()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={styles.logout}
          >
            <Feather name="log-out" size={20} color={colors.ink} />
          </Pressable>
        </View>

        {error && isEmpty ? (
          <View style={styles.message}>
            <Text style={styles.messageText}>{error}</Text>
            <Button label="Reintentar" variant="ghost" onPress={() => void refresh()} />
          </View>
        ) : null}

        {!isEmpty ? (
          <>
            <HeroCard reminders={reminders} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {FILTERS.map((f) => (
                <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.list}>
          {visible.map(({ reminder }) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onPress={() => navigation.navigate('Detail', { id: reminder.id })}
            />
          ))}
        </View>

        {!isEmpty && visible.length === 0 ? (
          <Text style={styles.messageText}>No hay recordatorios en esta categoría.</Text>
        ) : null}

        {isEmpty && !error && !loading ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="bell" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Todo en orden</Text>
            <Text style={styles.messageText}>
              Agregá un documento o trámite con su fecha y te avisamos antes de que venza.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('Form')}
        accessibilityRole="button"
        accessibilityLabel="Nuevo recordatorio"
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
      >
        <Feather name="plus" size={22} color={colors.white} />
        <Text style={styles.fabLabel}>Nuevo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: 20, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  today: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -0.6, color: colors.ink, marginTop: 4 },
  logout: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: 8, paddingRight: 20 },
  list: { gap: 12 },
  message: { gap: 8, alignItems: 'center' },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', gap: 12, marginTop: 40, paddingHorizontal: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  fab: {
    position: 'absolute',
    right: 20,
    height: 56,
    paddingLeft: 20,
    paddingRight: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.hero,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
