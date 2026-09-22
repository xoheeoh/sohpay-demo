import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { theme } from '@styles';

import { typographyStyles } from './Typography';

interface TextareaProps {
  value: string;
  setValue: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const Textarea: React.FC<TextareaProps> = ({ value, setValue, onFocus, onBlur }) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <TextInput
      style={[
        styles.container,
        {
          borderColor: isFocused ? theme.colors.primary : theme.colors.line, // 평소에도 연한 테두리 (다른 입력칸과 동일)
          backgroundColor: isFocused ? 'white' : theme.colors.gray50,
        },
      ]}
      placeholder="내용"
      placeholderTextColor={theme.colors.gray400}
      multiline
      value={value}
      onChangeText={setValue}
      onFocus={() => {
        setIsFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setIsFocused(false);
        onBlur?.();
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    height: 120,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    ...typographyStyles.body2, // 입력 글자는 타입 스케일의 body2 (다른 입력칸과 동일)
    color: theme.colors.gray900,
    textAlignVertical: 'top',
  },
});

export default Textarea;
export { Textarea };
