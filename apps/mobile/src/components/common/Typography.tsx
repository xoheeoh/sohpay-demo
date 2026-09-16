import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { theme } from '@styles';

interface TypographyProps extends TextProps {
  mode?:
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'subtitle1'
    | 'subtitle2'
    | 'subtitle3'
    | 'subtitle4'
    | 'caption1'
    | 'caption2'
    | 'body1'
    | 'body2';
  color?: keyof typeof theme.colors;
}

const Typography: React.FC<TypographyProps> = ({ style, mode = 'body1', color = 'gray900', children, ...rest }) => {
  const modeStyle = styles[mode] as TextStyle;
  const colorStyle = { color: theme.colors[color] } as TextStyle;

  return (
    <Text style={[modeStyle, colorStyle, style]} {...rest} lineBreakStrategyIOS={'hangul-word'}>
      {children}
    </Text>
  );
};

/**
 * 타입 스케일 (Pretendard)
 * heading: 화면 타이틀·금액 강조 / subtitle: 소제목·버튼·리스트 제목 / body: 본문 / caption: 보조 정보
 */
const styles = StyleSheet.create({
  heading1: { fontFamily: 'Pretendard-Bold', fontSize: 28, lineHeight: 36, letterSpacing: -0.6 },
  heading2: { fontFamily: 'Pretendard-Bold', fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  heading3: { fontFamily: 'Pretendard-Bold', fontSize: 20, lineHeight: 28, letterSpacing: -0.4 },
  subtitle1: { fontFamily: 'Pretendard-SemiBold', fontSize: 18, lineHeight: 26, letterSpacing: -0.3 },
  subtitle2: { fontFamily: 'Pretendard-SemiBold', fontSize: 16, lineHeight: 24, letterSpacing: -0.2 },
  subtitle3: { fontFamily: 'Pretendard-SemiBold', fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  subtitle4: { fontFamily: 'Pretendard-SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: -0.1 },
  body1: { fontFamily: 'Pretendard-Regular', fontSize: 16, lineHeight: 24, letterSpacing: -0.2 },
  body2: { fontFamily: 'Pretendard-Regular', fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  caption1: { fontFamily: 'Pretendard-Regular', fontSize: 12, lineHeight: 16, letterSpacing: -0.1 },
  caption2: { fontFamily: 'Pretendard-Medium', fontSize: 11, lineHeight: 14, letterSpacing: 0 },
});

export default Typography;
export { Typography };
