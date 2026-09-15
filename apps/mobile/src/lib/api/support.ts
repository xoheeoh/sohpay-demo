import { supabase } from '../supabase';
import { unwrap } from '../errors';
import type { Faq, Merchant, Notice, Term } from './types';

export async function listNotices(): Promise<Notice[]> {
  return unwrap(await supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('published_at', { ascending: false }));
}

export async function listFaqs(): Promise<Faq[]> {
  return unwrap(await supabase.from('faqs').select('*').order('category').order('sort_no'));
}

export async function listTerms(): Promise<Term[]> {
  return unwrap(await supabase.from('terms').select('*').order('sort_no'));
}

export async function listMerchants(): Promise<Merchant[]> {
  return unwrap(await supabase.from('merchants').select('id, mid, name, category, address, logo_emoji').order('name'));
}
