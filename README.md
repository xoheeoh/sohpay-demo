<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/lockup-dark.png">
    <img src="docs/brand/lockup-light.png" alt="SohPay" width="360">
  </picture>
</p>

충전 · QR 결제 · 환불이 되는 선불 지갑 앱입니다. React Native(Expo) 한 코드베이스로 iOS · Android · Web 에서 동작합니다.

<!-- 배포 후 채우기: 웹 데모 URL, 스크린샷 또는 GIF 3~4장 (홈 / QR 결제 / 충전 결제창 / 이용 내역) -->

| 데모 계정 | 비밀번호 | 결제 비밀번호 |
|---|---|---|
| `demo01` | `demo1234!` | `123456` |

> 실제 금융망·결제대행사·본인인증 기관에는 연결되어 있지 않습니다.
> 결제창, 본인인증, 계좌 인증은 같은 인터페이스를 가진 모의 서버가 응답하며, 실제 돈은 움직이지 않습니다.

---

## 3분 둘러보기

1. **로그인** — `demo01` 로 들어가면 잔액 131,100원과 최근 이용 내역이 보입니다.
2. **결제** — 홈 우측 상단 `데모 가맹점 →` 에서 가맹점과 금액을 고르면 결제 QR 이 발급됩니다.
   `이 코드로 바로 결제해 보기` → 결제 비밀번호 `123456` → 완료. 홈으로 돌아오면 잔액이 줄어 있습니다.
3. **취소** — `내역` 탭에서 방금 결제를 열어 `이 결제 취소하기`. 잔액이 되돌아옵니다.
4. **충전** — 홈 `충전` → 금액 → `가상계좌` → 모의 결제창에서 `결제 승인` / `승인 거절` / `결제 취소` 를 각각 눌러 보면 앱이 세 가지 결과를 어떻게 다르게 처리하는지 볼 수 있습니다.
5. **환불** — `환불` → 계좌가 없다고 안내 → 1원 인증으로 계좌 등록 → 금액 → 비밀번호 → 완료.

다른 기기가 있다면 데모 가맹점의 QR 을 그 기기의 SohPay 로 스캔해 결제할 수도 있습니다.

---

## 화면

| 영역 | 화면 | 눈여겨볼 점 |
|---|---|---|
| 온보딩 | 로그인 → 약관 → 본인인증(웹뷰) → 계정 → 결제 비밀번호 | 아이디 중복을 입력 중 실시간 확인. 인증 결과는 딥링크와 폴링 두 경로로 받아 어느 쪽이 유실돼도 진행됨 |
| 홈 | 잔액 · 최근 이용 내역 · 빠른 진입 | 스켈레톤 로딩, 당겨서 새로고침, 빈 상태 |
| 충전 | 금액 → 수단 → 결제창 → 결과 | 결제창 결과를 서버 상태로만 판단. 딥링크에 실린 값은 화면 전환 신호로만 사용 |
| 결제 | QR 스캔 / 코드 입력 → 확인 → 비밀번호 → 완료 | 확인 화면에서 멱등성 키를 한 번 만들어 비밀번호 재시도가 중복 결제로 이어지지 않음 |
| 내역 | 유형 · 기간 · 취소 필터, 무한 스크롤, 상세, 취소 | 날짜 구분 헤더, 취소 건 취소선 · 뱃지, 부분 취소 표시 |
| 환불 | 계좌 등록(1원 인증) → 금액 → 비밀번호 → 완료 | 대표 계좌 자동 선택, 미등록 시 등록 플로우로 유도 |
| 전체 | 내 정보 · 계좌 관리 · 비밀번호 변경 · 공지 · FAQ · 탈퇴 | 잔액이 남은 상태의 탈퇴 시도는 환불 화면으로 연결 |

---

## 구조

```
sohpay-demo/
  apps/mobile/          앱 (Expo SDK 57 · expo-router · TypeScript)
    src/app/            라우트 = 화면. (auth) / (app) 그룹을 로그인 상태로 전환
    src/components/ui/  Typography · Button · TextField · PinEntry · Keypad · Toast 등 13개
    src/lib/api/        서버 호출을 도메인별 모듈로 분리. 화면은 API 클라이언트를 직접 다루지 않음
    src/lib/errors.ts   서버 오류 코드 → 사용자 문구
    src/theme/          라이트 · 다크 토큰
  docs/api-spec.md      앱이 연동 기준으로 삼은 API 명세
  supabase/             데모용 API 서버 (아래 "범위" 참고)
```

