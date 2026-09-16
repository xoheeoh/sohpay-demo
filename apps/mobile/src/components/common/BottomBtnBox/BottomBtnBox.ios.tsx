import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, LayoutAnimation, ViewStyle } from 'react-native';
import PrimaryButton from '../PrimaryButton';

export interface BottomBtnBoxProps {
  buttonKey: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
}

const BottomBtnBox: React.FC<BottomBtnBoxProps> = ({ buttonKey, disabled, label, onPress }) => {
  const paddingAnim = useRef(new Animated.Value(1)).current; // 1: 기본 padding, 0: 타이트
  const [opacityAnim] = useState(new Animated.Value(1)); // 초기값: 보임
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false); // 키패드 존재 여부
  const [actualKeyboardHeight, setActualKeyboardHeight] = useState<number>(0);

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
    backgroundColor: 'white',
    bottom: keyboardVisible ? actualKeyboardHeight - 34 : 0,
    width: '100%',
    paddingHorizontal: paddingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 16],
    }),
    paddingBottom: paddingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 24],
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
        size={'large'}
        keyboardVisible={keyboardVisible}
      />
    </Animated.View>
  );
};

export default BottomBtnBox;
