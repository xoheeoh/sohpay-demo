import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="join/terms" options={{ title: '회원가입' }} />
      <Stack.Screen name="join/identity" options={{ title: '본인인증' }} />
      <Stack.Screen name="join/account" options={{ title: '계정 정보' }} />
      <Stack.Screen name="join/pin" options={{ title: '결제 비밀번호' }} />
    </Stack>
  );
}
