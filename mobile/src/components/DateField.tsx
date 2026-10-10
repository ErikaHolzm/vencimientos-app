import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, parseISO, toISO } from '../lib/dates';
import { colors, fonts, radius } from '../theme';

interface Props {
  label: string;
  /** AAAA-MM-DD */
  value: string;
  onChange: (isoDate: string) => void;
  /** Fechas fuera de este rango no se pueden elegir. */
  minimumDate?: Date;
  maximumDate?: Date;
}

/** Selector de fecha nativo: rueda compacta en iPhone y diálogo en Android. */
export function DateField({ label, value, onChange, minimumDate, maximumDate }: Props) {
  const date = parseISO(value);

  const handle = (_event: unknown, selected?: Date) => {
    if (selected) onChange(toISO(selected));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        <Text style={styles.value}>{formatDate(value)}</Text>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            onChange={handle}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cambiar ${label}`}
            onPress={() =>
              DateTimePickerAndroid.open({ value: date, mode: 'date', onChange: handle, minimumDate, maximumDate })
            }
          >
            <Text style={styles.change}>Cambiar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  box: {
    height: 56,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  change: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primary, padding: 8 },
});
