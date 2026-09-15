import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, TextField, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useJoinFlow } from '@/lib/flows';

const ID_RE = /^[a-z0-9_]{6,20}$/;

export default function AccountScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const flow = useJoinFlow();

  const [mbUid, setMbUid] = useState(flow.mbUid);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);

  // 아이디 중복 확인 (입력 멈추고 400ms 뒤)
  useEffect(() => {
    setAvailable(null);
    if (!ID_RE.test(mbUid)) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('is_mb_uid_available', { p_mb_uid: mbUid });
      setAvailable(!!(data as { available?: boolean } | null)?.available);
    }, 400);
    return () => clearTimeout(t);
  }, [mbUid]);

  const idError = mbUid && !ID_RE.test(mbUid) ? '영문 소문자·숫자·밑줄 6~20자' : available === false ? '이미 사용 중인 아이디예요' : null;
  const pwError = pw && pw.length < 8 ? '8자 이상 입력해 주세요' : null;
  const pw2Error = pw2 && pw !== pw2 ? '비밀번호가 서로 달라요' : null;
  const valid = ID_RE.test(mbUid) && available === true && pw.length >= 8 && pw === pw2;

  const next = () => {
    flow.set({ mbUid, password: pw });
    router.push('/(auth)/join/pin');
  };

  return (
    <Screen footer={<Button title="다음" disabled={!valid} onPress={next} />}>
      <View style={{ paddingTop: space.lg, gap: space.sm, marginBottom: space.xxl }}>
        <Typography variant="h1">로그인에 사용할{'\n'}계정을 만들어 주세요</Typography>
        {flow.identity ? <Typography variant="body2" color="textSub">{flow.identity.name}님, 인증이 완료되었습니다.</Typography> : null}
      </View>
      <View style={{ gap: space.lg }}>
        <TextField
          label="아이디"
          value={mbUid}
          onChangeText={(t) => setMbUid(t.toLowerCase().trim())}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="영문 소문자, 숫자 6~20자"
          error={idError}
          helper={available ? '사용할 수 있는 아이디예요' : undefined}
        />
        <TextField label="비밀번호" value={pw} onChangeText={setPw} secureTextEntry secureToggle placeholder="8자 이상" error={pwError} autoComplete="new-password" />
        <TextField label="비밀번호 확인" value={pw2} onChangeText={setPw2} secureTextEntry placeholder="한 번 더 입력" error={pw2Error} autoComplete="new-password" />
      </View>
    </Screen>
  );
}
