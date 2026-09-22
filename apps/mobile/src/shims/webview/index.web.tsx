/**
 * 웹용 WebView 대역. react-native-webview 는 웹 구현이 없다.
 * 앱이 쓰는 최소 기능만 iframe 으로 흉내 낸다:
 *   · source.uri / source.html 로드
 *   · onMessage — iframe 이 window.parent.postMessage 로 보낸 문자열을 nativeEvent.data 로 전달
 *   · onLoadStart / onLoadEnd
 * injectedJavaScript, onShouldStartLoadWithRequest 등은 웹에서 무시된다.
 */
import { useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type WebViewProps = {
  source?: { uri?: string; html?: string };
  style?: StyleProp<ViewStyle>;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
} & Record<string, unknown>;

export function WebView(props: WebViewProps) {
  const { source, style, onMessage, onLoadStart, onLoadEnd } = props;
  const frame = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!onMessage) return;
    const handler = (e: MessageEvent) => {
      // 우리 iframe 이 보낸 메시지만 넘긴다. iframe 이 없는 순간(마운트 전/해제 중)에 온 메시지도 버린다.
      // 주의: 보안 프로그램·확장 프로그램이 iframe 안에 끼워 넣은 스크립트가 보낸 메시지({"uniConnect":true} 등)는
      // 출처가 iframe 이라 여기서 걸러지지 않는다. 받는 쪽 화면에서 결과 형태인지 확인해야 한다.
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const data = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
      onMessage({ nativeEvent: { data } });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  useEffect(() => {
    onLoadStart?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.uri, source?.html]);

  return (
    <View style={[styles.wrap, style]}>
      <iframe
        ref={frame}
        src={source?.uri}
        srcDoc={source?.html}
        title="webview"
        style={{ border: 0, width: '100%', height: '100%' }}
        onLoad={() => onLoadEnd?.()}
      />
    </View>
  );
}

export default WebView;

const styles = StyleSheet.create({ wrap: { flex: 1, minHeight: 200 } });
