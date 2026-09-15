/**
 * 세션 토큰 저장소.
 *  · 네이티브: expo-secure-store (Keychain / Keystore)
 *  · 웹: localStorage — SecureStore 가 없고, 데모 웹에서는 이 정도가 합리적인 선이다.
 * SecureStore 는 값 하나당 2KB 제한이 있어 세션 JSON 은 조각내서 저장한다.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHUNK = 1800;

const web = {
  getItem: (k: string) => { try { return Promise.resolve(globalThis.localStorage?.getItem(k) ?? null); } catch { return Promise.resolve(null); } },
  setItem: (k: string, v: string) => { try { globalThis.localStorage?.setItem(k, v); } catch {} return Promise.resolve(); },
  removeItem: (k: string) => { try { globalThis.localStorage?.removeItem(k); } catch {} return Promise.resolve(); },
};

const native = {
  async getItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(`${key}.n`));
    if (!count) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)));
    return parts.some((p) => p == null) ? null : parts.join('');
  },
  async setItem(key: string, value: string) {
    const parts = value.match(new RegExp(`.{1,${CHUNK}}`, 'g')) ?? [];
    await Promise.all(parts.map((p, i) => SecureStore.setItemAsync(`${key}.${i}`, p)));
    await SecureStore.setItemAsync(`${key}.n`, String(parts.length));
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(`${key}.n`));
    await Promise.all(Array.from({ length: count || 0 }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)));
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

export const sessionStorage = Platform.OS === 'web' ? web : native;
