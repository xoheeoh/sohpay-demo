-- =====================================================================
-- SohPay Demo — 참조 데이터 시드
-- 회원/지갑은 여기서 만들지 않는다. scripts/seed-demo.mjs 가 Auth 계정을
-- 먼저 만든 뒤 demo_bootstrap() 을 호출해 채운다.
-- =====================================================================

insert into public.merchants (mid, name, category, address, business_no, logo_emoji) values
  ('M20260001', '연남동 커피로스터스', '카페',       '서울 마포구 연남로 23',    '120-81-00001', '☕'),
  ('M20260002', '을지로 김밥천국',     '분식',       '서울 중구 을지로12길 7',   '120-81-00002', '🍙'),
  ('M20260003', '합정 편의점 24',      '편의점',     '서울 마포구 양화로 45',    '120-81-00003', '🏪'),
  ('M20260004', '성수 베이커리',       '제과점',     '서울 성동구 아차산로 11',  '120-81-00004', '🥐'),
  ('M20260005', '강남 헬스클럽',       '스포츠시설', '서울 강남구 테헤란로 152', '120-81-00005', '🏋️'),
  ('M20260006', '망원 책방',           '서점',       '서울 마포구 포은로 88',    '120-81-00006', '📚'),
  ('M20260007', '이태원 라멘야',       '일식',       '서울 용산구 이태원로 199', '120-81-00007', '🍜'),
  ('M20260008', '종로 약국',           '약국',       '서울 종로구 종로 89',      '120-81-00008', '💊')
on conflict (mid) do nothing;

-- ── 데모용 상시 결제 QR ──────────────────────────────────────────────
-- README 에 인쇄된 QR / 결제코드. 만료되지 않고 몇 번이든 결제할 수 있다 (0700_demo_qr 참고).
-- 결제코드 화면이 숫자 입력이므로 토큰도 숫자로 둔다.
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

-- 공지 본문은 HTML 문자열이다. (전신 내부 앱에서 관리자가 HTML 편집기로 작성·저장했고, 앱은 그 형식을 RenderHtml 로 그린다)
-- 평문에 줄 바꿈 문자를 넣으면 HTML 규칙상 띄어쓰기로 합쳐져 화면에서 줄이 나뉘지 않으므로, 문단은 <p> 로 감싼다.
insert into public.notices (title, body, is_pinned, published_at) values
  ('서비스 점검 안내',
   '<p>더 나은 서비스를 위해 정기 점검을 진행합니다.</p><p>· 일시: 매월 둘째 주 화요일 02:00~04:00<br>· 영향: 충전 및 결제 일시 중단</p>',
   true, now() - interval '2 days'),
  ('QR 결제 한도 상향 안내',
   '<p>1회 결제 한도가 30만원에서 50만원으로 상향되었습니다.</p><p>1일 한도는 200만원으로 유지됩니다.</p>',
   false, now() - interval '9 days'),
  ('계좌 간편등록 기능 추가',
   '<p>1원 인증으로 환불 계좌를 등록할 수 있습니다.</p><p>마이페이지 &gt; 계좌 관리에서 이용해 주세요.</p>',
   false, now() - interval '21 days')
on conflict do nothing;

insert into public.faqs (category, question, answer, sort_no) values
  ('CHARGE',  '충전 한도가 어떻게 되나요?', '보유 잔액 기준 200만원까지 충전할 수 있습니다. 1회 충전은 1,000원 단위로 가능합니다.', 1),
  ('CHARGE',  '충전했는데 잔액이 안 늘어요', '결제창에서 승인이 완료된 뒤 잔액이 반영됩니다. 5분 이상 지연되면 고객센터로 문의해 주세요.', 2),
  ('PAYMENT', '결제 QR은 얼마 동안 유효한가요?', '발급 시점부터 5분간 유효하며, 한 번 사용된 QR은 재사용할 수 없습니다.', 1),
  ('PAYMENT', '결제 비밀번호를 잊어버렸어요', '마이페이지 > 설정 > 간편 비밀번호 변경에서 재설정할 수 있습니다. 5회 틀리면 10분간 잠깁니다.', 2),
  ('REFUND',  '환불은 어디로 입금되나요?', '등록된 환불 계좌로 입금됩니다. 계좌는 1원 인증을 마쳐야 등록됩니다.', 1),
  ('REFUND',  '환불 수수료가 있나요?', '데모 서비스이므로 수수료는 발생하지 않습니다.', 2),
  ('ACCOUNT', '탈퇴하면 잔액은 어떻게 되나요?', '잔액이 남아 있으면 탈퇴할 수 없습니다. 환불 후 탈퇴해 주세요.', 1)
on conflict do nothing;

insert into public.terms (code, title, body, is_required, sort_no) values
  ('SERVICE', '서비스 이용약관',      '본 약관은 포트폴리오 데모 애플리케이션의 이용 조건을 설명하기 위한 예시 문서입니다. 실제 법적 효력은 없습니다.', true, 1),
  ('PRIVACY', '개인정보 처리방침',    '본 데모는 실제 개인정보를 수집하지 않습니다. 입력된 값은 데모 데이터베이스에만 저장되며 언제든 삭제할 수 있습니다.', true, 2),
  ('EFT',     '전자금융거래 이용약관', '선불전자지급수단의 발행·충전·사용 흐름을 설명하기 위한 예시 문서입니다. 실제 금융거래가 발생하지 않습니다.', true, 3),
  ('MARKETING', '마케팅 정보 수신 동의', '데모용 선택 항목입니다. 실제로 발송되는 메시지는 없습니다.', false, 4)
on conflict (code) do nothing;

-- ── 데모 회원 부트스트랩 ─────────────────────────────────────────────
-- demo_bootstrap() 은 migrations/20260916000000_demo_bootstrap.sql 로 옮겼다.
-- 시드 파일은 적용할 마이그레이션이 없으면 db push 에서 건너뛰어, 함수 수정이 원격에 반영되지 않았기 때문.

-- ── 데모용 QR 발급 ───────────────────────────────────────────────────
-- 가맹점 포스기를 흉내 낸다. 앱에서 스캔할 QR 토큰을 만들어 준다.
create or replace function public.issue_payment_request(
  p_mid        text,
  p_amount     bigint,
  p_goods_name text default '데모 결제',
  p_ttl_seconds int default 300
)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_merchant public.merchants%rowtype;
  v_req      public.payment_requests%rowtype;
begin
  select * into v_merchant from public.merchants where mid = p_mid;
  if not found then
    perform public.app_error('MERCHANT_NOT_FOUND');
  end if;

  if p_amount <= 0 then
    perform public.app_error('INVALID_AMOUNT');
  end if;

  insert into public.payment_requests (merchant_id, qr_token, order_no, goods_name, amount,
                                       supply_amount, vat, expires_at)
  values (v_merchant.id,
          'SOHPAY:' || encode(gen_random_bytes(16), 'hex'),
          'ORD' || to_char(now(), 'YYYYMMDDHH24MISSMS') || lpad((random() * 999)::int::text, 3, '0'),
          p_goods_name,
          p_amount,
          round(p_amount / 1.1),
          p_amount - round(p_amount / 1.1),
          now() + make_interval(secs => p_ttl_seconds))
  returning * into v_req;

  return json_build_object('qrToken', v_req.qr_token, 'orderNo', v_req.order_no,
                           'amount', v_req.amount, 'expiresAt', v_req.expires_at,
                           'merchant', v_merchant.name);
end;
$$;

revoke execute on function public.issue_payment_request(text, bigint, text, int) from public, anon;
grant execute on function public.issue_payment_request(text, bigint, text, int) to authenticated, service_role;
