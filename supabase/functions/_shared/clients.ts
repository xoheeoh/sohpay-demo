import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/** 요청자의 토큰을 그대로 물려받는 클라이언트. RLS 가 그대로 적용된다. */
export function asCaller(req: Request): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
}

/** 서비스 롤. RLS 를 통과한다. 사용자 입력이 직접 닿는 곳에서는 쓰지 않는다. */
export function asService(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

export const DEEP_LINK = Deno.env.get('APP_DEEP_LINK') ?? 'sohpay://';
export const FUNCTIONS_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
