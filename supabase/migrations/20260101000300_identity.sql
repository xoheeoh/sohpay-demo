-- =====================================================================
-- 본인인증 (모의)
-- 가입 전 단계라 로그인 세션이 없다. 따라서 클라이언트에 테이블을 열지 않고
-- Edge Function 의 서비스 롤로만 다룬다. (RLS 켜고 정책을 만들지 않음)
-- =====================================================================
create table public.identity_verifications (
  id          uuid primary key default gen_random_uuid(),
  status      text not null default 'PENDING'
                check (status in ('PENDING', 'VERIFIED', 'FAILED', 'CONSUMED')),
  method      text not null default 'MOBILE'
                check (method in ('MOBILE', 'SIMPLE', 'IPIN')),
  name        text,
  birth_date  date,
  phone       text,
  -- 실제 서비스의 CI(연계정보) 자리. 데모에서는 이름+생년월일+번호의 해시를 쓴다.
  member_auth_key text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '10 minutes'
);

alter table public.identity_verifications enable row level security;

create index identity_verifications_expiry_idx
  on public.identity_verifications (expires_at);

-- 가입 시 같은 사람이 계정을 여러 개 만드는 것을 막기 위한 장치.
-- 실제 서비스에서 CI 중복 검사에 해당한다.
alter table public.profiles
  add column member_auth_key text;

create unique index profiles_member_auth_key_uniq
  on public.profiles (member_auth_key)
  where member_auth_key is not null and status <> 'WITHDRAWN';
