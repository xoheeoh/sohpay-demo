import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, Screen, Skeleton, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { support } from '@/lib/api';
import { keys } from '@/lib/query';

const CATS: Record<string, string> = { CHARGE: '충전', PAYMENT: '결제', REFUND: '환불', ACCOUNT: '계정' };

export default function FaqScreen() {
  const { colors, radius, space } = useTheme();
  const q = useQuery({ queryKey: keys.faqs, queryFn: support.listFaqs });
  const [cat, setCat] = useState<string>('ALL');
  const [open, setOpen] = useState<string | null>(null);
  const rows = (q.data ?? []).filter((f) => cat === 'ALL' || f.category === cat);

  return (
    <Screen>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['ALL', ...Object.keys(CATS)].map((c) => {
            const on = cat === c;
            return (
              <Pressable key={c} onPress={() => setCat(c)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: on ? colors.text : colors.line, backgroundColor: on ? colors.text : colors.surface }}>
                <Typography variant="label" style={{ color: on ? colors.bg : colors.textSub }}>{c === 'ALL' ? '전체' : CATS[c]}</Typography>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ gap: 10 }}>
          {q.isLoading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} height={60} radius={16} />) : rows.map((f) => (
            <Card key={f.id} onPress={() => setOpen(open === f.id ? null : f.id)}>
              <Typography variant="caption" color="primary">{CATS[f.category] ?? f.category}</Typography>
              <Typography variant="h3" style={{ marginTop: 4 }}>{f.question}</Typography>
              {open === f.id ? <Typography variant="body2" color="textSub" style={{ marginTop: 10 }}>{f.answer}</Typography> : null}
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
