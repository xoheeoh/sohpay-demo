-- =====================================================================
-- SohPay Demo — 스키마
-- 설계 원칙
--   1. 금액은 원(KRW) 단위 bigint. 부동소수점 금액을 쓰지 않는다.
--   2. 잔액의 진실은 ledger_entries 이고, wallets.balance 는 조회 성능을 위한 캐시다.
--   3. 상태 전이·금액 부호 같은 불변식은 애플리케이션이 아니라 제약조건으로 강제한다.
-- =====================================================================

create extension if not exists pgcrypto;

-- ── 열거형 ───────────────────────────────────────────────────────────
create type public.transaction_type as enum ('CHARGE', 'PAYMENT', 'REFUND');

create type public.transaction_status as enum (
  'PENDING',             -- 승인 대기 (충전 결제창 진행 중)
  'APPROVED',            -- 승인 완료
  'PARTIALLY_CANCELED',  -- 부분 취소
  'CANCELED',            -- 전체 취소
  'FAILED'               -- 실패
);

create type public.charge_method as enum ('BANK_TRANSFER', 'VIRTUAL_ACCOUNT');
create type public.ledger_direction as enum ('CREDIT', 'DEBIT');
create type public.bank_account_purpose as enum ('REFUND', 'CHARGE');
create type public.member_status as enum ('ACTIVE', 'DORMANT', 'WITHDRAWN');

-- ── 공통 트리거 ──────────────────────────────────────────────────────
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── 회원 ─────────────────────────────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  mb_uid           text not null unique
                     check (mb_uid ~ '^[a-z0-9_]{6,20}$'),
  name             text not null,
  email            text not null,
  phone            text,
  birth_date       date,
  -- PIN 은 bcrypt 해시로만 보관한다. 원문·복호화 가능한 형태로 저장하지 않는다.
  pin_hash         text not null,
  pin_failures     smallint not null default 0 check (pin_failures >= 0),
  pin_locked_at    timestamptz,
  status           public.member_status not null default 'ACTIVE',
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

comment on column public.profiles.mb_uid is '앱에서 입력받는 로그인 아이디. 인증 자체는 Supabase Auth 가 담당한다.';

-- ── 지갑 ─────────────────────────────────────────────────────────────
create table public.wallets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references public.profiles (id) on delete cascade,
  balance        bigint not null default 0 check (balance >= 0),
  currency       char(3) not null default 'KRW',
  daily_limit    bigint not null default 2000000 check (daily_limit > 0),
  per_tx_limit   bigint not null default 500000 check (per_tx_limit > 0),
  max_balance    bigint not null default 2000000 check (max_balance > 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.tg_set_updated_at();

comment on column public.wallets.max_balance is
  '전자금융거래법상 선불전자지급수단 한도를 흉내 낸 값. 데모용 수치다.';

-- ── 가맹점 ───────────────────────────────────────────────────────────
create table public.merchants (
  id          uuid primary key default gen_random_uuid(),
  mid         text not null unique,
  name        text not null,
  category    text,
  address     text,
  business_no text,
  logo_emoji  text,
  created_at  timestamptz not null default now()
);

-- ── 은행 계좌 ────────────────────────────────────────────────────────
create table public.bank_accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  bank_code         text not null,
  -- 데모 앱이므로 계좌번호 원문은 저장하지 않고 마스킹된 값만 보관한다.
  account_no_masked text not null,
  account_fingerprint text not null,  -- 중복 등록 판별용 해시
  holder_name       text not null,
  purpose           public.bank_account_purpose not null,
  is_primary        boolean not null default false,
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, purpose, account_fingerprint)
);

-- 목적별 대표계좌는 회원당 하나만 존재할 수 있다.
create unique index bank_accounts_single_primary
  on public.bank_accounts (user_id, purpose)
  where is_primary;

-- ── 계좌 1원 인증 ────────────────────────────────────────────────────
create table public.account_verifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  bank_code         text not null,
  account_no_masked text not null,
  account_fingerprint text not null,
  holder_name       text not null,
  code_hash         text not null,
  attempts          smallint not null default 0 check (attempts >= 0),
  verified_at       timestamptz,
  expires_at        timestamptz not null default now() + interval '5 minutes',
  created_at        timestamptz not null default now()
);

create index account_verifications_user_idx
  on public.account_verifications (user_id, created_at desc);

