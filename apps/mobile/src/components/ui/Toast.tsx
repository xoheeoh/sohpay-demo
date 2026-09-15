import { create } from 'zustand';
import { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Typography } from './Typography';

type ToastState = { message: string | null; tone: 'info' | 'error'; show: (m: string, tone?: 'info' | 'error') => void; hide: () => void };

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  show: (message, tone = 'info') => set({ message, tone }),
  hide: () => set({ message: null }),
}));

export const toast = {
  info: (m: string) => useToast.getState().show(m, 'info'),
  error: (m: string) => useToast.getState().show(m, 'error'),
};

export function ToastHost() {
  const { message, tone, hide } = useToast();
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [message, hide]);

  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 12 }]}>
      <Animated.View style={[styles.toast, { backgroundColor: tone === 'error' ? colors.danger : colors.text, borderRadius: radius.md }]}>
        <Typography variant="body2" color="textOnDark" align="center">{message}</Typography>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toast: { paddingHorizontal: 18, paddingVertical: 12, maxWidth: 420, marginHorizontal: 20 },
});
