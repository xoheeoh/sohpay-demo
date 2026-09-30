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
App.tsx           네비게이션 스택·전역 프로바이더(로딩·다이얼로그·토스트)·폰트 로딩
src/
  screens/        화면 (React Navigation native-stack)
  components/     common (디자인 시스템) · dashboard · uselist
  svc/apis/       API 어댑터 — 화면이 기대하는 { resultCd, ... } 응답을 Supabase 호출로 만든다
  svc/contexts/   Dialog · Loading · Navigation 컨텍스트
  svc/storages/   AsyncStorage + 보안 저장소(expo-secure-store)
  styles/         colors · layout · theme
  utils/          포맷터 · 검증 · 결제 콜백 파싱 · 은행 앱 링크
  shims/          Expo 환경 대역 (env, linear-gradient, 웹용 WebView)
```

## 플랫폼 분기와 모듈 선택

Expo 관리형 프로젝트 안에서 iOS · Android · Web 이 한 코드베이스로 돌도록 고른 모듈입니다.

| 용도               | 모듈                                                        | 비고                                                       |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| QR 스캔            | expo-camera                                                 | 웹에서는 카메라 대신 결제코드 직접 입력 경로 제공          |
| 세션·토큰 저장     | expo-secure-store (웹: localStorage)                        | 2KB 제한은 조각 저장으로 처리                              |
| 영수증 이미지 저장 | expo-media-library                                          | 권한 요청과 저장을 한 모듈이 처리. 웹은 미지원 안내        |
| 앱 버전 표시       | expo-application                                            | 스토어 미배포라 현재 버전만 표시                           |
| 그라데이션         | expo-linear-gradient (`src/shims`)                          |                                                            |
| 환경변수           | `EXPO_PUBLIC_*` (`src/shims/env`)                           | 빌드 시 인라인                                             |
| 폰트               | expo-font 런타임 로드                                       | 네이티브 otf, 웹 woff2                                     |
| 결제창 · 본인인증  | react-native-webview (웹: iframe 대역, `src/shims/webview`) | 결과는 양쪽 다 `postMessage`                               |
| API                | Supabase SDK                                                | 화면은 `svc/apis` 어댑터의 `{ resultCd, ... }` 응답만 본다 |
