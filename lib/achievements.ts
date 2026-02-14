/**
 * Achievement System - Single Source of Truth
 * 
 * Features:
 * - Define all achievements
 * - Check unlock conditions
 * - Calculate rewards
 */

import { RarityTier } from './rarity'

// ============================================================================
// Types
// ============================================================================

export type AchievementId = 
  | 'first_mint'
  | 'lucky_star'
  | 'collector'
  | 'whale'
  | 'social_butterfly'
  | 'referral_master'
  | 'early_bird'
  | 'platinum_hunter'
  | 'gold_rush'
  | 'silver_surfer'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  requirement: string
  reward?: {
    type: 'rarity_bonus' | 'discount' | 'badge'
    value: number | string
  }
}

export interface UserAchievement {
  achievementId: AchievementId
  unlockedAt: number
  progress?: number
}

// ============================================================================
// Achievement Definitions
// ============================================================================

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  // First mint - Mint your first NFT
  first_mint: {
    id: 'first_mint',
    name: 'First Mint',
    description: 'Mint your first PixelCaster NFT',
    icon: '🎉',
    rarity: 'common',
    requirement: 'Mint 1 NFT',
    reward: { type: 'rarity_bonus', value: 5 },
  },

  // Lucky Star - Get a Platinum NFT
  lucky_star: {
    id: 'lucky_star',
    name: 'Lucky Star',
    description: 'Mint a Platinum rarity NFT',
    icon: '💎',
    rarity: 'legendary',
    requirement: 'Get Platinum rarity',
    reward: { type: 'rarity_bonus', value: 10 },
  },

  // Collector - Mint 5+ NFTs
  collector: {
    id: 'collector',
    name: 'Collector',
    description: 'Mint 5 or more NFTs',
    icon: '📚',
    rarity: 'uncommon',
    requirement: 'Mint 5 NFTs',
    reward: { type: 'rarity_bonus', value: 8 },
  },

  // Whale - Mint 10+ NFTs
  whale: {
    id: 'whale',
    name: 'Whale',
    description: 'Mint 10 or more NFTs',
    icon: '🐋',
    rarity: 'epic',
    requirement: 'Mint 10 NFTs',
    reward: { type: 'rarity_bonus', value: 15 },
  },

  // Social Butterfly - Refer 3+ users
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Successfully refer 3 users',
    icon: '🦋',
    rarity: 'rare',
    requirement: 'Refer 3 users',
    reward: { type: 'rarity_bonus', value: 10 },
  },

  // Referral Master - Refer 10+ users
  referral_master: {
    id: 'referral_master',
    name: 'Referral Master',
    description: 'Successfully refer 10 users',
    icon: '👑',
    rarity: 'epic',
    requirement: 'Refer 10 users',
    reward: { type: 'rarity_bonus', value: 20 },
  },

  // Early Bird - Mint in first 24 hours
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Mint within the first 24 hours of launch',
    icon: '🐦',
    rarity: 'rare',
    requirement: 'Mint within 24h of launch',
    // Check timestamp - would be set by contract deployment time
  },

  // Platinum Hunter - Get 3+ Platinum NFTs
  platinum_hunter: {
    id: 'platinum_hunter',
    name: 'Platinum Hunter',
    description: 'Collect 3 Platinum rarity NFTs',
    icon: '🏆',
    rarity: 'legendary',
    requirement: 'Get 3 Platinum NFTs',
    reward: { type: 'rarity_bonus', value: 25 },
  },

  // Gold Rush - Get 5+ Gold NFTs
  gold_rush: {
    id: 'gold_rush',
    name: 'Gold Rush',
    description: 'Collect 5 Gold rarity NFTs',
    icon: '🥇',
    rarity: 'epic',
    requirement: 'Get 5 Gold NFTs',
    reward: { type: 'rarity_bonus', value: 15 },
  },

  // Silver Surfer - Get 10+ Silver NFTs
  silver_surfer: {
    id: 'silver_surfer',
    name: 'Silver Surfer',
    description: 'Collect 10 Silver rarity NFTs',
    icon: '⚡',
    rarity: 'rare',
    requirement: 'Get 10 Silver NFTs',
    reward: { type: 'rarity_bonus', value: 10 },
  },
}

// ============================================================================
// Achievement Checking
// ============================================================================

export interface AchievementCheckInput {
  totalMints: number
  platinumCount: number
  goldCount: number
  silverCount: number
  uncommonCount: number
  commonCount: number
  referralCount: number
  mintedAt?: number // Timestamp of first mint
  launchTimestamp?: number // When the project launched
}

export function checkAchievements(input: AchievementCheckInput): AchievementId[] {
  const unlocked: AchievementId[] = []

  // First Mint
  if (input.totalMints >= 1) {
    unlocked.push('first_mint')
  }

  // Lucky Star
  if (input.platinumCount >= 1) {
    unlocked.push('lucky_star')
  }

  // Collector
  if (input.totalMints >= 5) {
    unlocked.push('collector')
  }

  // Whale
  if (input.totalMints >= 10) {
    unlocked.push('whale')
  }

  // Social Butterfly
  if (input.referralCount >= 3) {
    unlocked.push('social_butterfly')
  }

  // Referral Master
  if (input.referralCount >= 10) {
    unlocked.push('referral_master')
  }

  // Early Bird (if within 24 hours of launch)
  if (input.mintedAt && input.launchTimestamp) {
    const hoursSinceLaunch = (input.mintedAt - input.launchTimestamp) / (1000 * 60 * 60)
    if (hoursSinceLaunch <= 24) {
      unlocked.push('early_bird')
    }
  }

  // Platinum Hunter
  if (input.platinumCount >= 3) {
    unlocked.push('platinum_hunter')
  }

  // Gold Rush
  if (input.goldCount >= 5) {
    unlocked.push('gold_rush')
  }

  // Silver Surfer
  if (input.silverCount >= 10) {
    unlocked.push('silver_surfer')
  }

  return unlocked
}

// ============================================================================
// Rarity Configuration
// ============================================================================

export const ACHIEVEMENT_RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: '#6B7280',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
}

export function getAchievementProgress(
  achievementId: AchievementId,
  input: AchievementCheckInput
): { current: number; target: number; percentage: number } {
  switch (achievementId) {
    case 'first_mint':
      return { current: input.totalMints, target: 1, percentage: Math.min(100, input.totalMints * 100) }
    case 'collector':
      return { current: input.totalMints, target: 5, percentage: Math.min(100, (input.totalMints / 5) * 100) }
    case 'whale':
      return { current: input.totalMints, target: 10, percentage: Math.min(100, (input.totalMints / 10) * 100) }
    case 'lucky_star':
    case 'platinum_hunter':
      return { current: input.platinumCount, target: achievementId === 'lucky_star' ? 1 : 3, percentage: Math.min(100, (input.platinumCount / (achievementId === 'lucky_star' ? 1 : 3)) * 100) }
    case 'gold_rush':
      return { current: input.goldCount, target: 5, percentage: Math.min(100, (input.goldCount / 5) * 100) }
    case 'silver_surfer':
      return { current: input.silverCount, target: 10, percentage: Math.min(100, (input.silverCount / 10) * 100) }
    case 'social_butterfly':
      return { current: input.referralCount, target: 3, percentage: Math.min(100, (input.referralCount / 3) * 100) }
    case 'referral_master':
      return { current: input.referralCount, target: 10, percentage: Math.min(100, (input.referralCount / 10) * 100) }
    default:
      return { current: 0, target: 1, percentage: 0 }
  }
}
