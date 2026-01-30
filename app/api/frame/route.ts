import { NextRequest, NextResponse } from 'next/server'

const MINI_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const NFT_CONTRACT = '0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF'
const MINT_PRICE = '0.001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid } = body

    // Generate Frame HTML response
    const frameHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="Mint Base NFT" />
          <meta property="og:description" content="Mint your exclusive Base NFT" />
          <meta property="og:image" content="${MINI_APP_URL}/og-image.png" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${MINI_APP_URL}/og-image.png" />
          <meta property="fc:frame:image:aspect_ratio" content="1:1" />
          <meta property="fc:frame:button:1" content="Open Mini App" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}/mint?fid=${fid}" />
        </head>
        <body></body>
      </html>
    `

    return new NextResponse(frameHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Frame error:', error)
    return NextResponse.json({ error: 'Frame error' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get('fid') || '0'

  const frameHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="Mint Base NFT" />
        <meta property="og:description" content="Mint your exclusive Base NFT for ${MINT_PRICE} ETH" />
        <meta property="og:image" content="${MINI_APP_URL}/og-image.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${MINI_APP_URL}/og-image.png" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:button:1" content="Mint on Base" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}/mint?fid=${fid}" />
      </head>
      <body></body>
    </html>
  `

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
