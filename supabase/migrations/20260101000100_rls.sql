-- =====================================================================
-- SohPay Demo — 행 수준 보안 (RLS)
--
-- 방침
--   · 조회는 RLS 로 "본인 것만" 허용한다.
--   · 잔액·거래를 만드는 쓰기는 테이블에 직접 허용하지 않는다.
--     반드시 security definer 함수(다음 마이그레이션)를 거치게 한다.
--     → 클라이언트가 토큰을 들고 있어도 잔액을 직접 UPDATE 할 수 없다.
-- =====================================================================

alter table public.profiles             enable row level security;
alter table public.wallets              enable row level security;
alter table public.merchants            enable row level security;
alter table public.bank_accounts        enable row level security;
alter table public.account_verifications enable row level security;
alter table public.payment_requests     enable row level security;
alter table public.transactions         enable row level security;
alter table public.ledger_entries       enable row level security;
alter table public.notices              enable row level security;
alter table public.faqs                 enable row level security;
alter table public.inquiries            enable row level security;
alter table public.terms                enable row level security;

-- 기본 권한 정리: 테이블 직접 쓰기를 열어주지 않는다.
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles,
  public.wallets,
  public.merchants,
  public.bank_accounts,
  public.transactions,
  public.ledger_entries,
  public.notices,
  public.faqs,
  public.inquiries,
  public.terms,
  public.recent_transactions
to authenticated;

grant select on public.notices, public.faqs, public.terms to anon;

-- 프로필은 일부 컬럼만 본인이 직접 수정할 수 있다.
grant update (name, phone, marketing_opt_in) on public.profiles to authenticated;

-- 1:1 문의는 본인 명의로 직접 등록할 수 있다.
grant insert on public.inquiries to authenticated;

-- ── 회원 ─────────────────────────────────────────────────────────────
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and status = 'ACTIVE')
  with check (id = (select auth.uid()));

-- ── 지갑 ─────────────────────────────────────────────────────────────
-- 조회만 가능하다. UPDATE 정책이 없으므로 잔액을 직접 고칠 수 없다.
create policy wallets_select_own on public.wallets
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ── 거래 / 원장 ──────────────────────────────────────────────────────
create policy transactions_select_own on public.transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy ledger_select_own on public.ledger_entries
  for select to authenticated
  using (
    wallet_id in (
      select w.id from public.wallets w where w.user_id = (select auth.uid())
    )
  );

-- ── 계좌 ─────────────────────────────────────────────────────────────
create policy bank_accounts_select_own on public.bank_accounts
  for select to authenticated
  using (user_id = (select auth.uid()));

-- 계좌 1원 인증 레코드는 클라이언트에 노출하지 않는다.
-- (정책을 만들지 않으면 RLS 가 모든 행을 가린다. Edge Function 의 서비스 롤만 접근한다.)

-- ── QR 결제 요청 ─────────────────────────────────────────────────────
-- 토큰을 아는 사람이 남의 결제 요청을 훑어볼 수 없도록 직접 조회를 막고,
-- resolve_payment_request() RPC 로만 열람하게 한다.

-- ── 가맹점 / 공지 / FAQ / 약관 ───────────────────────────────────────
create policy merchants_select_all on public.merchants
  for select to authenticated using (true);

create policy notices_select_all on public.notices
  for select to anon, authenticated using (true);

create policy faqs_select_all on public.faqs
  for select to anon, authenticated using (true);

create policy terms_select_all on public.terms
  for select to anon, authenticated using (true);

-- ── 1:1 문의 ─────────────────────────────────────────────────────────
create policy inquiries_select_own on public.inquiries
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy inquiries_insert_own on public.inquiries
  for insert to authenticated
  with check (user_id = (select auth.uid()));
