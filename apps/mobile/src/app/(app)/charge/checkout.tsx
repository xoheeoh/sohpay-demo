import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckoutView } from '@/components/CheckoutView';
import { charges } from '@/lib/api';
import { invalidateMoney } from '@/lib/query';

/**
 * 모의 결제창.
 * 결과는 두 경로로 들어온다.
 *   1. 딥링크 sohpay://charge/result?tx=..&status=..  (네이티브 웹뷰가 가로챔)
 *   2. 2초 간격 상태 폴링 — 웹(iframe) 이거나 딥링크가 유실돼도 결과를 놓치지 않는다.
 * 어느 쪽이든 금액은 서버에서 다시 읽는다. URL 파라미터의 값은 신뢰하지 않는다.
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const { tx, url } = useLocalSearchParams<{ tx: string; url: string }>();
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    invalidateMoney();
    router.replace({ pathname: '/(app)/charge/result', params: { tx } });
  };

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const s = await charges.getChargeStatus(tx);
        if (s.status !== 'PENDING') finish();
      } catch { /* 일시 오류는 다음 틱에 재시도 */ }
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx]);

  return (
    <View style={{ flex: 1 }}>
      <CheckoutView url={url} onDeepLink={finish} />
    </View>
  );
}
