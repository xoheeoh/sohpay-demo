import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function AppLayout() {
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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="charge/amount" options={{ title: '충전' }} />
      <Stack.Screen name="charge/method" options={{ title: '충전 수단' }} />
      <Stack.Screen name="charge/checkout" options={{ title: '결제창', presentation: 'modal' }} />
      <Stack.Screen name="charge/result" options={{ headerShown: false, gestureEnabled: false }} />

      <Stack.Screen name="pay/scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="pay/code" options={{ title: '결제 코드 입력' }} />
      <Stack.Screen name="pay/confirm" options={{ title: '결제 확인' }} />
      <Stack.Screen name="pay/pin" options={{ title: '' }} />
      <Stack.Screen name="pay/done" options={{ headerShown: false, gestureEnabled: false }} />

      <Stack.Screen name="refund/index" options={{ title: '환불' }} />
      <Stack.Screen name="refund/pin" options={{ title: '' }} />
      <Stack.Screen name="refund/done" options={{ headerShown: false, gestureEnabled: false }} />

      <Stack.Screen name="history/[id]" options={{ title: '거래 상세' }} />

      <Stack.Screen name="accounts/index" options={{ title: '계좌 관리' }} />
      <Stack.Screen name="accounts/add" options={{ title: '계좌 등록' }} />

      <Stack.Screen name="settings/pin" options={{ title: '결제 비밀번호 변경' }} />
      <Stack.Screen name="settings/profile" options={{ title: '내 정보' }} />

      <Stack.Screen name="support/notices" options={{ title: '공지사항' }} />
      <Stack.Screen name="support/faq" options={{ title: '자주 묻는 질문' }} />

      <Stack.Screen name="demo/qr" options={{ title: '데모 가맹점 (QR 발급)' }} />
    </Stack>
  );
}
