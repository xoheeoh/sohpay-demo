-- =====================================================================
-- 회원가입 함수(complete_signup)의 search_path 에 extensions 스키마를 다시 넣는다.
--
-- 20260929000100 에서 함수를 새로 만들 때 옛 정의의 `search_path = public, pg_temp` 를 그대로 가져왔다.
-- 그런데 PIN 을 해시하는 crypt()/gen_salt() 는 pgcrypto 확장 함수로 `extensions` 스키마에 있어서,
-- 실제 가입 시 "function gen_salt(unknown) does not exist" 로 프로필 생성이 실패했다.
-- (0500_search_path 마이그레이션이 이미 한 번 고쳤던 것을 새 정의가 되돌린 셈이다.)
-- 함수 본문은 그대로 두고 search_path 설정만 바로잡는다.
-- =====================================================================

alter function public.complete_signup(text, text, text, uuid, boolean, text)
  set search_path = public, extensions, pg_temp;
