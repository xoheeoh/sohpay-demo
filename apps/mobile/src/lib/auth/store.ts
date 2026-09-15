import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { emailFor, supabase } from '../supabase';
import { AppError, unwrap } from '../errors';
import type { Profile } from '../api/types';

type Status = 'booting' | 'signedOut' | 'needsProfile' | 'signedIn';

type AuthState = {
  status: Status;
  session: Session | null;
  profile: Profile | null;
  boot: () => Promise<void>;
  signIn: (mbUid: string, password: string) => Promise<void>;
  signUp: (input: { mbUid: string; password: string; pin: string; name: string; verificationId: string | null; marketing: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

async function loadProfile(): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').maybeSingle();
  return (data as Profile | null) ?? null;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'booting',
  session: null,
  profile: null,

  boot: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return set({ status: 'signedOut', session: null, profile: null });

    const profile = await loadProfile();
    set({ session, profile, status: profile ? 'signedIn' : 'needsProfile' });

    // 토큰 만료·재발급 실패 시 로그인 화면으로 돌려보낸다.
    supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT' || (!s && event === 'TOKEN_REFRESHED')) {
        set({ status: 'signedOut', session: null, profile: null });
      } else if (s) {
        set({ session: s });
      }
    });
  },

  signIn: async (mbUid, password) => {
    const res = await supabase.auth.signInWithPassword({ email: emailFor(mbUid), password });
    if (res.error) throw new AppError(res.error.code ?? res.error.message, res.error);
    const profile = await loadProfile();
    if (profile?.status === 'WITHDRAWN') {
      await supabase.auth.signOut();
      throw new AppError('MEMBER_NOT_ACTIVE');
    }
    set({ session: res.data.session, profile, status: profile ? 'signedIn' : 'needsProfile' });
  },

  signUp: async ({ mbUid, password, pin, name, verificationId, marketing }) => {
    const res = await supabase.auth.signUp({ email: emailFor(mbUid), password });
    if (res.error) throw new AppError(res.error.code ?? res.error.message, res.error);
    if (!res.data.session) throw new AppError('UNAUTHENTICATED');

    try {
      unwrap(
        await supabase.rpc('complete_signup', {
          p_mb_uid: mbUid.trim().toLowerCase(),
          p_name: name,
          p_pin: pin,
          p_verification_id: verificationId,
          p_marketing_opt_in: marketing,
        })
      );
    } catch (e) {
      // 프로필 생성에 실패하면 반쯤 만들어진 계정을 남기지 않는다.
      await supabase.auth.signOut();
      throw e;
    }

    const profile = await loadProfile();
    set({ session: res.data.session, profile, status: 'signedIn' });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ status: 'signedOut', session: null, profile: null });
  },

  reloadProfile: async () => {
    const profile = await loadProfile();
    set({ profile, status: profile ? get().status : 'needsProfile' });
  },
}));
