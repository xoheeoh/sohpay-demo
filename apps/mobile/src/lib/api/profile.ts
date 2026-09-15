import { supabase } from '../supabase';
import { assertOk, unwrap } from '../errors';
import type { Profile } from './types';

export async function getProfile(): Promise<Profile> {
  return unwrap(await supabase.from('profiles').select('*').single());
}

export async function updateProfile(patch: Partial<Pick<Profile, 'name' | 'phone' | 'marketing_opt_in'>>) {
  return unwrap(await supabase.from('profiles').update(patch).select().single());
}

export async function verifyPin(pin: string) {
  return assertOk(unwrap(await supabase.rpc('verify_pin', { p_pin: pin })) as { ok: boolean; code?: string });
}

export async function changePin(currentPin: string, newPin: string) {
  return assertOk(unwrap(await supabase.rpc('change_pin', { p_current_pin: currentPin, p_new_pin: newPin })) as { ok: boolean; code?: string });
}

export async function withdrawMember(pin: string) {
  return assertOk(unwrap(await supabase.rpc('withdraw_member', { p_pin: pin })) as { ok: boolean; code?: string });
}
