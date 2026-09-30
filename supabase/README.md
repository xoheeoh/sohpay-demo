# 데모 API 서버 (Supabase)

`apps/mobile` 앱을 실제로 동작시키기 위한 백엔드 대역입니다.

이 프로젝트는 프론트엔드 포트폴리오이고, 실무에서는 백엔드 팀이 담당하는 부분(DB, 서버 로직, 외부 연동)을
대신할 서버가 필요해 **AI 도구로 생성**했습니다. 앱은 [`docs/api-spec.md`](../docs/api-spec.md) 의
명세만 보고 연동했으며, 이 폴더의 내부 구현은 프로젝트가 보여주려는 역량 범위에 들어가지 않습니다.

아래는 서버 구성을 파악할 때 필요한 참고 자료입니다.

---

## 구성

```
supabase/
  migrations/   스키마 · RLS · 도메인 함수 · 데모 QR · 데모 회원 부트스트랩 · 데모 데이터 보정 (15개)
  functions/    Edge Functions — 모의 PG 결제창, 모의 본인인증, 모의 1원 인증
  seed.sql      가맹점 · 공지 · FAQ · 약관 · 데모 QR(상시)
  config.toml   로컬 스택 설정
```

앱이 호출하는 방식은 세 가지입니다.

| 용도 | 경로 | 예 |
|---|---|---|
| 조회 | PostgREST (`/rest/v1/...`) | 잔액, 거래 내역, 공지 |
| 금액 이동 | RPC (`/rest/v1/rpc/...`) | `execute_payment`, `request_refund`, `cancel_payment` |
| 외부 연동 흉내 | Edge Functions (`/functions/v1/...`) | 충전 결제창, 본인인증, 1원 인증 |

## 데이터 모델

```
profiles ─1:1─ wallets ─1:N─ ledger_entries
                                  │
                              transactions ─N:1─ merchants
                                  │
                              payment_requests (QR)
```

`wallets.balance` 는 조회용 캐시이고, 잔액의 근거는 `ledger_entries` 합계입니다.
`wallet_integrity_check()` 가 두 값이 어긋난 지갑을 찾아냅니다.

## 서버가 보장하는 것 (앱이 기대하는 계약)

앱 쪽 코드가 이 동작을 전제로 짜여 있으므로, 서버를 교체할 때는 같은 계약을 지켜야 합니다.

| 계약 | 앱에서 의존하는 곳 |
|---|---|
| 같은 `idempotency_key` 재요청은 기존 결과를 `replayed: true` 로 반환 | 결제·출금 PIN 화면의 재시도 |
| PIN 실패는 예외가 아니라 `{ ok:false, code, remainingAttempts }` | `svc/apis/client.ts` `fromRpc()` 가 `resultCd` 로 변환, PIN 화면에서 남은 횟수 안내 |
| 그 외 실패는 오류 코드 문자열(`INSUFFICIENT_BALANCE` 등)로 던짐 | `svc/apis/client.ts` 문구 매핑 |
| 충전 승인은 결제창 서버가 확정하고, 앱은 `transactions.status` 를 읽어 결과 확인 | `ChargeAcntWebScreen` 의 결과 처리 |
| 잔액·거래는 RLS 로 본인 것만 조회됨 | 쿼리에 `user_id` 필터를 넣지 않음 |

## 검증

`scripts/test.sql` 이 46개 시나리오(멱등성, 이중 충전, PIN 잠금, 한도, 부분 취소, RLS)를 검사합니다.
로컬 스택에서 `npm run db:test` 로 실행합니다.

## 교체 지점

실제 서비스 연동으로 바꾸고 싶다면 Edge Function 한 파일씩 갈아끼우면 됩니다.

| 기능 | 파일 | 대체 후보 |
|---|---|---|
| 본인인증 | `functions/identity` | Firebase Auth 전화번호 인증 |
| 아이디/비밀번호 찾기 | `functions/account-recovery` | 임시 비밀번호 이메일 발송 (데모는 화면에 표시) |
| 계좌 1원 인증 | `functions/account-verify` | 금융결제원 오픈뱅킹 테스트베드 |
| 결제창 | `functions/charge-checkout` | 실제 PG (사업자 심사 필요) |
