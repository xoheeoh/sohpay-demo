/**
 * 데모 계정을 만든다.
 *   node scripts/seed-demo.mjs
 *
 * Auth 계정은 관리자 API 로, 프로필·지갑·거래 이력은 demo_bootstrap() 으로 채운다.
 * 1:1 문의 예시(답변완료 / 답변중)는 이 스크립트에서 바로 넣는다 (아래 DEMO_INQUIRIES).
 * 서비스 롤 키를 쓰므로 로컬 또는 본인 프로젝트에서만 실행할 것.
 */
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  console.error('  예) SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed:demo');
  console.error('  값은 대시보드 Project Settings → Data API / API Keys 에서 확인합니다.');
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { persistSession: false },
  // 이 스크립트는 실시간 기능을 쓰지 않지만, Node 22 미만에서는 클라이언트 생성 시
  // WebSocket 구현이 없어 오류가 나므로 ws 를 넘겨 둔다.
  realtime: { transport: ws },
});

const ACCOUNTS = [
  { mbUid: 'demo01', name: '김데모', pin: '123456', password: 'demo1234!' },
  { mbUid: 'demo02', name: '이샘플', pin: '654321', password: 'demo1234!' },
];

/** 지금으로부터 n일 전 시각 (ISO 문자열) */
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/**
 * 1:1 문의 예시. 문의내역 탭에서 "답변완료"와 "답변중"이 둘 다 보이도록 두 건씩 넣는다.
 * - category: 01 결제 | 02 충전 | 03 출금 | 04 계정 (앱 InquiryEnrollScreen 의 optionMapping 과 같다)
 * - body 는 평문(줄바꿈 \n), answer 는 앱에서 HTML 로 렌더링하므로 <br /> 로 줄을 나눈다
 * - answer 가 없으면 답변중, 있으면 답변완료로 표시된다
 */
const DEMO_INQUIRIES = [
  {
    category: '01',
    title: '같은 가맹점에서 결제가 두 번 찍혀 있어요',
    body: '연남동 커피로스터스에서 QR 결제를 한 번만 했는데\n이용내역에 결제가 두 건으로 보입니다. 한 건은 취소해 주세요.',
    answer:
      '안녕하세요, SohPay 고객센터입니다.<br /><br />' +
      '확인 결과 두 건 중 한 건은 가맹점 요청으로 이미 취소 처리되어 잔액이 복구되었습니다.<br />' +
      '이용내역에서 거래 상태를 "취소"로 조회하시면 해당 건을 확인하실 수 있습니다.<br /><br />' +
      '불편을 드려 죄송합니다.',
    createdDaysAgo: 8,
    answeredDaysAgo: 7,
  },
  {
    category: '02',
    title: '계좌이체로 충전했는데 잔액에 반영이 안 됩니다',
    body: '오늘 오전에 계좌이체 충전을 완료했는데 잔액이 그대로예요.\n결제창에서는 승인 완료라고 나왔습니다.',
    answer:
      '안녕하세요, SohPay 고객센터입니다.<br /><br />' +
      '계좌이체 충전은 은행 승인 후 반영까지 최대 10분 정도 걸릴 수 있습니다.<br />' +
      '확인 시점에는 정상 반영되어 있으며, 홈 화면을 아래로 당겨 새로고침하시면 최신 잔액이 표시됩니다.',
    createdDaysAgo: 4,
    answeredDaysAgo: 4,
  },
  {
    category: '03',
    title: '출금 신청한 금액은 언제 입금되나요?',
    body: '어제 저녁에 50,000원 출금을 신청했는데 아직 계좌에 들어오지 않았습니다.\n보통 얼마나 걸리는지 알려주세요.',
    answer: null,
    createdDaysAgo: 1,
    answeredDaysAgo: null,
  },
  {
    category: '04',
    title: '간편 비밀번호를 잊어버렸어요',
    body: '간편 비밀번호 6자리를 잊어서 결제를 못 하고 있습니다.\n다시 설정하려면 어떻게 해야 하나요?',
    answer: null,
    createdDaysAgo: 0,
    answeredDaysAgo: null,
  },
];

/** 데모 계정의 1:1 문의 예시를 넣는다. 서비스 롤이라 RLS 를 거치지 않는다. */
const seedInquiries = async (userId) => {
  const rows = DEMO_INQUIRIES.map((q) => ({
    user_id: userId,
    category: q.category,
    title: q.title,
    body: q.body,
    answer: q.answer,
    answered_at: q.answeredDaysAgo === null ? null : daysAgo(q.answeredDaysAgo),
    created_at: daysAgo(q.createdDaysAgo),
  }));
  const { error } = await admin.from('inquiries').insert(rows);
  return error;
};

for (const acc of ACCOUNTS) {
  const email = `${acc.mbUid}@demo.sohpay.app`;

  // 이미 있으면 지우고 다시 만든다 (시드는 몇 번이고 돌릴 수 있어야 한다).
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.from('ledger_entries').delete().in(
      'wallet_id',
      (await admin.from('wallets').select('id').eq('user_id', existing.id)).data?.map((w) => w.id) ?? []
    );
    await admin.from('transactions').delete().eq('user_id', existing.id);
    await admin.from('payment_requests').delete().eq('used_by', existing.id);
    await admin.from('bank_accounts').delete().eq('user_id', existing.id);
    await admin.from('account_verifications').delete().eq('user_id', existing.id);
    await admin.from('inquiries').delete().eq('user_id', existing.id); // 테스트로 등록한 문의도 함께 정리
    await admin.from('wallets').delete().eq('user_id', existing.id);
    await admin.from('profiles').delete().eq('id', existing.id);
    await admin.auth.admin.deleteUser(existing.id);
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password: acc.password,
    email_confirm: true,
  });
  if (authError) {
    console.error(`${acc.mbUid} 계정 생성 실패:`, authError.message);
    continue;
  }

  const { data, error } = await admin.rpc('demo_bootstrap', {
    p_user_id: created.user.id,
    p_mb_uid: acc.mbUid,
    p_name: acc.name,
    p_pin: acc.pin,
  });

  if (error) {
    console.error(`${acc.mbUid} 데이터 생성 실패:`, error.message);
    continue;
  }

  const inquiryError = await seedInquiries(created.user.id);
  if (inquiryError) {
    console.error(`${acc.mbUid} 1:1 문의 예시 생성 실패:`, inquiryError.message);
  }

  console.log(
    `✓ ${acc.mbUid} / ${acc.password}  (PIN ${acc.pin})  잔액 ${Number(data.balance).toLocaleString('ko-KR')}원` +
      `  1:1 문의 ${DEMO_INQUIRIES.length}건`,
  );
}

// 앱에서 스캔할 QR 하나를 미리 뽑아둔다.
const { data: qr } = await admin.rpc('issue_payment_request', {
  p_mid: 'M20260001',
  p_amount: 5500,
  p_goods_name: '아메리카노 2잔',
  p_ttl_seconds: 86400,
});
console.log(`\n데모 QR 토큰 (24시간 유효):\n  ${qr?.qrToken}`);
