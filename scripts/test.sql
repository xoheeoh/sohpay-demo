-- =====================================================================
-- SohPay Demo — 도메인 시나리오 테스트
--   psql -f scripts/test.sql
-- 목적: 잔액이 틀어질 수 있는 모든 경로를 실제로 두드려 본다.
-- =====================================================================
\set ON_ERROR_STOP on
set client_min_messages = notice;
set search_path = public, extensions;   -- 호스팅 환경처럼 pgcrypto 가 extensions 스키마에 있어도 동작
\o /dev/null

create or replace function pg_temp.ok(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_cond then
    raise notice '  PASS  %', p_label;
  else
    raise exception 'FAIL  %', p_label;
  end if;
end $$;

create or replace function pg_temp.raises(p_sql text, p_code text, p_label text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL  % (오류가 나야 하는데 통과했다)', p_label;
exception
  when sqlstate 'P0001' then
    if sqlmessage() is null then null; end if;
    raise notice '  PASS  %', p_label;
end $$;

-- sqlmessage() 은 없으므로 메시지 비교용 래퍼를 따로 둔다.
create or replace function pg_temp.raises_with(p_sql text, p_code text, p_label text)
returns void language plpgsql as $$
declare v_msg text;
begin
  execute p_sql;
  raise exception 'FAIL  % — 오류 없이 통과했다', p_label;
exception
  when sqlstate 'P0001' then
    get stacked diagnostics v_msg = message_text;
    if v_msg = p_code then
      raise notice '  PASS  %  (%)', p_label, v_msg;
    else
      raise exception 'FAIL  % — 기대 %, 실제 %', p_label, p_code, v_msg;
    end if;
end $$;

-- json 결과의 code 필드를 비교한다 (PIN 실패처럼 예외 대신 값으로 오는 경우)
create or replace function pg_temp.code(p_sql text, p_expected text, p_label text)
returns void language plpgsql as $$
declare v_json json; v_code text;
begin
  execute p_sql into v_json;
  v_code := coalesce(v_json->>'code', '(ok)');
  if v_code = p_expected then
    raise notice '  PASS  %  (%)', p_label, v_code;
  else
    raise exception 'FAIL  % — 기대 %, 실제 %', p_label, p_expected, v_code;
  end if;
end $$;

-- ── 준비: 데모 계정 두 개 ────────────────────────────────────────────
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'

-- 외래키 순서대로 정리한다: 원장 → 거래 → 결제요청 → 지갑 → 프로필 → 계정
delete from public.ledger_entries where wallet_id in (select id from public.wallets where user_id in (:'alice'::uuid, :'bob'::uuid));
delete from public.transactions where user_id in (:'alice'::uuid, :'bob'::uuid);
delete from public.account_verifications where user_id in (:'alice'::uuid, :'bob'::uuid);
delete from public.bank_accounts where user_id in (:'alice'::uuid, :'bob'::uuid);
delete from public.payment_requests where used_by in (:'alice'::uuid, :'bob'::uuid);
delete from public.wallets where user_id in (:'alice'::uuid, :'bob'::uuid);
delete from public.profiles where id in (:'alice'::uuid, :'bob'::uuid);
delete from auth.users where id in (:'alice'::uuid, :'bob'::uuid);

insert into auth.users (id, email) values
  (:'alice'::uuid, 'alice@demo.sohpay.app'),
  (:'bob'::uuid,   'bob@demo.sohpay.app');

\echo '── 1. 가입'
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false);
select public.complete_signup('alice01', '김앨리스', '123456', null, true);
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 0, '가입 직후 잔액 0원');
select pg_temp.raises_with($$ select public.complete_signup('alice01','김앨리스','123456') $$, 'ALREADY_REGISTERED', '같은 계정 중복 가입 차단');
select pg_temp.raises_with($$ select public.complete_signup('alice01','x','12345') $$, 'INVALID_PIN_FORMAT', 'PIN 형식 검증');

select set_config('request.jwt.claim.sub', :'bob', false);
select public.complete_signup('bob001', '박밥', '654321');
select set_config('request.jwt.claim.sub', :'alice', false);

\echo '── 2. 충전'
select public.create_charge(50000, 'BANK_TRANSFER', null, 'idem-charge-1');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 0, '승인 전에는 잔액이 늘지 않는다');
select pg_temp.raises_with($$ select public.create_charge(1500,'BANK_TRANSFER') $$, 'INVALID_AMOUNT', '1,000원 단위가 아니면 거부');

select pg_temp.ok(
  (select (public.create_charge(50000,'BANK_TRANSFER',null,'idem-charge-1')->>'replayed')::boolean),
  '같은 멱등성 키로 재요청하면 기존 거래를 반환');
