/**
 * 공통 API 어댑터 (회원 정보 · 잔액 · 공지 · FAQ · 가맹점).
 */
import { IFAQList, INoticeList } from '@typ/commonType';
import { IMidInfo, IRmnAmt } from '@typ/paymentType';
import { IUserProfile } from '@typ/userType';
import { fail, ok, supabase, toFail, unwrap, ymd, ymdhms } from './client';

/* 마케팅 정보 수신 동의 조회 (설정 화면) */
export const loadMarketingOptIn = async () => {
  try {
    const p = unwrap(await supabase.from('profiles').select('marketing_opt_in').single()) as {
      marketing_opt_in: boolean;
    };
    return ok({ optIn: p.marketing_opt_in });
  } catch (e) {
    return toFail(e);
  }
};

/**
 * 마케팅 정보 수신 동의 변경 (설정 화면). profiles 의 marketing_opt_in 은 본인이 바꿀 수 있게 열려 있다.
 * 주의: 서버(PostgREST)는 어느 행을 고칠지 조건(WHERE)이 없는 갱신을 거절한다 ("UPDATE requires a WHERE clause").
 * 접근 정책이 내 행만 허용하더라도 조건은 꼭 붙여야 한다.
 */
export const updateMarketingOptIn = async (optIn: boolean) => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return fail('UNAUTHENTICATED');
    unwrap(
      await supabase.from('profiles').update({ marketing_opt_in: optIn }).eq('id', auth.user.id).select('id').single(),
    );
    return ok();
  } catch (e) {
    return toFail(e);
  }
};

/* 선불 회원 조회 (간소화) */
export const loadUsrInfoData = async () => {
  try {
    const p = unwrap(
      await supabase.from('profiles').select('mb_uid, name, email, phone, birth_date, created_at').single(),
    ) as {
      mb_uid: string;
      name: string;
      email: string;
      phone: string | null;
      birth_date: string | null;
      created_at: string;
    };
    const profile: IUserProfile = {
      mbUid: p.mb_uid,
      usrNm: p.name,
      email: p.email,
      hpNo: (p.phone ?? '').replace(/\D/g, ''),
      brthDt: (p.birth_date ?? '').replace(/-/g, ''),
      joinDnt: ymdhms(p.created_at),
      pointUseFlg: '0',
    };
    return ok(profile);
  } catch (e) {
    return toFail(e);
  }
};

/* 선불회원 잔액 조회 */
export const loadUserAmt = async () => {
  try {
    const w = unwrap(await supabase.from('wallets').select('balance').single()) as { balance: number };
    const b = String(w.balance);
    const amt: IRmnAmt = { sumPpRmnAmt: b, ppCanRfndRmnAmt: b, ppNeverRfndRmnAmt: '0', pointAmt: '0', moneyAmt: b };
    return ok(amt);
  } catch (e) {
    return toFail(e);
  }
};

/* 공지사항 조회 */
export const InquiryNotice = async () => {
  try {
    const rows = unwrap(
      await supabase
        .from('notices')
        .select('id, title, body, is_pinned, published_at')
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false }),
    ) as { id: string; title: string; body: string; is_pinned: boolean; published_at: string }[];
    const listData: INoticeList[] = rows.map((n, i) => ({
      seq: i + 1,
      title: n.title,
      body: n.body,
      notiCd: n.is_pinned ? '1' : '0',
      notiCdNm: n.is_pinned ? '중요' : '일반',
      regDt: ymd(n.published_at),
      frDt: ymd(n.published_at),
      toDt: '99991231',
    }));
    return ok({ listData });
  } catch (e) {
    return toFail(e);
  }
};

/** FAQ 카테고리 코드 → 표시 이름. FAQ 화면의 카테고리 선택 옵션도 이 표를 그대로 쓴다 (코드 불일치 방지) */
export const FAQ_CTGR_NM: Record<string, string> = { CHARGE: '충전', PAYMENT: '결제', REFUND: '출금', ACCOUNT: '계정' };

/* FAQ 조회 */
export const InquiryFAQ = async (title?: string, ctgr?: string) => {
  try {
    let q = supabase.from('faqs').select('id, category, question, answer, sort_no').order('category').order('sort_no');
    if (ctgr) q = q.eq('category', ctgr);
    if (title) q = q.ilike('question', `%${title}%`);
    const rows = unwrap(await q) as {
      id: string;
      category: string;
      question: string;
      answer: string;
      sort_no: number;
    }[];
    const listData: IFAQList[] = rows.map((f, i) => ({
      seq: i + 1,
      title: f.question,
      body: f.answer,
      ctgr: f.category,
      ctgrNm: FAQ_CTGR_NM[f.category] ?? f.category,
      regDt: '20260101',
    }));
    return ok({ listData });
  } catch (e) {
    return toFail(e);
  }
};

/* 1:1 상담 등록 */
export const enrollInquiry = async (head: string, body: string, ctgr: string) => {
  try {
    const { data: auth } = await supabase.auth.getUser();
    unwrap(
      await supabase
        .from('inquiries')
        .insert({ user_id: auth.user?.id, category: ctgr, title: head, body })
        .select('id')
        .single(),
    );
    return ok();
  } catch (e) {
    return toFail(e);
  }
};

/* 1:1 상담 내역 조회 */
export const loadMyInquiry = async (head?: string, ctgr?: string) => {
  try {
    let q = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (ctgr) q = q.eq('category', ctgr);
    if (head) q = q.ilike('title', `%${head}%`);
    const rows = unwrap(await q) as {
      id: string;
      category: string;
      title: string;
      body: string;
      answer: string | null;
      answered_at: string | null;
      created_at: string;
    }[];
    const listData = rows.map((r, i) => ({
      seq: i + 1,
      ctgr: r.category,
      qnaStType: r.answer ? '1' : '0',
      qnaStTypeNm: r.answer ? '답변완료' : '접수',
      regDt: ymd(r.created_at),
      head: r.title,
      body: r.body,
      answerList: r.answer
        ? {
            seq: 1,
            qnaStType: '1',
            qnaStTypeNm: '답변',
            regDt: ymd(r.answered_at ?? r.created_at),
            head: `RE: ${r.title}`,
            body: r.answer,
          }
        : undefined,
    }));
    return ok({ listData });
  } catch (e) {
    return toFail(e);
  }
};

/* 가맹점 정보 조회 */
export const loadMidInfo = async (mid: string) => {
  try {
    const m = unwrap(
      await supabase.from('merchants').select('mid, name, category, address, business_no').eq('mid', mid).maybeSingle(),
    ) as {
      mid: string;
      name: string;
      category: string | null;
      address: string | null;
      business_no: string | null;
    } | null;
    if (!m) return toFail({ code: 'MERCHANT_NOT_FOUND' });
    const info: IMidInfo = {
      coNo: m.business_no ?? '',
      coNm: m.name,
      hostingCd: '',
      repNm: '',
      useFlg: '1',
      postNo: '',
      addrNo1: m.address ?? '',
      addrNo2: '',
      rpostNo: '',
      raddrNo1: m.address ?? '',
      raddrNo2: '',
      telNo: '',
      faxNo: '',
      email: '',
    };
    return ok(info);
  } catch (e) {
    return toFail(e);
  }
};
