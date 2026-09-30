-- =====================================================================
-- README 에 인쇄된 데모 결제 QR / 결제코드 (20260001, 20260003, 20260007)
--
-- `supabase db push --include-seed` 는 적용할 마이그레이션이 없으면 시드를 건너뛰므로,
-- 이 행들이 db push 한 번으로 확실히 들어가도록 마이그레이션에 둔다.
-- 몇 번 실행해도 같은 결과가 되도록 이미 있으면 내용만 갱신한다 (on conflict).
--
-- 가맹점(M20260001 등)은 seed.sql 에서 들어가며 원격에도 이미 존재한다. 혹시 없더라도 join 에서 걸러져 오류는 나지 않는다.
-- 재사용 QR 의 동작(만료·사용 여부 미검사)은 0700_demo_qr 마이그레이션 참고.
-- =====================================================================

insert into public.payment_requests (merchant_id, qr_token, order_no, goods_name, amount, supply_amount, vat,
                                     expires_at, reusable)
select m.id, d.token, d.order_no, d.goods, d.amount, round(d.amount / 1.1), d.amount - round(d.amount / 1.1),
       timestamptz '2099-12-31 23:59:59+09', true
  from (values
    ('M20260001', '20260001', 'DEMO-CAFE',   '아메리카노 1잔',   4500),
    ('M20260003', '20260003', 'DEMO-STORE',  '생수 외 3건',     12400),
    ('M20260007', '20260007', 'DEMO-RAMEN',  '돈코츠 라멘',     13500)
  ) as d(mid, token, order_no, goods, amount)
  join public.merchants m on m.mid = d.mid
on conflict (qr_token) do update
   set goods_name = excluded.goods_name, amount = excluded.amount,
       supply_amount = excluded.supply_amount, vat = excluded.vat,
       expires_at = excluded.expires_at, reusable = true, status = 'OPEN';
