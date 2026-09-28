import { shell, esc } from './page.ts';
import { html } from './http.ts';

/**
 * 결제창/인증창 결과를 앱에 돌려주는 페이지.
 *
 * 앱의 웹뷰는 window.postMessage 로 결과 JSON 을 받는다 (원본 PG 연동과 같은 방식).
 *   · 네이티브 WebView : window.ReactNativeWebView.postMessage
 *     - Android 는 [이벤트명, payload] 배열, iOS 는 payload 객체를 기대한다
 *   · 웹(iframe)       : window.parent.postMessage
 *   · 둘 다 아니면     : 딥링크로 복귀
 */
export function bridgePage(title: string, badge: string, heading: string, sub: string, payload: Record<string, unknown>, deepLink: string) {
  const json = JSON.stringify(payload);
  return html(
    shell(
      title,
      badge,
      `<h1>${esc(heading)}</h1><p class="sub">${esc(sub)}</p>
       <div class="actions"><button class="primary center" onclick="send()">앱으로 돌아가기</button></div>
       <script>
         var payload = ${json};
         function send() {
           try {
             if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
               // 네이티브 Android WebView 만 배열 형식을 기대한다 (Android 브라우저로 여는 웹 앱은 해당 없음)
               var isAndroid = /Android/i.test(navigator.userAgent);
               window.ReactNativeWebView.postMessage(JSON.stringify(isAndroid ? ['result', payload] : payload));
               return;
             }
             if (window.parent && window.parent !== window) {
               window.parent.postMessage(JSON.stringify(payload), '*');
               return;
             }
           } catch (e) {}
           location.href = ${JSON.stringify(deepLink)};
         }
         setTimeout(send, 600);
       </script>`
    )
  );
}
