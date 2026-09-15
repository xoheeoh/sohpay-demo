import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

type Props = {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onClear?: () => void;
  /** PIN 입력처럼 배열을 섞어야 할 때 */
  shuffle?: boolean;
  leftKey?: { label: string; onPress: () => void };
};

function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function Keypad({ onDigit, onDelete, onClear, shuffle, leftKey }: Props) {
  const { colors, radius } = useTheme();

  const digits = useMemo(() => {
    const d = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    if (!shuffle) return d;
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }, [shuffle]);

  const rows = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)];

  const Key = ({ label, onPress, muted }: { label: string; onPress: () => void; muted?: boolean }) => (
    <Pressable
      accessibilityRole="keyboardkey"
      accessibilityLabel={label}
      onPress={() => { tap(); onPress(); }}
      onLongPress={label === '⌫' ? onClear : undefined}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: pressed ? colors.keypadPressed : colors.keypad, borderRadius: radius.md },
      ]}>
      <Typography variant="h1" color={muted ? 'textSub' : 'text'} weight="600">{label}</Typography>
    </Pressable>
  );

  return (
    <View style={styles.pad}>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          {r.map((d) => <Key key={d} label={d} onPress={() => onDigit(d)} />)}
        </View>
      ))}
      <View style={styles.row}>
        {leftKey ? <Key label={leftKey.label} onPress={leftKey.onPress} muted /> : <View style={styles.key} />}
        <Key label={digits[9]} onPress={() => onDigit(digits[9])} />
        <Key label="⌫" onPress={onDelete} muted />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center' },
});
