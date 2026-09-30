/**
 * 모의 본인인증창·결제창 HTML 을 fetch 로 받아 WebView 의 source.html 로 넣기 위한 도우미.
 *
 * Supabase Edge Functions 기본 도메인은 GET 의 text/html 응답을 text/plain 으로 바꾸므로(피싱 방지 정책),
 * 주소를 그대로 열면 HTML 소스가 글자로 보인다. 본문을 받아 넣으면 응답 헤더와 무관하게 HTML 로 그려지고,
 * 폼 제출(POST) 응답은 바뀌지 않아 이후 화면은 WebView 가 평소처럼 이어간다.
 *
 * 서버 쪽 짝: supabase/functions/_shared/http.ts 의 html() (CORS 허용), 각 페이지의 <form action="절대주소">
 */

/** WebView 의 source 로 그대로 넘길 수 있는 형태 */
export type WebViewHtmlSource = { html: string; baseUrl: string };

export async function fetchWebViewHtml(uri: string): Promise<WebViewHtmlSource> {
  const res = await fetch(uri);
  // Response.text() 는 헤더 charset 과 무관하게 UTF-8 로 읽으므로 text/plain 이어도 한글이 깨지지 않는다
  const html = await res.text();
  if (!html) throw new Error(`빈 응답 (HTTP ${res.status})`);
  // 오류 페이지(4xx)도 서버가 HTML 로 주므로 그대로 보여준다
  return { html, baseUrl: uri };
}
