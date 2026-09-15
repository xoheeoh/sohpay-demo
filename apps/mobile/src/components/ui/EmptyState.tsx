import { StyleSheet, View } from 'react-native';
import { Typography } from './Typography';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.wrap}>
      <Typography variant="h3" color="textSub" align="center">{title}</Typography>
      {body ? <Typography variant="body2" color="textMuted" align="center">{body}</Typography> : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { paddingVertical: 56, alignItems: 'center', gap: 6 } });
