import type { TextStyle } from 'react-native';

/**
 * 디자인 토큰.
 * 화면 코드에서 색상 hex 를 직접 쓰지 않는다. 항상 useTheme() 를 거친다.
 */
export const palette = {
  blue50: '#EEF3FF', blue100: '#D9E4FF', blue200: '#B3C8FF', blue300: '#86A7FF',
  blue400: '#5B8CFF', blue500: '#2F6BFF', blue600: '#1E63F0', blue700: '#174ECC',
  blue800: '#123C9C', blue900: '#0E2C70',

  gray0: '#FFFFFF', gray50: '#F6F7FA', gray100: '#EEF0F4', gray150: '#E2E5EB',
  gray200: '#CFD4DD', gray300: '#AEB5C2', gray400: '#8B93A3', gray500: '#6B7280',
  gray600: '#4B5160', gray700: '#343947', gray800: '#23262F', gray900: '#15171D',
  gray950: '#0C0D11',

  red50: '#FFEDEE', red500: '#E5484D', red600: '#D03D42',
  green50: '#E9F8EF', green500: '#2FA463', green600: '#25864F',
  amber50: '#FFF5E1', amber500: '#E89B0C',
  mint400: '#3ED2B0',
} as const;

const lightSpec = {
  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primarySoft: palette.blue50,
  onPrimary: palette.gray0,

  bg: palette.gray50,
  surface: palette.gray0,
  surfaceAlt: palette.gray100,
  line: palette.gray150,
  lineStrong: palette.gray200,

  text: palette.gray900,
  textSub: palette.gray500,
  textMuted: palette.gray400,
  textOnDark: palette.gray0,
  disabled: palette.gray200,
  onDisabled: palette.gray400,

  danger: palette.red500,
  dangerSoft: palette.red50,
  success: palette.green500,
  successSoft: palette.green50,
  warn: palette.amber500,
  warnSoft: palette.amber50,
  accent: palette.mint400,

  keypad: palette.gray0,
  keypadPressed: palette.gray100,
  overlay: 'rgba(12, 13, 17, 0.45)',
};

// palette 가 as const 라 리터럴로 좁혀지므로, 테마 타입은 string 으로 넓혀 둔다.
export type ThemeColors = { [K in keyof typeof lightSpec]: string };
export const light: ThemeColors = lightSpec;

export const dark: ThemeColors = {
  primary: palette.blue400,
  primaryPressed: palette.blue300,
  primarySoft: 'rgba(91, 140, 255, 0.14)',
  onPrimary: palette.gray950,

  bg: palette.gray950,
  surface: palette.gray900,
  surfaceAlt: palette.gray800,
  line: palette.gray800,
  lineStrong: palette.gray700,

  text: palette.gray50,
  textSub: palette.gray300,
  textMuted: palette.gray400,
  textOnDark: palette.gray0,
  disabled: palette.gray700,
  onDisabled: palette.gray500,

  danger: '#FF6B70',
  dangerSoft: 'rgba(229, 72, 77, 0.16)',
  success: '#4CC57F',
  successSoft: 'rgba(47, 164, 99, 0.16)',
  warn: '#F5B23C',
  warnSoft: 'rgba(232, 155, 12, 0.16)',
  accent: palette.mint400,

  keypad: palette.gray900,
  keypadPressed: palette.gray800,
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const type: Record<'display' | 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'label' | 'caption' | 'mono', TextStyle> = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8 },
  h1: { fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body1: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body2: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  mono: { fontSize: 14, lineHeight: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
};

export type TypeKey = keyof typeof type;
