import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { WebViewOpenWindowEvent } from 'react-native-webview/lib/WebViewTypes';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { requestChargeUrl } from '@apis/paymentApi';
import { ChargeTypeEnum } from '@dt/enum';
import { isHttpUrl, openExternalAppUrl, shouldInterceptPaymentUrl } from '@utils/bankAppLink';
import {
  getPaymentResultMessage,
  isAppCallbackUrl,
  isInternalAppReturnUrl,
  isPaymentCallbackUrl,
  isPaymentSuccessUrl,
  isWebViewPaymentSuccess,
  parseBankPayReturnUrl,
  parseWebViewPaymentMessage,
} from '@utils/paymentCallback';
import { fetchWebViewHtml, WebViewHtmlSource } from '@utils/webViewHtml';
import { ScreenWrapper } from '@components/common';
import { theme } from '@styles';

// 결제창 HTML 본문(모의 PG) 또는 주소(뱅크페이 복귀 등 외부 페이지)
type ChargeWebViewSource = WebViewHtmlSource | { uri: string };

type ChargeAcntWebScreenProps = NativeStackScreenProps<RootStackParamList, 'ChargeAcntWeb'>;

const ChargeAcntWebScreen: React.FC<ChargeAcntWebScreenProps> = ({ navigation, route }) => {
  const { chargeAmt } = route.params;
  const { confirm } = useDialog();

  // 결제창 HTML 은 주소를 바로 열지 않고 본문을 받아 넣는다. 이유는 utils/webViewHtml.ts 참고
  const [source, setSource] = useState<ChargeWebViewSource | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState<boolean>(true);
  const [isWebViewLoading, setIsWebViewLoading] = useState<boolean>(false);
  const isResultHandledRef = useRef(false);
  const webViewRef = useRef<WebView>(null);

  const navigateToResult = useCallback(
    (success: boolean, message?: string) => {
      if (isResultHandledRef.current) {
        return;
      }

      isResultHandledRef.current = true;

      if (success) {
        navigation.navigate('ChargeSuc', { chargeAmt });
        return;
      }

      confirm({
        title: '충전 실패',
        message1: message ?? '충전에 실패했습니다.',
        confirmText: '확인',
      }).then((ok) => {
        if (ok) {
          navigation.pop(2);
        }
      });
    },
    [chargeAmt, confirm, navigation],
  );

  const handleAppReturnUrl = useCallback((callbackUrl: string) => {
    if (!isAppCallbackUrl(callbackUrl)) {
      return false;
    }

    console.log('앱 복귀 URL:', callbackUrl);

    const bankPayRedirectUrl = parseBankPayReturnUrl(callbackUrl);
    if (bankPayRedirectUrl) {
      isResultHandledRef.current = false;
      setIsWebViewLoading(true);
      setSource({ uri: bankPayRedirectUrl });
      return true;
    }

    // sohpay:// 만으로 복귀한 경우 — 뱅크페이가 이미 앱을 열었으므로 추가 처리 불필요
    return true;
  }, []);

  const handlePaymentCallbackUrl = useCallback(
    (callbackUrl: string) => {
      if (isAppCallbackUrl(callbackUrl)) {
        return handleAppReturnUrl(callbackUrl);
      }

      if (!isPaymentCallbackUrl(callbackUrl)) {
        return false;
      }

      navigateToResult(isPaymentSuccessUrl(callbackUrl), getPaymentResultMessage(callbackUrl));
      return true;
    },
    [handleAppReturnUrl, navigateToResult],
  );

  useEffect(() => {
    requestChargeUrl(Number(chargeAmt), ChargeTypeEnum.Transfer)
      .then(async (data) => {
        console.log('충전 url 발급 결과:', data);

        if (data?.resultCd === '0000' && data.returnUrl) {
          setIsWebViewLoading(true);
          setSource(await fetchWebViewHtml(data.returnUrl)); // 실패하면 아래 catch 로 간다
        } else {
          confirm({
            title: '충전 실패',
            message1: data?.resultMsg ?? '충전 URL 발급에 실패했습니다.',
            confirmText: '확인',
          }).then((ok) => {
            if (ok) {
              navigation.pop(2);
            }
          });
        }
      })
      .catch((error) => {
        console.error('충전 결제창 준비 실패:', error);
        confirm({
          title: '충전 실패',
          message1: '충전 결제창을 불러오지 못했습니다.',
          confirmText: '확인',
        }).then((ok) => {
          if (ok) {
            navigation.pop(2);
          }
        });
      })
      .finally(() => setIsUrlLoading(false));
  }, [chargeAmt, confirm, navigation]);

  useEffect(() => {
    const handleDeepLink = (callbackUrl: string) => {
      if (isInternalAppReturnUrl(callbackUrl)) {
        return;
      }

      console.log('Deep link 수신:', callbackUrl);
      handlePaymentCallbackUrl(callbackUrl);
    };

    const subscription = Linking.addEventListener('url', ({ url: callbackUrl }) => {
      handleDeepLink(callbackUrl);
    });

    Linking.getInitialURL().then((callbackUrl) => {
      if (callbackUrl) {
        handleDeepLink(callbackUrl);
      }
    });

    return () => subscription.remove();
  }, [handlePaymentCallbackUrl]);

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    const { data } = event.nativeEvent;

    try {
      const parsedData = JSON.parse(data);
      console.log('Parsed data:', parsedData);

      if (isWebViewPaymentSuccess(parsedData)) {
        navigateToResult(true);
        return;
      }

      const result = parseWebViewPaymentMessage(parsedData);
      if (result?.resultCd) {
        navigateToResult(false, result.resultMsg);
      }
    } catch (error) {
      console.error('JSON 파싱 에러:', error);
    }
  };

  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      const requestUrl = request.url;

      if (isHttpUrl(requestUrl)) {
        return true;
      }

      if (handlePaymentCallbackUrl(requestUrl)) {
        return false;
      }

      if (shouldInterceptPaymentUrl(requestUrl)) {
        openExternalAppUrl(requestUrl, confirm);
        return false;
      }

      return false;
    },
    [confirm, handlePaymentCallbackUrl],
  );

  const handleWebViewError = useCallback(
    (event: { nativeEvent: { url?: string }; preventDefault: () => void }) => {
      setIsWebViewLoading(false);

      const failedUrl = event.nativeEvent.url ?? '';

      if (handlePaymentCallbackUrl(failedUrl)) {
        event.preventDefault();
        return;
      }

      if (shouldInterceptPaymentUrl(failedUrl)) {
        event.preventDefault();
        openExternalAppUrl(failedUrl, confirm);
      }
    },
    [confirm, handlePaymentCallbackUrl],
  );

  const handleOpenWindow = useCallback(
    (event: WebViewOpenWindowEvent) => {
      const targetUrl = event.nativeEvent.targetUrl;
      console.log('onOpenWindow:', targetUrl);

      if (handlePaymentCallbackUrl(targetUrl)) {
        return;
      }

      if (isHttpUrl(targetUrl)) {
        webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(targetUrl)}; true;`);
        return;
      }

      if (shouldInterceptPaymentUrl(targetUrl)) {
        openExternalAppUrl(targetUrl, confirm);
      }
    },
    [confirm, handlePaymentCallbackUrl],
  );

  const injectedJavaScript = `
    (function() {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);

      const originalPostMessage = window.postMessage;
      window.postMessage = function(message, targetOrigin) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(
            typeof message === 'object' ? JSON.stringify(message) : message
          );
        } else {
          originalPostMessage(message, targetOrigin);
        }
      };
    })();
    true;
  `;

  const showLoading = isUrlLoading || isWebViewLoading;
  const showWebView = source !== null && !isUrlLoading;

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      {showWebView && (
        <WebView
          ref={webViewRef}
          source={source}
          style={[styles.webView, { opacity: isWebViewLoading ? 0 : 1 }]}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled
          onOpenWindow={handleOpenWindow}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onError={handleWebViewError}
          onLoadStart={() => setIsWebViewLoading(true)}
          onLoadEnd={() => setIsWebViewLoading(false)}
        />
      )}

      {showLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size={'large'} color={theme.colors.primary} />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  webView: { flex: 1 },
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

export default ChargeAcntWebScreen;
export { ChargeAcntWebScreen };
