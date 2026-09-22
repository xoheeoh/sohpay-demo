import { theme } from '@styles';
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

  useEffect(() => {
    // 동일 위치에서 다른 필드로 바뀌는 경우 포커스 상태 초기화
    setIsFocused(false);
    inputRef.current?.blur();
  }, [id]);

  useEffect(() => {
    // value가 초기값으로 존재하면, 라벨 위치를 포커스 상태로 업데이트
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
    if (disabled || editable === false) return; // disabled 상태이거나 editable이 false인 경우 포커스 허용x
    setIsFocused(true);
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
      setIsFocused(false); // 값을 유지하면서 blur 상태로 전환
    }
  };

  const labelStyle = {
    top: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      // 비포커스 / 포커스 라벨 위치. 플랫폼별 폰트 메트릭이 달라 값이 다르다.
      // 웹은 <input> 이 텍스트를 세로 중앙 정렬하지 않으므로 아래 styles.input 의 paddingTop 과 함께 맞춘다.
      outputRange: Platform.select({ ios: [16, 10], web: [18, 10], default: [8, -1] }) as number[],
    }),
    fontSize: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 12], // 비포커스(fontSize=14), 포커스(fontSize=12)
    }),
  };

  // 기본은 채워진(gray50) 박스 + 연한 테두리(line), 포커스 시 primary 테두리, 오류 시 red 테두리 + 연한 red 배경
  // 입력칸 테두리 색은 Textarea·SearchBox·Dropdown 과 같은 theme.colors.line 을 쓴다
  const borderColor = error ? theme.colors.red500 : isFocused ? theme.colors.primary : theme.colors.line;
  const backgroundColor = error
    ? theme.colors.red50
    : editable === false
      ? theme.colors.gray100
      : isFocused
        ? theme.colors.white
        : theme.colors.gray50;

  // 클리어 버튼 클릭 이벤트
  const handleClear = () => {
    setValue(''); // 입력값 초기화
  };

  return (
    <View style={[styles.inputContainer, { borderColor, backgroundColor }]}>
      <Animated.Text
        style={[
          styles.label,
          labelStyle,
          { color: error ? theme.colors.red500 : isFocused ? theme.colors.primary : theme.colors.gray500 },
        ]}>
        {label}
      </Animated.Text>
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
        {...rest} // TextInputProps 확장을 위한 나머지 props 전달
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

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 56,
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
  },
  input: {
    ...typographyStyles.body2, // 입력 글자는 타입 스케일의 body2 (SearchBox·Textarea·Dropdown 과 동일)
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 12, web: 12, default: 20 }),
    // 컨테이너(56) 안에 테두리 1.5px 이 있어 안쪽 높이는 53. 웹은 넘치면 어긋나 보이므로 53 으로 맞춘다.
    height: Platform.OS === 'web' ? 53 : 56,
    includeFontPadding: false, // 안드로이드 기본 패딩 제거
    // 브라우저 기본 포커스 외곽선(outline)을 없앤다. 포커스 표시는 컨테이너 테두리 색(primary)이 담당한다.
    // RN 타입에는 'none' 이 없지만 react-native-web 은 CSS outline-style 로 그대로 넘긴다.
    ...(Platform.OS === 'web'
      ? ({ paddingBottom: 0, outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle)
      : null),
  },
  clearButton: {
    position: 'absolute',
    right: 16, // 우측 끝에 위치
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
