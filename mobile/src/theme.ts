export const colors = {
  ground: '#F2F4F7',
  surface: '#FFFFFF',
  ink: '#0E1726',
  muted: '#5B6575',
  border: '#E4E7EC',
  inputBorder: '#D5DAE1',
  primary: '#1E40AF',
  primarySoft: '#E5EDFF',
  hero: '#0E1B3D',
  heroMuted: '#AEBBD8',
  danger: '#B42318',
  disabled: '#9AA4B5',
  chipText: '#344054',
  white: '#FFFFFF',
} as const;

/** En React Native cada grosor de la fuente es una familia distinta. */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const radius = { md: 16, lg: 22, xl: 26, pill: 999 } as const;
