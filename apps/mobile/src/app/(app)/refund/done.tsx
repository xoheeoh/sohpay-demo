import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { won } from '@/lib/format';
import { bankOf } from '@/lib/banks';

export default function RefundDoneScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { amount, balance, bank, acct } = useLocalSearchParams<{ amount: string; balance: string; bank: string; acct: string }>();

  return (
    <Screen footer={<Button title="확인" onPress={() => { router.dismissAll(); router.replace('/(app)/(tabs)'); }} />}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md }}>
        <Typography variant="display">💸</Typography>
        <Typography variant="h1" align="center">환불을 신청했어요</Typography>
        <Typography variant="display" color="primary">{won(Number(amount))}</Typography>
        <Card style={{ alignSelf: 'stretch', gap: 10, marginTop: space.lg }}>
          <Row k="입금 계좌" v={`${bankOf(bank).name} ${acct}`} />
          <Row k="남은 잔액" v={won(Number(balance))} />
          <Row k="예상 입금" v="영업일 기준 1일 이내" />
        </Card>
      </View>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Typography variant="body2" color="textSub">{k}</Typography>
      <Typography variant="body1" weight="600">{v}</Typography>
    </View>
  );
}
