import type { Metadata, Viewport } from 'next'
import { Analytics } from "@vercel/analytics/next"
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://farcaster-fixel.vercel.app'),

  title: 'Fixel FID | Pixel NFT Mint',
  description: 'Generate and mint pixel NFTs from your FarCaster FID',

  // PWA
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fixel',
  },

  openGraph: {
    title: 'Fixel Pixel NFTs',
    description: 'Mint pixel NFTs from your FarCaster FID',
    url: 'https://farcaster-fixel.vercel.app',
    type: 'website',
    images: [
      {
        url: 'https://farcaster-fixel.vercel.app/Legendary-Lucker.png',
        width: 1200,
        height: 630
      }
    ]
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* FARCASTER FRAME META — MUST USE property= */}

        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://farcaster-fixel.vercel.app/Pixel-Pioneer.png" />
        <meta property="fc:frame:button:1" content="Mint NFT" />
        <meta property="fc:frame:post_url" content="https://farcaster-fixel.vercel.app/api/frame" />

        <meta property="base:app_id" content="6989f2196dea3c7b8e14a0d9" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
        <Analytics />
      {/* Safe area padding for mobile browsers */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)', minHeight: '100dvh' }}>
        {children}
      </div>
    </body>
    </html>
  )
}
