import { useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, ListRow, PinEntry, Screen, TextField, Typography, toast } from '@/components/ui';
import { useTheme } from '@/theme';
import { profile as profileApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/store';
import { messageOf } from '@/lib/errors';
import { queryClient } from '@/lib/query';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, space } = useTheme();
  const { profile, reloadProfile, signOut } = useAuth();
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [marketing, setMarketing] = useState(!!profile?.marketing_opt_in);
  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [wdError, setWdError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    try {
      await profileApi.updateProfile({ phone: phone || null, marketing_opt_in: marketing });
      await reloadProfile();
      toast.info('저장했어요');
    } catch (e) { toast.error(messageOf(e)); }
    finally { setBusy(false); }
  };

  const askWithdraw = () => {
    if (Platform.OS === 'web') return void (globalThis.confirm?.('정말 탈퇴할까요? 잔액이 남아 있으면 탈퇴할 수 없어요.') && setWithdrawing(true));
    Alert.alert('회원 탈퇴', '정말 탈퇴할까요?\n잔액이 남아 있으면 탈퇴할 수 없어요.', [{ text: '취소', style: 'cancel' }, { text: '탈퇴 진행', style: 'destructive', onPress: () => setWithdrawing(true) }]);
  };

  if (withdrawing) {
    return (
      <Screen scroll={false}>
        <PinEntry
          title="탈퇴하려면 비밀번호를 입력해 주세요"
          error={wdError}
          onComplete={async (pin) => {
            try {
              await profileApi.withdrawMember(pin);
              await signOut();
              queryClient.clear();
            } catch (e) {
              setWdError(messageOf(e));
              const code = (e as { code?: string }).code;
              if (code === 'BALANCE_REMAINING') setTimeout(() => { setWithdrawing(false); router.push('/(app)/refund'); }, 1500);
            }
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="저장" onPress={save} loading={busy} />}>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <Card style={{ gap: 4 }}>
          <Typography variant="caption" color="textMuted">이름 · 아이디</Typography>
          <Typography variant="h3">{profile?.name}  <Typography variant="body2" color="textSub">@{profile?.mb_uid}</Typography></Typography>
          {profile?.birth_date ? <Typography variant="caption" color="textMuted">생년월일 {profile.birth_date}</Typography> : null}
        </Card>

        <TextField label="휴대폰 번호" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="010-0000-0000" />

        <Card padded={false} style={{ paddingHorizontal: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }}>
            <View>
              <Typography variant="body1">마케팅 정보 수신</Typography>
              <Typography variant="caption" color="textMuted">데모용 · 실제 발송 없음</Typography>
            </View>
            <Switch value={marketing} onValueChange={setMarketing} trackColor={{ true: colors.primary }} />
          </View>
        </Card>

        <Card padded={false} style={{ paddingHorizontal: 18 }}>
          <ListRow title="회원 탈퇴" subtitle="잔액을 모두 환불한 뒤 진행할 수 있어요" onPress={askWithdraw} divider={false} valueColor="danger" value="›" />
        </Card>
      </View>
    </Screen>
  );
}
