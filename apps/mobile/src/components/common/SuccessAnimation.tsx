import { useCallback, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import checkSuccess from '@images/animation/checksuccess.json';

interface SuccessAnimationProps {
  /** 정사각형 한 변의 길이(px). Lottie 파일 안쪽에 여백이 있어 체크 표시는 이보다 작게 보인다. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * 성공 화면 공용 체크 애니메이션 (ID/PW 찾기 성공, 탈퇴 완료 등).
 *
 * LottieView 를 직접 쓰지 않고 감싼 이유
 *  1) 웹: lottie-react-native 의 웹 구현은 style 을 무시하고 webStyle 만 읽는다. 크기를 둘 다 넘겨야 웹에서도 보인다.
 *  2) 재생: autoPlay 를 나중에 true 로 바꾸는 방식은 웹에서 재생이 시작되지 않는다.
 *     처음부터 autoPlay 를 켜 두고, 화면에 다시 들어올 때만 ref 로 처음부터 다시 재생한다.
 */
export function SuccessAnimation({ size = 96, style }: SuccessAnimationProps) {
  const animationRef = useRef<LottieView>(null);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      // 첫 진입은 autoPlay 가 재생한다. 뒤로 갔다가 다시 들어온 경우에만 처음부터 다시 재생
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      animationRef.current?.reset();
      animationRef.current?.play();
    }, []),
  );

  return (
    <View style={[{ width: size, height: size, alignSelf: 'center' }, style]}>
      <LottieView
        ref={animationRef}
        source={checkSuccess}
        autoPlay
        loop={false}
        style={{ width: size, height: size }}
        webStyle={{ width: size, height: size }}
      />
    </View>
  );
}

export default SuccessAnimation;
