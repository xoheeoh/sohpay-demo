import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, LayoutAnimation, UIManager, ViewStyle } from 'react-native';
import PrimaryButton from '../PrimaryButton';
import { BottomBtnBoxProps } from './BottomBtnBox.ios';

const BottomBtnBox: React.FC<BottomBtnBoxProps> = ({ buttonKey, disabled, label, onPress }) => {
  const paddingAnim = useRef(new Animated.Value(1)).current; // 1: 기본 padding, 0: 타이트
  const [opacityAnim] = useState(new Animated.Value(1)); // 초기값: 보임
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false); // 키패드 존재 여부

  // 안드로이드 LayoutAnimation 설정
  useEffect(() => {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const didShowSub = Keyboard.addListener('keyboardDidShow', (event) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);

      const keyboardHeight = event.endCoordinates?.height ?? 0;
      Animated.parallel([
        Animated.timing(bottomAnim, {
          toValue: keyboardHeight,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(paddingAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    });

    const didHideSub = Keyboard.addListener('keyboardDidHide', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);

      Animated.parallel([
        Animated.timing(bottomAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(paddingAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => {
      didShowSub.remove();
      didHideSub.remove();
    };
  }, [bottomAnim, opacityAnim, paddingAnim]);

  const containerStyle: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    bottom: bottomAnim,
    width: '100%',
    backgroundColor: 'white',
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
