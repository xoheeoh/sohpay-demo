-- =====================================================================
-- 가입 시 본인인증 결과를 연결한다.
-- 같은 사람(member_auth_key)이 계정을 중복 생성하지 못하게 막는다.
-- =====================================================================
drop function if exists public.complete_signup(text, text, text, text, date, boolean);

create or replace function public.complete_signup(
  p_mb_uid           text,
  p_name             text,
  p_pin              text,
  p_verification_id  uuid default null,
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

  select u.email into v_email from auth.users u where u.id = v_uid;

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

-- 아이디 중복 확인 (가입 화면에서 실시간 체크)
create or replace function public.is_mb_uid_available(p_mb_uid text)
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select json_build_object(
    'available',
    p_mb_uid ~ '^[a-z0-9_]{6,20}$'
      and not exists (select 1 from public.profiles where mb_uid = lower(p_mb_uid))
  );
$$;

revoke execute on function public.complete_signup(text, text, text, uuid, boolean) from public, anon;
revoke execute on function public.is_mb_uid_available(text) from public;

grant execute on function public.complete_signup(text, text, text, uuid, boolean) to authenticated;
grant execute on function public.is_mb_uid_available(text) to anon, authenticated;
