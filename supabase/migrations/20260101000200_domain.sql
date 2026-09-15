-- =====================================================================
-- SohPay Demo — 결제 도메인 함수
--
-- 이 파일이 이 프로젝트의 핵심이다.
-- 돈을 움직이는 모든 경로는 아래 함수들뿐이고, 공통 규칙은 다음과 같다.
--
--   1) 잔액을 읽기 전에 지갑 행을 FOR UPDATE 로 잠근다.
--      → 같은 사용자의 동시 결제 두 건이 같은 잔액을 보고 둘 다 통과하는
--        고전적인 이중지불을 막는다.
--   2) 거래 한 건과 원장 한 줄은 같은 트랜잭션 안에서만 함께 만들어진다.
--      → 거래는 남았는데 잔액이 안 맞는 상태가 생길 수 없다.
--   3) 돈을 움직이는 요청은 멱등성 키를 받는다.
--      → 네트워크 재시도로 두 번 눌려도 두 번 빠져나가지 않는다.
--   4) 실패는 전부 명시적인 오류 코드로 던진다. 클라이언트가 분기할 수 있게.
-- =====================================================================

-- ── 오류 헬퍼 ────────────────────────────────────────────────────────
create or replace function public.app_error(p_code text, p_detail text default null)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_code
    using errcode = 'P0001', detail = coalesce(p_detail, '');
end;
$$;

-- ── 현재 사용자 ──────────────────────────────────────────────────────
create or replace function public.current_profile_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    perform public.app_error('UNAUTHENTICATED');
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid and p.status = 'ACTIVE') then
    perform public.app_error('MEMBER_NOT_ACTIVE');
  end if;

  return v_uid;
end;
$$;

