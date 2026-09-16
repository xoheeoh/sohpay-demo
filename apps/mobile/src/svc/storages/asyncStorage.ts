import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 웹에는 SecureStore 네이티브 모듈이 없으므로 네이티브에서만 지연 로드한다.
const SecureStore = Platform.OS === 'web' ? null : (require('expo-secure-store') as typeof import('expo-secure-store'));

/* ── 보안 저장소 ──────────────────────────────────────────────────
 * 원본은 react-native-encrypted-storage 를 썼다. Expo 에서는 expo-secure-store(Keychain/Keystore)로 대체한다.
 * SecureStore 는 값 하나에 2KB 제한이 있어 긴 값은 조각내어 저장한다. 웹은 SecureStore 가 없어 localStorage 를 쓴다.
 */
const CHUNK = 1800;

const webStore = {
  getItem: async (k: string) => {
    try {
      return globalThis.localStorage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (k: string, v: string) => {
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {}
  },
  removeItem: async (k: string) => {
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {}
  },
};

const nativeStore = {
  async getItem(key: string) {
    if (!SecureStore) return null;
    const count = Number(await SecureStore.getItemAsync(`${key}.n`));
    if (!count) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)));
    return parts.some((p) => p == null) ? null : parts.join('');
  },
  async setItem(key: string, value: string) {
    if (!SecureStore) return;
    const parts = value.match(new RegExp(`.{1,${CHUNK}}`, 'g')) ?? [];
    await Promise.all(parts.map((p, i) => SecureStore.setItemAsync(`${key}.${i}`, p)));
    await SecureStore.setItemAsync(`${key}.n`, String(parts.length));
  },
  async removeItem(key: string) {
    if (!SecureStore) return;
    const count = Number(await SecureStore.getItemAsync(`${key}.n`));
    await Promise.all(Array.from({ length: count || 0 }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)));
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

/** Supabase 세션 저장에도 같은 저장소를 쓴다. */
export const secureStorage = Platform.OS === 'web' ? webStore : nativeStore;
const EncryptedStorage = secureStorage;

// 데이터 저장
export const storeData = async (key: string, value: any) => {
  try {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error: any) {
    console.error('데이터 저장 오류:', error.message);
  }
};

// userToken 암호화 저장
export const storeEncryptedToken = async (token: { at: string; rt: string }): Promise<void> => {
  try {
    const stringValue = JSON.stringify(token);
    await EncryptedStorage.setItem('userToken', stringValue);
  } catch (error: any) {
    console.error('토큰 암호화 저장 오류:', error.message);
    throw error;
  }
};

// userToken 복호화 읽기
export const getEncryptedToken = async <T>(): Promise<T | null> => {
  try {
    const value = await EncryptedStorage.getItem('userToken');
    if (value) {
      return JSON.parse(value) as T;
    }
  } catch (error: any) {
    console.error('토큰 복호화 읽기 오류:', error.message);
  }
  return null;
};

// userToken 암호화 병합 저장
export const mergeEncryptedToken = async (newData: Partial<{ at: string; rt: string }>): Promise<void> => {
  try {
    // 기존 데이터 가져오기
    const existingData = await EncryptedStorage.getItem('userToken');
    const parsedData = existingData ? JSON.parse(existingData) : {};

    // 기존 데이터와 새로운 데이터 병합
    const mergedData = { ...parsedData, ...newData };

    // 병합된 데이터 저장
    await EncryptedStorage.setItem('userToken', JSON.stringify(mergedData));
  } catch (error: any) {
    console.error('토큰 암호화 병합 저장 오류:', error.message);
    throw error;
  }
};

// userToken 암호화 삭제
export const removeEncryptedToken = async (): Promise<void> => {
  try {
    // 화면(로그아웃·탈퇴)이 토큰 삭제 = 로그아웃으로 쓰므로 Supabase 세션도 함께 끝낸다.
    const { supabase } = await import('@apis/client');
    await supabase.auth.signOut().catch(() => {});
    await EncryptedStorage.removeItem('userToken');
  } catch (error: any) {
    console.error('토큰 암호화 삭제 오류:', error.message);
    throw error;
  }
};

