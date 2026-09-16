import { useCallback, useEffect, useState } from 'react';
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

const QRcodeScanScreen: React.FC<QRcodeScanScreenProps> = ({ navigation }) => {
  // Dialog
  const { confirm } = useDialog();

  // 원본은 react-native-vision-camera 를 썼다. Expo 에서는 expo-camera 로 같은 동작(QR 스캔)을 한다.
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = !!permission?.granted;
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const isFocused = useIsFocused();

  // 화면 진입 시 카메라 권한 요청
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch((error) => console.error('카메라 권한 요청 실패:', error));
    }
  }, [permission, requestPermission]);

  // 화면이 focus될 때마다 스캔 상태 초기화
  useFocusEffect(
    useCallback(() => {
      setIsScanning(true);
      return () => {
        setIsScanning(false);
      };
    }, []),
  );

  // QR 코드 스캔 처리
  const onCodeScanned = async (codeValue: string) => {
    if (!isScanning) return; // 중복 방지
    setIsScanning(false);

    try {
      if (codeValue) {
        console.log(`조회한 QR코드 값: ${codeValue}`);

        const data = await chkPaymentQR(codeValue);
        console.log('QR 결제 결과:', data);

        if (data.resultCd === '0000') {
          navigation.navigate('CodeInfo', { data: data as unknown as IQRdata });
        } else {
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

  const CameraMock = () => (
    <View style={StyleSheet.absoluteFill}>
      <Image source={require('@images/mock.jpg')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );

  const width = getAppWidth();
  const { height } = Dimensions.get('window');

  if (!hasPermission && Platform.OS !== 'web')
    return (
      <ScreenWrapper backgroundColor="white">
        <View style={[styles.wrap, { gap: 24 }]}>
          <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
            카메라 권한이 허용되지 않았습니다.{'\n'}설정에서 권한을 허용해 주세요.
          </Typography>
          <SecondaryButton label={'권한 설정'} onPress={() => Linking.openSettings()} size={'large'} />
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
              size={'large'}
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
