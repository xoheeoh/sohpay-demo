import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, TextField, Typography, toast } from '@/components/ui';
import { BankBadge } from '@/components/BankBadge';
import { useTheme } from '@/theme';
import { accounts } from '@/lib/api';
import type { VerifyStart } from '@/lib/api/accounts';
import { BANKS } from '@/lib/banks';
import { messageOf } from '@/lib/errors';
import { keys, queryClient } from '@/lib/query';
import { useAuth } from '@/lib/auth/store';

type Step = 'input' | 'code';

/**
 * 1원 인증.
 *  1) 은행·계좌·예금주 입력 → 서버가 1원을 보내며 입금자명에 3자리 코드를 붙인다(모의)
 *  2) 사용자가 통장에서 확인한 코드 입력 → 등록
 * 데모라 서버가 코드를 같이 알려주며, 화면에 그대로 띄운다.
 */
export default function AddAccountScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const { purpose = 'REFUND' } = useLocalSearchParams<{ purpose?: 'REFUND' | 'CHARGE' }>();
  const profile = useAuth((s) => s.profile);

  const [step, setStep] = useState<Step>('input');
  const [bankCode, setBankCode] = useState(BANKS[0].code);
  const [accountNo, setAccountNo] = useState('');
  const [holder, setHolder] = useState(profile?.name ?? '');
  const [code, setCode] = useState('');
  const [started, setStarted] = useState<VerifyStart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true); setError(null);
    try {
      const res = await accounts.startAccountVerify({ bankCode, accountNo, holderName: holder.trim() });
      setStarted(res);
      setStep('code');
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!started) return;
    setBusy(true); setError(null);
    try {
      await accounts.confirmAccountVerify({ verificationId: started.verificationId, code });
      await accounts.registerBankAccount(started.verificationId, purpose, true);
      queryClient.invalidateQueries({ queryKey: keys.bankAccounts });
      toast.info('계좌를 등록했어요');
      router.back();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'code' && started) {
    return (
      <Screen footer={<Button title="인증 완료" onPress={confirm} loading={busy} disabled={code.length !== 3} />}>
        <View style={{ paddingTop: space.lg, gap: space.xl }}>
          <View style={{ gap: space.sm }}>
            <Typography variant="h1">입금자명의 숫자 3자리를{'\n'}입력해 주세요</Typography>
            <Typography variant="body2" color="textSub">{started.bankName} {started.accountNo} 계좌로 1원을 보냈어요. 통장 입금 내역에서 입금자명을 확인하세요.</Typography>
          </View>

          <Card style={{ gap: 6, backgroundColor: colors.primarySoft, borderColor: 'transparent' }}>
            <Typography variant="caption" color="primary">통장에 찍힌 입금자명 (데모라 여기 보여드려요)</Typography>
            <Typography variant="h2" color="primary">{started.depositorName}</Typography>
          </Card>

          <TextField label="숫자 3자리" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" placeholder="000" error={error} autoFocus />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="1원 보내기" onPress={start} loading={busy} disabled={accountNo.replace(/\D/g, '').length < 10 || holder.trim().length < 2} />}>
      <View style={{ paddingTop: space.lg, gap: space.xl }}>
        <Typography variant="h1">{purpose === 'REFUND' ? '환불 받을' : '충전에 사용할'}{'\n'}계좌를 등록해 주세요</Typography>

        <View style={{ gap: 8 }}>
          <Typography variant="label" color="textSub">은행</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {BANKS.map((b) => {
              const on = b.code === bankCode;
              return (
                <Pressable key={b.code} onPress={() => setBankCode(b.code)} style={[styles.bank, { borderRadius: radius.md, borderColor: on ? colors.primary : colors.line, backgroundColor: on ? colors.primarySoft : colors.surface }]}>
                  <BankBadge code={b.code} size={28} />
                  <Typography variant="caption" color={on ? 'primary' : 'textSub'}>{b.name}</Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <TextField label="계좌번호" value={accountNo} onChangeText={(t) => setAccountNo(t.replace(/[^\d-]/g, ''))} keyboardType="number-pad" placeholder="'-' 없이 숫자만" />
        <TextField label="예금주" value={holder} onChangeText={setHolder} placeholder="본인 명의 계좌만 등록할 수 있어요" error={error} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ bank: { alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1.5, minWidth: 76 } });
