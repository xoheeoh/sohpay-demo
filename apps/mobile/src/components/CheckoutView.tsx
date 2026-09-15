import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

type Props = { url: string; onDeepLink: (url: string) => void };

/** 네이티브: 웹뷰. sohpay:// 로 나가려는 요청을 가로채 앱이 처리한다. */
export function CheckoutView({ url, onDeepLink }: Props) {
  return (
    <WebView
      source={{ uri: url }}
      style={styles.web}
      originWhitelist={['https://*', 'http://*', 'sohpay://*']}
      onShouldStartLoadWithRequest={(req) => {
        if (req.url.startsWith('sohpay://')) {
          onDeepLink(req.url);
          return false;
        }
        return true;
      }}
      incognito
      javaScriptEnabled
    />
  );
}

const styles = StyleSheet.create({ web: { flex: 1, backgroundColor: 'transparent' } });
