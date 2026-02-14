import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// POST /api/user-profile - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, fid, action, tier, streak } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const addressLower = address.toLowerCase();

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to mock response if Supabase not configured
      // For update_fortune, return success with the data that would be saved
      if (action === 'update_fortune') {
        return NextResponse.json({
          address: addressLower,
          fid: fid || null,
          total_mints: 0,
          total_referrals: 0,
          current_streak: streak || 1,
          longest_streak: streak || 1,
          referral_code: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
          last_fortune_date: new Date().toISOString().split('T')[0],
          last_mint_date: null,
          message: 'Supabase not configured - fortune saved locally only'
        });
      }
      
      return NextResponse.json({
        address: addressLower,
        fid: fid || null,
        total_mints: 0,
        total_referrals: 0,
        current_streak: 0,
        longest_streak: 0,
        referral_code: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
        last_fortune_date: null,
        message: 'Supabase not configured - using mock data'
      });
    }

    // Handle update_fortune action
    if (action === 'update_fortune') {
      const today = new Date().toISOString().split('T')[0];
      
      // First try to get existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('address', addressLower)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Also save to daily_fortunes table for history
      await supabase
        .from('daily_fortunes')
        .upsert({
          address: addressLower,
          tier: tier || 'COMMON',
          streak: streak || 1,
          draw_date: today,
        }, {
          onConflict: 'address,draw_date'
        });

      if (existing) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            last_fortune_date: today,
            current_streak: streak || 1,
            longest_streak: Math.max(streak || 1, existing.longest_streak || 0),
            updated_at: new Date().toISOString(),
          })
          .eq('address', addressLower)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      } else {
        // Create new profile with fortune
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            address: addressLower,
            fid: fid || null,
            referral_code: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
            total_mints: 0,
            total_referrals: 0,
            current_streak: streak || 1,
            longest_streak: streak || 1,
            last_fortune_date: today,
          })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      }
    }

    if (action === 'increment_mint') {
      // Increment mint count and update streak
      const { data: existing, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('address', addressLower)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const today = new Date().toDateString();
      const lastMintDate = existing?.last_mint_date ? new Date(existing.last_mint_date).toDateString() : null;
      
      let newStreak = existing?.current_streak || 0;
      
      // Check if streak should continue or reset
      if (lastMintDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastMintDate === yesterday.toDateString()) {
          newStreak += 1;
        } else if (lastMintDate !== today) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, existing?.longest_streak || 0);

      if (existing) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            total_mints: (existing.total_mints || 0) + 1,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_mint_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('address', addressLower)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      } else {
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            address: addressLower,
            fid: fid || null,
            total_mints: 1,
            total_referrals: 0,
            current_streak: newStreak,
            longest_streak: newStreak,
            referral_code: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
            last_mint_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      }
    }

    // Default: Get or create profile
    const { data: existing, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('address', addressLower)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new profile
    const referralCode = `FIXEL-${address.slice(2, 8).toUpperCase()}`;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        address: addressLower,
        fid: fid || null,
        referral_code: referralCode,
        total_mints: 0,
        total_referrals: 0,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in user-profile API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/user-profile?address=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json({
        address: address.toLowerCase(),
        total_mints: 0,
        total_referrals: 0,
        current_streak: 0,
        longest_streak: 0,
        referral_code: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
        last_fortune_date: null,
        message: 'Supabase not configured'
      });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('address', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return NextResponse.json(data);
    }

    // Return default if not found
    return NextResponse.json({
      address: address.toLowerCase(),
      total_mints: 0,
      total_referrals: 0,
      current_streak: 0,
      longest_streak: 0,
      referral_code: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
      last_fortune_date: null,
    });

  } catch (error: any) {
    console.error('Error in user-profile GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
