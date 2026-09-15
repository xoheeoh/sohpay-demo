import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: 'bg' | 'surface';
}>;

/**
 * 모든 화면의 바깥 틀.
 * 안전영역, 키보드 회피, 하단 고정 버튼 영역을 한 곳에서 처리한다.
 */
export function Screen({ children, scroll = true, padded = true, footer, style, bg = 'bg' }: Props) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = padded ? { paddingHorizontal: space.xl } : null;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.grow, pad, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.grow, pad, style]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.grow, { backgroundColor: colors[bg] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.lg), backgroundColor: colors[bg] },
          ]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  footer: { paddingTop: 12, gap: 10 },
});
