# SohPay Demo — API 명세

> 앱(`apps/mobile`) 이 연동 기준으로 삼은 문서입니다.
> 서버 구현은 `supabase/` 에 있으며, 앱은 이 문서에 적힌 요청·응답·오류 코드만 전제로 동작합니다.
> 서버를 다른 구현으로 교체해도 이 계약만 지키면 앱은 수정 없이 동작합니다.

## 0. 공통 규칙

| 규칙 | 앱에 미치는 영향 |
|---|---|
| 금액은 원(KRW) 단위 정수 | 화면에서 `toLocaleString` 만 적용, 소수 처리 없음 |
| 돈이 움직이는 요청은 `idempotency_key` 필수. 재요청 시 `replayed: true` | 재시도 시 같은 키 재사용 |
| PIN 실패는 예외가 아니라 `{ ok: false, code, remainingAttempts }` 응답 | `assertOk()` 로 검사 후 남은 횟수 표시 |
| 그 외 실패는 오류 코드 문자열로 응답 (`error.message`) | `apps/mobile/src/svc/apis/client.ts` 에서 문구로 변환 |
| 조회는 RLS 로 본인 데이터만 반환 | 쿼리에 사용자 필터를 넣지 않음 |

## 1. 인증

Supabase Auth(이메일/비밀번호) 기반. 앱 화면에서는 기존 앱과 동일하게 **아이디(mbUid)**를 입력받고,
클라이언트가 `{mbUid}@demo.sohpay.app` 형태로 변환해 로그인한다. (데모용 매핑, 서버에 원문 저장 없음)

| 동작 | 호출 |
|---|---|
| 회원가입 | `POST /auth/v1/signup` → 이후 `rpc/complete_signup` 으로 프로필·지갑·PIN 생성 |
| 로그인 | `POST /auth/v1/token?grant_type=password` |
| 토큰 재발급 | `POST /auth/v1/token?grant_type=refresh_token` (SDK 자동) |
| 로그아웃 | `POST /auth/v1/logout` |

> 토큰 재발급은 Supabase SDK 가 자동으로 처리한다. 재발급 실패 시 앱은 로그인 화면으로 리셋한다.

### 본인인증 (모의)
| 동작 | 호출 |
|---|---|
| 인증 세션 생성 | `POST /functions/v1/identity/start` → `{ verificationId, checkoutUrl }` |
| 결과 수신 | 웹뷰가 `sohpay://join/identity?verificationId=...&status=...` 로 콜백 |
| 결과 확정 | `POST /functions/v1/identity/complete` → `{ memberAuthKey, name, birthDate, phone }` |

## 2. 지갑 / 잔액

| 동작 | 호출 | 비고 |
|---|---|---|
| 잔액 조회 | `GET /rest/v1/wallets?select=balance,currency,updated_at` | RLS로 본인 지갑만 |
| 원장 조회 | `GET /rest/v1/ledger_entries?order=created_at.desc` | 잔액 검증용 |

## 3. 거래 내역

```
GET /rest/v1/transactions
  ?type=eq.PAYMENT            # PAYMENT | CHARGE | REFUND
  &status=in.(APPROVED,CANCELED)
  &created_at=gte.2026-01-01
  &order=created_at.desc
  &limit=20&offset=0
```

| 동작 | 호출 |
|---|---|
| 최근 20건 | `GET /rest/v1/recent_transactions` (뷰) |
| 상세 | `GET /rest/v1/transactions?id=eq.{id}&select=*,merchant:merchants(*)` |

## 4. 충전

| 동작 | 호출 | 설명 |
|---|---|---|
| 충전 시작 | `POST /functions/v1/charges` | `{ amount, method, bankAccountId? }` → `{ transactionId, checkoutUrl }` |
| 결제창 | 웹뷰가 `checkoutUrl` 로드 | 모의 PG 페이지. 승인/실패/취소 선택 가능 |
| 콜백 | `sohpay://charge/result?tx=...&status=...` | 앱은 딥링크만 받고 금액은 신뢰하지 않음 |
| 확정 | 모의 PG가 서버로 `POST /functions/v1/charges/webhook` | **여기서만 잔액이 증가** |
| 상태 확인 | `GET /rest/v1/transactions?id=eq.{id}` | 앱은 폴링으로 최종 상태 확인 |

`method`: `BANK_TRANSFER`(계좌이체) | `VIRTUAL_ACCOUNT`(가상계좌)

> **클라이언트 콜백의 금액은 신뢰하지 않는다.**
> 딥링크는 "화면 전환 트리거"일 뿐이고, 잔액 반영은 서버-서버 웹훅으로만 일어난다.

## 5. QR 결제