-- ── QR 결제 요청 ─────────────────────────────────────────────────────
create table public.payment_requests (
  id              uuid primary key default gen_random_uuid(),
  merchant_id     uuid not null references public.merchants (id) on delete cascade,
  qr_token        text not null unique,
  order_no        text not null,
  goods_name      text not null,
  amount          bigint not null check (amount > 0),
  supply_amount   bigint not null default 0 check (supply_amount >= 0),
  vat             bigint not null default 0 check (vat >= 0),
  tax_free_amount bigint not null default 0 check (tax_free_amount >= 0),
  status          text not null default 'OPEN'
                    check (status in ('OPEN', 'USED', 'EXPIRED')),
  expires_at      timestamptz not null default now() + interval '5 minutes',
  -- 회원이 삭제돼도 결제 요청 기록 자체는 남긴다(감사 추적).
  used_by         uuid references public.profiles (id) on delete set null,
  used_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique (merchant_id, order_no),
  -- 사용된 요청은 반드시 사용 시각을 가진다.
  constraint payment_requests_used_consistency check (
    (status = 'USED' and used_at is not null)
    or (status <> 'USED' and used_by is null and used_at is null)
  )
);

-- ── 거래 ─────────────────────────────────────────────────────────────
create table public.transactions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  type                    public.transaction_type not null,
  status                  public.transaction_status not null default 'PENDING',
  amount                  bigint not null check (amount > 0),
  canceled_amount         bigint not null default 0 check (canceled_amount >= 0),
  balance_after           bigint check (balance_after >= 0),
  merchant_id             uuid references public.merchants (id),
  payment_request_id      uuid references public.payment_requests (id),
  bank_account_id         uuid references public.bank_accounts (id),
  charge_method           public.charge_method,
  order_no                text not null,
  goods_name              text,
  original_transaction_id uuid references public.transactions (id),
  idempotency_key         text,
  failure_code            text,
  approved_at             timestamptz,
  canceled_at             timestamptz,
  created_at              timestamptz not null default now(),

  constraint transactions_cancel_within_amount
    check (canceled_amount <= amount),

  -- 취소 금액과 상태가 서로 모순되지 않도록 강제한다.
  constraint transactions_status_matches_cancel check (
    (status = 'CANCELED'           and canceled_amount = amount) or
    (status = 'PARTIALLY_CANCELED' and canceled_amount > 0 and canceled_amount < amount) or
    (status in ('PENDING', 'APPROVED', 'FAILED') and canceled_amount = 0)
  ),

  constraint transactions_charge_has_method
    check (type <> 'CHARGE' or charge_method is not null)
);

-- 같은 멱등성 키로 두 번 요청해도 거래는 하나만 생긴다.
create unique index transactions_idempotency
  on public.transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create index transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

create index transactions_user_type_created_idx
  on public.transactions (user_id, type, created_at desc);

-- ── 원장 ─────────────────────────────────────────────────────────────
-- 잔액을 바꾼 모든 사건은 여기에 한 줄씩 남는다. 수정·삭제하지 않는다.
create table public.ledger_entries (
  id             bigint generated always as identity primary key,
  wallet_id      uuid not null references public.wallets (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  direction      public.ledger_direction not null,
  amount         bigint not null check (amount > 0),
  balance_after  bigint not null check (balance_after >= 0),
  memo           text,
  created_at     timestamptz not null default now()
);

create index ledger_entries_wallet_idx
  on public.ledger_entries (wallet_id, id desc);

-- ── 고객센터 ─────────────────────────────────────────────────────────
create table public.notices (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  is_pinned    boolean not null default false,
  published_at timestamptz not null default now()
);

create table public.faqs (
  id       uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer   text not null,
  sort_no  integer not null default 0
);

create table public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  category   text not null,
  title      text not null,
  body       text not null,
  answer     text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index inquiries_user_idx on public.inquiries (user_id, created_at desc);

create table public.terms (
  code       text primary key,
  title      text not null,
  body       text not null,
  is_required boolean not null default true,
  version    text not null default '1.0',
  sort_no    integer not null default 0
);

-- ── 뷰: 대시보드 최근 이력 ───────────────────────────────────────────
create view public.recent_transactions
with (security_invoker = true)
as
select
  t.id,
  t.type,
  t.status,
  t.amount,
  t.canceled_amount,
  t.balance_after,
  t.goods_name,
  t.created_at,
  m.name as merchant_name,
  m.logo_emoji as merchant_emoji
from public.transactions t
left join public.merchants m on m.id = t.merchant_id
where t.status <> 'PENDING'
order by t.created_at desc
limit 20;
