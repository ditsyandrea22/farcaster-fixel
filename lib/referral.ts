/**
 * Referral System - Single Source of Truth
 * 
 * Features:
 * - Generate unique referral codes
 * - Track referrals
 * - Calculate referral rewards
 * - Bonus rarity chance for referrer
 */

import { RarityTier } from './rarity'

// ============================================================================
// Types
// ============================================================================

export interface ReferralCode {
  code: string
  referrerFid: number
  referrerAddress: string
  createdAt: number
  totalReferrals: number
  successfulReferrals: number
}

export interface Referral {
  id: string
  referralCode: string
  refereeFid: number | null
  refereeAddress: string
  refereeMintTx: string | null
  refereeRarity: RarityTier | null
  rewardClaimed: boolean
  createdAt: number
  completedAt: number | null
}

export interface ReferralReward {
  referrerBonusChance: number // Additional % chance for rare NFT
  refereeDiscount: number // Discount on mint price (in ETH)
  refereeRarityBoost: number // Additional % chance for rare NFT
}

// ============================================================================
// Referral Code Generation
// ============================================================================

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluded confusing chars
const CODE_LENGTH = 8

/**
 * Generate a unique referral code from FID
 */
export function generateReferralCode(fid: number): string {
  // Use FID as seed for deterministic but unique code
  let seed = fid * 9999 + Date.now()
  let code = ''
  
  for (let i = 0; i < CODE_LENGTH; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    code += CODE_CHARS[seed % CODE_CHARS.length]
  }
  
  return code
}

/**
 * Generate a short referral link
 */
export function generateReferralLink(code: string, baseUrl: string = 'https://farcaster.xyz'): string {
  return `${baseUrl}/frame/${code}`
}

// ============================================================================
// Reward Configuration
// ============================================================================

export const REFERRAL_TIERS: Record<number, ReferralReward> = {
  // Tier 1: 1-5 successful referrals
  5: {
    referrerBonusChance: 5, // +5% chance for rare NFT
    refereeDiscount: 0, // No discount
    refereeRarityBoost: 3, // +3% chance for rare NFT
  },
  // Tier 2: 6-15 successful referrals
  15: {
    referrerBonusChance: 10, // +10% chance for rare NFT
    refereeDiscount: 0.0001, // 0.0001 ETH discount
    refereeRarityBoost: 5,
  },
  // Tier 3: 16-30 successful referrals
  30: {
    referrerBonusChance: 15, // +15% chance for rare NFT
    refereeDiscount: 0.0002, // 0.0002 ETH discount
    refereeRarityBoost: 8,
  },
  // Tier 4: 31+ successful referrals
  999999: {
    referrerBonusChance: 25, // +25% chance for rare NFT
    refereeDiscount: 0.0003, // 0.0003 ETH discount
    refereeRarityBoost: 10,
  },
}

/**
 * Get referral reward based on total successful referrals
 */
export function getReferralReward(totalReferrals: number): ReferralReward {
  const tiers = Object.keys(REFERRAL_TIERS).map(Number).sort((a, b) => a - b)
  
  for (const tier of tiers) {
    if (totalReferrals <= tier) {
      return REFERRAL_TIERS[tier]
    }
  }
  
  return REFERRAL_TIERS[999999]
}

/**
 * Calculate mint price after referral discount
 */
export function calculateMintPriceWithReferral(
  basePrice: string,
  referralCode: string | null,
  referralData: ReferralCode | null
): string {
  if (!referralCode || !referralData) {
    return basePrice
  }
  
  const reward = getReferralReward(referralData.totalReferrals)
  const discount = reward.refereeDiscount
  
  // Convert to Wei, subtract discount, convert back
  const basePriceWei = BigInt(Math.round(parseFloat(basePrice) * 1e18))
  const discountWei = BigInt(Math.round(discount * 1e18))
  
  const newPrice = basePriceWei - discountWei
  return (Number(newPrice) / 1e18).toString()
}

// ============================================================================
// Rarity Bonus Calculation
// ============================================================================

/**
 * Apply referral bonus to rarity roll
 * Returns adjusted random threshold for rare NFT
 */
export function applyReferralBonus(
  baseThreshold: number, // 0-100, lower = more rare
  referralData: ReferralCode | null
): number {
  if (!referralData) return baseThreshold
  
  const reward = getReferralReward(referralData.totalReferrals)
  const referrerBonus = reward.referrerBonusChance
  
  // Reduce threshold by bonus amount (easier to get rare)
  // For example: threshold 1 (Platinum) becomes 1 + bonus
  return Math.max(0, baseThreshold - referrerBonus)
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  if (!code || code.length !== CODE_LENGTH) return false
  return [...code].every(char => CODE_CHARS.includes(char))
}

/**
 * Check if referral code belongs to user
 */
export function isOwnReferralCode(code: string, userFid: number): boolean {
  // In production, check against database
  return false // Placeholder
}

// ============================================================================
// Storage Keys (for Vercel KV)
// ============================================================================

export const REFERRAL_KEYS = {
  code: (code: string) => `referral:code:${code}`,
  referrer: (fid: number) => `referrer:${fid}`,
  referee: (address: string) => `referee:${address.toLowerCase()}`,
  stats: () => 'referral:stats',
}
