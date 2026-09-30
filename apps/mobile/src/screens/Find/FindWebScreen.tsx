import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { storeData } from '@storages/asyncStorage';
import { fetchWebViewHtml, WebViewHtmlSource } from '@utils/webViewHtml';
import { ScreenWrapper } from '@components/common';
import { theme } from '@styles';

type FindWebScreenProps = NativeStackScreenProps<RootStackParamList, 'FindAuthWeb'>;

const FindWebScreen: React.FC<FindWebScreenProps> = ({ navigation, route }) => {
  const uri = route.params.uri;

  const { confirm } = useDialog();

  // 주소를 바로 열지 않고 HTML 본문을 받아 넣는 이유는 utils/webViewHtml.ts 참고
  const [source, setSource] = useState<WebViewHtmlSource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    fetchWebViewHtml(uri)
      .then((html) => {
        if (!cancelled) setSource(html);
      })
      .catch((error) => {
        console.error('본인인증 화면 불러오기 실패:', error);
        if (cancelled) return;
        confirm({
          title: '본인 인증',
          message1: '본인인증 화면을 불러오지 못했습니다.',
          message2: '다시 시도하여 주시기 바랍니다.',
          confirmText: '확인',
        }).then(() => navigation.goBack());
      });
    return () => {
      cancelled = true;
    };
  }, [uri, confirm, navigation]);

  const handleMessage = async (event: any) => {
    const { data } = event.nativeEvent;

    try {
      // 네이티브 Android 웹뷰는 [이벤트명, payload] 배열로, 그 외는 payload 객체로 온다
      const parsedData = JSON.parse(data);
      const payload = Array.isArray(parsedData) ? parsedData[1] : parsedData;
      console.log('Parsed Data from WebView:', payload);

      if (payload?.type === 'CLOSE_WEBVIEW') {
        navigation.goBack();
        console.log('페이지 닫기!');
        return;
      }

      // 보안 프로그램·브라우저 확장이 iframe 안에서 임의 메시지({"uniConnect":true} 등)를 보내므로 인증 결과가 아닌 메시지는 무시한다
      if (!payload || typeof payload.resultCd !== 'string') {
        console.log('본인인증 결과가 아닌 메시지라 무시:', payload);
        return;
      }

      if (payload.resultCd === '0000') {
        console.log('본인인증 성공:', payload.resultMsg);
        await storeData('certData', payload.certData);
        navigation.goBack();
      } else {
        const ok = await confirm({
          title: '본인 인증',
          message1: '본인인증에 실패하였습니다.',
          message2: '다시 시도하여 주시기 바랍니다.',
        });
        if (ok) {
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('본인인증 오류 또는 메시지 파싱 실패:', error);
    }
  };

  const injectedJavaScript = `
    (function() {
      const originalPostMessage = window.postMessage;

      // window.postMessage를 가로채 ReactNativeWebView.postMessage로 전달
      window.postMessage = function(message, targetOrigin) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          // React Native로 메시지 전달
          window.ReactNativeWebView.postMessage(
            typeof message === 'object' ? JSON.stringify(message) : message
          );
        } else {
          originalPostMessage(message, targetOrigin);
        }
      };

      // 웹 화면 내의 닫기 버튼 클릭하면 이전 화면으로 돌아감
      const checkCloseButton = setInterval(function () {
        const closeButton = document.querySelector('.icon-close-btn');
        if (closeButton) {
          closeButton.addEventListener('click', function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CLOSE_WEBVIEW' }));
          });
          clearInterval(checkCloseButton); // 한 번만 실행되도록 멈춤
        }
      }, 500);
    })();
    true; // 방지 코드
  `;

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      {source && (
        <WebView
          source={source}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size={'large'} color={theme.colors.primary} />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default FindWebScreen;
export { FindWebScreen };
