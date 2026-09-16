// 네이티브: 실제 패키지를 그대로 내보낸다. (alias 는 '^react-native-webview$' 만 잡으므로 하위 경로 import 는 원본으로 간다)
import WebView from 'react-native-webview/index.js';
export * from 'react-native-webview/index.js';
export { WebView };
export default WebView;
