/**
 * Achievements API - Get user achievements from real blockchain data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, generousConfig } from '@/lib/rate-limit'
import { ACHIEVEMENTS, checkAchievements, getAchievementProgress } from '@/lib/achievements'
import { getBalance, getContractStats } from '@/lib/blockchain'

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
    const address = searchParams.get('address')
    const fid = searchParams.get('fid')

    if (!address && !fid) {
      return NextResponse.json(
        { error: 'Missing address or fid parameter' },
        { status: 400 }
      )
    }

    // Get real data from blockchain
    const userAddress = address?.toLowerCase()
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Get user's real NFT balance
    const balance = await getBalance(userAddress)
    
    // Get contract stats
    const contractStats = await getContractStats()
    
    // Build user stats from real data
    const userStats = {
      totalMints: balance,
      platinumCount: 0, // Would need to query each NFT
      goldCount: 0,
      silverCount: 0,
      uncommonCount: 0,
      commonCount: balance,
      referralCount: 0, // Would need Vercel KV storage
      mintedAt: Date.now(),
      launchTimestamp: contractStats.latestBlock - (30 * 24 * 60 * 60), // Approx 30 days ago
    }

    // Check which achievements are unlocked
    const unlockedIds = checkAchievements(userStats)
    
    // Get progress for all achievements
    const achievements = Object.values(ACHIEVEMENTS).map(achievement => {
      const progress = getAchievementProgress(achievement.id, userStats)
      const isUnlocked = unlockedIds.includes(achievement.id)
      
      return {
        ...achievement,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked ? Date.now() : null,
        progress: progress,
      }
    })

    // Sort: unlocked first, then by rarity
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
    achievements.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      return rarityOrder[a.rarity] - rarityOrder[b.rarity]
    })

    return NextResponse.json({
      userId: userAddress,
      stats: userStats,
      achievements,
      unlockedCount: unlockedIds.length,
      totalCount: Object.keys(ACHIEVEMENTS).length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}
