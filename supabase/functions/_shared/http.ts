export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function fail(code: string, status = 400, extra: Record<string, unknown> = {}) {
  return json({ ok: false, code, ...extra }, status);
}

/**
 * HTML 응답.
 *
 * 주의: Supabase 기본 도메인(*.supabase.co)은 피싱 방지를 위해 GET 의 text/html 응답을 text/plain 으로 바꿔 보낸다.
 * 그래서 앱은 이 HTML 을 주소로 직접 열지 않고, fetch 로 본문만 받아 WebView 에 넣는다 (apps/mobile utils/webViewHtml.ts).
 * 웹 브라우저에서 그 fetch 가 되려면 CORS 헤더가 필요해서 함께 보낸다. POST 응답은 바뀌지 않으므로 폼 제출 결과는 그대로 그려진다.
 */
export function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

export function preflight(req: Request) {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: CORS }) : null;
}
