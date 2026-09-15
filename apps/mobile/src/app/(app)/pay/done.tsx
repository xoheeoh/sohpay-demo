import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { won } from '@/lib/format';
import { dateTimeLabel } from '@/lib/format';
import { usePayFlow } from '@/lib/flows';

export default function PayDoneScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { tx, balance } = useLocalSearchParams<{ tx: string; balance: string }>();
  const req = usePayFlow((s) => s.request);

  const finish = () => { usePayFlow.getState().reset(); router.dismissAll(); router.replace('/(app)/(tabs)'); };

  return (
    <Screen
      footer={
        <>
          <Button title="확인" onPress={finish} />
          <Button title="거래 상세 보기" variant="ghost" onPress={() => { usePayFlow.getState().reset(); router.replace({ pathname: '/(app)/history/[id]', params: { id: tx } }); }} />
        </>
      }>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md }}>
        <Typography variant="display">✅</Typography>
        <Typography variant="h1" align="center">결제가 완료되었어요</Typography>
        {req ? (
          <>
            <Typography variant="display" color="primary">{won(req.amount)}</Typography>
            <Card style={{ alignSelf: 'stretch', gap: 10, marginTop: space.lg }}>
              <Row k="가맹점" v={req.merchant.name} />
              <Row k="상품" v={req.goodsName} />
              <Row k="일시" v={dateTimeLabel(new Date().toISOString())} />
              <Row k="남은 잔액" v={won(Number(balance))} />
            </Card>
          </>
        ) : null}
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
