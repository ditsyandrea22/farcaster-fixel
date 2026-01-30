import { NextRequest, NextResponse } from 'next/server'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY

export async function GET(request: NextRequest) {
  try {
    const fid = request.nextUrl.searchParams.get('fid')

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

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
