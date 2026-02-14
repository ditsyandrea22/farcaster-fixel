/**
 * Referral API - Handle referral code creation and validation with real data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'
import { 
  generateReferralCode, 
  getReferralReward, 
  isValidReferralCode,
  ReferralCode
} from '@/lib/referral'

// Note: In production, use Vercel KV or database
// const referralCodes = new Map<string, ReferralCode>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const fid = searchParams.get('fid')
  const address = searchParams.get('address')

  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await getRateLimitResult(ip, defaultConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate referral code
    if (code) {
      if (!isValidReferralCode(code)) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
      }
      
      // In production, fetch from Vercel KV
      return NextResponse.json({
        code,
        exists: false,
        reward: getReferralReward(0),
      })
    }

    // Generate new code for FID
    if (fid) {
      const fidNum = parseInt(fid)
      const newCode = generateReferralCode(fidNum)

      return NextResponse.json({
        code: newCode,
        referrerFid: fidNum,
        totalReferrals: 0,
        successfulReferrals: 0,
        reward: getReferralReward(0),
      })
    }

    return NextResponse.json({ error: 'Missing code or fid parameter' }, { status: 400 })

  } catch (error) {
    console.error('Referral API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, address, referredByCode } = body

    if (!fid) {
      return NextResponse.json({ error: 'Missing FID' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await getRateLimitResult(ip, defaultConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate referral code if provided
    if (referredByCode && !isValidReferralCode(referredByCode)) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    // Generate new referral code for user
    const fidNum = parseInt(fid)
    const userCode = generateReferralCode(fidNum)

    // Calculate rewards
    let refereeReward = null
    
    if (referredByCode) {
      refereeReward = getReferralReward(0) // New referrer gets tier 1 rewards
    }

    return NextResponse.json({
      success: true,
      referralCode: userCode,
      referredBy: referredByCode || null,
      refereeReward,
      discount: refereeReward?.refereeDiscount || 0,
      rarityBoost: refereeReward?.refereeRarityBoost || 0,
    })

  } catch (error) {
    console.error('Referral POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { referralCode, refereeAddress, rarity } = body

    if (!referralCode || !refereeAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In production, update Vercel KV

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Referral PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
