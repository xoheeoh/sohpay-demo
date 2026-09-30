/** `@env` 별칭으로 내보내는 환경변수. Expo 는 EXPO_PUBLIC_ 접두어 변수를 빌드 시 인라인한다 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * 개발 중 특정 화면만 바로 열어 보고 싶을 때 쓰는 시작 화면 이름 (예: JoinCompleted).
 * 개발 실행(npm run web / ios / android)에서만 읽히고, 배포용 빌드에서는 항상 빈 값이다.
 * 값을 지우거나 비우면 평소처럼 로그인/홈에서 시작한다. 바꾼 뒤에는 서버를 다시 띄워야 반영된다.
 */
export const DEV_START_SCREEN = __DEV__ ? (process.env.EXPO_PUBLIC_DEV_START_SCREEN ?? '') : '';

/** 데모 가맹점 ID (결제 QR 발급 기본값) */
export const DEFAULT_MID = 'M20260001';
