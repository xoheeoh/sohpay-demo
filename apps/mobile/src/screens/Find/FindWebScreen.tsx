import { Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { storeData } from '@storages/asyncStorage';
import { ScreenWrapper } from '@components/common';

type FindWebScreenProps = NativeStackScreenProps<RootStackParamList, 'FindAuthWeb'>;

const FindWebScreen: React.FC<FindWebScreenProps> = ({ navigation, route }) => {
  // 이전 화면에서 얻어온 본인인증 uri
  const uri = route.params.uri;

  // Dialog
  const { confirm } = useDialog();

  const handleMessage = async (event: any) => {
    // 웹뷰에서 전달된 데이터 읽기
    const { data } = event.nativeEvent;

    try {
      // JSON 파싱 시도
      const parsedData = JSON.parse(data);
      console.log('Parsed Data from WebView:', Platform.OS === 'android' ? parsedData[1] : parsedData);

      // 닫기 버튼 메시지 처리
      if (parsedData.type === 'CLOSE_WEBVIEW') {
        navigation.goBack();
        console.log('페이지 닫기!');
        return;
      }

      if (Platform.OS === 'android' ? parsedData[1].resultCd === '0000' : parsedData.resultCd === '0000') {
        console.log('본인인증 성공:', Platform.OS === 'android' ? parsedData[1].resultMsg : parsedData.resultMsg);
        await storeData('certData', Platform.OS === 'android' ? parsedData[1].certData : parsedData.certData);
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

  // 웹뷰에 주입할 JavaScript
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
      <WebView
        source={{ uri: uri }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript} // JavaScript 주입
      />
    </ScreenWrapper>
  );
};

export default FindWebScreen;
export { FindWebScreen };
