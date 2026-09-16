/**
 * 원본은 react-native-dotenv 의 `@env` 모듈을 썼다.
 * Expo 에서는 EXPO_PUBLIC_ 접두어 환경변수가 빌드 시 인라인되므로 여기서 같은 이름으로 내보낸다.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** 데모 가맹점 ID (결제 QR 발급 기본값) */
export const DEFAULT_MID = 'M20260001';
