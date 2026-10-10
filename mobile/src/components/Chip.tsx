import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { IconName } from '../categories';
import { colors, fonts, radius } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
}

/** Botón en forma de píldora para filtros y opciones. Mide 44 pt de alto (tamaño táctil cómodo). */
export function Chip({ label, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      {icon ? <Feather name={icon} size={18} color={selected ? colors.white : colors.chipText} /> : null}
      <Text style={[styles.label, { color: selected ? colors.white : colors.chipText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  label: { fontFamily: fonts.semibold, fontSize: 14 },
});
