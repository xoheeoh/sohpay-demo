-- =====================================================================
-- 데모 이력에 충전·출금 실패 건 추가
--
-- 이용내역 조회의 거래상태 "실패" 필터에서 볼 수 있는 데이터를 넣는다.
-- 20260929000300 이 적용된 뒤 추가된 데이터라 별도 마이그레이션으로 둔다.
-- 돈이 움직이지 않은 건이라 장부(ledger)에는 남기지 않고 거래 행만 FAILED 로 둔다.
-- 실제로도 모의 결제창에서 "승인 거절"을 누르면 같은 모양(FAILED · PG_DECLINED)의 충전 행이 생긴다.
-- =====================================================================

-- 이미 시드된 데모 계정(demo01·demo02)에 실패 이력 2건을 넣는다. 아래 demo_bootstrap 갱신과 같은 구성.
-- 순번은 9001·9002 를 써서 부트스트랩이 만든 주문번호와 겹치지 않게 한다.
do $$
declare
  p record;
begin
  for p in select id from public.profiles where mb_uid in ('demo01', 'demo02')
  loop
    insert into public.transactions (user_id, type, status, amount, charge_method, failure_code, order_no,
                                     goods_name, created_at)
    values (p.id, 'CHARGE', 'FAILED', 50000, 'BANK_TRANSFER', 'PG_DECLINED',
            'CHG' || to_char(now() - interval '3 days', 'YYYYMMDDHH24MISS') || '9001',
            '잔액 충전', now() - interval '3 days');

    insert into public.transactions (user_id, type, status, amount, bank_account_id, failure_code, order_no,
                                     goods_name, created_at)
    select p.id, 'REFUND'::public.transaction_type, 'FAILED'::public.transaction_status, 20000, b.id, 'BANK_ERROR',
           'RFD' || to_char(now() - interval '10 days', 'YYYYMMDDHH24MISS') || '9002',
           '잔액 환불', now() - interval '10 days'
      from public.bank_accounts b
     where b.user_id = p.id and b.purpose = 'REFUND' and b.is_primary;
  end loop;
end $$;

