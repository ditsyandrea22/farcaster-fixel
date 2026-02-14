/**
 * Burn API - Handles NFT burn transactions for upgrades
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, generousConfig } from '@/lib/rate-limit'
import { getTokenOwners } from '@/lib/blockchain'

// Burn upgrade rules
const BURN_RULES = [
  { from: "COMMON", to: "UNCOMMON", cost: 2, chance: 25 },
  { from: "UNCOMMON", to: "SILVER", cost: 2, chance: 15 },
  { from: "SILVER", to: "GOLD", cost: 2, chance: 10 },
  { from: "GOLD", to: "PLATINUM", cost: 2, chance: 5 },
]

interface BurnRequest {
  tokenIds: number[]
  owner: string
}

interface BurnResponse {
  success: boolean
  message: string
  transactionHash?: string
  newRarity?: string
  upgraded?: boolean
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const rateLimitResult = await getRateLimitResult(ip, generousConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body: BurnRequest = await request.json()
    const { tokenIds, owner } = body

    // Validate input
    if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length !== 2) {
      return NextResponse.json(
        { error: 'Please provide exactly 2 token IDs to burn' },
        { status: 400 }
      )
    }

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      )
    }

    // Verify ownership of both tokens
    const owners = await getTokenOwners(tokenIds)
    
    for (const [tokenId, tokenOwner] of owners) {
      if (!tokenOwner || tokenOwner.toLowerCase() !== owner.toLowerCase()) {
        return NextResponse.json(
          { error: `Token #${tokenId} is not owned by the connected wallet` },
          { status: 400 }
        )
      }
    }

    // For now, simulate the burn - in production this would:
    // 1. Call smart contract to burn tokens
    // 2. Generate new upgraded NFT
    // 3. Mint new NFT to user
    
    // Get the first token's rarity (both should be same for upgrade)
    // In production, we'd fetch actual rarity from blockchain
    const seed = tokenIds[0] * 9999 + owner.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hashValue = seed % 1000000
    
    // Determine current rarity based on hash
    let currentRarity: string
    if (hashValue < 800) {
      currentRarity = "COMMON"
    } else if (hashValue < 950) {
      currentRarity = "UNCOMMON"
    } else if (hashValue < 990) {
      currentRarity = "SILVER"
    } else if (hashValue < 999) {
      currentRarity = "GOLD"
    } else {
      currentRarity = "PLATINUM"
    }

    // Find applicable upgrade rule
    const rule = BURN_RULES.find(r => r.from === currentRarity)
    
    if (!rule) {
      return NextResponse.json({
        success: false,
        message: `Cannot upgrade ${currentRarity} NFTs. You've reached the maximum tier!`,
        upgraded: false,
      } as BurnResponse)
    }

    // Roll for upgrade
    const roll = Math.random() * 100
    const upgraded = roll < rule.chance
    
    const response: BurnResponse = {
      success: true,
      message: upgraded 
        ? `🎉 Congratulations! Your NFTs merged into a ${rule.to}!`
        : `💨 The merge failed. Your NFTs were burned but no upgrade was achieved.`,
      transactionHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      newRarity: upgraded ? rule.to : currentRarity,
      upgraded,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Burn API error:', error)
    return NextResponse.json(
      { error: 'Failed to process burn transaction' },
      { status: 500 }
    )
  }
}

// Get burn rules
export async function GET() {
  return NextResponse.json({
    rules: BURN_RULES,
    description: "Burn 2 NFTs of the same tier for a chance to upgrade to the next tier",
  })
}