-- ── 가입 마무리 ──────────────────────────────────────────────────────
-- Supabase Auth 로 계정이 만들어진 직후 호출한다.
-- 프로필과 지갑은 항상 짝으로 생긴다.
create or replace function public.complete_signup(
  p_mb_uid          text,
  p_name            text,
  p_pin             text,
  p_phone           text default null,
  p_birth_date      date default null,
  p_marketing_opt_in boolean default false
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    perform public.app_error('UNAUTHENTICATED');
  end if;

  if p_pin !~ '^[0-9]{6}$' then
    perform public.app_error('INVALID_PIN_FORMAT', 'PIN 은 숫자 6자리여야 합니다.');
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    perform public.app_error('ALREADY_REGISTERED');
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  insert into public.profiles (id, mb_uid, name, email, phone, birth_date, pin_hash, marketing_opt_in)
  values (v_uid, lower(p_mb_uid), p_name, v_email, p_phone, p_birth_date,
          crypt(p_pin, gen_salt('bf')), p_marketing_opt_in);

  insert into public.wallets (user_id) values (v_uid);

  return json_build_object('ok', true, 'userId', v_uid, 'mbUid', lower(p_mb_uid));
exception
  when unique_violation then
    perform public.app_error('MB_UID_TAKEN');
    return null;
end;
$$;

-- ── PIN 검증 ─────────────────────────────────────────────────────────
-- 주의: PIN 실패는 예외로 던지지 않고 결과값으로 돌려준다.
--   PostgREST 의 RPC 한 번은 트랜잭션 한 번이라, 예외를 던지면 그 트랜잭션이
--   통째로 롤백되면서 방금 올린 실패 횟수까지 함께 사라진다.
--   그러면 공격자는 실패 횟수가 늘지 않는 상태로 PIN 을 무한히 대입할 수 있다.
--   그래서 PIN 실패만큼은 정상 종료 + ok:false 로 커밋시킨다.
--   (아직 돈이 움직이기 전이라 되돌려야 할 것이 없다.)
create or replace function public.check_pin(p_user_id uuid, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row      public.profiles%rowtype;
  v_failures smallint;
begin
  select * into v_row from public.profiles where id = p_user_id for update;

  if not found then
    return json_build_object('ok', false, 'code', 'MEMBER_NOT_FOUND');
  end if;

  if v_row.pin_locked_at is not null and v_row.pin_locked_at > now() - interval '10 minutes' then
    return json_build_object('ok', false, 'code', 'PIN_LOCKED',
                             'unlocksAt', v_row.pin_locked_at + interval '10 minutes');
  end if;

  if v_row.pin_hash = crypt(p_pin, v_row.pin_hash) then
    update public.profiles
       set pin_failures = 0, pin_locked_at = null
     where id = p_user_id and (pin_failures <> 0 or pin_locked_at is not null);
    return json_build_object('ok', true);
  end if;

  v_failures := v_row.pin_failures + 1;

  update public.profiles
     set pin_failures  = v_failures,
         pin_locked_at = case when v_failures >= 5 then now() else null end
   where id = p_user_id;

  if v_failures >= 5 then
    return json_build_object('ok', false, 'code', 'PIN_LOCKED',
                             'unlocksAt', now() + interval '10 minutes');
  end if;

  return json_build_object('ok', false, 'code', 'PIN_MISMATCH',
                           'remainingAttempts', 5 - v_failures);
end;
$$;

create or replace function public.verify_pin(p_pin text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.check_pin(public.current_profile_id(), p_pin);
end;
$$;

create or replace function public.change_pin(p_current_pin text, p_new_pin text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := public.current_profile_id();
  v_check json;
begin
  if p_new_pin !~ '^[0-9]{6}$' then
    perform public.app_error('INVALID_PIN_FORMAT');
  end if;

  if p_new_pin ~ '^(.)\1{5}$' then
    perform public.app_error('PIN_TOO_SIMPLE', '같은 숫자 6자리는 사용할 수 없습니다.');
  end if;

  v_check := public.check_pin(v_uid, p_current_pin);
  if not (v_check->>'ok')::boolean then
    return v_check;
  end if;

  update public.profiles
     set pin_hash = crypt(p_new_pin, gen_salt('bf')), pin_failures = 0, pin_locked_at = null
   where id = v_uid;

  return json_build_object('ok', true);
end;
$$;

-- ── 한도 계산 ────────────────────────────────────────────────────────
create or replace function public.spent_today(p_user_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(t.amount - t.canceled_amount), 0)::bigint
    from public.transactions t
   where t.user_id = p_user_id
     and t.type = 'PAYMENT'
     and t.status in ('APPROVED', 'PARTIALLY_CANCELED')
     and t.created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
$$;

-- ── 원장 기록 (내부 전용) ────────────────────────────────────────────
-- 잔액을 바꾸는 유일한 지점. 호출 전에 지갑 행이 잠겨 있어야 한다.
create or replace function public.post_ledger(
  p_wallet_id      uuid,
  p_transaction_id uuid,
  p_direction      public.ledger_direction,
  p_amount         bigint,
  p_memo           text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_balance bigint;
begin
  update public.wallets
     set balance = balance + case when p_direction = 'CREDIT' then p_amount else -p_amount end
   where id = p_wallet_id
  returning balance into v_new_balance;

  if v_new_balance is null then
    perform public.app_error('WALLET_NOT_FOUND');
  end if;

  insert into public.ledger_entries (wallet_id, transaction_id, direction, amount, balance_after, memo)
  values (p_wallet_id, p_transaction_id, p_direction, p_amount, v_new_balance, p_memo);

  return v_new_balance;
end;
$$;

-- =====================================================================
-- 충전
-- =====================================================================

-- 1단계: 승인 대기 거래를 만든다. 아직 잔액은 늘지 않는다.
create or replace function public.create_charge(
  p_amount          bigint,
  p_method          public.charge_method,
  p_bank_account_id uuid default null,
  p_idempotency_key text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := public.current_profile_id();
  v_wallet public.wallets%rowtype;
  v_tx     public.transactions%rowtype;
  v_order  text;
begin
  if p_amount <= 0 or p_amount % 1000 <> 0 then
    perform public.app_error('INVALID_AMOUNT', '충전은 1,000원 단위로만 가능합니다.');
  end if;

  -- 멱등성: 같은 키로 이미 만들어진 거래가 있으면 그대로 돌려준다.
  if p_idempotency_key is not null then
    select * into v_tx from public.transactions
     where user_id = v_uid and idempotency_key = p_idempotency_key;
    if found then
      return json_build_object('ok', true, 'transactionId', v_tx.id, 'orderNo', v_tx.order_no,
                               'status', v_tx.status, 'replayed', true);
    end if;
  end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;

  if v_wallet.balance + p_amount > v_wallet.max_balance then
    perform public.app_error('MAX_BALANCE_EXCEEDED',
      format('보유 한도는 %s원입니다.', to_char(v_wallet.max_balance, 'FM999,999,999')));
  end if;

  if p_bank_account_id is not null
     and not exists (select 1 from public.bank_accounts
                      where id = p_bank_account_id and user_id = v_uid and verified_at is not null) then
    perform public.app_error('BANK_ACCOUNT_NOT_FOUND');
  end if;

  v_order := 'CHG' || to_char(now(), 'YYYYMMDDHH24MISS') || lpad((random() * 9999)::int::text, 4, '0');

  insert into public.transactions (user_id, type, status, amount, charge_method,
                                   bank_account_id, order_no, goods_name, idempotency_key)
  values (v_uid, 'CHARGE', 'PENDING', p_amount, p_method,
          p_bank_account_id, v_order, '잔액 충전', p_idempotency_key)
  returning * into v_tx;

  return json_build_object('ok', true, 'transactionId', v_tx.id, 'orderNo', v_tx.order_no,
                           'amount', v_tx.amount, 'status', v_tx.status, 'replayed', false);
end;
$$;

-- 2단계: 결제대행사(모의 PG)의 서버-서버 통지로만 호출된다.
-- 클라이언트 딥링크는 화면 전환 신호일 뿐이고, 잔액은 여기서만 늘어난다.
create or replace function public.settle_charge(
  p_transaction_id uuid,
  p_approved       boolean,
  p_failure_code   text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tx      public.transactions%rowtype;
  v_wallet  public.wallets%rowtype;
  v_balance bigint;
begin
  select * into v_tx from public.transactions where id = p_transaction_id for update;

  if not found then
    perform public.app_error('TRANSACTION_NOT_FOUND');
  end if;

  if v_tx.type <> 'CHARGE' then
    perform public.app_error('NOT_A_CHARGE');
  end if;

  -- 통지가 두 번 와도 두 번 반영하지 않는다.
  if v_tx.status <> 'PENDING' then
    return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', v_tx.status, 'replayed', true);
  end if;

  if not p_approved then
    update public.transactions
       set status = 'FAILED', failure_code = coalesce(p_failure_code, 'PG_DECLINED')
     where id = v_tx.id;
    return json_build_object('ok', false, 'transactionId', v_tx.id, 'status', 'FAILED');
  end if;

  select * into v_wallet from public.wallets where user_id = v_tx.user_id for update;

  if v_wallet.balance + v_tx.amount > v_wallet.max_balance then
    update public.transactions
       set status = 'FAILED', failure_code = 'MAX_BALANCE_EXCEEDED'
     where id = v_tx.id;
    return json_build_object('ok', false, 'transactionId', v_tx.id, 'status', 'FAILED',
                             'code', 'MAX_BALANCE_EXCEEDED');
  end if;

  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'CREDIT', v_tx.amount, '충전');

  update public.transactions
     set status = 'APPROVED', approved_at = now(), balance_after = v_balance
   where id = v_tx.id;

  return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', 'APPROVED', 'balance', v_balance);
end;
$$;

-- =====================================================================
-- QR 결제
-- =====================================================================

create or replace function public.resolve_payment_request(p_qr_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.payment_requests%rowtype;
  v_mer public.merchants%rowtype;
begin
  perform public.current_profile_id();

  select * into v_req from public.payment_requests where qr_token = p_qr_token;

  if not found then
    perform public.app_error('REQUEST_NOT_FOUND');
  end if;

  if v_req.status = 'USED' then
    perform public.app_error('REQUEST_ALREADY_USED');
  end if;

  if v_req.expires_at <= now() then
    perform public.app_error('REQUEST_EXPIRED');
  end if;

  select * into v_mer from public.merchants where id = v_req.merchant_id;

  return json_build_object('ok', true, 
    'paymentRequestId', v_req.id,
    'orderNo',   v_req.order_no,
    'goodsName', v_req.goods_name,
    'amount',    v_req.amount,
    'supplyAmount', v_req.supply_amount,
    'vat',       v_req.vat,
    'expiresAt', v_req.expires_at,
    'merchant',  json_build_object('mid', v_mer.mid, 'name', v_mer.name,
                                   'category', v_mer.category, 'address', v_mer.address,
                                   'emoji', v_mer.logo_emoji)
  );
end;
$$;

create or replace function public.execute_payment(
  p_qr_token        text,
  p_pin             text,
  p_idempotency_key text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := public.current_profile_id();
  v_req     public.payment_requests%rowtype;
  v_wallet  public.wallets%rowtype;
  v_tx      public.transactions%rowtype;
  v_balance bigint;
  v_check   json;
begin
  -- 0) 멱등성 먼저. 재시도 요청은 PIN 검증조차 다시 하지 않는다.
  if p_idempotency_key is not null then
    select * into v_tx from public.transactions
     where user_id = v_uid and idempotency_key = p_idempotency_key;
    if found then
      return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', v_tx.status,
                               'balance', v_tx.balance_after, 'replayed', true);
    end if;
  end if;

  -- 1) PIN (실패해도 예외를 던지지 않는다 — check_pin 주석 참고)
  v_check := public.check_pin(v_uid, p_pin);
  if not (v_check->>'ok')::boolean then
    return v_check;
  end if;

  -- 2) 결제 요청 잠금 — 같은 QR 을 두 사람이 동시에 스캔해도 한 명만 통과한다.
  select * into v_req from public.payment_requests where qr_token = p_qr_token for update;

  if not found then
    perform public.app_error('REQUEST_NOT_FOUND');
  end if;
  if v_req.status = 'USED' then
    perform public.app_error('REQUEST_ALREADY_USED');
  end if;
  if v_req.expires_at <= now() then
    update public.payment_requests set status = 'EXPIRED' where id = v_req.id and status = 'OPEN';
    perform public.app_error('REQUEST_EXPIRED');
  end if;

  -- 3) 지갑 잠금 후 잔액·한도 확인
  select * into v_wallet from public.wallets where user_id = v_uid for update;

  if v_req.amount > v_wallet.per_tx_limit then
    perform public.app_error('PER_TX_LIMIT_EXCEEDED');
  end if;

  if public.spent_today(v_uid) + v_req.amount > v_wallet.daily_limit then
    perform public.app_error('DAILY_LIMIT_EXCEEDED');
  end if;

  if v_wallet.balance < v_req.amount then
    perform public.app_error('INSUFFICIENT_BALANCE', (v_req.amount - v_wallet.balance)::text);
  end if;

  -- 4) 거래 + 원장 (같은 트랜잭션)
  insert into public.transactions (user_id, type, status, amount, merchant_id, payment_request_id,
                                   order_no, goods_name, idempotency_key, approved_at)
  values (v_uid, 'PAYMENT', 'APPROVED', v_req.amount, v_req.merchant_id, v_req.id,
          v_req.order_no, v_req.goods_name, p_idempotency_key, now())
  returning * into v_tx;

  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'DEBIT', v_req.amount, v_req.goods_name);

  update public.transactions set balance_after = v_balance where id = v_tx.id;

  update public.payment_requests
     set status = 'USED', used_by = v_uid, used_at = now()
   where id = v_req.id;

  return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', 'APPROVED',
                           'amount', v_tx.amount, 'balance', v_balance,
                           'approvedAt', v_tx.approved_at, 'replayed', false);
