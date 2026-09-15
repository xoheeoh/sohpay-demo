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

export function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

export function preflight(req: Request) {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: CORS }) : null;
}
