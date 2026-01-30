import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

function generatePixelPattern(fid: number): boolean[][] {
  // Deterministic pixel pattern based on FID (12x12 grid)
  const gridSize = 12
  const pattern: boolean[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(false))

  // Generate pattern using FID as seed
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const hash = (fid * (i + 1) * (j + 1) * 73856093) ^ ((fid >> 16) * 19349663)
      pattern[i][j] = (hash & 1) === 1
    }
  }

  return pattern
}

function generateColors(fid: number): { primary: string; secondary: string; accent: string } {
  // Deterministic colors based on FID
  const hue1 = (fid * 137.5) % 360
  const hue2 = (hue1 + 180) % 360
  const sat = 60 + ((fid % 20) * 2)

  return {
    primary: `hsl(${hue1}, ${sat}%, 55%)`,
    secondary: `hsl(${hue2}, ${sat}%, 45%)`,
    accent: `hsl(${(hue1 + 60) % 360}, 80%, 60%)`,
  }
}

export async function GET(request: NextRequest) {
  try {
    const fid = request.nextUrl.searchParams.get('fid')
    const username = request.nextUrl.searchParams.get('username') || 'Farcaster'

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const fidNumber = parseInt(fid, 10)
    const pattern = generatePixelPattern(fidNumber)
    const colors = generateColors(fidNumber)

    const pixelSize = 60
    const gridSize = 12
    const totalSize = pixelSize * gridSize
    const padding = 120

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
            background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%), linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)`,
            fontFamily: 'system-ui, -apple-system',
            position: 'relative',
          }}
        >
          {/* Decorative background elements */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              right: '50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: colors.primary,
              opacity: 0.08,
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
              background: colors.secondary,
              opacity: 0.06,
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
            {/* Pixel Art Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
                gap: '2px',
                padding: '20px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${colors.primary}40`,
              }}
            >
              {pattern.map((row, i) =>
                row.map((isActive, j) => (
                  <div
                    key={`${i}-${j}`}
                    style={{
                      width: `${pixelSize}px`,
                      height: `${pixelSize}px`,
                      background: isActive ? colors.primary : colors.accent,
                      borderRadius: '4px',
                      opacity: isActive ? 1 : 0.15,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))
              )}
            </div>

            {/* FID Badge */}
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
                  fontSize: '48px',
                  fontWeight: '900',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  backgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '2px',
                }}
              >
                FID {fidNumber}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: colors.primary,
                  letterSpacing: '1px',
                }}
              >
                {username.toUpperCase()}
              </div>
            </div>

            {/* Base Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: `${colors.primary}15`,
                border: `2px solid ${colors.primary}40`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.primary,
                letterSpacing: '0.5px',
              }}
            >
              <span style={{ fontSize: '20px' }}>⛓️</span>
              BASE MAINNET
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
      }
    )

    return response
  } catch (error) {
    console.error('Error generating NFT image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
