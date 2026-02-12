import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'
import {
  RARITY_TIERS,
  type RarityTier,
  RARITY_DETAILS,
  hashFid,
  hashAddress,
  generateRandomSeed,
  determineRarity,
  getAttributes,
  getTierColor,
} from '@/lib/rarity'

export const runtime = 'nodejs'

const DEFAULT_BASE_URL = 'https://farcaster-fixel.vercel.app'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL

// Warn if using default URL in production
if (BASE_URL === DEFAULT_BASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: NFT metadata is using default BASE_URL. '
    + 'Set NEXT_PUBLIC_BASE_URL environment variable for production use.')
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const rateLimit = await getRateLimitResult(ip)
    
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
      return NextResponse.json({ error: 'FID, wallet address, or token ID is required' }, { status: 400 })
    }

    // Determine the seed for this NFT
    let seed: number
    let ownerAddress: string | null = null
    
    if (tokenId) {
      // If tokenId is provided, use it as the seed (deterministic)
      seed = parseInt(tokenId, 10) || generateRandomSeed()
    } else if (randomize) {
      // Truly random seed for each request
      seed = generateRandomSeed()
      ownerAddress = address || null
    } else {
      // Deterministic seed based on FID or address
      seed = fid ? hashFid(fid) : hashAddress(address!)
      ownerAddress = address || null
    }

    // Determine rarity based on seed
    const rarity = determineRarity(seed)
    const rarityDetails = RARITY_DETAILS[rarity]
    
    // Generate image URL
    const imageUrl = tokenId 
      ? `${BASE_URL}/api/nft-image?tokenId=${tokenId}`
      : (fid 
          ? `${BASE_URL}/api/nft-image?fid=${fid}`
          : `${BASE_URL}/api/nft-image?address=${address}`
        )

    // Generate external URL for the NFT
    const externalUrl = tokenId
      ? `${BASE_URL}/nft/${tokenId}`
      : `${BASE_URL}?fid=${fid || ''}&address=${address || ''}`

    // Build ERC721 compliant metadata
    const metadata = {
      name: `PixelCaster AI #${tokenId || (seed % 20000 + 1).toString().padStart(5, '0')}`,
      description: rarityDetails.description,
      image: imageUrl,
      image_url: imageUrl,
      external_url: externalUrl,
      externalUrl: externalUrl,
      animation_url: null,
      youtube_url: null,
      background_color: getTierColor(rarity).replace('#', ''),
      background_color_hex: getTierColor(rarity).replace('#', ''),
      traits: getAttributes(rarity, seed),
      attributes: getAttributes(rarity, seed),
      collection: {
        name: 'PixelCaster AI',
        family: 'PixelCaster AI Collection',
        display_name: 'PixelCaster AI NFT',
      },
      dna: seed.toString(16),
      date: Date.now(),
      generated_at: new Date().toISOString(),
      compiler: 'PixelCaster AI Generator v1.0 (CSPRNG)',
      randomness: {
        algorithm: 'Mulberry32 + Web Crypto API',
        seed: seed,
        is_deterministic: !randomize,
      },
      created_by: ownerAddress || 'unknown',
    }

    // Add CORS headers for external access
    const response = NextResponse.json(metadata, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })

    return response
  } catch (error) {
    console.error('Error generating NFT metadata:', error)
    return NextResponse.json(
      { error: 'Failed to generate metadata' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
