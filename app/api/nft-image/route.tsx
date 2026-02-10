import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Get base URL from environment or use a default for server-side generation
const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  return 'https://farcaster-fixel.vercel.app' // Fallback production URL
}

// Rarity tiers with distribution rates
const RARITY_TIERS = {
  COMMON: { name: 'COMMON', rate: 80, color: '#6B7280' },
  UNCOMMON: { name: 'UNCOMMON', rate: 15, color: '#10B981' },
  SILVER: { name: 'SILVER', rate: 4, color: '#94A3B8' },
  GOLD: { name: 'GOLD', rate: 0.99, color: '#F59E0B' },
  PLATINUM: { name: 'PLATINUM', rate: 0.01, color: '#E5E7EB' },
} as const

export type RarityTier = keyof typeof RARITY_TIERS
export const MAX_SUPPLY = 20000

// Cryptographically secure random number generator (0-1)
function cryptoRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] / (0xFFFFFFFF + 1)
  }
  // Fallback for Node.js
  return Math.random()
}

// Generate truly random seed using Web Crypto API
function generateRandomSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new BigUint64Array(1)
    crypto.getRandomValues(array as unknown as Uint8Array)
    return Number(array[0] % BigInt(1000000))
  }
  return Math.floor(Math.random() * 1000000)
}

// Mulberry32 - high quality PRNG for better distribution
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Seeded random number generator for deterministic results
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Hash FID to number for seeding
function hashFid(fid: string): number {
  return parseInt(fid, 10) || 0
}

// Hash wallet address to number for seeding
function hashAddress(address: string): number {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Determine rarity based on seeded random using Mulberry32 for better distribution
function determineRarity(seed: number): RarityTier {
  // Use Mulberry32 for better random distribution
  const random = mulberry32(seed)()
  const rand = random * 100
  
  let cumulative = 0
  const rates = [
    { tier: 'COMMON' as RarityTier, rate: RARITY_TIERS.COMMON.rate },
    { tier: 'UNCOMMON' as RarityTier, rate: RARITY_TIERS.UNCOMMON.rate },
    { tier: 'SILVER' as RarityTier, rate: RARITY_TIERS.SILVER.rate },
    { tier: 'GOLD' as RarityTier, rate: RARITY_TIERS.GOLD.rate },
    { tier: 'PLATINUM' as RarityTier, rate: RARITY_TIERS.PLATINUM.rate },
  ]
  
  for (const { tier, rate } of rates) {
    cumulative += rate
    if (rand <= cumulative) {
      return tier
    }
  }
  return 'COMMON'
}

// Generate unique pattern based on seed and rarity
function generatePixelPattern(seed: number, rarity: RarityTier): boolean[][] {
  const gridSize = rarity === 'PLATINUM' ? 16 : rarity === 'GOLD' ? 14 : 12
  const pattern: boolean[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(false))
  
  // Use Mulberry32 for better pattern distribution
  const random = mulberry32(seed)
  
  // Adjust density based on rarity
  const densityMultiplier = rarity === 'PLATINUM' ? 1.5 : rarity === 'GOLD' ? 1.3 : rarity === 'SILVER' ? 1.2 : 1
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const hash = (seed * (i + 1) * (j + 1) * 73856093) ^ ((seed >> 16) * 19349663)
      const threshold = 0.5 / densityMultiplier
      pattern[i][j] = (hash & 1) === 1 && random() > threshold
    }
  }
  
  return pattern
}

// Generate colors based on seed and rarity
function generateColors(seed: number, rarity: RarityTier): { primary: string; secondary: string; accent: string; bgGradient: string } {
  
  // Use Mulberry32 for better color distribution
  const random = mulberry32(seed)
  
  // Adjust saturation and lightness based on rarity
  const rarityBoost = rarity === 'PLATINUM' ? 40 : rarity === 'GOLD' ? 30 : rarity === 'SILVER' ? 20 : 0
  
  const hue1 = (seed * 137.5) % 360
  const hue2 = (hue1 + 180) % 360
  const sat = 60 + ((seed % 20) * 2) + rarityBoost
  const light = 55 + (rarityBoost / 2)
  
  // Special colors for higher rarities
  if (rarity === 'PLATINUM') {
    return {
      primary: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)',
      secondary: 'linear-gradient(135deg, #D1D5DB, #6B7280)',
      accent: '#FFFFFF',
      bgGradient: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 50%, #D1D5DB 100%)',
    }
  }
  
  if (rarity === 'GOLD') {
    return {
      primary: `linear-gradient(135deg, #F59E0B, #D97706)`,
      secondary: `linear-gradient(135deg, #FCD34D, #F59E0B)`,
      accent: '#FEF3C7',
      bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
    }
  }
  
  return {
    primary: `hsl(${hue1}, ${sat}%, ${light}%)`,
    secondary: `hsl(${hue2}, ${sat}%, ${light - 10}%)`,
    accent: `hsl(${(hue1 + 60) % 360}, ${Math.min(sat + 20, 100)}%, ${Math.min(light + 15, 80)}%)`,
    bgGradient: `linear-gradient(135deg, hsl(${hue1}, ${sat}%, 98%) 0%, hsl(${hue2}, ${sat}%, 96%) 100%)`,
  }
}

// Get tier display properties
function getTierProperties(rarity: RarityTier) {
  const tier = RARITY_TIERS[rarity]
  return {
    name: tier.name,
    color: tier.color,
    glowIntensity: rarity === 'PLATINUM' ? 0.8 : rarity === 'GOLD' ? 0.6 : rarity === 'SILVER' ? 0.4 : 0.2,
    borderWidth: rarity === 'PLATINUM' ? 4 : rarity === 'GOLD' ? 3 : rarity === 'SILVER' ? 2 : 1,
    hasSparkles: rarity === 'PLATINUM' || rarity === 'GOLD' || rarity === 'SILVER',
    hasHalo: rarity === 'PLATINUM',
  }
}

