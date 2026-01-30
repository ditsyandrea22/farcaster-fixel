import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'

const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY

if (!NEYNAR_API_KEY) {
  console.error('NEYNAR_API_KEY is not configured')
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

    const address = request.nextUrl.searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: NEYNAR_API_KEY not set' }, { status: 500 })
    }

    // Query Neynar to find FID by wallet address
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_verification?address=${address}`,
      {
        headers: {
          'x-api-key': NEYNAR_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      console.error('Neynar API error:', response.statusText)
      return NextResponse.json(
        { error: 'No Farcaster account found for this address' },
        { status: 404 }
      )
    }

    const data = await response.json()
    
    if (!data.user || !data.user.fid) {
      return NextResponse.json(
        { error: 'No FID found for this address' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fid: data.user.fid,
      username: data.user.username,
      displayName: data.user.display_name,
    })
  } catch (error) {
    console.error('Error in fid-from-address route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
