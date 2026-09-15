import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Typography, toast } from '@/components/ui';
import { payments } from '@/lib/api';
import { messageOf } from '@/lib/errors';
import { usePayFlow } from '@/lib/flows';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const onScanned = async (data: string) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const req = await payments.resolvePaymentRequest(data);
      usePayFlow.getState().set({ qrToken: data, request: req, idempotencyKey: null });
      router.replace('/(app)/pay/confirm');
    } catch (e) {
      toast.error(messageOf(e));
      setTimeout(() => { lock.current = false; }, 1500);
    } finally {
      setBusy(false);
    }
  };

  const denied = permission && !permission.granted;

  return (
    <View style={styles.root}>
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={busy ? undefined : ({ data }) => onScanned(data)}
        />
      ) : null}

      <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
            <Typography variant="h2" style={styles.white}>✕</Typography>
          </Pressable>
          <Typography variant="h3" style={styles.white}>QR 결제</Typography>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.center}>
          <View style={styles.frame} />
          <Typography variant="body1" style={[styles.white, { marginTop: 18 }]} align="center">
            {denied ? '카메라 권한이 필요해요' : busy ? '확인 중…' : '가맹점 QR 코드를 비춰 주세요'}
          </Typography>
          {Platform.OS === 'web' ? (
            <Typography variant="caption" style={[styles.dim, { marginTop: 6 }]} align="center">브라우저에서는 카메라 대신 코드 입력을 권장해요</Typography>
          ) : null}
        </View>

        <View style={{ gap: 10 }}>
          {denied ? <Button title="권한 허용" onPress={requestPermission} /> : null}
          <Button title="결제 코드 직접 입력" variant="secondary" onPress={() => router.replace('/(app)/pay/code')} style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingHorizontal: 20, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center' },
  frame: { width: 240, height: 240, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  white: { color: '#fff' },
  dim: { color: 'rgba(255,255,255,0.7)' },
});
