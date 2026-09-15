import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Screen, Skeleton, Typography } from '@/components/ui';
import { useTheme } from '@/theme';
import { support } from '@/lib/api';
import { keys } from '@/lib/query';
import { dateLabel } from '@/lib/format';

export default function NoticesScreen() {
  const { space } = useTheme();
  const q = useQuery({ queryKey: keys.notices, queryFn: support.listNotices });
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Screen>
      <View style={{ paddingTop: space.lg, gap: 10 }}>
        {q.isLoading ? [0, 1, 2].map((i) => <Skeleton key={i} height={72} radius={16} />) : (q.data ?? []).map((n) => (
          <Card key={n.id} onPress={() => setOpen(open === n.id ? null : n.id)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {n.is_pinned ? <Badge label="중요" tone="primary" /> : null}
              <Typography variant="caption" color="textMuted">{dateLabel(n.published_at)}</Typography>
            </View>
            <Typography variant="h3" style={{ marginTop: 6 }}>{n.title}</Typography>
            {open === n.id ? <Typography variant="body2" color="textSub" style={{ marginTop: 10 }}>{n.body}</Typography> : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
