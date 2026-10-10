import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
}

/** Campo de texto con etiqueta. 16 pt de fuente evita que iOS haga zoom al enfocar. */
export function Field({ label, ...inputProps }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.disabled}
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
});