### 기술 선택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Expo · expo-router | 파일 기반 라우팅과 `Stack.Protected` 로그인 가드, 웹 빌드까지 한 설정으로 |
| 서버 상태 | TanStack Query | 잔액 · 내역처럼 여러 화면이 같은 데이터를 보는 구조에서 캐시 무효화 지점이 명확 |
| 클라이언트 상태 | zustand | 세션과 "여러 화면에 걸친 플로우 임시값" 두 가지만 필요해 가볍게 |
| 스타일 | StyleSheet + 디자인 토큰 | 색상은 `useTheme()` 로만 접근. 화면 코드에 hex 값 없음 |
| 세션 저장 | expo-secure-store / localStorage | 네이티브는 Keychain · Keystore(2KB 제한 → 조각 저장), 웹은 localStorage 로 분기 |
| 결제창 | react-native-webview / iframe | 플랫폼 파일(`.web.tsx`)로 분기한 컴포넌트는 이것 하나 |
| QR | expo-camera | 웹에서는 카메라 대신 코드 직접 입력 경로를 함께 제공 |

### 지킨 원칙

**서버가 준 값만 믿는다.** 결제창에서 앱으로 돌아오는 딥링크에 금액 · 상태가 실려 있어도 화면에 쓰지 않습니다.
딥링크는 "결과 화면으로 가라"는 신호로만 쓰고, 보이는 잔액과 상태는 서버에서 다시 읽습니다.

**돈이 움직이는 요청은 재시도해도 한 번만 실행된다.** 결제 · 환불 요청에 멱등성 키를 붙이는데,
그 키를 확인 화면에서 만들어 비밀번호 화면에서 재사용합니다. 비밀번호를 틀려 다시 입력해도 서버는 같은 요청으로 봅니다.

**오류는 코드로 받고, 문구는 앱이 정한다.** `INSUFFICIENT_BALANCE`, `REQUEST_EXPIRED` 같은 코드를
`lib/errors.ts` 한 곳에서 문구로 바꿉니다. 비밀번호 오류는 남은 시도 횟수까지 함께 보여줍니다.

**웹에서도 같은 화면이 깨지지 않는다.** 딥링크 · SecureStore · 카메라 · Alert 처럼 웹에 없는 것은
각각 폴링 · localStorage · 코드 입력 · `confirm` 으로 대체했고, 그 분기는 컴포넌트 안에 있어 화면 코드에는 드러나지 않습니다.

---

## 범위

이 저장소에서 작성한 것은 `apps/mobile` 의 앱 전체입니다 — 화면, 디자인 시스템, 상태 관리, API 연동, 플랫폼 분기, 오류 처리.

`supabase/` 는 앱을 실제로 동작시키기 위한 **데모용 API 서버**입니다. 실무에서는 백엔드 팀이 명세와 함께 제공하는 영역이며,
이 프로젝트에서는 그 역할을 대신할 서버를 AI 도구로 생성해 사용했습니다. 앱은 [`docs/api-spec.md`](docs/api-spec.md) 의
명세만을 기준으로 연동했고, DB 설계와 서버 로직은 이 포트폴리오가 보여주려는 범위에 포함되지 않습니다.
서버 구성은 [`supabase/README.md`](supabase/README.md) 에 별도로 정리되어 있습니다.

---

## 직접 실행하기

Supabase 무료 프로젝트와 Node 20 이상이 필요합니다. Docker 는 필요하지 않습니다.

```bash
# 1. 데모 API 서버
npm install
npm run login
npm run link -- --project-ref <ref>
npm run db:push                 # 스키마 + 시드
npm run config:push             # 이메일 확인 없이 가입되도록
cp supabase/functions/.env.example supabase/functions/.env   # CHECKOUT_SECRET 을 긴 난수로
npm run fn:secrets && npm run fn:deploy
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service_role> npm run seed:demo

# 2. 앱
cd apps/mobile
cp .env.example .env            # URL, anon key
npm install
npm run web                     # 또는 npm run ios / npm run android
```

<details>
<summary>로컬 Docker 스택으로 띄우기</summary>

```bash
npm run db:start                # Docker Desktop 필요
npm run db:test                 # 마이그레이션 + 시드 + 서버 시나리오 테스트
npm run fn:serve
SUPABASE_SERVICE_ROLE_KEY=<db:status 의 service_role key> npm run seed:demo
```
앱 `.env` 에는 `http://127.0.0.1:54321` 과 로컬 anon key 를 넣습니다. 실기기는 127.0.0.1 대신 PC 의 LAN IP.
</details>

---

## 문서

- [`docs/api-spec.md`](docs/api-spec.md) — API 명세와 오류 코드
- [`apps/mobile/README.md`](apps/mobile/README.md) — 앱 폴더 구조와 플랫폼 분기
- [`supabase/README.md`](supabase/README.md) — 데모 API 서버 구성
