# SohPay — 앱 (Expo)

루트 README 의 "직접 실행하기" 절차로 API 서버를 먼저 올린 뒤:

```bash
cd apps/mobile
cp .env.example .env      # SUPABASE URL / anon key 채우기
npm install
npm run web               # 브라우저
npm run ios / android     # 시뮬레이터 (Expo Go 또는 개발 빌드)
```

## 구조

```
src/
  app/            expo-router 라우트 (파일 = 화면)
    (auth)/       로그인 · 회원가입 4단계
    (app)/        로그인 후 영역
      (tabs)/     홈 · 내역 · 전체
      charge/     금액 → 수단 → 결제창 → 결과
      pay/        스캔 → 확인 → PIN → 완료
      refund/     금액 → PIN → 완료
      accounts/   계좌 목록 · 1원 인증 등록
      ...
  components/     ui (디자인 시스템) · dashboard · 플랫폼 분기 컴포넌트
  lib/
    api/          Supabase 호출을 도메인별로 묶음. 화면은 supabase 를 직접 만지지 않는다.
    auth/         세션 스토어 (zustand)
    errors.ts     서버 오류 코드 → 사용자 문구
    flows.ts      여러 화면에 걸친 임시 상태
  theme/          토큰 · ThemeProvider (라이트/다크)
```

## 플랫폼 분기

| 기능 | 네이티브 | 웹 |
|---|---|---|
| 세션 저장 | expo-secure-store (2KB 조각 저장) | localStorage |
| 결제창 | WebView, `sohpay://` 가로채기 | iframe + 서버 상태 폴링 |
| QR 스캔 | expo-camera | 카메라 가능하나 코드 직접 입력을 안내 |
| 확인 대화상자 | Alert | window.confirm |

파일명 `.web.tsx` 로 분기한 컴포넌트는 `CheckoutView` 하나이고, 나머지는 `Platform.OS` 로 처리한다.
