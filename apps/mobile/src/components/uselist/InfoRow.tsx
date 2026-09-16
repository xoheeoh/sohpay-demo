import { ReactNode } from 'react';
import { StyleSheet, TextStyle, View } from 'react-native';

import { Typography } from '@components/common';
import { theme } from '@styles';

interface InfoRowProps {
  label: string;
  value: ReactNode;
  emphasis?: boolean; // 합계 등 강조 행
  valueStyle?: TextStyle;
}

/** 상세내역 카드 안의 "라벨 — 값" 한 줄 (영수증 형태로 값은 우측 정렬) */
const InfoRow: React.FC<InfoRowProps> = ({ label, value, emphasis = false, valueStyle }) => {
  return (
    <View style={[styles.row, emphasis && styles.emphasisRow]}>
      <Typography mode="body2" color="gray500" style={styles.label}>
        {label}
      </Typography>
      <Typography
        mode={emphasis ? 'subtitle2' : 'body2'}
        color="gray900"
        style={[styles.value, valueStyle]}
        numberOfLines={2}>
        {value}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  emphasisRow: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
  },
  label: { width: 96, flexShrink: 0 },
  value: { flex: 1, textAlign: 'right' },
});

export default InfoRow;
export { InfoRow };
