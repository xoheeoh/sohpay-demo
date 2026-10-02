import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Platform, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';

import { RootStackParamList } from '@typ/navigation';
import type { IQRdata } from '@typ/paymentType';
import { useDialog } from '@contexts/DialogContext';
import { chkPaymentQR } from '@apis/paymentApi';
import { ScreenWrapper, SecondaryButton, Typography } from '@components/common';
import { theme } from '@styles';
import { getAppWidth } from '@utils/dimensions';

type QRcodeScanScreenProps = NativeStackScreenProps<RootStackParamList, 'QRscan'>;

/** 화면 가운데 QR 스캔 박스 한 변의 길이와 모서리 반지름 */
const SCAN_BOX_SIZE = 250;
const SCAN_BOX_RADIUS = 12;

type ScanBox = { left: number; top: number; size: number };

/** 모서리가 둥근 사각형의 SVG 경로. 화면 전체 사각형과 함께 evenodd 로 채우면 이 부분만 구멍이 된다 */
const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} ` +
  `H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;

/**
 * 카메라는 화면 전체를 찍으므로 박스 밖 모서리에 걸친 QR 도 읽힌다.
 * 꼭짓점(없으면 bounds)으로 QR 의 중심을 구해 박스 안에 있을 때만 인식으로 인정한다. 좌표는 두 플랫폼 모두 카메라 뷰 기준 dp.
 * 위치 정보가 전혀 없으면 막지 않는다.
 */
const isInsideScanBox = (result: BarcodeScanningResult, box: ScanBox) => {
  let centerX: number | undefined;
  let centerY: number | undefined;

  if (result.cornerPoints?.length >= 3) {
    centerX = result.cornerPoints.reduce((sum, p) => sum + p.x, 0) / result.cornerPoints.length;
    centerY = result.cornerPoints.reduce((sum, p) => sum + p.y, 0) / result.cornerPoints.length;
  } else if (result.bounds?.size?.width > 0 && result.bounds?.size?.height > 0) {
    centerX = result.bounds.origin.x + result.bounds.size.width / 2;
    centerY = result.bounds.origin.y + result.bounds.size.height / 2;
  }

  if (centerX === undefined || centerY === undefined) return true;

  return (
    centerX >= box.left && centerX <= box.left + box.size && centerY >= box.top && centerY <= box.top + box.size
  );
};

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
  // 안드로이드는 카메라를 열고 첫 프레임을 받기까지 1~3초가 걸린다. 그동안 검은 화면이 오류로 보이지 않도록 준비 중 표시를 낸다
  const [isCameraReady, setIsCameraReady] = useState<boolean>(Platform.OS === 'web');

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

  // 화면이 focus될 때마다 스캔 상태 초기화. 화면을 떠나면 카메라가 내려가므로 다시 들어올 때는 준비 중부터 시작한다
  useFocusEffect(
    useCallback(() => {
      setIsScanning(true);
      isHandlingRef.current = false;
      return () => {
        setIsScanning(false);
        if (Platform.OS !== 'web') setIsCameraReady(false);
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
    } catch {
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
  // 스캔 박스 위치. 화면에 그리는 오버레이와 인식 판별이 같은 값을 쓴다
  const scanBox: ScanBox = { left: width / 2 - SCAN_BOX_SIZE / 2, top: height * 0.2, size: SCAN_BOX_SIZE };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!isInsideScanBox(result, scanBox)) return;
    onCodeScanned(result.data);
  };

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
      {/* 배경은 완전한 검정 대신 어두운 회색. 카메라가 뜨기 전에도 꺼진 화면이 아니라 준비 중인 화면으로 읽히게 한다 */}
      <View style={{ position: 'absolute', width, height, top: 0, left: 0, backgroundColor: theme.colors.gray800 }}>
        {/* 카메라 화면 */}
        {isFocused && Platform.OS !== 'web' ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
            onCameraReady={() => setIsCameraReady(true)}
          />
        ) : (
          <CameraMock />
        )}

        {/* 박스 바깥을 어둡게 덮어 인식 범위를 눈에 보이게 한다. 화면 전체 사각형에서 박스 모양(둥근 모서리 포함)만 evenodd 로 비운 SVG 한 장 */}
        <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
          <Path
            fill={theme.colors.overlay}
            fillRule="evenodd"
            d={`M0,0 H${width} V${height} H0 Z ${roundedRectPath(scanBox.left, scanBox.top, scanBox.size, scanBox.size, SCAN_BOX_RADIUS)}`}
          />
        </Svg>

        {/* QR 코드 스캔 UI 오버레이 */}
        <View style={{ alignItems: 'center', position: 'absolute', top: scanBox.top, left: scanBox.left }}>
          {/* QR 스캔 박스. 카메라가 준비되기 전에는 안쪽에 준비 중 표시를 낸다 */}
          <View style={styles.qrScanBox}>
            {!isCameraReady && (
              <View style={styles.cameraLoading}>
                <ActivityIndicator size="large" color={theme.colors.mint} />
                <Typography mode="body2" color="white">
                  카메라를 준비하고 있어요
                </Typography>
              </View>
            )}
          </View>

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
  qrScanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderWidth: 5,
    borderColor: theme.colors.mint,
    borderRadius: SCAN_BOX_RADIUS,
  },
  cameraLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  msgBox: { alignItems: 'center', gap: 16, paddingTop: 24 },
});

export default QRcodeScanScreen;
export { QRcodeScanScreen };
