import { NextRequest, NextResponse } from 'next/server'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
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
