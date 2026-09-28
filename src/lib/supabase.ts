import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://nplwoopouwvgpwbmkint.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHdvb3BvdXd2Z3B3Ym1raW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NjE0ODQsImV4cCI6MjEwNjEzNzQ4NH0.V8mYiZ1yy4qp5vJH3t9PDp42T2spZP2gPWpnTXGiz8o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserProfile = {
  id: string;
  email: string;
  phone: string;
  plan: string;
  balance: number;
  completed_surveys: number[];
  unlocked_survey_ids: number[];
  daily_withdrawn: number;
  last_withdrawal_date: string | null;
  activated: boolean;
  created_at: string;
};
