import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { RootStackParamList } from '@typ/navigation';
import { IMidInfo } from '@typ/paymentType';
import { useDialog } from '@contexts/DialogContext';
import { formatDateTime, formatWon } from '@utils/formatter';
import { loadMidInfo } from '@apis/commonApi';
import { getBankName } from '@dt/bankCd';
import {
  Badge,
  ScreenWrapper,
  Typography,
  getTrxAmountColor,
  getTrxTone,
  useScreenBottomPadding,
} from '@components/common';
import { ChargeInfo, MidInfo, PaymentInfo } from '@components/uselist';
import { theme } from '@styles';

type UseDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'UseDetail'>;

const UseDetailScreen: React.FC<UseDetailScreenProps> = ({ route }) => {
  const screenBottom = useScreenBottomPadding();
  const { getCd, item } = route.params;

  // Dialog
  const { alert, confirm } = useDialog();

  // 결제 건의 가맹점 정보
  const [midInfo, setMidInfo] = useState<IMidInfo>();

  const viewShotRef = useRef<ViewShotRef>(null);

  /**
   * 갤러리 저장 권한은 expo-media-library 로 요청한다 (사진 추가 권한만).
   * 웹에는 네이티브 모듈이 없어 로드 시점에 오류가 나므로 네이티브에서만 지연 로드한다.
   * 기본 진입점은 SDK 57 부터 새 객체형 API 라 별도 네이티브 모듈(ExpoMediaLibraryNext)을 요구하고 Expo Go 에 없다.
   * 권한 요청·저장 두 함수만 쓰므로 예전 API 가 있는 legacy 경로를 쓴다.
   */
  const loadMediaLibrary = () =>
    Platform.OS === 'web' ? null : (require('expo-media-library/legacy') as typeof import('expo-media-library/legacy'));

  const ensureGalleryPermission = async (): Promise<boolean> => {
    const MediaLibrary = loadMediaLibrary();
    if (!MediaLibrary) return false;
    try {
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') return true;
      if (!canAskAgain) {
        const goSettings = await confirm({
          title: '권한 필요',
          message1: '이미지를 저장하려면 사진 접근 권한이 필요합니다.',
          message2: '설정에서 권한을 허용해 주세요.',
          confirmText: '설정으로 이동',
          cancelText: '취소',
        });
        if (goSettings) await Linking.openSettings();
        return false;
      }
      await alert({ title: '권한 필요', message1: '이미지를 저장하려면 사진 접근 권한이 필요합니다.' });
      return false;
    } catch (error) {
      console.log('권한 요청 오류:', error);
      return false;
    }
  };

  /** 저장 API 는 file:// 스킴이 있는 경로를 기대한다. 스킴이 없으면 iOS 에서 메시지 없이 저장에 실패한다 */
  const toFileUri = (pathOrUri: string) => {
    if (pathOrUri.startsWith('file://')) {
      return pathOrUri;
    }
    if (pathOrUri.startsWith('/')) {
      return `file://${pathOrUri}`;
    }
    return pathOrUri;
  };

  // 캡처 파일을 앨범에 저장한다
  const saveToGallery = async (uri: string) => {
    try {
      const fileUri = toFileUri(uri);
      const MediaLibrary = loadMediaLibrary();
      if (!MediaLibrary) throw new Error('web');
      await MediaLibrary.saveToLibraryAsync(fileUri);

      alert({
        title: '저장 완료',
        message1: '이미지가 갤러리에 저장되었습니다.',
      });
    } catch (error) {
      console.log('이미지 저장 실패:', error);

      alert({
        title: '저장 실패',
        message1: '이미지 저장 중 오류가 발생했습니다.',
      });
    }
  };

  const handleSave = async () => {
    // 웹은 갤러리 저장을 지원하지 않아 안내만 띄운다
    if (Platform.OS === 'web') {
      alert({
        title: '앱에서 이용할 수 있어요',
        message1: '이미지 저장은 iOS·Android 앱에서만 지원합니다.',
        message2: '웹에서는 화면 캡처 기능을 이용해 주세요.',
      });
      return;
    }

    try {
      const hasPermission = await ensureGalleryPermission();
      if (!hasPermission) return;

      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (uri) {
          await saveToGallery(uri);
        }
      }
    } catch (error) {
      console.log('저장 실패:', error);

      alert({
        title: '오류',
        message1: '이미지 저장 중 오류가 발생했습니다.',
      });
    }
  };

  useEffect(() => {
    if (item.mid) {
      loadMidInfo(item.mid).then((data) => {
        console.log('조회한 가맹점 정보:', data);

        if (data.resultCd === '0000') {
          setMidInfo(data);
        }
      });
    }
  }, [item.mid]);

  // 거래 시각
  const dateTime =
    getCd === 'USE' || getCd === 'CHRG'
      ? `${item.trDt}${item.trTm}`
      : getCd === 'RFND'
        ? `${item.rfndReqDt}${item.rfndReqTm}`
        : '';

  // 거래 상태명
  const stateNm =
    getCd === 'USE' && item.trxStCd === '0'
      ? '결제'
      : getCd === 'USE' && (item.trxStCd === '1' || item.trxStCd === '2') && item.partCanFlg === '0'
        ? '취소'
        : getCd === 'USE' && item.partCanFlg === '1'
          ? '부분취소'
          : getCd === 'CHRG'
            ? item.chrgStCd === '2'
              ? '충전실패'
              : '충전'
            : getCd === 'RFND' && item.rfndStCd === '0'
              ? '출금요청'
              : getCd === 'RFND' && item.rfndStCd === '1'
                ? '출금성공'
                : getCd === 'RFND' && item.rfndStCd === '2'
                  ? '출금실패'
                  : '';

  // 돈이 움직이지 않은 취소·실패 건만 취소선·회색으로 그린다
  const isStruck = stateNm.includes('취소') || stateNm.includes('실패');

  // 요약 카드 제목/부제
  const summaryTitle =
    getCd === 'USE'
      ? (midInfo?.coNm ?? item.goodsNm)
      : getCd === 'CHRG'
        ? item.chrgPmCdNm
        : getCd === 'RFND'
          ? `${getBankName(item.rfndBankCd)} ${item.rfndAcntNo}`
          : '';
  // 실패 건은 부제 자리에 실패 사유를 보여준다 (예: 승인 거절)
  const summarySub =
    getCd === 'USE' && midInfo?.coNm
      ? item.goodsNm
      : getCd === 'CHRG'
        ? (item.failMsg ?? '')
        : getCd === 'RFND'
          ? (item.failMsg ?? item.rfndAcntNm)
          : '';

  // 금액 (결제/출금은 -, 충전/취소는 +)
  const amount =
    getCd === 'USE' ? item.goodsAmt : getCd === 'CHRG' ? item.chrgAmt : getCd === 'RFND' ? item.rfndAmt : 0;
  const sign = isStruck ? '' : getCd === 'CHRG' ? '+ ' : '- ';

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg}>
      <ScrollView contentContainerStyle={[styles.wrap, screenBottom]}>
        {/* 이미지 저장 - 캡처 영역 밖 */}
        <Pressable style={styles.saveBtn} onPress={handleSave} hitSlop={8}>
          <Icon source="tray-arrow-down" size={18} color={theme.colors.gray600} />
          <Typography mode="caption1" color="gray600">
            이미지 저장
          </Typography>
        </Pressable>

        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.8 }} style={styles.capture}>
          {/* 결제 요약 카드 */}
          <View style={styles.card}>
            <Badge label={stateNm} tone={getTrxTone(stateNm)} size="medium" />

            <View style={styles.summaryTitle}>
              <Typography mode="subtitle2" color="gray900">
                {summaryTitle}
              </Typography>
              {!!summarySub && (
                <Typography mode="body2" color="gray500">
                  {summarySub}
                </Typography>
              )}
            </View>

            <Typography
              mode="heading1"
              color={
                isStruck
                  ? 'gray400'
                  : getTrxAmountColor(getCd === 'CHRG' ? 'charge' : getCd === 'RFND' ? 'refund' : 'pay')
              }
              style={{ textDecorationLine: isStruck ? 'line-through' : 'none' }}>
              {sign}
              {formatWon(amount)}
            </Typography>

            <Typography mode="caption1" color="gray400">
              {formatDateTime(dateTime)}
            </Typography>
          </View>

          {/* 가맹점 정보 - 결제 정보일 때만 보임 */}
          {getCd === 'USE' && midInfo && (
            <View style={styles.card}>
              <Typography mode="subtitle3" color="gray500">
                가맹점 정보
              </Typography>
              <View style={styles.rows}>
                <MidInfo midInfo={midInfo} />
              </View>
            </View>
          )}

          {/* 충전수단 정보 - 충전 정보일 때만 보임 */}
          {getCd === 'CHRG' && (
            <View style={styles.card}>
              <Typography mode="subtitle3" color="gray500">
                충전수단
              </Typography>
              <View style={styles.rows}>
                <ChargeInfo item={item} />
              </View>
            </View>
          )}

          {/* 결제 세부 */}
          <View style={styles.card}>
            <Typography mode="subtitle3" color="gray500">
              {getCd === 'USE' ? '결제 정보' : getCd === 'CHRG' ? '충전 정보' : '출금 정보'}
            </Typography>
            <View style={styles.rows}>
              <PaymentInfo getCd={getCd} dateTime={dateTime} item={item} stateNm={stateNm} />
            </View>
          </View>
        </ViewShot>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topCard, gap: 8 },
  saveBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 4,
  },
  capture: { gap: 12, backgroundColor: theme.colors.bg },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    gap: 12,
    boxShadow: theme.shadow.card,
  },
  summaryTitle: { gap: 2, marginTop: 4 },
  rows: { gap: 12 },
});

export default UseDetailScreen;
export { UseDetailScreen };
