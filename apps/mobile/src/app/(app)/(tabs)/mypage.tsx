import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ListRow, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { useAuth } from '@/lib/auth/store';
import { queryClient } from '@/lib/query';

export default function MyPageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, space } = useTheme();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);

  const logout = () => {
    const run = async () => { await signOut(); queryClient.clear(); };
    if (Platform.OS === 'web') return void (globalThis.confirm?.('로그아웃할까요?') && run());
    Alert.alert('로그아웃', '로그아웃할까요?', [{ text: '취소', style: 'cancel' }, { text: '로그아웃', style: 'destructive', onPress: run }]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.lg }}>
      <Typography variant="h1">전체</Typography>

      <Card onPress={() => router.push('/(app)/settings/profile')}>
        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Typography variant="h2" color="primary">{profile?.name?.[0] ?? '?'}</Typography>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h3">{profile?.name}</Typography>
            <Typography variant="caption" color="textMuted">@{profile?.mb_uid}</Typography>
          </View>
          <Typography variant="body1" color="textMuted">›</Typography>
        </View>
      </Card>

      <Card padded={false} style={{ paddingHorizontal: 18 }}>
        <ListRow title="계좌 관리" subtitle="환불·충전 계좌 등록" onPress={() => router.push('/(app)/accounts')} chevron />
        <ListRow title="결제 비밀번호 변경" onPress={() => router.push('/(app)/settings/pin')} chevron />
        <ListRow title="환불 신청" onPress={() => router.push('/(app)/refund')} chevron divider={false} />
      </Card>

      <Card padded={false} style={{ paddingHorizontal: 18 }}>
        <ListRow title="공지사항" onPress={() => router.push('/(app)/support/notices')} chevron />
        <ListRow title="자주 묻는 질문" onPress={() => router.push('/(app)/support/faq')} chevron />
        <ListRow title="데모 가맹점 (QR 발급)" subtitle="포스기 대신 결제 QR을 만들어 봅니다" onPress={() => router.push('/(app)/demo/qr')} chevron divider={false} />
      </Card>

      <Card padded={false} style={{ paddingHorizontal: 18 }}>
        <ListRow title="로그아웃" onPress={logout} divider={false} />
      </Card>

      <Typography variant="caption" color="textMuted" align="center">
        SohPay는 포트폴리오용 데모입니다. 실제 금융거래가 발생하지 않습니다.
      </Typography>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
