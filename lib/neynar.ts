// Neynar utilities - kept for compatibility but no longer required for NFT generation
// NFT generation now uses wallet address directly
// Rarity logic has been centralized in lib/rarity.ts

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

// Re-export rarity utilities from centralized module
// All rarity logic has been moved to lib/rarity.ts
export {
  type RarityTier,
  RARITY_TIERS,
  RARITY_DISTRIBUTION,
  MAX_SUPPLY,
  determineRarity,
  determineRarityFromFid,
  determineRarityFromAddress,
  hashFid,
  hashAddress,
  generateRandomSeed,
} from '@/lib/rarity'

// NFT generation URL helper - kept for compatibility
export function generateNftImageUrl(address: string, walletShort?: string): string {
  return `/api/nft-image?address=${address}&wallet=${encodeURIComponent(walletShort || '')}`
}
