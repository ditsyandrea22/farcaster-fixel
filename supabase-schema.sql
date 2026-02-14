-- Supabase Database Schema for Fixel FID NFT App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address VARCHAR(66) UNIQUE NOT NULL,
  fid INTEGER,
  referral_code VARCHAR(50) UNIQUE,
  total_mints INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_mint_date TIMESTAMP WITH TIME ZONE,
  last_fortune_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_address VARCHAR(66) NOT NULL,
  referred_address VARCHAR(66),
  referral_code VARCHAR(50) NOT NULL,
  minted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create daily_fortunes table
CREATE TABLE IF NOT EXISTS daily_fortunes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address VARCHAR(66) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  streak INTEGER DEFAULT 1,
  draw_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(address, draw_date)
);

-- 4. Create NFTs table (for burn to upgrade feature)
CREATE TABLE IF NOT EXISTS nfts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token_id INTEGER NOT NULL,
  owner_address VARCHAR(66) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  seed INTEGER NOT NULL,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  burned BOOLEAN DEFAULT FALSE,
  burned_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_address ON user_profiles(address);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_daily_fortunes_address ON daily_fortunes(address);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_address);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_fortunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public read access
DROP POLICY IF EXISTS "Public can read user_profiles" ON user_profiles;
CREATE POLICY "Public can read user_profiles" ON user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read referrals" ON referrals;
CREATE POLICY "Public can read referrals" ON referrals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read daily_fortunes" ON daily_fortunes;
CREATE POLICY "Public can read daily_fortunes" ON daily_fortunes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read nfts" ON nfts;
CREATE POLICY "Public can read nfts" ON nfts FOR SELECT USING (true);

-- 8. Create policies for authenticated insert/update
DROP POLICY IF EXISTS "Users can insert user_profiles" ON user_profiles;
CREATE POLICY "Users can insert user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update user_profiles" ON user_profiles;
CREATE POLICY "Users can update user_profiles" ON user_profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;
CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert daily_fortunes" ON daily_fortunes;
CREATE POLICY "Users can insert daily_fortunes" ON daily_fortunes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert nfts" ON nfts;
CREATE POLICY "Users can insert nfts" ON nfts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update nfts" ON nfts;
CREATE POLICY "Users can update nfts" ON nfts FOR UPDATE USING (true);

-- 9. Add unique constraint for referral_code if not exists
ALTER TABLE user_profiles ADD CONSTRAINT unique_referral_code UNIQUE (referral_code);
