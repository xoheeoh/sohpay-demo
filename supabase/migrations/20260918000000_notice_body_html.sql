-- 이미 들어가 있는 데모 공지 본문을 평문 → HTML 로 바꾼다.
-- 공지 본문은 관리자 HTML 편집기 출력물을 전제로 앱이 HTML 로 그린다.
-- seed.sql 의 초기 데이터가 평문+줄 바꿈 문자로 들어가 있어 화면에서 줄이 나뉘지 않던 것을 맞춘다.
-- 이미 HTML 인 행(본문이 '<' 로 시작)은 건드리지 않으므로 여러 번 실행해도 안전하다.

update public.notices
   set body = '<p>더 나은 서비스를 위해 정기 점검을 진행합니다.</p><p>· 일시: 매월 둘째 주 화요일 02:00~04:00<br>· 영향: 충전 및 결제 일시 중단</p>'
 where title = '서비스 점검 안내' and body not like '<%';

update public.notices
   set body = '<p>1회 결제 한도가 30만원에서 50만원으로 상향되었습니다.</p><p>1일 한도는 200만원으로 유지됩니다.</p>'
 where title = 'QR 결제 한도 상향 안내' and body not like '<%';

update public.notices
   set body = '<p>1원 인증으로 환불 계좌를 등록할 수 있습니다.</p><p>마이페이지 &gt; 계좌 관리에서 이용해 주세요.</p>'
 where title = '계좌 간편등록 기능 추가' and body not like '<%';