select pg_temp.ok((select count(*) from public.transactions where user_id = :'alice'::uuid and type='CHARGE') = 1,
  '멱등 재요청으로 거래가 늘지 않는다');

reset role;
select set_config('request.jwt.claim.sub', :'alice', false);
select public.settle_charge((select id from public.transactions where user_id = :'alice'::uuid and type='CHARGE'), true);
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 50000, '승인 통지 후 잔액 50,000원');
select pg_temp.ok((select count(*) from public.ledger_entries l join public.wallets w on w.id=l.wallet_id where w.user_id = :'alice'::uuid) = 1,
  '원장 1줄 기록');

-- 웹훅 중복 수신
select public.settle_charge((select id from public.transactions where user_id = :'alice'::uuid and type='CHARGE'), true);
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 50000, '웹훅이 두 번 와도 이중 충전되지 않는다');

\echo '── 3. QR 결제'
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false);

create temp table t_qr as select (public.issue_payment_request('M20260001', 5500, '아메리카노 2잔')->>'qrToken') as token;

select pg_temp.ok((public.resolve_payment_request((select token from t_qr))->>'amount')::bigint = 5500, 'QR 해석 결과 금액 일치');

select pg_temp.code(
  format($$ select public.execute_payment(%L, '999999', 'idem-pay-x') $$, (select token from t_qr)),
  'PIN_MISMATCH', '틀린 PIN 거부');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 50000, 'PIN 실패 시 잔액 불변');

select public.execute_payment((select token from t_qr), '123456', 'idem-pay-1');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 44500, '결제 후 잔액 44,500원');
reset role;
select pg_temp.ok((select status from public.payment_requests where qr_token = (select token from t_qr)) = 'USED', 'QR 사용 처리');
do $$
begin
  set local role authenticated;
  perform 1 from public.payment_requests limit 1;
  raise exception 'FAIL  앱 토큰이 결제요청 테이블을 직접 읽을 수 있으면 안 된다';
exception
  when insufficient_privilege then raise notice '  PASS  결제요청은 RPC 로만 열람 가능';
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false);

select pg_temp.ok(
  (public.execute_payment((select token from t_qr), '123456', 'idem-pay-1')->>'replayed')::boolean,
  '같은 멱등성 키 재결제는 기존 결과 반환');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 44500, '멱등 재결제로 이중 출금되지 않는다');

select pg_temp.raises_with(
  format($$ select public.execute_payment(%L, '123456', 'idem-pay-2') $$, (select token from t_qr)),
  'REQUEST_ALREADY_USED', '사용된 QR 재사용 차단');

-- PIN 실패 누적 후 잠금
-- 각 select 는 별도 트랜잭션이다(= PostgREST 의 RPC 한 번과 같다).
-- 실패 횟수가 롤백에 쓸려나가지 않는지 여기서 확인한다.
create temp table t_qr2 as select (public.issue_payment_request('M20260002', 3000, '김밥')->>'qrToken') as token;
select public.execute_payment((select token from t_qr2), '000000', 'idem-lock-1');
select public.execute_payment((select token from t_qr2), '000000', 'idem-lock-2');
select public.execute_payment((select token from t_qr2), '000000', 'idem-lock-3');
select pg_temp.ok((select pin_failures from public.profiles where id = :'alice'::uuid) = 3,
  'PIN 실패 횟수가 트랜잭션 롤백에 사라지지 않는다');
select pg_temp.code($$ select public.verify_pin('000000') $$, 'PIN_MISMATCH', '4회차 실패');
select pg_temp.code($$ select public.verify_pin('000000') $$, 'PIN_LOCKED', '5회차에 잠금');
select pg_temp.code(
  format($$ select public.execute_payment(%L, '123456', 'idem-lock-9') $$, (select token from t_qr2)),
  'PIN_LOCKED', '잠긴 동안에는 올바른 PIN 도 거부');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 44500,
  'PIN 잠금 과정에서 잔액 변동 없음');

-- 잠금 해제 후 진행
reset role;
update public.profiles set pin_failures = 0, pin_locked_at = null where id = :'alice'::uuid;
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false);

\echo '── 4. 한도'
select pg_temp.raises_with(
  format($$ select public.execute_payment((public.issue_payment_request('M20260005', 600000, '한도초과')->>'qrToken'), '123456', 'idem-limit-1') $$),
  'PER_TX_LIMIT_EXCEEDED', '1회 한도 초과 차단');

select pg_temp.raises_with(
  format($$ select public.execute_payment((public.issue_payment_request('M20260005', 400000, '잔액초과')->>'qrToken'), '123456', 'idem-bal-1') $$),
  'INSUFFICIENT_BALANCE', '잔액 부족 차단');

