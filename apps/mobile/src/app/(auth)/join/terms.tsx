import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Screen, Skeleton, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { support, type Term } from '@/lib/api';
import { keys } from '@/lib/query';
import { useJoinFlow } from '@/lib/flows';

function Check({ on }: { on: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.check, { borderColor: on ? colors.primary : colors.lineStrong, backgroundColor: on ? colors.primary : 'transparent' }]}>
      {on ? <Typography variant="caption" style={{ color: colors.onPrimary, fontWeight: '800' }}>✓</Typography> : null}
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();
  const { colors, space, radius } = useTheme();
  const setFlow = useJoinFlow((s) => s.set);
  const { data: terms, isLoading } = useQuery({ queryKey: keys.terms, queryFn: support.listTerms });

  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);

  const required = useMemo(() => (terms ?? []).filter((t) => t.is_required), [terms]);
  const allRequired = required.length > 0 && required.every((t) => agreed[t.code]);
  const all = (terms ?? []).length > 0 && (terms ?? []).every((t) => agreed[t.code]);

  const toggleAll = () => {
    const next = !all;
    setAgreed(Object.fromEntries((terms ?? []).map((t) => [t.code, next])));
  };

  const next = () => {
    setFlow({ agreedRequired: true, marketing: !!agreed.MARKETING });
    router.push('/(auth)/join/identity');
  };

  return (
    <Screen footer={<Button title="동의하고 계속" disabled={!allRequired} onPress={next} />}>
      <View style={{ paddingTop: space.lg, gap: space.sm, marginBottom: space.xxl }}>
        <Typography variant="h1">서비스 이용을 위해{'\n'}약관에 동의해 주세요</Typography>
      </View>

      {isLoading ? (
        <View style={{ gap: 14 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={22} />)}</View>
      ) : (
        <View style={{ gap: space.xs }}>
          <Pressable onPress={toggleAll} style={[styles.allRow, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
            <Check on={all} />
            <Typography variant="h3">전체 동의</Typography>
          </Pressable>

          {(terms ?? []).map((t: Term) => (
            <View key={t.code}>
              <View style={styles.row}>
                <Pressable onPress={() => setAgreed((a) => ({ ...a, [t.code]: !a[t.code] }))} style={styles.rowMain} hitSlop={6}>
                  <Check on={!!agreed[t.code]} />
                  <Typography variant="body1">
                    <Typography variant="body1" color={t.is_required ? 'primary' : 'textMuted'}>{t.is_required ? '[필수] ' : '[선택] '}</Typography>
                    {t.title}
                  </Typography>
                </Pressable>
                <Pressable onPress={() => setOpen(open === t.code ? null : t.code)} hitSlop={8}>
                  <Typography variant="label" color="textMuted">{open === t.code ? '접기' : '보기'}</Typography>
                </Pressable>
              </View>
              {open === t.code ? (
                <View style={[styles.body, { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm }]}>
                  <Typography variant="body2" color="textSub">{t.body}</Typography>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { padding: 14, marginBottom: 6 },
});