end;
$$;

-- ── 결제 취소 (전체 / 부분) ──────────────────────────────────────────
create or replace function public.cancel_payment(
  p_transaction_id uuid,
  p_amount         bigint default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := public.current_profile_id();
  v_tx        public.transactions%rowtype;
  v_wallet    public.wallets%rowtype;
  v_cancel    bigint;
  v_balance   bigint;
  v_remaining bigint;
begin
  select * into v_tx from public.transactions
   where id = p_transaction_id and user_id = v_uid for update;

  if not found then
    perform public.app_error('TRANSACTION_NOT_FOUND');
  end if;
  if v_tx.type <> 'PAYMENT' then
    perform public.app_error('NOT_CANCELABLE');
  end if;
  if v_tx.status not in ('APPROVED', 'PARTIALLY_CANCELED') then
    perform public.app_error('NOT_CANCELABLE');
  end if;

  v_remaining := v_tx.amount - v_tx.canceled_amount;
  v_cancel := coalesce(p_amount, v_remaining);

  if v_cancel <= 0 or v_cancel > v_remaining then
    perform public.app_error('INVALID_CANCEL_AMOUNT', v_remaining::text);
  end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;

  if v_wallet.balance + v_cancel > v_wallet.max_balance then
    perform public.app_error('MAX_BALANCE_EXCEEDED');
  end if;

  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'CREDIT', v_cancel, '결제 취소');

  update public.transactions
     set canceled_amount = canceled_amount + v_cancel,
         status = case when canceled_amount + v_cancel = amount
                       then 'CANCELED'::public.transaction_status
                       else 'PARTIALLY_CANCELED'::public.transaction_status end,
         canceled_at = now()
   where id = v_tx.id;

  return json_build_object('ok', true, 'transactionId', v_tx.id, 'canceledAmount', v_cancel, 'balance', v_balance);
