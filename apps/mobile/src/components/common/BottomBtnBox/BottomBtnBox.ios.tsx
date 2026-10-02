import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, LayoutAnimation, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../PrimaryButton';
import { useBottomBtnBoxPaddingBottom } from './metrics';

export interface BottomBtnBoxProps {
  buttonKey: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
  /** 버튼 뒤 바탕색. 기본 흰색. 회색 배경(theme.colors.bg) 화면에서는 같은 색을 넘겨 버튼 띠가 화면과 한 덩어리로 보이게 한다 */
  backgroundColor?: string;
}

const BottomBtnBox: React.FC<BottomBtnBoxProps> = ({
  buttonKey,
  disabled,
  label,
  onPress,
  backgroundColor = 'white',
}) => {
  const paddingAnim = useRef(new Animated.Value(1)).current; // 1: 기본 padding, 0: 타이트
  const [opacityAnim] = useState(new Animated.Value(1));
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [actualKeyboardHeight, setActualKeyboardHeight] = useState<number>(0);
  const insets = useSafeAreaInsets();
  const paddingBottom = useBottomBtnBoxPaddingBottom();

  useEffect(() => {
    const frameSub = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
      const screenHeight = Dimensions.get('window').height;
      const keyboardTop = event.endCoordinates.screenY;
      const newHeight = screenHeight - keyboardTop;

      // 키보드가 완전히 내려갔을 때
      if (newHeight <= 0) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);

        Animated.timing(paddingAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();

        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();
      } else {
        // 키보드가 올라오거나 높이가 변경될 때
        setKeyboardVisible(true);
        setActualKeyboardHeight(newHeight);

        Animated.timing(paddingAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();

        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      frameSub.remove();
    };
  }, []);

  const containerStyle: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    backgroundColor,
    // 상자는 안전 영역 안쪽에 있으므로 키보드 높이에서 안전 영역을 뺀 만큼만 올린다. 홈 버튼 기종은 안전 영역이 0 이다
    // 키보드 프레임이 소수점으로 오면 상자 아랫변이 픽셀 사이에 걸리므로 정수로 맞춘다.
    // 상자와 키보드 사이에 보이는 1px 밝은 선은 iOS 키보드 자체의 윗변 경계선이라 앱에서 없앨 수 없다
    bottom: keyboardVisible ? Math.round(actualKeyboardHeight - insets.bottom) : 0,
    width: '100%',
    paddingHorizontal: paddingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 16],
    }),
    paddingBottom: paddingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, paddingBottom],
    }),
    paddingTop: paddingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 16],
    }),
    opacity: opacityAnim,
  };

  return (
    <Animated.View style={containerStyle}>
      <PrimaryButton
        key={buttonKey}
        disabled={disabled}
        label={label}
        onPress={onPress}
        size={'lg'}
        keyboardVisible={keyboardVisible}
      />
    </Animated.View>
  );
};

export default BottomBtnBox;
