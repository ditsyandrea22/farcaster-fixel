import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'

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

    console.log(`Looking up FID for address: ${address}`)

    // Method 1: Try Neynar's fetch user by custody address
    // This is more reliable for finding users by their connected wallet
    try {
      console.log('Trying custody address lookup...')
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/custody?custody_address=${address}`,
        {
          headers: {
            'x-api-key': NEYNAR_API_KEY || '',
          },
        }
      )
      
      console.log('Custody lookup response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Found user by custody address:', data)
        return NextResponse.json({
          fid: data.fid,
          username: data.username,
          displayName: data.display_name,
        })
      } else {
        const errorText = await response.text()
        console.log('Custody lookup failed:', response.status, errorText)
      }
    } catch (custodyError) {
      console.log('Custody address lookup error:', custodyError)
    }

    // Method 2: Try search by verified addresses (original method)
    const searchResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?verified_addresses.ethereum=${address}`,
      {
        headers: {
          'x-api-key': NEYNAR_API_KEY || '',
        },
      }
    )

    if (!searchResponse.ok) {
      console.error('Neynar API error:', searchResponse.statusText)
      
      // Handle 402 Payment Required / Rate Limit
      if (searchResponse.status === 402) {
        return NextResponse.json(
          { error: 'API usage limit reached. Please upgrade your Neynar plan or try again later.' },
          { status: 402 }
        )
      }
      
      // Handle 429 Rate Limit
      if (searchResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch user data from Neynar' },
        { status: searchResponse.status }
      )
    }

    const data = await searchResponse.json()
    console.log('Neynar search response:', data)
    
    // Neynar returns users array
    const users = data.users || []
    
    if (!users || users.length === 0) {
      console.log('No users found for address:', address)
      return NextResponse.json(
        { error: 'No FarCaster account found for this address' },
        { status: 404 }
      )
    }

    // Find user that has the verified Ethereum address
    const user = users.find((u: any) => 
      u.verified_addresses?.ethereum?.some((addr: string) => 
        addr.toLowerCase() === address.toLowerCase()
      )
    )

    if (!user) {
      console.log('No user with verified address found:', address)
      return NextResponse.json(
        { error: 'No FarCaster account found for this address' },
        { status: 404 }
      )
    }

    console.log('Found FID:', user.fid)
    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
    })
  } catch (error) {
    console.error('Error in fid-from-address route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
