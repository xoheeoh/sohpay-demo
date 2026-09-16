import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet } from 'react-native';

import { Typography } from '@components/common';
import { theme } from '@styles';

interface BottomAmtBtnProps {
  add: (value: number) => void;
  /**
   * 기존 화면 호환용. 전달되지 않으면 내부에서 키보드 이벤트를 구독해 자동 처리함.
   * (화면별 키보드 state 제거를 위한 리팩터링)
   */
  keyboardHeight?: number;
  keyboardVisible?: boolean;
  keyboardWillHide?: boolean;
}
const BottomAmtBtn: React.FC<BottomAmtBtnProps> = ({ add, keyboardHeight, keyboardVisible, keyboardWillHide }) => {
  const buttons = [
    { label: '+1만', value: 10000 },
    { label: '+5만', value: 50000 },
    { label: '+10만', value: 100000 },
    { label: '+100만', value: 1000000 },
  ];

  const bottomAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [internalKeyboardVisible, setInternalKeyboardVisible] = useState(false);
  const [internalKeyboardWillHide, setInternalKeyboardWillHide] = useState(false);
  const [internalKeyboardHeight, setInternalKeyboardHeight] = useState(0);

  const effectiveKeyboardVisible = keyboardVisible ?? internalKeyboardVisible;
  const effectiveKeyboardWillHide = keyboardWillHide ?? internalKeyboardWillHide;
  const effectiveKeyboardHeight = keyboardHeight ?? internalKeyboardHeight;

  // 화면에서 키보드 상태를 넘기지 않으면 내부에서 자동으로 추적
  useEffect(() => {
    if (keyboardVisible !== undefined || keyboardWillHide !== undefined || keyboardHeight !== undefined) return;

    const willHideSub = Keyboard.addListener('keyboardWillHide', () => {
      setInternalKeyboardWillHide(true);
    });
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setInternalKeyboardVisible(true);
      setInternalKeyboardWillHide(false);
      // iOS/Android 모두 키보드 상단에 정확히 붙도록 높이를 사용
      setInternalKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setInternalKeyboardVisible(false);
      setInternalKeyboardHeight(0);
      setInternalKeyboardWillHide(false);
    });

    return () => {
      willHideSub.remove();
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight, keyboardVisible, keyboardWillHide]);

  const targetBottom = useMemo(() => {
    // iOS: 키보드 위 + 약간 여유, Android: 키보드 위 + BottomBtnBox 높이 정도 여유
    // Android에서도 키보드 높이를 더해줘야(특히 adjustPan 환경) 키보드에 가려지지 않음.
    return Platform.OS === 'ios' ? effectiveKeyboardHeight + 14 : effectiveKeyboardHeight + 48;
  }, [effectiveKeyboardHeight]);

  useEffect(() => {
    // 키패드가 완전히 나타났을 때만 fadeIn
    if (effectiveKeyboardVisible && !effectiveKeyboardWillHide) {
      // bottom 위치를 즉시 설정
      bottomAnim.setValue(targetBottom);

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }

    // 키패드가 닫히기 시작하면 즉시 fadeOut
    if (effectiveKeyboardWillHide) {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }

    // 키패드가 완전히 사라졌을 때
    if (!effectiveKeyboardVisible && !effectiveKeyboardWillHide) {
      opacityAnim.setValue(0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKeyboardHeight, effectiveKeyboardVisible, effectiveKeyboardWillHide, targetBottom]);

  return (
    <Animated.View
      // 키보드가 없을 때는 투명하게 숨겨져 있으므로 아래 요소(하단 버튼)의 터치를 가로채지 않게 한다
      pointerEvents={effectiveKeyboardVisible && !effectiveKeyboardWillHide ? 'auto' : 'none'}
      style={[
        styles.btnBox,
        {
          bottom: bottomAnim,
          opacity: opacityAnim,
          zIndex: 1000,
        },
      ]}>
      {buttons.map((btn) => (
        <Pressable key={btn.label} style={styles.amtButton} onPress={() => add(btn.value)}>
          <Typography mode="subtitle3" color="primary">
            {btn.label}
          </Typography>
        </Pressable>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btnBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray150,
    padding: 16,
    gap: 24,
    backgroundColor: 'white',
  },
  amtButton: {
    paddingHorizontal: 14,
    height: 36,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomAmtBtn;
export { BottomAmtBtn };
