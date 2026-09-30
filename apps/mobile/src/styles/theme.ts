import colors from './colors';

/** 모서리 반경 */
export const radius = { xs: 6, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 } as const;

/** 간격 (4pt 그리드) */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** 그림자 - RN 0.76+ / web 공통 boxShadow 문자열 */
export const shadow = {
  card: '0 1px 2px rgba(21, 23, 29, 0.04), 0 6px 20px rgba(21, 23, 29, 0.06)',
  float: '0 8px 28px rgba(21, 23, 29, 0.12)',
  primary: '0 10px 24px rgba(30, 99, 240, 0.28)',
} as const;

/** 다크 모드 시맨틱 토큰. 현재 앱은 라이트 고정이며, 적용 시 colors 의 시맨틱 키를 이 값으로 바꾼다 */
export const darkColors = {
  primary: '#5B8CFF',
  primaryDark: '#2F6BFF',
  primarySoft: 'rgba(91, 140, 255, 0.14)',
  bg: '#0C0D11',
  surface: '#15171D',
  surfaceAlt: '#23262F',
  line: '#23262F',
  lineStrong: '#343947',
  text: '#F6F7FA',
  textSub: '#AEB5C2',
  textMuted: '#8B93A3',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const theme = {
  colors,
  radius,
  space,
  shadow,
};

export default theme;
