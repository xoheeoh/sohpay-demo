import { controlSize, theme } from '@styles';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Animated,
  TextInputProps,
  Platform,
  TouchableOpacity,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { Icon } from 'react-native-paper';

import { typographyStyles } from './Typography';
import { useNotifyInputFocus } from './KeyboardAwareScrollView';

interface AnimatedTextInputProps extends TextInputProps {
  id: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  editable?: boolean;
}

const AnimatedTextInput = React.forwardRef<TextInput, AnimatedTextInputProps>((props, forwardedRef) => {
  const { id, label, value, setValue, placeholder, error, disabled, editable, onFocus, onBlur, ...rest } = props;
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);
  const animatedLabelPosition = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  const notifyInputFocus = useNotifyInputFocus();

  useEffect(() => {
    // 동일 위치에서 다른 필드로 바뀌는 경우 포커스 상태 초기화
    setIsFocused(false);
    inputRef.current?.blur();
  }, [id]);

  useEffect(() => {
    // 초기값이 있으면 라벨을 떠 있는 위치로 바로 옮긴다
    if (value) {
      Animated.timing(animatedLabelPosition, {
        toValue: 1,
        duration: 0, // 즉시 이동
        useNativeDriver: false,
      }).start();
      return;
    }

    // 값이 비어 있고 포커스가 아닐 때는 라벨을 원위치
    if (!isFocused) {
      Animated.timing(animatedLabelPosition, {
        toValue: 0,
        duration: 0, // 즉시 이동
        useNativeDriver: false,
      }).start();
    }
  }, [value, isFocused, animatedLabelPosition]);

  const handleFocus = () => {
    if (disabled || editable === false) return;
    setIsFocused(true);
    notifyInputFocus();
    Animated.timing(animatedLabelPosition, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    if (!value) {
      setIsFocused(false);
      Animated.timing(animatedLabelPosition, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      setIsFocused(false);
    }
  };

  const labelStyle = {
    top: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      // 플랫폼별 폰트 메트릭이 달라 라벨 위치가 다르다. 웹은 <input> 이 세로 중앙 정렬을 하지 않아 styles.input 의 paddingTop 과 함께 맞춘다.
      // iOS 의 자리표시자 위치(17)는 Dropdown 의 body2 글자(줄 높이 20 을 56 안에 중앙 정렬, 중심 28)와 같은 글상자가 되도록 잡은 값이다.
      // top 은 테두리(1) 안쪽 기준이라 (56 - 20) / 2 = 18 에서 1 을 뺀다
      outputRange: Platform.select({ ios: [17, 10], web: [18, 10], default: [20, 10] }) as number[],
    }),
    fontSize: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12],
    }),
    // iOS: 자리표시자일 때는 Dropdown 글자와 같은 줄 높이 20, 위로 떠오르면 자연 높이(12px 글자 약 14.3)로 돌아간다
    ...(Platform.OS === 'ios'
      ? {
          lineHeight: animatedLabelPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 14.5],
          }),
        }
      : null),
  };

  // 기본 gray50 배경 + line 테두리, 포커스 primary, 오류 red. Textarea·SearchBox·Dropdown 과 같은 규칙
  const borderColor = error ? theme.colors.red500 : isFocused ? theme.colors.primary : theme.colors.line;
  const backgroundColor = error
    ? theme.colors.red50
    : editable === false
      ? theme.colors.gray100
      : isFocused
        ? theme.colors.white
        : theme.colors.gray50;

  // 자리표시자 위치의 라벨은 입력값(gray900)과 구분되도록 한 단계 연하게 한다
  const isLabelFloating = isFocused || !!value;
  const labelColor = error
    ? theme.colors.red500
    : isFocused
      ? theme.colors.primary
      : isLabelFloating
        ? theme.colors.gray500
        : theme.colors.gray400;

  const handleClear = () => {
    setValue('');
  };

  return (
    <View style={[styles.inputContainer, { borderColor, backgroundColor }]}>
      <Animated.Text style={[styles.label, labelStyle, { color: labelColor }]}>{label}</Animated.Text>
      <TextInput
        ref={(node) => {
          inputRef.current = node;
          if (!forwardedRef) return;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else forwardedRef.current = node;
        }}
        style={[styles.input, { color: editable === false ? theme.colors.gray400 : theme.colors.gray900 }]}
        onFocus={(e) => {
          handleFocus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          handleBlur();
          onBlur?.(e);
        }}
        value={value}
        onChangeText={setValue}
        placeholder={isFocused ? placeholder : ''}
        editable={!disabled && editable !== false}
        selectTextOnFocus={!disabled && editable !== false}
        {...rest}
      />
      {/* 클리어 버튼 (X) */}
      {value.length > 0 && !disabled && editable !== false && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Icon source="close" size={16} color={theme.colors.gray300} />
        </TouchableOpacity>
      )}
    </View>
  );
});

// forwardRef 컴포넌트는 이름이 자동으로 붙지 않아 개발 도구에 익명으로 나온다
AnimatedTextInput.displayName = 'AnimatedTextInput';

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    borderRadius: controlSize.lg.radius,
    borderWidth: 1,
    height: controlSize.lg.height,
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    flex: 1,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontFamily: 'Pretendard-Medium',
    letterSpacing: -0.2,
    includeFontPadding: false, // 안드로이드는 글자 위아래에 여백을 더 넣어 top 값이 어긋나므로 제거
  },
  input: {
    ...typographyStyles.body2, // SearchBox·Textarea·Dropdown 과 같은 body2
    // iOS 는 한 줄 입력칸이 비어 있을 때는 lineHeight 를 무시하다가 첫 글자부터 적용해 글자가 1~2px 내려앉는다. 줄 높이를 빼면 처음부터 같은 자리에 그려진다
    ...(Platform.OS === 'ios' ? { lineHeight: undefined } : null),
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 12, web: 12, default: 20 }),
    // 웹은 컨테이너 안쪽 높이를 넘으면 어긋나 보이므로 테두리를 뺀 높이로 맞춘다
    height: Platform.OS === 'web' ? controlSize.lg.height - 3 : controlSize.lg.height,
    includeFontPadding: false, // 안드로이드 기본 패딩 제거
    // 브라우저 기본 포커스 outline 을 없앤다. 포커스 표시는 컨테이너 테두리 색이 담당한다.
    // RN 타입에는 없는 값이지만 react-native-web 은 CSS outline-style 로 그대로 넘긴다.
    ...(Platform.OS === 'web'
      ? ({ paddingBottom: 0, outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle)
      : null),
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    width: 22,
    height: 22,
    backgroundColor: theme.colors.gray100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedTextInput;
export { AnimatedTextInput };
