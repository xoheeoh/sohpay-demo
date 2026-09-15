/** 모의 결제창/인증창 공통 셸. 실제 PG 창의 분위기만 흉내 낸 데모 화면이다. */
export function shell(title: string, badge: string, body: string) {
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; --bg:#f2f4f8; --card:#fff; --fg:#121319; --muted:#696e77;
          --line:#dde0e6; --brand:#2CB5ED; --danger:#E32622; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#121319; --card:#21232a; --fg:#f2f4f8; --muted:#a2a7b0; --line:#34363f; }
  }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
         background:var(--bg); color:var(--fg); display:flex; align-items:center; justify-content:center;
         min-height:100dvh; padding:24px 16px; }
  .card { width:100%; max-width:420px; background:var(--card); border-radius:20px; padding:28px 22px 24px;
          box-shadow:0 12px 40px rgba(0,0,0,.10); }
  .badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.04em; color:var(--brand);
           border:1px solid var(--brand); border-radius:999px; padding:4px 10px; margin-bottom:18px; }
  h1 { font-size:19px; margin:0 0 4px; letter-spacing:-.01em; }
  p.sub { margin:0 0 22px; color:var(--muted); font-size:13px; line-height:1.55; }
  dl { margin:0 0 22px; border-top:1px solid var(--line); }
  div.row { display:flex; justify-content:space-between; gap:12px; padding:13px 2px; border-bottom:1px solid var(--line); }
  dt { color:var(--muted); font-size:13px; margin:0; }
  dd { margin:0; font-size:14px; font-weight:600; text-align:right; word-break:break-all; }
  dd.amount { font-size:22px; font-weight:800; letter-spacing:-.02em; }
  label { display:block; font-size:12px; color:var(--muted); margin:14px 0 6px; }
  input { width:100%; padding:13px 14px; font-size:16px; border:1px solid var(--line); border-radius:12px;
          background:transparent; color:var(--fg); }
  input:focus { outline:2px solid var(--brand); outline-offset:-1px; border-color:transparent; }
  .actions { display:flex; flex-direction:column; gap:9px; margin-top:22px; }
  button { width:100%; padding:15px; font-size:15px; font-weight:700; border-radius:12px; border:0; cursor:pointer;
           font-family:inherit; }
  button.primary { background:var(--brand); color:#fff; }
  button.ghost { background:transparent; color:var(--muted); border:1px solid var(--line); }
  button.danger { background:transparent; color:var(--danger); border:1px solid var(--danger); }
  .note { margin-top:18px; font-size:11px; color:var(--muted); line-height:1.6; text-align:center; }
</style></head>
<body><main class="card"><span class="badge">${badge}</span>${body}
<p class="note">포트폴리오용 데모 화면입니다. 실제 금융거래는 일어나지 않습니다.</p>
</main></body></html>`;
}

export function won(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}
