import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from 'react-native-paper';

import { Typography } from './Typography';
import { theme } from '@styles';

type InfoBoxTone = 'gray' | 'yellow';

interface InfoBoxProps {
  /** 안내 문구. 문자열이면 기본 글자 모양으로, 직접 꾸민 요소를 넘겨도 된다 */
  children: ReactNode;
  /** gray: 일반 안내 / yellow: 주의가 필요한 안내 */
  tone?: InfoBoxTone;
  /** 아이콘 이름 (react-native-paper / MaterialCommunityIcons). 기본은 정보 아이콘 */
  icon?: string;
  style?: ViewStyle;
}

const TONES: Record<InfoBoxTone, { bg: keyof typeof theme.colors; icon: keyof typeof theme.colors }> = {
  gray: { bg: 'gray50', icon: 'gray600' },
  yellow: { bg: 'yellow50', icon: 'yellow700' },
};

/**
 * 안내 상자: 연한 배경 위에 [아이콘 + 짧은 안내 문구].
 * 계좌인증·권한 안내·탈퇴 안내 등 화면마다 따로 그리던 상자를 한 모양으로 맞춘다.
 * 아이콘은 첫 줄 글자 높이에 맞춰 두어 여러 줄 문구에서도 위로 뜨지 않는다.
 */
const InfoBox: React.FC<InfoBoxProps> = ({ children, tone = 'gray', icon = 'information-outline', style }) => {
  const colors = TONES[tone];

  return (
    <View style={[styles.box, { backgroundColor: theme.colors[colors.bg] }, style]}>
      <View style={styles.icon}>
        <Icon source={icon} size={18} color={theme.colors[colors.icon]} />
      </View>
      {typeof children === 'string' ? (
        <Typography mode="caption1" color="gray600" style={styles.text}>
          {children}
        </Typography>
      ) : (
        <View style={styles.text}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: theme.radius.md,
  },
  // caption1 의 첫 줄 높이(16)에 아이콘 가운데를 맞춘다
  icon: { height: 16, justifyContent: 'center' },
  text: { flex: 1 },
});

export default InfoBox;
export { InfoBox };