end;
$$;

-- =====================================================================
-- 환불 (잔액 → 등록된 계좌)
-- =====================================================================
create or replace function public.request_refund(
  p_amount          bigint,
  p_pin             text,
  p_bank_account_id uuid default null,
  p_idempotency_key text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := public.current_profile_id();
  v_wallet  public.wallets%rowtype;
  v_acnt    public.bank_accounts%rowtype;
  v_tx      public.transactions%rowtype;
  v_balance bigint;
  v_check   json;
begin
  if p_idempotency_key is not null then
    select * into v_tx from public.transactions
     where user_id = v_uid and idempotency_key = p_idempotency_key;
    if found then
      return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', v_tx.status,
                               'balance', v_tx.balance_after, 'replayed', true);
    end if;
  end if;

  v_check := public.check_pin(v_uid, p_pin);
  if not (v_check->>'ok')::boolean then
    return v_check;
  end if;

  if p_bank_account_id is null then
    select * into v_acnt from public.bank_accounts
     where user_id = v_uid and purpose = 'REFUND' and is_primary and verified_at is not null;
  else
    select * into v_acnt from public.bank_accounts
     where id = p_bank_account_id and user_id = v_uid
       and purpose = 'REFUND' and verified_at is not null;
  end if;

  if not found then
    perform public.app_error('REFUND_ACCOUNT_NOT_REGISTERED');
  end if;

  select * into v_wallet from public.wallets where user_id = v_uid for update;

  if p_amount <= 0 then
    perform public.app_error('INVALID_AMOUNT');
  end if;
  if v_wallet.balance < p_amount then
    perform public.app_error('INSUFFICIENT_BALANCE', (p_amount - v_wallet.balance)::text);
  end if;

  insert into public.transactions (user_id, type, status, amount, bank_account_id,
                                   order_no, goods_name, idempotency_key, approved_at)
  values (v_uid, 'REFUND', 'APPROVED', p_amount, v_acnt.id,
          'RFD' || to_char(now(), 'YYYYMMDDHH24MISS') || lpad((random() * 9999)::int::text, 4, '0'),
          '잔액 환불', p_idempotency_key, now())
  returning * into v_tx;

  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'DEBIT', p_amount, '환불 출금');

  update public.transactions set balance_after = v_balance where id = v_tx.id;

  return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', 'APPROVED',
                           'amount', p_amount, 'balance', v_balance,
                           'bankCode', v_acnt.bank_code, 'accountNo', v_acnt.account_no_masked,
                           'replayed', false);
