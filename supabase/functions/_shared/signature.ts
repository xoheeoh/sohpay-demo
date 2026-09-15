/**
 * 결제창 URL 위조 방지용 서명.
 *
 * 결제창은 로그인 세션 없이 웹뷰가 그냥 여는 주소다.
 * 거래 id 만 들고 있으면 누구나 남의 결제창을 열 수 있으므로,
 * 서버만 아는 비밀키로 (거래 id + 만료시각) 을 서명해 붙인다.
 */
const enc = new TextEncoder();

async function key(): Promise<CryptoKey> {
  const secret = Deno.env.get('CHECKOUT_SECRET');
  if (!secret) throw new Error('CHECKOUT_SECRET 환경변수가 없습니다.');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sign(id: string, expiresAt: number): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await key(), enc.encode(`${id}.${expiresAt}`));
  return `${expiresAt}.${hex(mac)}`;
}

export async function verify(id: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  const [expRaw, mac] = token.split('.');
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = await sign(id, expiresAt);
  // 길이가 같을 때만 상수시간 비교
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0 && mac.length === 64;
}

export const TTL_MS = 10 * 60 * 1000;
