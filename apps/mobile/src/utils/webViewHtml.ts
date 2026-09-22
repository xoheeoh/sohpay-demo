/**
 * 모의 본인인증창·결제창 HTML 을 "주소로 열지" 않고 "본문만 받아" WebView 에 넣기 위한 도우미.
 *
 * 왜 필요한가
 *   서버(Supabase Edge Functions)는 기본 도메인에서 GET 의 HTML 응답을 text/plain 으로 바꿔 보낸다 (피싱 방지 정책).
 *   그래서 WebView / iframe 에 주소를 그대로 넣으면 HTML 소스가 글자로 보이고 한글도 깨진다.
 *   fetch 로 본문을 받아 source.html 로 넣으면 응답 형식 헤더와 무관하게 HTML 로 그려진다.
 *   폼 제출(POST)의 응답은 바뀌지 않으므로, 그 다음 화면부터는 WebView 가 평소처럼 이어서 보여준다.
 *
 * 서버 쪽 짝: supabase/functions/_shared/http.ts 의 html() (CORS 허용), 각 페이지의 <form action="절대주소">
 */

/** WebView 의 source 로 그대로 넘길 수 있는 형태 */
export type WebViewHtmlSource = { html: string; baseUrl: string };

export async function fetchWebViewHtml(uri: string): Promise<WebViewHtmlSource> {
  const res = await fetch(uri);
  // Response.text() 는 헤더의 charset 과 상관없이 UTF-8 로 읽는다. 그래서 text/plain 으로 와도 한글이 깨지지 않는다.
  const html = await res.text();
  if (!html) throw new Error(`빈 응답 (HTTP ${res.status})`);
  // 만료 안내 같은 오류 페이지(4xx)도 서버가 HTML 로 주므로 그대로 보여준다.
  return { html, baseUrl: uri };
}
