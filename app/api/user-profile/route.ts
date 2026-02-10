import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'
import { parseFid, validateFid, createFidDebugReport } from '@/lib/fid-utils'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY

if (!NEYNAR_API_KEY) {
  console.error('NEYNAR_API_KEY is not configured. Please set NEYNAR_API_KEY in your environment variables.')
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

    const fidParam = request.nextUrl.searchParams.get('fid')

    // Debug FID input
    console.log('FID parameter received:', fidParam)
    const debugReport = createFidDebugReport(fidParam, { source: 'user-profile-api' })
    console.log('FID debug report:', JSON.stringify(debugReport, null, 2))

    // Parse and validate FID
    const fid = parseFid(fidParam)
    
    if (fid === null) {
      const validation = validateFid(fidParam)
      return NextResponse.json(
        { error: validation.error || 'FID is required and must be a positive integer' }, 
        { status: 400 }
      )
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: NEYNAR_API_KEY not set' }, { status: 500 })
    }

    console.log(`Fetching user profile for FID: ${fid}`)

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_fid?fid=${fid}`,
      {
        headers: {
          'x-api-key': NEYNAR_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      console.error('Neynar API error:', response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data.user)
  } catch (error) {
    console.error('Error in user-profile route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
