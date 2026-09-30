import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Linking, Platform, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { RootStackParamList } from '@typ/navigation';
import type { IQRdata } from '@typ/paymentType';
import { useDialog } from '@contexts/DialogContext';
import { chkPaymentQR } from '@apis/paymentApi';
import { ScreenWrapper, SecondaryButton, Typography } from '@components/common';
import { theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';

type QRcodeScanScreenProps = NativeStackScreenProps<RootStackParamList, 'QRscan'>;

// 카메라를 쓸 수 없는 웹에서 카메라 대신 보여주는 목(mock) 이미지. 컴포넌트 밖에 두어 리렌더 시 깜빡이지 않게 한다
const CameraMock = () => (
  <View style={StyleSheet.absoluteFill}>
    <Image source={require('@images/mock.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
  </View>
);

const QRcodeScanScreen: React.FC<QRcodeScanScreenProps> = ({ navigation }) => {
  // Dialog
  const { confirm } = useDialog();

  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = !!permission?.granted;
  const [isScanning, setIsScanning] = useState<boolean>(true);
  // 카메라가 같은 QR 을 연속으로 읽어 보내므로 state 대신 ref 로 즉시 잠가 중복 조회를 막는다
  const isHandlingRef = useRef(false);
  const isFocused = useIsFocused();

  // 카메라 권한은 한 번만 요청한다. 거부 뒤에도 canAskAgain 이 true 로 남는 환경(웹, 일부 Android)에서는
  // 요청이 무한 반복되며 화면이 깜빡인다. 웹은 CameraMock 을 보여주므로 요청을 건너뛴다.
  const hasRequestedPermission = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (hasRequestedPermission.current) return;
    if (permission && !permission.granted && permission.canAskAgain) {
      hasRequestedPermission.current = true;
      requestPermission().catch((error) => console.error('카메라 권한 요청 실패:', error));
    }
  }, [permission, requestPermission]);

  // 화면이 focus될 때마다 스캔 상태 초기화
  useFocusEffect(
    useCallback(() => {
      setIsScanning(true);
      isHandlingRef.current = false;
      return () => {
        setIsScanning(false);
      };
    }, []),
  );

  // QR 코드 스캔 처리
  const onCodeScanned = async (codeValue: string) => {
    if (!isScanning || isHandlingRef.current) return; // 중복 방지
    isHandlingRef.current = true;
    setIsScanning(false);

    try {
      if (codeValue) {
        console.log(`조회한 QR코드 값: ${codeValue}`);

        const data = await chkPaymentQR(codeValue);
        console.log('QR 결제 결과:', data);

        if (data.resultCd === '0000') {
          navigation.navigate('CodeInfo', { data: data as unknown as IQRdata });
        } else {
          // 서버가 구분해 주는 이유(만료·이미 결제됨·없는 코드)를 그대로 보여준다
          confirm({
            title: '조회 실패',
            message1: data.resultMsg,
            message2: '확인 후 다시 시도해주세요.',
            confirmText: '확인',
          }).then((ok) => {
            if (ok) {
              isHandlingRef.current = false;
              setIsScanning(true); // QR 인식 재시작
            }
          });
        }
      }
    } catch (error) {
      confirm({
        title: '조회 실패',
        message1: 'QR 코드 인식에 실패했습니다.',
        message2: '확인 후 다시 시도해주세요.',
        confirmText: '확인',
      }).then((ok) => {
        if (ok) {
          setIsScanning(true); // QR 인식 재시작
        }
      });
    }
  };

  const width = getAppWidth();
  const { height } = Dimensions.get('window');

  if (!hasPermission && Platform.OS !== 'web')
    return (
      <ScreenWrapper backgroundColor="white">
        <View style={[styles.wrap, { gap: 24 }]}>
          <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
            카메라 권한이 허용되지 않았습니다.{'\n'}설정에서 권한을 허용해 주세요.
          </Typography>
          <SecondaryButton label={'권한 설정'} onPress={() => Linking.openSettings()} size={'lg'} />
        </View>
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false}>
      <View style={{ position: 'absolute', width, height, top: 0, left: 0 }}>
        {/* 카메라 화면 */}
        {isFocused && Platform.OS !== 'web' ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={isScanning ? ({ data }) => onCodeScanned(data) : undefined}
          />
        ) : (
          <CameraMock />
        )}

        {/* QR 코드 스캔 UI 오버레이 */}
        <View style={{ alignItems: 'center', position: 'absolute', top: '20%', left: width / 2 - 125 }}>
          {/* QR 스캔 박스 */}
          <View style={styles.qrScanBox}></View>

          {/* 안내 문구 및 버튼 */}
          <View style={styles.msgBox}>
            <Typography mode="heading3" color="white">
              QR코드를 스캔해 주세요!
            </Typography>
            <SecondaryButton
              style={{ alignSelf: 'center' }}
              label={'결제코드 입력'}
              onPress={() => navigation.navigate('CodeInput')}
              size={'lg'}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  qrScanBox: { width: 250, height: 250, borderWidth: 5, borderColor: theme.colors.mint, borderRadius: 12 },
  msgBox: { alignItems: 'center', gap: 16, paddingTop: 24 },
});

export default QRcodeScanScreen;
export { QRcodeScanScreen };
