import { createElement, type CSSProperties } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { toISO } from '../lib/dates';
import { colors, fonts } from '../theme';

interface Props {
  label: string;
  /** AAAA-MM-DD */
  value: string;
  onChange: (isoDate: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const inputStyle: CSSProperties = {
  height: 56,
  boxSizing: 'border-box',
  width: '100%',
  padding: '0 16px',
  borderRadius: 16,
  border: `1px solid ${colors.inputBorder}`,
  backgroundColor: colors.surface,
  fontFamily: fonts.regular,
  fontSize: 16,
  color: colors.ink,
};

/**
 * Versión web del selector de fecha: usa el calendario del navegador (<input type="date">).
 * Metro elige este archivo solo en la web; en el teléfono se usa DateField.tsx.
 */
export function DateField({ label, value, onChange, minimumDate, maximumDate }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {createElement('input', {
        type: 'date',
        value,
        min: minimumDate ? toISO(minimumDate) : undefined,
        max: maximumDate ? toISO(maximumDate) : undefined,
        'aria-label': label,
        style: inputStyle,
        onChange: (event: { target: { value: string } }) => {
          // El navegador devuelve '' si se borra el campo: se ignora para no guardar una fecha vacía.
          if (event.target.value) onChange(event.target.value);
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
});
