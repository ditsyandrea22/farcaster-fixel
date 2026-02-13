import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'
import { getRateLimitResult, defaultConfig } from '@/lib/rate-limit'
import {
  RARITY_TIERS,
  type RarityTier,
  MAX_SUPPLY,
  hashFid,
  hashAddress,
  generateRandomSeed,
  determineRarity,
  generatePixelPattern,
  generateColors,
  getTierProperties,
  generateSerialNumber,
} from '@/lib/rarity'
import { uploadImageToIPFS, isPinataConfigured } from '@/lib/pinata'

export const runtime = 'nodejs'

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

    const fid = request.nextUrl.searchParams.get('fid')
    const address = request.nextUrl.searchParams.get('address')
    const tokenIdParam = request.nextUrl.searchParams.get('tokenId')
    const randomize = request.nextUrl.searchParams.get('random') === 'true'

    if (!fid && !address && !tokenIdParam) {
      return NextResponse.json({ error: 'FID or wallet address is required' }, { status: 400 })
    }

    // Use FID if available, otherwise use address or generate random
    let seed: number
    let walletDisplay: string
    
    // Parse and validate tokenId
    let tokenId: number | null = null
    if (tokenIdParam) {
      const parsedTokenId = parseInt(tokenIdParam, 10)
      if (!isNaN(parsedTokenId) && parsedTokenId > 0) {
        tokenId = parsedTokenId
      } else {
        return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
      }
    }
    
    if (tokenId) {
      seed = tokenId
      walletDisplay = `Token #${tokenId}`
    } else if (randomize) {
      seed = generateRandomSeed()
      walletDisplay = fid ? `FID ${fid}` : (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown')
    } else if (fid) {
      const hashedFid = hashFid(fid)
      if (hashedFid === null) {
        return NextResponse.json({ error: 'Invalid FID format' }, { status: 400 })
      }
      seed = hashedFid
      walletDisplay = `FID ${fid}`
    } else {
      const hashedAddress = hashAddress(address!)
      if (hashedAddress === null) {
        return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 })
      }
      seed = hashedAddress
      walletDisplay = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'
    }

    const rarity = determineRarity(seed)
    const tierProps = getTierProperties(rarity)
    const colors = generateColors(seed, rarity)
    const pattern = generatePixelPattern(seed, rarity)
    const serialNumber = generateSerialNumber(seed)

    const pixelSize = rarity === 'PLATINUM' ? 50 : rarity === 'GOLD' ? 55 : 60
    const gridSize = pattern.length
    const totalSize = pixelSize * gridSize
    const padding = 120

    // Build glow effect for rare tiers
    const glowStyle = tierProps.hasSparkles ? {
      boxShadow: `
        0 0 ${30 + tierProps.glowIntensity * 40}px ${tierProps.color}40,
        0 0 ${60 + tierProps.glowIntensity * 80}px ${tierProps.color}20,
        0 0 ${100 + tierProps.glowIntensity * 100}px ${tierProps.color}10
      `,
    } : {}

    // Safe color handling
    const getColor = (colorValue: string | { toString(): string }, fallback: string) => {
      if (typeof colorValue === 'string') return colorValue
      try {
        return colorValue.toString()
      } catch {
        return fallback
      }
    }

    const response = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1200px',
            height: '1200px',
            background: getColor(colors.bgGradient, '#f3f4f6'),
            fontFamily: 'system-ui, -apple-system',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Halo effect for Platinum */}
          {tierProps.hasHalo && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229, 231, 235, 0.3) 0%, transparent 70%)',
              }}
            />
          )}

          {/* Decorative background elements */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              right: '50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: tierProps.color,
              opacity: 0.08 * tierProps.glowIntensity + 0.05,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '40px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: tierProps.color,
              opacity: 0.06 * tierProps.glowIntensity + 0.03,
            }}
          />

          {/* Main NFT Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Rarity Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px 32px',
                background: tierProps.hasSparkles 
                  ? `linear-gradient(135deg, ${tierProps.color}30, ${tierProps.color}10)`
                  : `${tierProps.color}15`,
                border: `2px solid ${tierProps.color}${tierProps.hasSparkles ? '80' : '40'}`,
                borderRadius: '16px',
                fontSize: '24px',
                fontWeight: '900',
                letterSpacing: '4px',
                textShadow: tierProps.hasSparkles ? `0 0 20px ${tierProps.color}60` : 'none',
                color: tierProps.hasSparkles ? tierProps.color : tierProps.color,
                textTransform: 'uppercase',
                ...glowStyle,
              }}
            >
              {tierProps.hasSparkles && <span style={{ fontSize: '20px' }}>✨</span>}
              {tierProps.name}
              {tierProps.hasSparkles && <span style={{ fontSize: '20px' }}>✨</span>}
            </div>

            {/* Pixel Art Grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                width: `${gridSize * pixelSize + (gridSize - 1) * 2}px`,
                gap: '2px',
                padding: '24px',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                border: `${tierProps.borderWidth}px solid ${tierProps.color}60`,
                ...glowStyle,
              }}
            >
              {pattern.map((row, i) =>
                row.map((isActive, j) => (
                  <div
                    key={`${i}-${j}`}
                    style={{
                      width: `${pixelSize}px`,
                      height: `${pixelSize}px`,
                      background: isActive 
                        ? (typeof colors.primary === 'string' ? colors.primary : '#6B7280')
                        : (typeof colors.accent === 'string' ? colors.accent : '#E5E7EB'),
                      borderRadius: '4px',
                      opacity: isActive ? 1 : 0.1,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))
              )}
            </div>

            {/* Serial Number */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: tierProps.color,
                  letterSpacing: '2px',
                  fontFamily: 'monospace',
                }}
              >
                {serialNumber}
              </div>
            </div>

            {/* Wallet Address */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: `${tierProps.color}15`,
                border: `2px solid ${tierProps.color}40`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: tierProps.color,
                letterSpacing: '0.5px',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ fontSize: '20px' }}>⛓️</span>
              {walletDisplay}
            </div>
          </div>

          {/* Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              fontSize: '12px',
              color: '#9CA3AF',
              fontFamily: 'monospace',
            }}
          >
            AI GENERATED • {new Date().getFullYear()} • {rarity}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    )

    // Convert ImageResponse to buffer for IPFS upload
    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Upload image to IPFS via Pinata if configured
    let ipfsHash: string | null = null
    let ipfsGatewayUrl: string | null = null

    if (isPinataConfigured()) {
      const ipfsResult = await uploadImageToIPFS(imageBuffer, {
        name: `pixelcaster-image-${tokenId || fid || address || seed}`,
        contentType: 'image/png',
      })

      if (ipfsResult.success && ipfsResult.ipfsHash) {
        ipfsHash = ipfsResult.ipfsHash
        ipfsGatewayUrl = ipfsResult.gatewayUrl || null
        console.log(`✅ NFT image uploaded to IPFS: ${ipfsHash}`)
      } else {
        console.warn('⚠️ Failed to upload image to IPFS, using dynamic URL')
      }
    }

    // Set appropriate headers
    response.headers.set('Content-Type', 'image/png')
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')

    // Add IPFS info to response headers
    if (ipfsHash) {
      response.headers.set('X-IPFS-Hash', ipfsHash)
      response.headers.set('X-IPFS-Gateway-URL', ipfsGatewayUrl || '')
    }

    return response
  } catch (error) {
    console.error('Error generating NFT image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
