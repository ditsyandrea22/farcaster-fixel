// Neynar utilities - kept for compatibility but no longer required for NFT generation
// NFT generation now uses wallet address directly

export interface UserProfile {
  fid: number
  username: string
  displayName: string
  pfp: {
    url: string
  }
  profile: {
    bio: {
      text: string
    }
  }
}

export async function getUserProfile(fid: number): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/user-profile?fid=${fid}`)

    if (!response.ok) {
      console.error('Failed to fetch user profile:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export interface FidLookupResult {
  fid: number
  username: string
  displayName: string
}

export async function getFidFromAddress(address: string): Promise<FidLookupResult | null> {
  try {
    const response = await fetch(`/api/fid-from-address?address=${address}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle 402 Payment Required
      if (response.status === 402) {
        throw new Error('API_LIMIT_REACHED')
      }
      
      // Handle 429 Rate Limit
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED')
      }
      
      console.error('Failed to fetch FID from address:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error && (error.message === 'API_LIMIT_REACHED' || error.message === 'RATE_LIMIT_EXCEEDED')) {
      throw error // Re-throw for special handling
    }
    console.error('Error fetching FID from address:', error)
    return null
  }
}

// NFT generation now uses wallet address directly - this function kept for compatibility
export function generateNftImageUrl(address: string, walletShort?: string): string {
  return `/api/nft-image?address=${address}&wallet=${encodeURIComponent(walletShort || '')}`
}

// Rarity tier determination - available for client-side use
export type RarityTier = 'COMMON' | 'UNCOMMON' | 'SILVER' | 'GOLD' | 'PLATINUM'

export function determineRarity(address: string): RarityTier {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const rand = (Math.abs(hash) % 10000) / 100 // 0-100 scale
  
  let cumulative = 0
  const rates = [
    { tier: 'COMMON' as RarityTier, rate: 80 },
    { tier: 'UNCOMMON' as RarityTier, rate: 15 },
    { tier: 'SILVER' as RarityTier, rate: 4 },
    { tier: 'GOLD' as RarityTier, rate: 0.99 },
    { tier: 'PLATINUM' as RarityTier, rate: 0.01 },
  ]
  
  for (const { tier, rate } of rates) {
    cumulative += rate
    if (rand <= cumulative) {
      return tier
    }
  }
  return 'COMMON'
}

export const RARITY_CONFIG = {
  COMMON: { name: 'COMMON', rate: 80, color: '#6B7280' },
  UNCOMMON: { name: 'UNCOMMON', rate: 15, color: '#10B981' },
  SILVER: { name: 'SILVER', rate: 4, color: '#94A3B8' },
  GOLD: { name: 'GOLD', rate: 0.99, color: '#F59E0B' },
  PLATINUM: { name: 'PLATINUM', rate: 0.01, color: '#E5E7EB' },
} as const

export const MAX_SUPPLY = 20000
