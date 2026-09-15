import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  helper?: string;
  right?: React.ReactNode;
  secureToggle?: boolean;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, helper, right, secureToggle, secureTextEntry, style, onFocus, onBlur, ...rest },
  ref
) {
  const { colors, radius, type } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  const border = error ? colors.danger : focused ? colors.primary : colors.line;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Typography variant="label" color="textSub" style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <View
        style={[
          styles.box,
          { borderColor: border, backgroundColor: colors.surface, borderRadius: radius.md },
        ]}>
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[type.body1, styles.input, { color: colors.text }, style]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8} accessibilityRole="button">
            <Typography variant="label" color="textSub">{hidden ? '표시' : '숨김'}</Typography>
          </Pressable>
        ) : right}
      </View>
      {error ? (
        <Typography variant="caption" color="danger" style={styles.helper}>{error}</Typography>
      ) : helper ? (
        <Typography variant="caption" color="textMuted" style={styles.helper}>{helper}</Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, paddingVertical: 0, height: '100%' },
  helper: { marginLeft: 2 },
});
