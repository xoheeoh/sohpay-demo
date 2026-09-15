import { FUNCTIONS_URL, supabase } from '../supabase';
import { AppError } from '../errors';

/** Edge Function 호출. 세션 토큰을 붙이고, ok:false 응답을 AppError 로 바꾼다. */
export async function callFunction<T>(path: string, body: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  };
  if (auth) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new AppError('UNAUTHENTICATED');
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_URL}/${path}`, { method: 'POST', headers, body: JSON.stringify(body ?? {}) });
  } catch {
    throw new AppError('Network request failed');
  }

  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string } & T;
  if (!res.ok || json.ok === false) throw new AppError(json.code ?? `HTTP_${res.status}`, json);
  return json;
}
