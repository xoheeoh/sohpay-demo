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
       <div class="actions"><button class="primary" onclick="send()">앱으로 돌아가기</button></div>
       <script>
         var payload = ${json};
         function send() {
           try {
             var isAndroid = /Android/i.test(navigator.userAgent);
             var msg = JSON.stringify(isAndroid ? ['result', payload] : payload);
             if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
               window.ReactNativeWebView.postMessage(msg);
               return;
             }
             if (window.parent && window.parent !== window) {
               window.parent.postMessage(msg, '*');
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
