import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export type { User };

export async function signUp(email: string, password: string, phone: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { phone } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertProfile(userId: string, email: string, phone: string) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    phone,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('upsertProfile error:', error);
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function logSurveyCompletion(
  userId: string,
  surveyId: number,
  company: string,
  earned: number
) {
  const { error } = await supabase.from('survey_completions').insert({
    user_id: userId,
    survey_id: surveyId,
    company,
    earned,
  });
  if (error) console.error('logSurveyCompletion error:', error);
}

export async function logWithdrawal(
  userId: string,
  amount: number,
  phone: string,
  checkoutRequestId?: string
) {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      amount,
      phone,
      checkout_request_id: checkoutRequestId,
      status: 'pending',
    })
    .select()
    .single();
  if (error) { console.error('logWithdrawal error:', error); return null; }
  return data;
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: string,
  receipt?: string
) {
  const { error } = await supabase
    .from('withdrawals')
    .update({ status, mpesa_receipt: receipt })
    .eq('id', withdrawalId);
  if (error) console.error('updateWithdrawalStatus error:', error);
}

export async function logUnlockPurchase(
  userId: string,
  surveyIds: number[],
  amountPaid: number,
  checkoutRequestId?: string
) {
  const { data, error } = await supabase
    .from('unlock_purchases')
    .insert({
      user_id: userId,
      survey_ids: surveyIds,
      amount_paid: amountPaid,
      checkout_request_id: checkoutRequestId,
      status: 'pending',
    })
    .select()
    .single();
  if (error) { console.error('logUnlockPurchase error:', error); return null; }
  return data;
}

export async function logUpgradePurchase(
  userId: string,
  planName: string,
  amountPaid: number,
  checkoutRequestId?: string
) {
  const { data, error } = await supabase
    .from('upgrade_purchases')
    .insert({
      user_id: userId,
      plan_name: planName,
      amount_paid: amountPaid,
      checkout_request_id: checkoutRequestId,
      status: 'pending',
    })
    .select()
    .single();
  if (error) { console.error('logUpgradePurchase error:', error); return null; }
  return data;
}
