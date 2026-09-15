import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { sessionStorage } from './storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. apps/mobile/.env 를 확인하세요.');
}

export const supabase = createClient(url, anon, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    // 웹은 URL 에서 세션을 읽지 않는다(이메일 링크 플로우를 쓰지 않음)
    detectSessionInUrl: false,
  },
});

export const FUNCTIONS_URL = `${url}/functions/v1`;

// 앱이 전면에 올 때만 토큰 갱신 타이머를 돌린다 (공식 권장 패턴)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** 아이디 → 로그인 이메일. 서버는 이메일만 알고, 화면은 아이디만 보여준다. */
export const emailFor = (mbUid: string) => `${mbUid.trim().toLowerCase()}@demo.sohpay.app`;
