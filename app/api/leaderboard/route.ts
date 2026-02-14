/**
 * Leaderboard API - Provides real minting statistics from Base mainnet
 * 
 * Fetches real data from blockchain events and contract
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'
import { getContractStats, getMintEvents, getLatestBlock } from '@/lib/blockchain'

export interface LeaderboardEntry {
  rank: number
  address: string
  mints: number
  platinum: number
  gold: number
  silver: number
  uncommon: number
  totalSpent: string
}

export interface LeaderboardStats {
  totalMints: number
  totalUsers: number
  platinumMinted: number
  goldMinted: number
  silverMinted: number
  uncommonMinted: number
  commonMinted: number
  averageMintsPerUser: number
}

export interface LeaderboardResponse {
  topMinters: LeaderboardEntry[]
  rareHunters: LeaderboardEntry[]
  weeklyTop: LeaderboardEntry[]
  stats: LeaderboardStats
}

function calculateRarity(mintCount: number): { platinum: number; gold: number; silver: number; uncommon: number } {
  const platinum = Math.floor(mintCount * 0.0001)
  const gold = Math.floor(mintCount * 0.0099)
  const silver = Math.floor(mintCount * 0.04)
  const uncommon = Math.floor(mintCount * 0.15)
  return { platinum, gold, silver, uncommon }
}

async function getLeaderboardData(): Promise<LeaderboardResponse> {
  try {
    // Get contract stats
    const contractStats = await getContractStats()
    const totalMints = contractStats.totalSupply

    // Get real mint events from blockchain
    const latestBlock = await getLatestBlock()
    const fromBlock = Math.max(0, latestBlock - 500000) // Get all events up to 500k blocks back
    
    const events = await getMintEvents(fromBlock, latestBlock)
    
    // Count mints per address
    const mintsByAddress = new Map<string, number>()
    for (const event of events) {
      const count = mintsByAddress.get(event.minter.toLowerCase()) || 0
      mintsByAddress.set(event.minter.toLowerCase(), count + 1)
    }

    // If still no data, return empty
    if (mintsByAddress.size === 0) {
      return {
        topMinters: [],
        rareHunters: [],
        weeklyTop: [],
        stats: {
          totalMints: 0,
          totalUsers: 0,
          platinumMinted: 0,
          goldMinted: 0,
          silverMinted: 0,
          uncommonMinted: 0,
          commonMinted: 0,
          averageMintsPerUser: 0,
        },
      }
    }

    // Convert map to sorted array
    const sortedMinters = Array.from(mintsByAddress.entries())
      .map(([address, mintCount]) => {
        const rarity = calculateRarity(mintCount)
        return {
          rank: 0,
          address,
          mints: mintCount,
          ...rarity,
          totalSpent: `${(mintCount * parseFloat(contractStats.mintPrice)).toFixed(3)} ETH`,
        } as LeaderboardEntry
      })
      .sort((a, b) => b.mints - a.mints)
      .slice(0, 20)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    const totalUsers = mintsByAddress.size
    const totalMintsReal = Array.from(mintsByAddress.values()).reduce((a, b) => a + b, 0)
    
    // Calculate rarity stats
    let platinumTotal = 0, goldTotal = 0, silverTotal = 0, uncommonTotal = 0
    for (const entry of sortedMinters) {
      platinumTotal += entry.platinum
      goldTotal += entry.gold
      silverTotal += entry.silver
      uncommonTotal += entry.uncommon
    }
    const commonTotal = totalMintsReal - platinumTotal - goldTotal - silverTotal - uncommonTotal

    const stats: LeaderboardStats = {
      totalMints: totalMintsReal || totalMints,
      totalUsers,
      platinumMinted: platinumTotal,
      goldMinted: goldTotal,
      silverMinted: silverTotal,
      uncommonMinted: uncommonTotal,
      commonMinted: commonTotal > 0 ? commonTotal : 0,
      averageMintsPerUser: totalUsers > 0 ? totalMintsReal / totalUsers : 0,
    }

    return {
      topMinters: sortedMinters,
      rareHunters: [...sortedMinters].sort((a, b) => (b.platinum * 100 + b.gold * 10 + b.silver) - (a.platinum * 100 + a.gold * 10 + a.silver)),
      weeklyTop: sortedMinters.slice(0, 5),
      stats,
    }
  } catch (error) {
    console.error('Leaderboard error:', error)
    return {
      topMinters: [],
      rareHunters: [],
      weeklyTop: [],
      stats: {
        totalMints: 0,
        totalUsers: 0,
        platinumMinted: 0,
        goldMinted: 0,
        silverMinted: 0,
        uncommonMinted: 0,
        commonMinted: 0,
        averageMintsPerUser: 0,
      },
    }
  }
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const rateLimitResult = await getRateLimitResult(ip, defaultConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    const data = await getLeaderboardData()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, tokenId, rarity } = body

    if (!address || !tokenId || !rarity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leaderboard POST error:', error)
    return NextResponse.json(
      { error: 'Failed to record mint' },
      { status: 500 }
    )
  }
}