// Generate NFT serial number based on seed
function generateSerialNumber(seed: number): string {
  const num = (seed % MAX_SUPPLY) + 1
  return `#${num.toString().padStart(5, '0')}/${MAX_SUPPLY}`
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const rateLimit = getRateLimitResult(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': defaultConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const fid = request.nextUrl.searchParams.get('fid')
    const address = request.nextUrl.searchParams.get('address')
    const tokenId = request.nextUrl.searchParams.get('tokenId')
    const randomize = request.nextUrl.searchParams.get('random') === 'true'

    if (!fid && !address && !tokenId) {
      return NextResponse.json({ error: 'FID or wallet address is required' }, { status: 400 })
    }

    // Use FID if available, otherwise use address or generate random
    let seed: number
    let walletDisplay: string
    
    if (tokenId) {
      seed = parseInt(tokenId, 10) || generateRandomSeed()
      walletDisplay = `Token #${tokenId}`
    } else if (randomize) {
      seed = generateRandomSeed()
      walletDisplay = fid ? `FID ${fid}` : `${address!.slice(0, 6)}...${address!.slice(-4)}`
    } else if (fid) {
      seed = hashFid(fid)
      walletDisplay = `FID ${fid}`
    } else {
      seed = hashAddress(address!)
      walletDisplay = `${address!.slice(0, 6)}...${address!.slice(-4)}`
    }

    const rarity = determineRarity(seed)
    const tierProps = getTierProperties(rarity)
    const colors = generateColors(seed, rarity)
    const pattern = generatePixelPattern(seed, rarity)
    const serialNumber = generateSerialNumber(seed)

    const pixelSize = rarity === 'PLATINUM' ? 50 : rarity === 'GOLD' ? 55 : 60
    const gridSize = pattern.length
    const totalSize = pixelSize * gridSize
    const padding = 120

    // Build glow effect for rare tiers
    const glowStyle = tierProps.hasSparkles ? {
      boxShadow: `
        0 0 ${30 + tierProps.glowIntensity * 40}px ${tierProps.color}40,
        0 0 ${60 + tierProps.glowIntensity * 80}px ${tierProps.color}20,
        0 0 ${100 + tierProps.glowIntensity * 100}px ${tierProps.color}10
      `,
    } : {}

    // Safe color handling
    const getColor = (colorValue: string | { toString(): string }, fallback: string) => {
      if (typeof colorValue === 'string') return colorValue
      try {
        return colorValue.toString()
      } catch {
        return fallback
      }
    }

    const response = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1200px',
            height: '1200px',
            background: getColor(colors.bgGradient, '#f3f4f6'),
            fontFamily: 'system-ui, -apple-system',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Halo effect for Platinum */}
          {tierProps.hasHalo && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229, 231, 235, 0.3) 0%, transparent 70%)',
              }}
            />
          )}

          {/* Decorative background elements */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              right: '50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: tierProps.color,
              opacity: 0.08 * tierProps.glowIntensity + 0.05,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '40px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: tierProps.color,
              opacity: 0.06 * tierProps.glowIntensity + 0.03,
            }}
          />

          {/* Main NFT Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Rarity Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px 32px',
                background: tierProps.hasSparkles 
                  ? `linear-gradient(135deg, ${tierProps.color}30, ${tierProps.color}10)`
                  : `${tierProps.color}15`,
                border: `2px solid ${tierProps.color}${tierProps.hasSparkles ? '80' : '40'}`,
                borderRadius: '16px',
                fontSize: '24px',
                fontWeight: '900',
                letterSpacing: '4px',
                textShadow: tierProps.hasSparkles ? `0 0 20px ${tierProps.color}60` : 'none',
                color: tierProps.hasSparkles ? tierProps.color : tierProps.color,
                textTransform: 'uppercase',
                ...glowStyle,
              }}
            >
              {tierProps.hasSparkles && <span style={{ fontSize: '20px' }}>✨</span>}
              {tierProps.name}
              {tierProps.hasSparkles && <span style={{ fontSize: '20px' }}>✨</span>}
            </div>

            {/* Pixel Art Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
                gap: '2px',
                padding: '24px',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                border: `${tierProps.borderWidth}px solid ${tierProps.color}60`,
                ...glowStyle,
              }}
            >
              {pattern.map((row, i) =>
                row.map((isActive, j) => (
                  <div
                    key={`${i}-${j}`}
                    style={{
                      width: `${pixelSize}px`,
                      height: `${pixelSize}px`,
                      background: isActive 
                        ? (typeof colors.primary === 'string' ? colors.primary : '#6B7280')
                        : (typeof colors.accent === 'string' ? colors.accent : '#E5E7EB'),
                      borderRadius: '4px',
                      opacity: isActive ? 1 : 0.1,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))
              )}
            </div>

            {/* Serial Number */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: tierProps.color,
                  letterSpacing: '2px',
                  fontFamily: 'monospace',
                }}
              >
                {serialNumber}
              </div>
            </div>

            {/* Wallet Address */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: `${tierProps.color}15`,
                border: `2px solid ${tierProps.color}40`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: tierProps.color,
                letterSpacing: '0.5px',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ fontSize: '20px' }}>⛓️</span>
              {walletDisplay}
            </div>
          </div>

          {/* Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              fontSize: '12px',
              color: '#9CA3AF',
              fontFamily: 'monospace',
            }}
          >
            AI GENERATED • {new Date().getFullYear()} • {rarity}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    )

    return response
  } catch (error) {
    console.error('Error generating NFT image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