create or replace function public.demo_bootstrap(
  p_user_id uuid,
  p_mb_uid  text,
  p_name    text,
  p_pin     text default '123456'
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_wallet   public.wallets%rowtype;
  v_merchant public.merchants%rowtype;
  v_tx       public.transactions%rowtype;
  v_balance  bigint;
  v_seq      int := 0;
  r          record;
begin
  insert into public.profiles (id, mb_uid, name, email, phone, birth_date, pin_hash)
  select p_user_id, lower(p_mb_uid), p_name, u.email, '010-0000-0000', date '1994-03-21',
         crypt(p_pin, gen_salt('bf'))
    from auth.users u where u.id = p_user_id
  on conflict (id) do nothing;

  insert into public.wallets (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into v_wallet from public.wallets where user_id = p_user_id;

  -- 충전 3건 (75일 전 1건은 이용내역 "3개월" 필터에서만 보이는 케이스). 충전 수단은 앱이 실제로 제공하는 계좌이체만 쓴다
  for r in select * from (values (150000, 'BANK_TRANSFER', 75), (200000, 'BANK_TRANSFER', 26), (100000, 'BANK_TRANSFER', 12)) as t(amt, method, days_ago)
  loop
    v_seq := v_seq + 1;
    insert into public.transactions (user_id, type, status, amount, charge_method, order_no,
                                     goods_name, approved_at, created_at)
    values (p_user_id, 'CHARGE', 'APPROVED', r.amt, r.method::public.charge_method,
            -- 실제 충전 플로우(create_charge)와 같은 형식: CHG + 일시 + 4자리
            'CHG' || to_char(now() - (r.days_ago || ' days')::interval, 'YYYYMMDDHH24MISS') || lpad(v_seq::text, 4, '0'),
            '잔액 충전',
            now() - (r.days_ago || ' days')::interval,
            now() - (r.days_ago || ' days')::interval)
    returning * into v_tx;

    v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'CREDIT', r.amt, '충전');
    update public.transactions set balance_after = v_balance where id = v_tx.id;
  end loop;

  -- 결제 이력 (34일 전 이후 4건은 이용내역 "3개월" 필터에서만 보이는 케이스)
  for r in
    select m.id as merchant_id, g.amount, g.goods, g.days_ago
      from (values
        ('M20260001',  5500, '아메리카노 2잔',  1),
        ('M20260003', 12400, '생필품',          2),
        ('M20260002',  9000, '참치김밥 세트',   4),
        ('M20260004',  7800, '크루아상 외 2건', 6),
        ('M20260007', 13500, '돈코츠 라멘',     8),
        ('M20260006', 18000, '단행본 1권',     11),
        ('M20260005', 99000, '헬스 1개월권',   15),
        ('M20260008',  6200, '종합비타민',     19),
        ('M20260002',  8500, '떡볶이 세트',    34),
        ('M20260004', 15600, '식빵 외 3건',    45),
        ('M20260001',  4500, '아메리카노 1잔', 58),
        ('M20260007', 27000, '라멘 2인 세트',  70)
      ) as g(mid, amount, goods, days_ago)
      join public.merchants m on m.mid = g.mid
     order by g.days_ago desc   -- 오래된 것부터 넣어 순번을 예측 가능하게 둔다
  loop
    v_seq := v_seq + 1;
    insert into public.transactions (user_id, type, status, amount, merchant_id, order_no,
                                     goods_name, approved_at, created_at)
    values (p_user_id, 'PAYMENT', 'APPROVED', r.amount, r.merchant_id,
            -- 실제 결제 플로우(issue_payment_request)와 같은 형식: ORD + 일시 + 3자리
            'ORD' || to_char(now() - (r.days_ago || ' days')::interval, 'YYYYMMDDHH24MISSMS') || lpad(v_seq::text, 3, '0'),
            r.goods,
            now() - (r.days_ago || ' days')::interval,
            now() - (r.days_ago || ' days')::interval)
    returning * into v_tx;

    v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'DEBIT', r.amount, r.goods);
    update public.transactions set balance_after = v_balance where id = v_tx.id;
  end loop;

  -- 부분 취소된 결제 1건 (화면에서 취소 뱃지를 확인하기 위한 케이스)
  select * into v_tx from public.transactions
   where user_id = p_user_id and type = 'PAYMENT' and goods_name = '생필품';
  if found then
    v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'CREDIT', 2500, '부분 취소');
    update public.transactions
       set canceled_amount = 2500, status = 'PARTIALLY_CANCELED', canceled_at = now() - interval '20 hours'
     where id = v_tx.id;
  end if;

  -- 전체 취소된 결제 1건 (결제 직후 2시간 뒤 취소. 잔액에는 영향 없음)
  v_seq := v_seq + 1;
  insert into public.transactions (user_id, type, status, amount, merchant_id, order_no,
                                   goods_name, approved_at, created_at)
  select p_user_id, 'PAYMENT'::public.transaction_type, 'APPROVED'::public.transaction_status, 12000, m.id,
         'ORD' || to_char(now() - interval '9 days', 'YYYYMMDDHH24MISSMS') || lpad(v_seq::text, 3, '0'),
         '문제집 1권', now() - interval '9 days', now() - interval '9 days'
    from public.merchants m where m.mid = 'M20260006'
  returning * into v_tx;
  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'DEBIT', 12000, '문제집 1권');
  v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'CREDIT', 12000, '결제 취소');
  update public.transactions
     set balance_after = v_balance, canceled_amount = 12000, status = 'CANCELED',
         canceled_at = now() - interval '9 days' + interval '2 hours'
   where id = v_tx.id;

  -- 환불(출금) 계좌 1개. 출금 거래가 이 계좌를 참조한다.
  -- 실제 등록 플로우(account-verify)와 같은 형식: 마스킹 = 앞 3자리 + * + 뒤 4자리, 지문 = sha256(은행코드:계좌번호)
  insert into public.bank_accounts (user_id, bank_code, account_no_masked, account_fingerprint,
                                    holder_name, purpose, is_primary, verified_at)
  values (p_user_id, '088', '110*****6789', encode(digest('088:110123456789', 'sha256'), 'hex'),
          p_name, 'REFUND', true, now() - interval '30 days')
  on conflict (user_id, purpose, account_fingerprint) do nothing;

  -- 출금 2건 (이용내역 "충전 > 출금" 필터와 "모두" 목록에서 출금 행을 볼 수 있게)
  for r in select * from (values (30000, 22), (50000, 5)) as t(amt, days_ago)
  loop
    v_seq := v_seq + 1;
    insert into public.transactions (user_id, type, status, amount, bank_account_id, order_no,
                                     goods_name, approved_at, created_at)
    select p_user_id, 'REFUND'::public.transaction_type, 'APPROVED'::public.transaction_status, r.amt, b.id,
           -- 실제 출금 플로우(request_refund)와 같은 형식: RFD + 일시 + 4자리
           'RFD' || to_char(now() - (r.days_ago || ' days')::interval, 'YYYYMMDDHH24MISS') || lpad(v_seq::text, 4, '0'),
           '잔액 환불',
           now() - (r.days_ago || ' days')::interval,
           now() - (r.days_ago || ' days')::interval
      from public.bank_accounts b
     where b.user_id = p_user_id and b.purpose = 'REFUND' and b.is_primary
    returning * into v_tx;

    v_balance := public.post_ledger(v_wallet.id, v_tx.id, 'DEBIT', r.amt, '환불 출금');
    update public.transactions set balance_after = v_balance where id = v_tx.id;
  end loop;

  -- 실패 이력 2건 (이용내역 "충전 > 실패" / "출금 > 실패" 필터에서 볼 수 있게).
  -- 돈이 움직이지 않은 건이라 장부(ledger)에는 남기지 않고 거래 행만 FAILED 로 둔다.
  -- 실제로도 모의 결제창에서 "승인 거절"을 누르면 같은 모양(FAILED · PG_DECLINED)의 충전 행이 생긴다.
  v_seq := v_seq + 1;
  insert into public.transactions (user_id, type, status, amount, charge_method, failure_code, order_no,
                                   goods_name, created_at)
  values (p_user_id, 'CHARGE', 'FAILED', 50000, 'BANK_TRANSFER', 'PG_DECLINED',
          'CHG' || to_char(now() - interval '3 days', 'YYYYMMDDHH24MISS') || lpad(v_seq::text, 4, '0'),
          '잔액 충전', now() - interval '3 days');

  v_seq := v_seq + 1;
  insert into public.transactions (user_id, type, status, amount, bank_account_id, failure_code, order_no,
                                   goods_name, created_at)
  select p_user_id, 'REFUND'::public.transaction_type, 'FAILED'::public.transaction_status, 20000, b.id, 'BANK_ERROR',
         'RFD' || to_char(now() - interval '10 days', 'YYYYMMDDHH24MISS') || lpad(v_seq::text, 4, '0'),
         '잔액 환불', now() - interval '10 days'
    from public.bank_accounts b
   where b.user_id = p_user_id and b.purpose = 'REFUND' and b.is_primary;

  select balance into v_balance from public.wallets where user_id = p_user_id;
  return json_build_object('userId', p_user_id, 'balance', v_balance);
end;
$$;

revoke execute on function public.demo_bootstrap(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.demo_bootstrap(uuid, text, text, text) to service_role;
