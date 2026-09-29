/**
 * 모의 결제창/인증창 공통 셸.
 * 실제 결제대행사(PG)·본인인증사 창이 서는 자리에 뜨는 데모 화면이다. 그래서 두 가지를 지킨다.
 *   1. "데모용 모의 화면"이라는 사실을 맨 위 띠에서 바로 알린다 (진짜 은행 창으로 오해하지 않게).
 *   2. 색·모서리·글자 크기는 앱(apps/mobile styles/colors.ts, theme.ts)과 같은 값을 써서 앱의 일부처럼 보이게 한다.
 */
export function shell(title: string, badge: string, body: string) {
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="darkreader-lock">
<title>${title}</title>
<style>
  /* 앱 팔레트: primary #1E63F0, bg #F6F7FA, text #15171D, textSub #6B7280, line #E2E5EB, red500 #E5484D */
  :root { color-scheme: light; --bg:#F6F7FA; --card:#FFFFFF; --fg:#15171D; --muted:#6B7280; --faint:#8B93A3;
          --line:#E2E5EB; --soft:#EEF3FF; --brand:#1E63F0; --brand-dark:#174ECC; --danger:#E5484D;
          --yellow-bg:#FFF5E1; --yellow-fg:#8A5C08; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
         background:var(--bg); color:var(--fg); display:flex; align-items:center; justify-content:center;
         min-height:100dvh; padding:24px 16px; letter-spacing:-.01em; }
  .card { width:100%; max-width:420px; background:var(--card); border-radius:20px; overflow:hidden;
          box-shadow:0 1px 2px rgba(21,23,29,.04), 0 6px 20px rgba(21,23,29,.06); }

  /* 데모 안내 띠: 카드 맨 위에 항상 보인다 */
  .demo { display:flex; align-items:flex-start; gap:8px; padding:12px 16px; background:var(--yellow-bg); color:var(--yellow-fg);
          font-size:12px; line-height:1.5; }
  .demo b { font-weight:700; }
  .demo svg { flex:none; width:16px; height:16px; margin-top:1px; }

  .inner { padding:22px 20px 20px; }
  .badge { display:inline-block; font-size:11px; font-weight:600; color:var(--brand); background:var(--soft);
           border-radius:999px; padding:4px 10px; margin-bottom:16px; }
  h1 { font-size:20px; line-height:28px; margin:0 0 6px; letter-spacing:-.02em; }
  p.sub { margin:0 0 20px; color:var(--muted); font-size:14px; line-height:1.55; }

  dl { margin:0 0 20px; padding:4px 14px; background:var(--bg); border-radius:12px; }
  div.row { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 0; }
  div.row + div.row { border-top:1px solid var(--line); }
  dt { color:var(--muted); font-size:14px; margin:0; flex:none; }
  dd { margin:0; font-size:14px; font-weight:600; text-align:right; word-break:break-all; }
  dd.amount { font-size:24px; font-weight:700; letter-spacing:-.02em; color:var(--brand); }

  label { display:block; font-size:12px; color:var(--muted); margin:14px 0 6px; }
  input { width:100%; padding:15px 16px; font-size:16px; border:1px solid var(--line); border-radius:12px;
          background:var(--bg); color:var(--fg); font-family:inherit; }
  /* 자리표시자는 입력값과 구분되도록 연하게 (앱 입력칸의 placeholder 색 gray300 과 같은 값) */
  input::placeholder { color:#AEB5C2; opacity:1; }
  input:focus { outline:none; border:1.5px solid var(--brand); background:#fff; }

  .actions { display:flex; flex-direction:column; gap:10px; margin-top:20px; }
  /* 기본 버튼: 글자 가운데 정렬 (본인인증 "인증 완료", 결과 화면 "앱으로 돌아가기" 등) */
  button { width:100%; min-height:56px; padding:12px 16px; font-size:16px; font-weight:600; border-radius:12px; border:0;
           cursor:pointer; font-family:inherit; text-align:center; display:flex; flex-direction:column; justify-content:center;
           align-items:center; gap:2px; letter-spacing:-.01em; }
  /* 설명 줄(small)이 딸린 버튼: 제목·설명을 왼쪽에 맞춘다 (결제창의 승인/거절/취소) */
  button.detail { text-align:left; align-items:flex-start; }
  button small { display:block; font-size:12px; font-weight:500; line-height:16px; opacity:.85; }
  button.primary { background:var(--brand); color:#fff; }
  button.primary:active { background:var(--brand-dark); }
  button.danger { background:#FFEDEE; color:var(--danger); }
  button.ghost { background:#EEF0F4; color:#4B5160; }
  button:active { transform:scale(.99); }

  .note { margin:18px 0 0; font-size:11px; color:var(--faint); line-height:1.6; text-align:center; }
</style></head>
<body><main class="card">
<div class="demo">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3h6M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3"/>
  </svg>
  <div><b>데모용 모의 화면입니다.</b> 실제 은행·결제대행사와 연결되지 않으며, 실제 돈은 움직이지 않습니다.</div>
</div>
<div class="inner"><span class="badge">${badge}</span>${body}
<p class="note">SohPay 포트폴리오 데모 · 이 창은 실제 서비스에서 결제대행사(PG) 창이 뜨는 자리입니다.</p>
</div></main></body></html>`;
}

export function won(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}
