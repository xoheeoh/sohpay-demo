import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import * as Application from 'expo-application';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { loadMarketingOptIn, updateMarketingOptIn } from '@apis/commonApi';
import { Badge, ScreenWrapper, Skeleton, ToggleSwitch, Typography } from '@components/common';
import { layout, theme } from '@styles';

type SettingScreenProps = NativeStackScreenProps<RootStackParamList, 'Setting'>;

const SettingScreen: React.FC<SettingScreenProps> = () => {
  const { alert, confirm } = useDialog();

  // 스토어에 배포되지 않은 데모 앱이라 최신 버전 조회 없이 현재 버전만 보여준다. 웹은 네이티브 버전이 없어 0.1.0
  const currentVersion = Application.nativeApplicationVersion ?? '0.1.0';

  const handleCheckUpdate = () => {
    confirm({
      title: '업데이트 확인',
      message1: '현재 최신 버전을 사용하고 있어요.',
      message2: '데모 앱은 스토어에 배포되어 있지 않아 업데이트가 제공되지 않습니다.',
      confirmText: '확인',
    });
  };

  // 회원가입 때 받은 마케팅 수신 동의. null 이면 조회 전이라 스위치 자리에 자리표시자를 보여준다
  const [marketingOptIn, setMarketingOptIn] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMarketingOptIn().then((data) => {
      if (data.resultCd === '0000') {
        setMarketingOptIn(!!data.optIn);
      } else {
        console.log('마케팅 수신 동의 조회 실패:', data.resultMsg);
        setMarketingOptIn(false);
      }
    });
  }, []);

  const handleToggleMarketing = async (next: boolean) => {
    if (isSaving) return;
    const prev = marketingOptIn;
    setMarketingOptIn(next); // 먼저 바꿔 보이고, 실패하면 되돌린다
    setIsSaving(true);

    const data = await updateMarketingOptIn(next);
    setIsSaving(false);

    if (data.resultCd !== '0000') {
      setMarketingOptIn(prev);
      alert({
        title: '저장 실패',
        message1: '수신 동의 설정을 저장하지 못했습니다.',
        message2: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg}>
      <ScrollView contentContainerStyle={styles.wrap}>
        {/* 앱 정보 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            앱 정보
          </Typography>

          <View style={styles.card}>
            <View style={[layout.rowBetween, styles.row]}>
              <View style={[layout.rowCenter, { gap: 12 }]}>
                <View style={styles.appIcon}>
                  <Icon source="wallet" size={22} color="white" />
                </View>
                <View style={{ gap: 2 }}>
                  <Typography mode="subtitle2" color="gray900">
                    SohPay
                  </Typography>
                  <Typography mode="body2" color="gray500">
                    버전 {currentVersion}
                  </Typography>
                </View>
              </View>
              <Badge label="최신 버전" tone="blue" />
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [layout.rowBetween, styles.row, styles.rowDivider, pressed && styles.pressed]}
              onPress={handleCheckUpdate}>
              <Typography mode="subtitle2" color="gray900">
                업데이트 확인
              </Typography>
              <Icon source="chevron-right" size={20} color={theme.colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            알림 설정
          </Typography>

          {/* 항목이 하나뿐이라 카드로 감싸지 않고 제목 아래에 바로 둔다 */}
          <View style={[layout.rowBetween, styles.plainRow]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography mode="subtitle2" color="gray900">
                마케팅 정보 수신 동의
              </Typography>
              <Typography mode="caption1" color="gray500">
                이벤트·혜택 소식 수신에 동의합니다. 데모 앱에서는 실제 알림을 보내지 않아요.
              </Typography>
            </View>

            {marketingOptIn === null ? (
              <Skeleton width={51} height={31} radius={16} />
            ) : (
              <ToggleSwitch
                value={marketingOptIn}
                onValueChange={handleToggleMarketing}
                disabled={isSaving}
                accessibilityLabel="마케팅 정보 수신 동의"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topForm, paddingBottom: theme.screen.bottom, gap: 24 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
  },
  row: { paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  // 카드 밖에 놓는 줄. 카드 안 글자와 같은 선에 맞추기 위해 좌우 여백을 sectionTitle 과 같게 둔다
  plainRow: { paddingHorizontal: 4, paddingVertical: 6, gap: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray100 },
  pressed: { backgroundColor: theme.colors.gray50 },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingScreen;
export { SettingScreen };
