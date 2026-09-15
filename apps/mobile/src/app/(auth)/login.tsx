import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, TextField, Typography, toast } from '@/components/ui';
import { useTheme } from '@/theme';
import { Wordmark } from '@/components/brand/Wordmark';
import { useAuth } from '@/lib/auth/store';
import { messageOf } from '@/lib/errors';
import { useJoinFlow } from '@/lib/flows';

export default function LoginScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const resetJoin = useJoinFlow((s) => s.reset);

  const [mbUid, setMbUid] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!mbUid.trim() || !password) return setError('아이디와 비밀번호를 입력해 주세요.');
    setBusy(true); setError(null);
    try {
      await signIn(mbUid, password);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button title="로그인" onPress={submit} loading={busy} />
          <Button title="회원가입" variant="ghost" onPress={() => { resetJoin(); router.push('/(auth)/join/terms'); }} />
        </>
      }>
      <View style={[styles.hero, { paddingTop: 96, gap: space.sm }]}>
        <Wordmark height={44} />
        <Typography variant="body1" color="textSub">충전하고, 스캔하고, 끝.</Typography>
      </View>

      <View style={{ gap: space.lg }}>
        <TextField
          label="아이디"
          value={mbUid}
          onChangeText={(t) => setMbUid(t.toLowerCase())}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          placeholder="demo01"
          returnKeyType="next"
        />
        <TextField
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          secureToggle
          autoComplete="current-password"
          placeholder="8자 이상"
          returnKeyType="done"
          onSubmitEditing={submit}
          error={error}
        />
      </View>

      <View style={{ height: space.xxl }} />
      <Typography variant="caption" color="textMuted" align="center" onPress={() => toast.info('데모 계정: demo01 / demo1234!  (PIN 123456)')}>
        데모 계정으로 둘러보기
      </Typography>
    </Screen>
  );
}

const styles = StyleSheet.create({ hero: { paddingBottom: 48 } });
