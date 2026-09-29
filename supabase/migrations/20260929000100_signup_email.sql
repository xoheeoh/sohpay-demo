-- =====================================================================
-- 회원가입 함수에 이메일 인자를 추가한다.
--
-- 전에는 프로필 이메일을 로그인용 가짜 주소(아이디@demo.sohpay.app)로 넣은 뒤 앱이 "한 번 더 요청"해서
-- 가입 화면에 입력한 진짜 이메일로 덮어썼다. 두 번째 요청이 실패하면 콘솔 경고만 남고 프로필에는 가짜 주소가
-- 그대로 남았다 (실제로 발생). 이제 가입 함수가 처음부터 진짜 이메일로 프로필을 만든다.
--
-- 함수 시그니처가 바뀌므로 옛 함수를 지우고 새로 만든다 (같은 이름이 두 개 남아 있으면 rpc 호출이 모호해진다).
-- =====================================================================

drop function if exists public.complete_signup(text, text, text, uuid, boolean);

create or replace function public.complete_signup(
  p_mb_uid           text,
  p_name             text,
  p_pin              text,
  p_verification_id  uuid default null,
  p_marketing_opt_in boolean default false,
  p_email            text default null
)
returns json
language plpgsql
security definer
-- crypt()/gen_salt() 는 pgcrypto 확장 함수라 extensions 스키마가 search_path 에 있어야 한다 (0500_search_path 참고)
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_ident public.identity_verifications%rowtype;
begin
  if v_uid is null then
    perform public.app_error('UNAUTHENTICATED');
  end if;

  if p_mb_uid !~ '^[a-z0-9_]{6,20}$' then
    perform public.app_error('INVALID_MB_UID', '아이디는 영문 소문자·숫자 6~20자입니다.');
  end if;

  if p_pin !~ '^[0-9]{6}$' then
    perform public.app_error('INVALID_PIN_FORMAT', 'PIN 은 숫자 6자리여야 합니다.');
  end if;

  -- 연락용 이메일: 가입 화면 입력값. 비어 있으면 로그인용 주소로 채워 이전 동작을 유지한다.
  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' then
    select u.email into v_email from auth.users u where u.id = v_uid;
  elsif v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    perform public.app_error('INVALID_EMAIL', '이메일 주소 형식이 올바르지 않습니다.');
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    perform public.app_error('ALREADY_REGISTERED');
  end if;

  if p_verification_id is not null then
    select * into v_ident from public.identity_verifications
     where id = p_verification_id for update;

    if not found or v_ident.status <> 'VERIFIED' then
      perform public.app_error('IDENTITY_NOT_VERIFIED');
    end if;

    if v_ident.expires_at <= now() then
      perform public.app_error('IDENTITY_EXPIRED');
    end if;

    if exists (
      select 1 from public.profiles
       where member_auth_key = v_ident.member_auth_key and status <> 'WITHDRAWN'
    ) then
      perform public.app_error('ALREADY_JOINED_MEMBER', '이미 가입된 사용자입니다.');
    end if;

    update public.identity_verifications set status = 'CONSUMED' where id = v_ident.id;
  end if;

  insert into public.profiles (id, mb_uid, name, email, phone, birth_date,
                               pin_hash, marketing_opt_in, member_auth_key)
  values (v_uid,
          lower(p_mb_uid),
          coalesce(v_ident.name, p_name),
          v_email,
          v_ident.phone,
          v_ident.birth_date,
          crypt(p_pin, gen_salt('bf')),
          p_marketing_opt_in,
          v_ident.member_auth_key);

  insert into public.wallets (user_id) values (v_uid);

  return json_build_object('ok', true, 'userId', v_uid, 'mbUid', lower(p_mb_uid));
exception
  when unique_violation then
    perform public.app_error('MB_UID_TAKEN');
    return null;
end;
$$;

revoke execute on function public.complete_signup(text, text, text, uuid, boolean, text) from public, anon;
grant execute on function public.complete_signup(text, text, text, uuid, boolean, text) to authenticated;