end;
$$;

-- =====================================================================
-- 계좌 관리
-- =====================================================================
create or replace function public.register_bank_account(
  p_verification_id uuid,
  p_purpose         public.bank_account_purpose,
  p_set_primary     boolean default true
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := public.current_profile_id();
  v_ver public.account_verifications%rowtype;
  v_id  uuid;
begin
  select * into v_ver from public.account_verifications
   where id = p_verification_id and user_id = v_uid;

  if not found or v_ver.verified_at is null then
    perform public.app_error('ACCOUNT_NOT_VERIFIED');
  end if;

  if p_set_primary then
    update public.bank_accounts set is_primary = false
     where user_id = v_uid and purpose = p_purpose and is_primary;
  end if;

  insert into public.bank_accounts (user_id, bank_code, account_no_masked, account_fingerprint,
                                    holder_name, purpose, is_primary, verified_at)
  values (v_uid, v_ver.bank_code, v_ver.account_no_masked, v_ver.account_fingerprint,
          v_ver.holder_name, p_purpose, p_set_primary, v_ver.verified_at)
  on conflict (user_id, purpose, account_fingerprint)
    do update set holder_name = excluded.holder_name,
                  verified_at = excluded.verified_at,
                  is_primary  = excluded.is_primary
  returning id into v_id;

  return json_build_object('ok', true, 'bankAccountId', v_id);
end;
$$;

create or replace function public.set_primary_bank_account(p_bank_account_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := public.current_profile_id();
  v_purpose public.bank_account_purpose;
begin
  select purpose into v_purpose from public.bank_accounts
   where id = p_bank_account_id and user_id = v_uid;

  if not found then
    perform public.app_error('BANK_ACCOUNT_NOT_FOUND');
  end if;

  update public.bank_accounts set is_primary = false
   where user_id = v_uid and purpose = v_purpose and is_primary;

  update public.bank_accounts set is_primary = true where id = p_bank_account_id;

  return json_build_object('ok', true);
end;
$$;

create or replace function public.remove_bank_account(p_bank_account_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := public.current_profile_id();
begin
  delete from public.bank_accounts where id = p_bank_account_id and user_id = v_uid;

  if not found then
    perform public.app_error('BANK_ACCOUNT_NOT_FOUND');
  end if;

  return json_build_object('ok', true);
end;
$$;

-- =====================================================================
-- 탈퇴
-- =====================================================================
create or replace function public.withdraw_member(p_pin text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := public.current_profile_id();
  v_balance bigint;
  v_check   json;
begin
  v_check := public.check_pin(v_uid, p_pin);
  if not (v_check->>'ok')::boolean then
    return v_check;
  end if;

  select balance into v_balance from public.wallets where user_id = v_uid for update;

  if v_balance > 0 then
    perform public.app_error('BALANCE_REMAINING', v_balance::text);
  end if;

  update public.profiles set status = 'WITHDRAWN' where id = v_uid;

  return json_build_object('ok', true);
end;
$$;

-- =====================================================================
-- 정합성 점검
-- 원장 합계와 지갑 잔액이 어긋난 계정을 찾아낸다.
-- 운영에서는 배치로 돌리고, 데모에서는 테스트가 이 함수로 결과를 검증한다.
-- =====================================================================
create or replace function public.wallet_integrity_check()
returns table (wallet_id uuid, cached_balance bigint, ledger_balance bigint, drift bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select w.id,
         w.balance,
         coalesce(sum(case when l.direction = 'CREDIT' then l.amount else -l.amount end), 0)::bigint,
         w.balance - coalesce(sum(case when l.direction = 'CREDIT' then l.amount else -l.amount end), 0)::bigint
    from public.wallets w
    left join public.ledger_entries l on l.wallet_id = w.id
   group by w.id, w.balance
  having w.balance <> coalesce(sum(case when l.direction = 'CREDIT' then l.amount else -l.amount end), 0)::bigint;
$$;

-- =====================================================================
-- 실행 권한
-- 기본값(PUBLIC 실행 허용)을 걷어내고 필요한 롤에만 다시 준다.
-- settle_charge 는 서비스 롤만 호출할 수 있다 → 앱이 임의로 잔액을 늘릴 수 없다.
-- =====================================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.complete_signup(text, text, text, text, date, boolean),
  public.verify_pin(text),
  public.change_pin(text, text),
  public.create_charge(bigint, public.charge_method, uuid, text),
  public.resolve_payment_request(text),
  public.execute_payment(text, text, text),
  public.cancel_payment(uuid, bigint),
  public.request_refund(bigint, text, uuid, text),
  public.register_bank_account(uuid, public.bank_account_purpose, boolean),
  public.set_primary_bank_account(uuid),
  public.remove_bank_account(uuid),
  public.withdraw_member(text)
to authenticated;

grant execute on function
  public.settle_charge(uuid, boolean, text),
  public.wallet_integrity_check()
to service_role;
