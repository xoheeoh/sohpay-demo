<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/lockup-dark.png">
    <img src="docs/brand/lockup-light.png" alt="SohPay" width="360">
  </picture>
</p>

충전 · QR 결제 · 환불이 되는 선불 지갑 앱입니다. React Native(Expo) 한 코드베이스로 iOS · Android · Web 에서 동작합니다.

<!-- 배포 후 채우기: 웹 데모 URL, 스크린샷 또는 GIF 3~4장 (홈 / QR 결제 / 충전 결제창 / 이용 내역) -->

## 데모 계정

바로 로그인해 볼 수 있는 계정입니다. 두 계정 모두 잔액 225,500원과 최근 3개월치 샘플 거래 내역이 들어 있습니다.

| 아이디 | 비밀번호 | 간편 비밀번호(PIN) | 용도 |
|---|---|---|---|
| `demo01` | `demo1234!` | `123456` | 기본 체험용 |
| `demo02` | `demo1234!` | `654321` | 다른 사람이 `demo01` 을 쓰고 있을 때 쓸 두 번째 계정 |

- 간편 비밀번호는 결제·출금·충전 확인 단계에서 입력합니다. 5회 틀리면 10분간 잠깁니다.
- 회원가입도 실제로 동작합니다. 본인인증 화면은 모의 화면이라 아무 이름·생년월일·번호를 넣어도 통과합니다.
- 결제 체험용 QR 은 아래 [데모 QR](#데모-qr) 에 있습니다.
- 데모 데이터는 예고 없이 초기화될 수 있습니다.

> 실제 금융망·결제대행사·본인인증 기관에는 연결되어 있지 않습니다.
> 결제창, 본인인증, 계좌 인증은 같은 인터페이스를 가진 모의 서버가 응답하며, 실제 돈은 움직이지 않습니다.

---

## 3분 둘러보기

1. **로그인** — `demo01` 로 들어가면 잔액 225,500원과 최근 이용 내역이 보입니다.
2. **결제** — 홈의 `결제하기` 로 카메라를 켜고 아래 데모 QR 중 하나를 스캔합니다. 가맹점·금액을 확인하고
   간편 비밀번호 `123456` 을 입력하면 결제가 끝나고, 홈으로 돌아오면 잔액이 줄어 있습니다.
   웹 브라우저처럼 카메라가 없는 환경에서는 `결제코드 직접 입력` 에 QR 아래의 숫자 코드를 넣으면 같은 흐름입니다.
3. **이용내역** — 홈 `최근 이용 내역` 또는 마이페이지 `이용내역 조회` 에서 기간·거래 종류·상태로 필터링하고,
   건을 눌러 영수증 형태의 상세를 보거나 이미지로 저장할 수 있습니다.
4. **충전** — 홈 `충전` → 계좌이체 → 금액 → 간편 비밀번호 → 모의 결제창. `결제 승인` / `승인 거절` / `결제 취소` 를
   각각 눌러 보면 앱이 세 가지 결과를 어떻게 다르게 처리하는지 볼 수 있습니다.
5. **출금** — 홈 `출금` → 금액 → 계좌 확인 → 간편 비밀번호 → 완료. 계좌가 없으면 1원 인증 화면으로 안내됩니다.
   모의 인증이라 "입금된 1원의 입금자명" 토스트에 인증번호 3자리가 함께 표시됩니다.

### 데모 QR

앱의 카메라로 스캔하는 결제 QR 입니다. 실제 서비스의 QR 은 5분 뒤 만료되고 한 번만 쓸 수 있지만,
아래 세 개는 포트폴리오용으로 만료되지 않고 몇 번이든 결제할 수 있게 열어 두었습니다. 결제마다 새 거래가 만들어집니다.

| 연남동 커피로스터스 · 4,500원 | 합정 편의점 24 · 12,400원 | 이태원 라멘야 · 13,500원 |
|:---:|:---:|:---:|
| <img src="docs/demo/qr-cafe.png" width="200" alt="데모 QR - 연남동 커피로스터스 4,500원"> | <img src="docs/demo/qr-store.png" width="200" alt="데모 QR - 합정 편의점 24 12,400원"> | <img src="docs/demo/qr-ramen.png" width="200" alt="데모 QR - 이태원 라멘야 13,500원"> |
| 결제코드 `20260001` | 결제코드 `20260003` | 결제코드 `20260007` |

---

## 화면

| 영역 | 화면 | 눈여겨볼 점 |
|---|---|---|
| 온보딩 | 권한 안내 → 로그인 → 약관 → 본인인증(웹뷰) · 회원정보 → 간편 비밀번호 설정·확인 | 아이디 중복확인 버튼, 비밀번호 규칙 실시간 검증. 본인인증 결과는 웹뷰 `postMessage` 로 받고, 웹에서는 iframe 대역이 같은 메시지를 흘려 줌 |
| 홈 | 잔액 · 충전/출금 바로가기 · 결제하기 · 최근 이용 내역 | 당겨서 새로고침, 5건 단위 더보기, 빈 상태 |
| 결제 | QR 스캔 / 결제코드 입력 → 결제 정보 확인 → 간편 비밀번호 → 완료 | 간편 비밀번호는 한 번만 검증해 결제 요청에 재사용. 멱등성 키는 QR 해석 시 서버가 발급해 PIN 재시도가 이중 결제로 이어지지 않음 |
| 충전 | 수단 → 금액 → 간편 비밀번호 → 결제창(웹뷰) → 결과 | 결제창 결과는 `postMessage` 로 받되 화면에 쓰는 값은 서버에서 다시 조회. 승인·거절·취소 세 결과를 각각 처리 |
| 이용내역 | 기간 · 거래 종류 · 상태 필터, 무한 스크롤, 상세(영수증) | 상태 배지, 취소 건 취소선, 상세를 이미지로 저장(`react-native-view-shot` + `expo-media-library`) |
| 출금 | 금액 → 계좌 확인 → 간편 비밀번호 → 완료 | 계좌 미등록 시 1원 인증 등록 플로우로 유도, 잔액 전액 입력, 출금 후 잔액 미리 표시 |
| 마이페이지 | 회원정보 · 간편 비밀번호 변경 · 계좌 관리 · 약관 · 고객센터(공지·FAQ·1:1 문의) · 설정 · 탈퇴 | 탈퇴는 잔액이 남아 있으면 막고 출금으로 안내 |

---

## 구조

```
sohpay-demo/
  apps/mobile/                  앱 (Expo SDK 57 · React Native 0.86 · TypeScript)
    App.tsx                     네비게이션 스택(React Navigation native-stack) · 전역 프로바이더 · 폰트 로딩
    src/screens/                화면 51개 — Login · Join · Find · Dashboard(Charge · Payment · Refund · Use) · MyPage · Pin
    src/components/common/      디자인 시스템 — Typography · Button 3종 · TextField · Dropdown · BottomSheet · PopupModal · Badge · PinPad …
    src/components/dashboard/   홈 전용 (잔액 카드 · 결제 버튼 · 은행 선택 · 거래 행)
    src/components/uselist/     이용내역 전용 (거래 행 · 필터 시트 · 상세 정보 행)
    src/svc/apis/               API 어댑터 — 화면이 기대하는 { resultCd, resultMsg, ... } 응답을 만들어 준다
    src/svc/contexts/           Dialog · Loading · Navigation 컨텍스트
    src/svc/storages/           AsyncStorage + 보안 저장소(expo-secure-store / 웹 localStorage)
    src/styles/                 디자인 토큰 — 색(시맨틱 + 스케일) · radius · space · shadow · 다크 토큰
    src/shims/                  플랫폼 대역 — env · linear-gradient · 웹용 WebView(iframe)
  docs/api-spec.md              앱이 연동 기준으로 삼은 API 명세
  docs/demo/                    README 용 데모 QR
  supabase/                     데모용 API 서버 (아래 "범위" 참고)
```

### 기술 선택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Expo (managed) | 원본 RN CLI 프로젝트를 네이티브 모듈 변경 없이 iOS · Android · Web 한 코드베이스로. 바꾼 모듈은 [`apps/mobile/README.md`](apps/mobile/README.md) 에 표로 정리 |
| 네비게이션 | React Navigation native-stack | 화면 51개를 하나의 스택으로. 헤더는 공통 `Header` 컴포넌트로 교체해 디자인 통제 |
| API 연동 | 어댑터 계층 (`svc/apis`) | 서버가 바뀌어도 화면은 원래 응답 계약(`resultCd`)만 보도록 격리. 화면 코드에 API 클라이언트가 등장하지 않음 |
| 스타일 | `StyleSheet` + 디자인 토큰 | 색은 `theme.colors.<key>` 또는 `Typography color="<key>"` 로만. 화면 코드에 hex 값 없음 |
| 폰트 | Pretendard (OFL) | 네이티브는 otf, 웹은 절반 용량의 woff2 를 `Platform` 분기로 로드 |
| 세션 저장 | expo-secure-store / localStorage | 네이티브는 Keychain · Keystore, 웹은 localStorage 로 분기 |
| 결제창 · 본인인증 | react-native-webview / iframe 대역 | 웹에서만 `.web.tsx` 로 갈라지는 컴포넌트는 이것 하나. 결과는 양쪽 다 `postMessage` |
| QR | expo-camera | 웹에서는 카메라 대신 결제코드 직접 입력 경로를 함께 제공 |

### 지킨 원칙

**화면은 서버를 모른다.** 원본 앱이 사내 API 에 맞춰 쓰던 화면 코드를 그대로 두고, `svc/apis` 어댑터가 같은 응답 모양을 만들어
줍니다. 덕분에 서버를 통째로 바꿨는데도 화면 쪽 변경은 거의 없었고, 명세가 바뀌면 고칠 곳도 한 군데입니다.

**돈이 움직이는 요청은 재시도해도 한 번만 실행된다.** 결제의 멱등성 키는 QR 을 해석하는 시점에 서버가 발급하고 결제 화면까지
그대로 전달됩니다. 간편 비밀번호를 틀려 다시 입력해도 서버는 같은 요청으로 보고, 새로 스캔하면 새 결제가 됩니다.

**오류는 코드로 받고, 문구는 앱이 정한다.** `INSUFFICIENT_BALANCE`, `REQUEST_EXPIRED`, `PIN_LOCKED` 같은 코드를
`svc/apis/client.ts` 한 곳에서 문구로 바꿉니다. 원본 화면이 분기에 쓰던 특수 코드(예: PIN 잠김 `9004`)도 여기서 맞춰 줍니다.

**웹에서도 같은 화면이 깨지지 않는다.** WebView · SecureStore · 카메라 · 사진 저장처럼 웹에 없는 것은 각각 iframe ·
localStorage · 코드 입력 · 지연 로드로 대체했고, 그 분기는 컴포넌트와 어댑터 안에 있어 화면 코드에는 드러나지 않습니다.
웹 화면은 최대 700px 프레임으로 가운데 정렬해 모바일 레이아웃을 그대로 보여 줍니다.

**디자인은 토큰에서 시작한다.** 색 · 라운드 · 여백 · 그림자를 `src/styles` 에 모으고 공통 컴포넌트가 그것만 참조하게 해서,
이번 리디자인처럼 51개 화면의 룩을 바꿀 때도 화면 파일 대부분은 건드리지 않았습니다. 다크 모드 토큰도 같은 자리에 준비되어 있습니다.

---

## 범위

이 저장소에서 작성한 것은 `apps/mobile` 의 앱 전체입니다 — 화면, 디자인 시스템, API 어댑터, 플랫폼 분기, 오류 처리.

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
