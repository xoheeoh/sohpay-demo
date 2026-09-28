import { useEffect, useState } from 'react';
import { Animated, DimensionValue, Easing, StyleSheet, ViewStyle } from 'react-native';

import { theme } from '@styles';

interface SkeletonProps {
  /** 가로 크기. 숫자(px) 또는 '100%' 같은 비율 */
  width?: DimensionValue;
  /** 세로 크기 (px) */
  height?: number;
  /** 모서리 반경. 원을 만들려면 height 의 절반을 넘긴다 */
  radius?: number;
  style?: ViewStyle;
}

/**
 * 스켈레톤(자리표시자): 데이터를 불러오는 동안 내용이 들어올 자리를 회색 막대로 미리 보여준다.
 * 조회가 끝나기 전에 "없음" 화면이 잠깐 보이는 깜빡임을 막는 용도. 천천히 밝아지고 어두워지는 애니메이션이 돈다.
 */
const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, radius = theme.radius.sm, style }) => {
  // 애니메이션 값은 한 번만 만들어 재사용한다 (렌더 중 ref 를 읽지 말라는 lint 규칙 때문에 useRef 대신 useState 초기화 함수를 쓴다)
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, { width, height, borderRadius: radius, opacity }, style]} />;
};

const styles = StyleSheet.create({
  base: { backgroundColor: theme.colors.gray100 },
});

export default Skeleton;
export { Skeleton };
