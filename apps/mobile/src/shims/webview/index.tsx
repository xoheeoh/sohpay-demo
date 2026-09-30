// 네이티브: 실제 패키지를 그대로 내보낸다. (alias 는 '^react-native-webview$' 만 잡으므로 하위 경로 import 는 패키지로 간다)
//
// 주의: 이 파일의 확장자는 index.web.tsx 와 똑같이 .tsx 여야 한다.
// Metro 는 확장자(ts → tsx …)를 바깥 순서로, 플랫폼(.web)을 안쪽 순서로 찾기 때문에
// index.ts 로 두면 웹에서도 index.web.tsx 대신 이 파일이 먼저 잡혀 네이티브 패키지가 로드된다.
// ("React Native WebView does not support this platform." 문구가 그 증상)
import WebView from 'react-native-webview/index.js';
export * from 'react-native-webview/index.js';
export { WebView };
export default WebView;