| 동작 | 호출 | 설명 |
|---|---|---|
| QR 해석 | `POST /rest/v1/rpc/resolve_payment_request` | `{ qr_token }` → 가맹점/금액/상품명 + `attemptKey`. 만료·중복사용 검사 |
| 결제 실행 | `POST /rest/v1/rpc/execute_payment` | `{ qr_token, pin, idempotency_key }` — `idempotency_key` 에는 해석 시 받은 `attemptKey` 를 그대로 보낸다 |
| 코드 직접 입력 | 동일 RPC (`qr_token`에 수기 입력 코드) | |

일반 QR 은 발급 후 5분간 유효하고 한 번 결제되면 `USED` 가 된다. README 에 실린 **데모 QR**(`reusable = true`) 은
만료되지 않고 몇 번이든 결제할 수 있으며, 결제마다 새 거래(새 주문번호)가 생긴다. 이때 `attemptKey` 는 해석마다 새로 발급되므로
같은 QR 을 다시 스캔하면 새 결제, 같은 화면에서 PIN 을 다시 입력하면 같은 결제(멱등)로 처리된다.

`execute_payment` 내부 순서: PIN 검증 → 요청 유효성 → 지갑 행 잠금 → 잔액 확인 → 거래 생성 → 원장 기록 → 잔액 갱신. **단일 트랜잭션.**

| 실패 코드 | 의미 |
|---|---|
| `PIN_MISMATCH` | PIN 불일치 (5회 초과 시 `PIN_LOCKED`) |
| `INSUFFICIENT_BALANCE` | 잔액 부족 |
| `REQUEST_EXPIRED` | QR 만료 |
| `REQUEST_ALREADY_USED` | 이미 결제된 QR |
| `DAILY_LIMIT_EXCEEDED` | 1일 한도 초과 |

## 6. 결제 취소 / 환불

| 동작 | 호출 |
|---|---|
| 결제 취소(가맹점) | `POST /rest/v1/rpc/cancel_payment` — `{ transaction_id, amount? }` 부분취소 지원 |
| 잔액 환불(계좌) | `POST /rest/v1/rpc/request_refund` — `{ amount, pin, bank_account_id, idempotency_key }` |

## 7. 계좌 관리

| 동작 | 호출 |
|---|---|
| 목록 | `GET /rest/v1/bank_accounts` |
| 1원 인증 요청 | `POST /functions/v1/accounts/verify/start` → `{ verificationId }` (모의 입금자명 발급) |
| 1원 인증 확인 | `POST /functions/v1/accounts/verify/confirm` → `{ verificationId, code }` |
| 등록 | `POST /rest/v1/rpc/register_bank_account` |
| 해지 | `POST /rest/v1/rpc/remove_bank_account` |
| 대표계좌 변경 | `POST /rest/v1/rpc/set_primary_bank_account` |

> 실계좌 검증이 필요하면 **금융결제원 오픈뱅킹 테스트베드**로 교체 가능하도록
> `accounts/verify/*` Edge Function 한 곳에만 어댑터를 둔다.

## 8. 프로필 / PIN

| 동작 | 호출 |
|---|---|
| 내 정보 | `GET /rest/v1/profiles?id=eq.{uid}` |
| 정보 수정 | `PATCH /rest/v1/profiles?id=eq.{uid}` (수정 가능 컬럼만 RLS 허용) |
| 비밀번호 검증 | `POST /rest/v1/rpc/verify_password` |
| PIN 검증 | `POST /rest/v1/rpc/verify_pin` |
| PIN 변경 | `POST /rest/v1/rpc/change_pin` |
| 회원 탈퇴 | `POST /rest/v1/rpc/withdraw_member` (잔액 0원일 때만 허용) |

## 9. 고객센터 / 가맹점

| 동작 | 호출 |
|---|---|
| 공지 | `GET /rest/v1/notices?order=published_at.desc` |
| FAQ | `GET /rest/v1/faqs?category=eq.PAYMENT` |
| 1:1 문의 목록 | `GET /rest/v1/inquiries` |
| 1:1 문의 등록 | `POST /rest/v1/inquiries` |
| 가맹점 조회 | `GET /rest/v1/merchants?mid=eq.{mid}` |

## 10. 화면 플로우별 사용 API

| 화면 플로우 | 사용하는 API |
|---|---|
| 회원가입 (약관 → 본인인증 → 계정 → PIN) | `identity/start` → 웹뷰 → `identity/result` → Auth signup → `complete_signup` |
| 홈 (잔액 · 최근 이력) | `wallets`, `recent_transactions` |
| 충전 | `charges` → 결제창 웹뷰 → `transactions` 상태 폴링 |
| QR 결제 | `resolve_payment_request` → `execute_payment` |
| 이용 내역 · 상세 · 취소 | `transactions` (필터·페이지네이션), `cancel_payment` |
| 환불 | `bank_accounts` → `request_refund` |
| 계좌 등록 | `account-verify/start` → `account-verify/confirm` → `register_bank_account` |
| 전체 (내 정보 · PIN · 탈퇴) | `profiles`, `verify_pin`, `change_pin`, `withdraw_member` |
| 공지 · FAQ | `notices`, `faqs` |
