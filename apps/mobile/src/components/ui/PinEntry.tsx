import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { Keypad } from './Keypad';
import { PinDots } from './PinDots';
import { Typography } from './Typography';

type Props = {
  title: string;
  subtitle?: string;
  error?: string | null;
  /** 6자리가 채워지면 호출. 처리 중엔 다시 호출되지 않는다. */
  onComplete: (pin: string) => Promise<void> | void;
  busy?: boolean;
};

/** PIN 입력 화면 본문. 결제·환불·설정 어디서든 같은 모양을 쓴다. */
export function PinEntry({ title, subtitle, error, onComplete, busy }: Props) {
  const { space } = useTheme();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (pin.length === 6 && !busy) {
      Promise.resolve(onComplete(pin)).finally(() => setPin(''));
    }
  }, [pin, busy, onComplete]);

  useEffect(() => {
    if (error) setPin('');
  }, [error]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.top, { gap: space.sm }]}>
        <Typography variant="h1" align="center">{title}</Typography>
        {subtitle ? <Typography variant="body2" color="textSub" align="center">{subtitle}</Typography> : null}
        <View style={{ height: space.xxxl }} />
        <PinDots filled={pin.length} error={!!error} />
        <View style={{ minHeight: 24, marginTop: space.md }}>
          {error ? <Typography variant="body2" color="danger" align="center">{error}</Typography> : null}
        </View>
      </View>
      <Keypad
        shuffle
        onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
        onDelete={() => setPin((p) => p.slice(0, -1))}
        onClear={() => setPin('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between', paddingBottom: 8 },
  top: { paddingTop: 40, alignItems: 'center' },
});
