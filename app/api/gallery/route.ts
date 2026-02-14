/**
 * Gallery API - Provides NFT gallery data from real Base mainnet contract
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, generousConfig } from '@/lib/rate-limit'
import { getTotalSupply, getTokenOwners, getContractStats } from '@/lib/blockchain'
import { RARITY_TIERS, determineRarity } from '@/lib/rarity'

export interface GalleryNFT {
  id: string
  tokenId: number
  seed: number
  owner: string
  rarity: 'COMMON' | 'UNCOMMON' | 'SILVER' | 'GOLD' | 'PLATINUM'
  mintedAt: number
  name: string
}

function generateSeed(tokenId: number, owner: string): number {
  const hash = tokenId * 9999 + owner.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return hash % 1000000
}

async function fetchGalleryFromChain(): Promise<GalleryNFT[]> {
  try {
    const stats = await getContractStats()
    const totalSupply = stats.totalSupply

    if (totalSupply === 0) {
      return []
    }

    // Limit to recent 500 mints for performance
    const maxTokens = Math.min(totalSupply, 500)
    const tokenIds = Array.from({ length: maxTokens }, (_, i) => i + 1)

    const owners = await getTokenOwners(tokenIds)

    const nfts: GalleryNFT[] = []

    for (const [tokenId, owner] of owners) {
      if (owner && owner !== '0x0000000000000000000000000000000000000000') {
        const seed = generateSeed(tokenId, owner)
        const rarity = determineRarity(seed)

        nfts.push({
          id: tokenId.toString(),
          tokenId,
          seed,
          owner: owner.toLowerCase(),
          rarity,
          mintedAt: Date.now() - (maxTokens - tokenId) * 60000,
          name: `PixelCaster #${tokenId.toString().padStart(5, '0')}`,
        })
      }
    }

    return nfts
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return []
  }
}

export interface GalleryResponse {
  nfts: GalleryNFT[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  filters: {
    rarity: string[]
    sortBy: string
  }
  contractStats?: {
    totalSupply: number
    maxSupply: number
  }
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const rateLimitResult = await getRateLimitResult(ip, generousConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '12')
    const rarity = searchParams.get('rarity')
    const owner = searchParams.get('owner')
    const sortBy = searchParams.get('sortBy') || 'recent'

    // Fetch real data from blockchain
    let filtered = await fetchGalleryFromChain()

    if (filtered.length === 0) {
      // Return empty if no NFTs or error
      return NextResponse.json({
        nfts: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 0,
        filters: {
          rarity: Object.keys(RARITY_TIERS),
          sortBy,
        },
        contractStats: {
          totalSupply: 0,
          maxSupply: 20000,
        },
      })
    }

    // Filter by rarity
    if (rarity && rarity !== 'all') {
      filtered = filtered.filter(nft => nft.rarity === rarity.toUpperCase())
    }

    // Filter by owner
    if (owner) {
      filtered = filtered.filter(nft => 
        nft.owner.toLowerCase() === owner.toLowerCase()
      )
    }

    // Sort
    switch (sortBy) {
      case 'rarity':
        const rarityOrder = { PLATINUM: 0, GOLD: 1, SILVER: 2, UNCOMMON: 3, COMMON: 4 }
        filtered.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
        break
      case 'oldest':
        filtered.sort((a, b) => a.mintedAt - b.mintedAt)
        break
      case 'recent':
      default:
        filtered.sort((a, b) => b.mintedAt - a.mintedAt)
    }

    // Paginate
    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paginated = filtered.slice(start, start + pageSize)

    const stats = await getContractStats().catch(() => ({
      totalSupply: 0,
      maxSupply: 20000,
    }))

    const response: GalleryResponse = {
      nfts: paginated,
      total,
      page,
      pageSize,
      totalPages,
      filters: {
        rarity: Object.keys(RARITY_TIERS),
        sortBy,
      },
      contractStats: {
        totalSupply: stats.totalSupply,
        maxSupply: stats.maxSupply,
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery data' },
      { status: 500 }
    )
  }
}
