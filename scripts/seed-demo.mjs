/**
 * 데모 계정을 만든다.
 *   node scripts/seed-demo.mjs
 *
 * Auth 계정은 관리자 API 로, 프로필·지갑·거래 이력은 demo_bootstrap() 으로 채운다.
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

  console.log(`✓ ${acc.mbUid} / ${acc.password}  (PIN ${acc.pin})  잔액 ${Number(data.balance).toLocaleString('ko-KR')}원`);
}

// 앱에서 스캔할 QR 하나를 미리 뽑아둔다.
const { data: qr } = await admin.rpc('issue_payment_request', {
  p_mid: 'M20260001',
  p_amount: 5500,
  p_goods_name: '아메리카노 2잔',
  p_ttl_seconds: 86400,
});
console.log(`\n데모 QR 토큰 (24시간 유효):\n  ${qr?.qrToken}`);
