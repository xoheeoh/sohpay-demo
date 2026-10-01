import React, { useCallback, useEffect } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { goToLogin } from '@utils/navigationHelpers';
import { removeData, removeEncryptedToken } from '@storages/asyncStorage';
import {
  BottomBtnBox,
  useBottomBtnBoxHeight,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  KeyboardAwareScrollView,
  ScreenWrapper,
  SuccessAnimation,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';

type WithdrawalSucScreenProps = NativeStackScreenProps<RootStackParamList, 'WithdrawalSuc'>;

/**
 * 하단 버튼 상자가 스크롤 영역 위에 떠 있어 단순 가운데 정렬은 아래로 치우쳐 보이므로,
 * 버튼 위 영역 기준으로 가운데를 맞추기 위한 추가 아래 여백.
 */
const CENTERING_LIFT = 24;

/** 탈퇴로 처리된 내용과 안내 */
const NOTES = [
  {
    icon: 'shield-check-outline',
    title: '계정이 탈퇴 처리되었어요',
    desc: '이 아이디로는 더 이상 로그인할 수 없어요. 거래 기록은 관련 법령에 따라 5년 보관 후 파기됩니다.',
  },
  {
    icon: 'account-plus-outline',
    title: '다시 이용하고 싶다면 새로 가입해 주세요',
    desc: '같은 본인인증 정보로 다시 가입할 수 있습니다.',
  },
];

const WithdrawalSucScreen: React.FC<WithdrawalSucScreenProps> = ({ navigation }) => {
  const centeringExtraBottomPadding = useBottomBtnBoxHeight() - BOTTOM_BTN_BOX_KEYBOARD_INSET + CENTERING_LIFT;
  // 탈퇴한 계정의 토큰과 저장된 아이디를 지운다
  useEffect(() => {
    const fetchData = async () => {
      await removeEncryptedToken();
      await removeData('mbUid');
      await removeData('uid');
      await removeData('idSave');
    };

    fetchData();
  }, []);

  // 완료 화면에서는 뒤로가기를 막고 로그인 화면으로 보낸다
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false,
      });

      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return true;
      };

      // 웹에는 BackHandler 가 없어(콘솔 오류) 앱에서만 등록한다
      if (Platform.OS === 'web') return;
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
        extraBottomPadding={centeringExtraBottomPadding}>
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

        {/* 결과 숫자가 없는 화면이라 결제·출금 완료의 강조 카드 대신 조용한 안내 카드를 쓴다 */}
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
  // 아래 여백은 KeyboardAwareScrollView 가 덮어쓰므로 extraBottomPadding 으로 보정한다
  container: { paddingHorizontal: 16, paddingVertical: 24, gap: 50, flexGrow: 1, justifyContent: 'center' },

  hero: { gap: 12, alignItems: 'center' },
  // Lottie 그림 안의 투명 여백(위 28px, 아래 35px)을 음수 여백으로 상쇄해 보이는 그림 기준으로 정렬한다
  animation: { marginTop: -28, marginBottom: -32 },

  // 웹은 프레임이 700px 까지 넓어지므로 카드를 휴대폰 폭 정도로 제한한다
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
