import React, { useCallback, useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { goToLogin } from '@utils/navigationHelpers';
import { removeData, removeEncryptedToken } from '@storages/asyncStorage';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_HEIGHT,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type WithdrawalSucScreenProps = NativeStackScreenProps<RootStackParamList, 'WithdrawalSuc'>;

/**
 * 내용을 "버튼 위 영역"의 가운데에 놓기 위한 추가 아래 여백 (출금·충전·결제·회원가입 완료 화면과 같은 계산).
 * 하단 버튼 상자는 화면 위에 떠 있어 스크롤 영역이 그 뒤까지 이어지므로, 그냥 가운데 정렬하면 아래로 치우쳐 보인다.
 */
const CENTERING_EXTRA_BOTTOM_PADDING = BOTTOM_BTN_BOX_HEIGHT - BOTTOM_BTN_BOX_KEYBOARD_INSET + 24;

/** 탈퇴로 처리된 내용과 안내 */
const NOTES = [
  {
    icon: 'shield-check-outline',
    title: '회원정보·결제정보·계좌정보가 폐기되었어요',
    desc: '복구할 수 없으며, 이 아이디로는 더 이상 로그인할 수 없습니다.',
  },
  {
    icon: 'account-plus-outline',
    title: '다시 이용하고 싶다면 새로 가입해 주세요',
    desc: '같은 본인인증 정보로 다시 가입할 수 있습니다.',
  },
];

const WithdrawalSucScreen: React.FC<WithdrawalSucScreenProps> = ({ navigation }) => {
  // 저장되어 있던 회원 정보 삭제
  useEffect(() => {
    const fetchData = async () => {
      await removeEncryptedToken(); // 암호화된 토큰 삭제
      await removeData('mbUid');
      await removeData('uid');
      await removeData('idSave');
    };

    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false, // 제스처 뒤로가기 방지
      });

      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }], // 무조건 'Login' 화면으로 이동
        });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => {
        subscription.remove();
      };
    }, [navigation]),
  );

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}
        extraBottomPadding={CENTERING_EXTRA_BOTTOM_PADDING}>
        {/* 체크 애니메이션 → 완료 문구. 다른 완료 화면과 같은 애니메이션으로 톤을 맞춘다 */}
        <View style={styles.hero}>
          <SuccessAnimation size={160} style={styles.animation} />

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Typography mode="heading3" color="gray900">
              회원 탈퇴가 완료되었어요
            </Typography>
            <Typography mode="body2" color="gray600" style={{ textAlign: 'center' }}>
              그동안 SohPay를 이용해 주셔서 감사합니다.{'\n'}확인을 누르면 로그인 화면으로 이동합니다.
            </Typography>
          </View>
        </View>

        {/* 처리 내용 안내 카드. 결과 숫자가 없는 화면이라 결제·출금 완료의 유리판 카드 대신 조용한 안내 카드를 쓴다 */}
        <View style={styles.noteCard}>
          {NOTES.map((note, index) => (
            <View key={note.title} style={[layout.rowCenter, styles.noteRow, index > 0 && styles.noteDivider]}>
              <View style={styles.noteIcon}>
                <Icon source={note.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Typography mode="subtitle3" color="gray900">
                  {note.title}
                </Typography>
                <Typography mode="caption1" color="gray500">
                  {note.desc}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox buttonKey={'confirm'} disabled={false} label={'확인'} onPress={() => goToLogin(navigation)} />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // 세로 가운데 정렬. 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 extraBottomPadding 으로 보정한다.
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // Lottie 그림은 상자 안에 위 28px, 아래 35px 투명 여백을 두고 그려지므로 음수 여백으로 상쇄해 보이는 그림 기준으로 정렬한다
  animation: { marginTop: -28, marginBottom: -32 },

  // 웹은 프레임이 700px 까지 넓어져 카드가 너무 커 보인다. 다른 완료 화면 카드와 같은 폭으로 제한하고 가운데에 둔다.
  noteCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
  },
  noteRow: { gap: 12, paddingVertical: 14, alignItems: 'flex-start' },
  noteDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray150 },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WithdrawalSucScreen;
export { WithdrawalSucScreen };