\echo '── 5. 결제 취소'
create temp table t_paid as
  select (public.execute_payment((public.issue_payment_request('M20260003', 12000, '생필품')->>'qrToken'), '123456', 'idem-pay-3')->>'transactionId')::uuid as tx;
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 32500, '두 번째 결제 후 32,500원');

select public.cancel_payment((select tx from t_paid), 4000);
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 36500, '부분 취소 4,000원 환입');
select pg_temp.ok((select status from public.transactions where id = (select tx from t_paid)) = 'PARTIALLY_CANCELED', '부분 취소 상태');

select pg_temp.raises_with(
  format($$ select public.cancel_payment(%L, 99999) $$, (select tx from t_paid)),
  'INVALID_CANCEL_AMOUNT', '남은 금액을 넘는 취소 차단');

select public.cancel_payment((select tx from t_paid));
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 44500, '잔여 전액 취소');
select pg_temp.ok((select status from public.transactions where id = (select tx from t_paid)) = 'CANCELED', '전체 취소 상태');
select pg_temp.raises_with(
  format($$ select public.cancel_payment(%L) $$, (select tx from t_paid)),
  'NOT_CANCELABLE', '이미 취소된 거래 재취소 차단');

\echo '── 6. 환불'
select pg_temp.raises_with($$ select public.request_refund(10000, '123456') $$,
  'REFUND_ACCOUNT_NOT_REGISTERED', '계좌 미등록 시 환불 차단');

reset role;
insert into public.account_verifications (id, user_id, bank_code, account_no_masked, account_fingerprint, holder_name, code_hash, verified_at)
values ('33333333-3333-3333-3333-333333333333', :'alice'::uuid, '004', '123456-**-7890',
        encode(digest('004:12345678907890', 'sha256'), 'hex'), '김앨리스', 'x', now());
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false);
select public.register_bank_account('33333333-3333-3333-3333-333333333333', 'REFUND', true);
select public.request_refund(20000, '123456', null, 'idem-refund-1');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 24500, '환불 후 잔액 24,500원');
select pg_temp.ok(
  (public.request_refund(20000, '123456', null, 'idem-refund-1')->>'replayed')::boolean,
  '환불 멱등성 동작');
select pg_temp.ok((select balance from public.wallets where user_id = :'alice'::uuid) = 24500, '환불 멱등 재요청으로 이중 출금 없음');
select pg_temp.raises_with($$ select public.request_refund(999999, '123456', null, 'idem-refund-2') $$,
  'INSUFFICIENT_BALANCE', '잔액 넘는 환불 차단');

\echo '── 7. 접근 제어'
select pg_temp.ok((select count(*) from public.wallets) = 1, '다른 회원의 지갑은 조회되지 않는다 (RLS)');
select pg_temp.ok((select count(*) from public.profiles) = 1, '다른 회원의 프로필은 조회되지 않는다 (RLS)');

do $$
begin
  update public.wallets set balance = 99999999;
  raise exception 'FAIL  앱 토큰으로 잔액을 직접 수정할 수 있으면 안 된다';
exception
  when insufficient_privilege then raise notice '  PASS  앱 토큰은 잔액을 직접 UPDATE 할 수 없다';
end $$;

do $$
begin
  perform public.settle_charge(gen_random_uuid(), true);
  raise exception 'FAIL  앱 토큰이 충전 확정 함수를 호출할 수 있으면 안 된다';
exception
  when insufficient_privilege then raise notice '  PASS  충전 확정은 서비스 롤만 호출 가능';
end $$;

select set_config('request.jwt.claim.sub', :'bob', false);
select pg_temp.raises_with(
  format($$ select public.cancel_payment(%L) $$, (select tx from t_paid)),
  'TRANSACTION_NOT_FOUND', '남의 거래는 취소할 수 없다');

\echo '── 8. 탈퇴'
select set_config('request.jwt.claim.sub', :'alice', false);
select pg_temp.raises_with($$ select public.withdraw_member('123456') $$,
  'BALANCE_REMAINING', '잔액이 남으면 탈퇴 불가');

\echo '── 9. 원장 정합성'
reset role;
select pg_temp.ok((select count(*) from public.wallet_integrity_check()) = 0,
  '모든 지갑에서 잔액 캐시와 원장 합계가 일치');

select pg_temp.ok(
  (select balance from public.wallets where user_id = :'alice'::uuid)
  = (select coalesce(sum(case when direction='CREDIT' then amount else -amount end),0)
       from public.ledger_entries l join public.wallets w on w.id = l.wallet_id
      where w.user_id = :'alice'::uuid),
  '앨리스 잔액 = 원장 합계');

\echo ''
\echo '모든 시나리오 통과'
