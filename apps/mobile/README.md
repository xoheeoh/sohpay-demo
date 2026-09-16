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

## Expo 이식 시 바뀐 것

| 원본 | 이 앱 | 이유 |
|---|---|---|
| react-native-vision-camera | expo-camera | Expo 관리형 프로젝트에서 바로 동작 |
| react-native-encrypted-storage | expo-secure-store (웹: localStorage) | 동일 역할, 2KB 제한은 조각 저장으로 처리 |
| @react-native-camera-roll + react-native-permissions | expo-media-library | 권한 요청과 저장을 한 모듈이 처리 |
| react-native-device-info / version-check | expo-application | 스토어 미배포라 현재 버전만 표시 |
| react-native-linear-gradient | expo-linear-gradient (shim) | 같은 API |
| react-native-dotenv `@env` | `EXPO_PUBLIC_*` (shim) | Expo 환경변수 규칙 |
| 네이티브 폰트 링크 | expo-font 런타임 로드 | |
| axios + 단일 엔드포인트 | Supabase SDK | 화면 코드는 응답 모양이 같아 그대로 |

웹에서는 WebView 가 iframe 대역으로 동작하고(`src/shims/webview`), 카메라 대신 결제코드 직접 입력을 안내합니다.
