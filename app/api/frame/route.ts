import { NextRequest, NextResponse } from 'next/server'

const MINI_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://farcaster-fixel.vercel.app'

const NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0xBee2A3b777445E212886815A5384f6F4e8902d21'
const MINT_PRICE = '0.0002'

// Helper function to escape HTML special characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Validate FID parameter
function isValidFid(fid: string): boolean {
  const num = parseInt(fid, 10)
  return !isNaN(num) && num > 0 && num <= 99999999999
}

// Generate Frame HTML helper function
function generateFrameHtml(
  imageUrl: string,
  buttonText: string,
  buttonAction: string,
  buttonTarget: string,
  title: string,
  description: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(description)}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1200" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content="${MINI_APP_URL}/api/frame" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:button:1" content="${escapeHtml(buttonText)}" />
        <meta property="fc:frame:button:1:action" content="${escapeHtml(buttonAction)}" />
        <meta property="fc:frame:button:1:target" content="${buttonTarget}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
      </head>
      <body></body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fid = body?.untrustedData?.fid
    const buttonIndex = body?.untrustedData?.buttonIndex

    // Validate FID
    if (!fid || !isValidFid(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      )
    }

    // Escape FID for safe HTML insertion
    const escapedFid = escapeHtml(String(fid))
    
    // Generate Frame HTML response with OG meta tags for better preview
    const frameHtml = generateFrameHtml(
      `${MINI_APP_URL}/Legendary-Lucker.png`,
      'Open Mini App',
      'link',
      `${MINI_APP_URL}/mint?fid=${escapedFid}`,
      'Mint Base NFT',
      'Mint your exclusive Base NFT with your FarCaster identity'
    )

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
          <meta property="og:image" content="${MINI_APP_URL}/splash.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="1200" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:post_url" content="${MINI_APP_URL}/api/frame" />
          <meta property="fc:frame:image:aspect_ratio" content="1:1" />
          <meta property="fc:frame:button:1" content="Try Again" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="${MINI_APP_URL}/splash.png" />
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

  // Escape FID for safe HTML insertion
  const escapedFid = escapeHtml(fid)

  const frameHtml = generateFrameHtml(
    `${MINI_APP_URL}/Legendary-Lucker.png`,
    'Mint on Base',
    'link',
    `${MINI_APP_URL}/mint?fid=${escapedFid}`,
    'Mint Base NFT',
    `Mint your exclusive Base NFT for ${MINT_PRICE} ETH`
  )

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
