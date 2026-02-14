import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client for browser
// Add these to your .env.local:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are provided
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to get supabase client with a warning if not configured
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    console.warn('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

// Safe wrapper for supabase operations
export async function withSupabase<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallback: T
): Promise<T> {
  if (!supabase) {
    console.warn('Supabase not configured, using fallback');
    return fallback;
  }
  try {
    return await operation(supabase);
  } catch (error) {
    console.error('Supabase operation failed:', error);
    return fallback;
  }
}

// Database types
export interface UserProfile {
  id: string;
  address: string;
  fid: number | null;
  total_mints: number;
  total_referrals: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_address: string;
  referred_address: string;
  referral_code: string;
  minted: boolean;
  created_at: string;
}

export interface DailyFortune {
  id: string;
  address: string;
  tier: string;
  streak: number;
  draw_date: string;
  created_at: string;
}

export interface NFT {
  id: string;
  token_id: number;
  owner_address: string;
  rarity: string;
  minted_at: string;
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