/**
 * 데이터를 병합하여 AsyncStorage에 저장하는 함수
 * @param key 저장할 키
 * @param newData 새로운 데이터 (Partial 형태로 기존 데이터와 병합)
 */
export const mergeData = async <T>(key: string, newData: Partial<T>): Promise<void> => {
  try {
    // 기존 데이터 가져오기
    const existingData = await AsyncStorage.getItem(key);
    const parsedData: T = existingData ? JSON.parse(existingData) : ({} as T);

    // 기존 데이터와 새로운 데이터 병합
    const mergedData = { ...parsedData, ...newData };

    // 병합된 데이터 저장
    await AsyncStorage.setItem(key, JSON.stringify(mergedData));
  } catch (error: any) {
    console.error(`${key} 데이터 병합 오류:`, error.message);
  }
};

// 데이터 불러오기
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as T;
    }
  } catch (error: any) {
    console.error(`${key} 데이터 불러오기 오류:`, error.message);
  }
  return null;
};

// 데이터 삭제하기
export const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error: any) {
    console.error('데이터 삭제 오류:', error.message);
  }
};

// 데이터 저장 여부 확인하기
export const containKeys = async (key: string) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(key);
  } catch (error: any) {
    console.error('데이터 저장 여부 확인 오류:', error.message);
  }
};

// AsyncStorage에 토큰 관련 키가 남아있는지 확인하고 삭제하는 함수
export const checkTokenInAsyncStorage = async (autoRemove: boolean = true): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tokenRelatedKeys = ['at', 'rt', 'accessToken', 'refreshToken', 'userToken', 'token'];

    console.log('=== AsyncStorage 토큰 검사 시작 ===');
    console.log('전체 AsyncStorage 키 목록:', allKeys);

    const foundTokens: { [key: string]: string | null } = {};
    const keysToRemove: string[] = [];
    let hasToken = false;

    // 토큰 관련 키 확인
    for (const key of tokenRelatedKeys) {
      if (allKeys.includes(key)) {
        const value = await AsyncStorage.getItem(key);
        foundTokens[key] = value;
        keysToRemove.push(key);
        hasToken = true;
        console.warn(`[보안 위험] AsyncStorage에 "${key}" 키가 발견되었습니다!`);
        console.warn(`값: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null'}`);
      }
    }

    // 모든 키를 확인하여 토큰처럼 보이는 값이 있는지 체크
    for (const key of allKeys) {
      if (!tokenRelatedKeys.includes(key)) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            // 객체이고 at 또는 rt 속성이 있으면 토큰일 가능성
            if (typeof parsed === 'object' && (parsed.at || parsed.rt)) {
              foundTokens[key] = value;
              keysToRemove.push(key);
              hasToken = true;
              console.warn(`[보안 위험] AsyncStorage의 "${key}" 키에 토큰 데이터가 포함되어 있습니다!`);
              console.warn(`값: ${JSON.stringify(parsed).substring(0, 100)}...`);
            }
          } catch {
            // JSON 파싱 실패는 무시
          }
        }
      }
    }

    if (!hasToken) {
      console.log('AsyncStorage에 토큰 관련 데이터가 없습니다. 안전합니다.');
    } else {
      console.error('[보안 경고] AsyncStorage에 토큰 데이터가 남아있습니다!');
      console.error('발견된 토큰 키:', Object.keys(foundTokens));

      if (autoRemove) {
        // 발견된 토큰 키들을 자동으로 삭제
        for (const key of keysToRemove) {
          try {
            await AsyncStorage.removeItem(key);
            console.log(`"${key}" 키를 삭제했습니다.`);
          } catch (error: any) {
            console.error(`"${key}" 키 삭제 실패:`, error.message);
          }
        }
        console.log('발견된 토큰 데이터를 모두 삭제했습니다.');
      } else {
        console.error('즉시 삭제가 필요합니다!');
      }
    }

    console.log('=== AsyncStorage 토큰 검사 완료 ===');
  } catch (error: any) {
    console.error('AsyncStorage 토큰 검사 오류:', error.message);
  }
};
