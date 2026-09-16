/**
 * 컬러 팔레트
 * - 화면 코드는 theme.colors.<key> 또는 Typography color="<key>" 로만 색을 참조한다.
 * - 브랜드 블루(#1E63F0)는 로고와 동일. 회색은 살짝 푸른 기가 도는 쿨 뉴트럴.
 */
const colors = {
  // 브랜드
  primary: '#1E63F0',
  primaryDark: '#174ECC',
  primarySoft: '#EEF3FF',
  mint: '#3ED2B0',
  disabled: '#E2E5EB',

  // 시맨틱 (라이트)
  bg: '#F6F7FA', // 화면 배경
  surface: '#FFFFFF', // 카드/시트
  surfaceAlt: '#F6F7FA', // 채워진 인풋, 눌림 배경
  line: '#E2E5EB', // 구분선
  lineStrong: '#CFD4DD',
  text: '#15171D',
  textSub: '#6B7280',
  textMuted: '#8B93A3',
  overlay: 'rgba(12, 13, 17, 0.45)',

  // 그레이 스케일
  gray900: '#15171D',
  gray800: '#23262F',
  gray700: '#343947',
  gray600: '#4B5160',
  gray500: '#6B7280',
  gray400: '#8B93A3',
  gray300: '#AEB5C2',
  gray200: '#CFD4DD',
  gray150: '#E2E5EB',
  gray100: '#EEF0F4',
  gray50: '#F6F7FA',

  red900: '#7F2225',
  red800: '#9E2A2E',
  red700: '#B83338',
  red600: '#D03D42',
  red500: '#E5484D',
  red400: '#EC6B6F',
  red300: '#F28D90',
  red200: '#F7B1B3',
  red100: '#FCD5D6',
  red50: '#FFEDEE',

  blue900: '#0E2C70',
  blue800: '#123C9C',
  blue700: '#174ECC',
  blue600: '#1E63F0',
  blue500: '#2F6BFF',
  blue400: '#5B8CFF',
  blue300: '#86A7FF',
  blue200: '#B3C8FF',
  blue100: '#D9E4FF',
  blue50: '#EEF3FF',

  green900: '#155230',
  green800: '#1C6A3E',
  green700: '#207A47',
  green600: '#25864F',
  green500: '#2FA463',
  green400: '#4CC57F',
  green300: '#7AD5A0',
  green200: '#A8E4C0',
  green100: '#D2F1DF',
  green50: '#E9F8EF',

  yellow900: '#8A5C08',
  yellow800: '#A8700A',
  yellow700: '#C4830B',
  yellow600: '#D68F0C',
  yellow500: '#E89B0C',
  yellow400: '#F0B23C',
  yellow300: '#F5C66A',
  yellow200: '#F9D998',
  yellow100: '#FCEAC4',
  yellow50: '#FFF5E1',

  white: '#ffffff',
  black: '#000000',
};

export default colors;
