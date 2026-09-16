-- =====================================================================
-- 재사용 가능한 데모 결제 QR
-- 일반 결제 요청은 5분 뒤 만료되고 한 번 쓰면 USED 가 된다. 포트폴리오를 보는 사람이
-- README 에 인쇄된 QR 을 아무 때나 스캔해 볼 수 있도록, reusable 플래그가 켜진 요청은
-- 만료·사용 여부를 검사하지 않고 결제마다 새 거래를 만든다.
--  - resolve_payment_request 는 결제 시도마다 다른 attemptKey 를 내려 주고,
--    앱은 그 값을 멱등성 키로 쓴다 (같은 시도 안의 PIN 재시도는 한 건, 새 스캔은 새 건).
-- =====================================================================

alter table public.payment_requests
  add column if not exists reusable boolean not null default false;

create or replace function public.resolve_payment_request(p_qr_token text)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
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

  if not v_req.reusable then
    if v_req.status = 'USED' then
      perform public.app_error('REQUEST_ALREADY_USED');
    end if;

    if v_req.expires_at <= now() then
      perform public.app_error('REQUEST_EXPIRED');
    end if;
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
    'reusable',  v_req.reusable,
    -- 이번 결제 시도의 멱등성 키. 일회용 요청은 요청 ID 로 고정, 재사용 요청은 시도마다 새로 발급.
    'attemptKey', case when v_req.reusable
                       then 'PAY-' || v_req.id || '-' || encode(gen_random_bytes(6), 'hex')
                       else 'PAY-' || v_req.id end,
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
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid      uuid := public.current_profile_id();
  v_req      public.payment_requests%rowtype;
  v_wallet   public.wallets%rowtype;
  v_tx       public.transactions%rowtype;
  v_balance  bigint;
  v_check    json;
  v_order_no text;
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

  if not v_req.reusable then
    if v_req.status = 'USED' then
      perform public.app_error('REQUEST_ALREADY_USED');
    end if;
    if v_req.expires_at <= now() then
      update public.payment_requests set status = 'EXPIRED' where id = v_req.id and status = 'OPEN';
      perform public.app_error('REQUEST_EXPIRED');
    end if;
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

  -- 재사용 요청은 결제마다 새 주문번호를 만든다 (일회용은 요청의 주문번호 그대로)
  v_order_no := case when v_req.reusable
                     then 'ORD' || to_char(now(), 'YYYYMMDDHH24MISSMS') || lpad((random() * 999)::int::text, 3, '0')
                     else v_req.order_no end;

  -- 4) 거래 + 원장 (같은 트랜잭션)
  insert into public.transactions (user_id, type, status, amount, merchant_id, payment_request_id,
                                   order_no, goods_name, idempotency_key, approved_at)
  values (v_uid, 'PAYMENT', 'APPROVED', v_req.amount, v_req.merchant_id, v_req.id,
          v_order_no, v_req.goods_name, p_idempotency_key, now())
  returning * into v_tx;

  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'DEBIT', v_req.amount, v_req.goods_name);

  update public.transactions set balance_after = v_balance where id = v_tx.id;

  if not v_req.reusable then
    update public.payment_requests
       set status = 'USED', used_by = v_uid, used_at = now()
     where id = v_req.id;
  end if;

  return json_build_object('ok', true, 'transactionId', v_tx.id, 'status', 'APPROVED',
                           'amount', v_tx.amount, 'balance', v_balance,
                           'approvedAt', v_tx.approved_at, 'replayed', false);
end;
$$;
