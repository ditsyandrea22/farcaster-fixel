import { NextRequest, NextResponse } from 'next/server'

const MINI_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-fixel.vercel.app/'
const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0xBee2A3b777445E212886815A5384f6F4e8902d21'
const MINT_PRICE = '0.0002'

// Validate FID parameter
function isValidFid(fid: string): boolean {
  const num = parseInt(fid, 10)
  return !isNaN(num) && num > 0 && num <= 99999999999
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, buttonIndex } = body

    // Validate FID
    if (!fid || !isValidFid(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      )
    }

    // Generate Frame HTML response with OG meta tags for better preview
    const frameHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="Mint Base NFT" />
          <meta property="og:description" content="Mint your exclusive Base NFT with your FarCaster identity" />
          <meta property="og:image" content="${MINI_APP_URL}/og.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="1200" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${MINI_APP_URL}/og.png" />
          <meta property="fc:frame:image:aspect_ratio" content="1:1" />
          <meta property="fc:frame:button:1" content="Open Mini App" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}/mint?fid=${fid}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="${MINI_APP_URL}/og.png" />
        </head>
        <body></body>
      </html>
    `

    return new NextResponse(frameHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Frame error:', error)
    return NextResponse.json({ error: 'Frame error' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get('fid') || '0'

  // Validate FID
  if (!isValidFid(fid)) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="Invalid FID" />
          <meta property="og:description" content="Invalid FarCaster ID provided" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${MINI_APP_URL}/og.png" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}" />
        </head>
        <body></body>
      </html>
    `
    return new NextResponse(errorHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }

  const frameHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="Mint Base NFT" />
        <meta property="og:description" content="Mint your exclusive Base NFT for ${MINT_PRICE} ETH" />
        <meta property="og:image" content="${MINI_APP_URL}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1200" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${MINI_APP_URL}/og.png" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:button:1" content="Mint on Base" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}/mint?fid=${fid}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${MINI_APP_URL}/og.png" />
      </head>
      <body></body>
    </html>
  `

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
