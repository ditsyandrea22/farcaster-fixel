import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://farcaster-fixel.vercel.app'),

  title: 'Fixel FID | Pixel NFT Mint',
  description: 'Generate and mint pixel NFTs from your FarCaster FID',

  openGraph: {
    title: 'Fixel Pixel NFTs',
    description: 'Mint pixel NFTs from your FarCaster FID',
    url: 'https://farcaster-fixel.vercel.app',
    type: 'website',
    images: [
      {
        url: 'https://farcaster-fixel.vercel.app/og.png',
        width: 1200,
        height: 630
      }
    ]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Fixel Pixel NFTs',
    description: 'Mint pixel NFTs from your FarCaster FID',
    images: ['https://farcaster-fixel.vercel.app/og.png']
  },

  other: {
    'base:app_id': '6989f2196dea3c7b8e14a0d9',
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://farcaster-fixel.vercel.app/Pixel-Pioneer.png',
    'fc:frame:button:1': 'Mint NFT',
    'fc:frame:post_url': 'https://farcaster-fixel.vercel.app/api/frame'
  },

  icons: {
    icon: 'https://farcaster-fixel.vercel.app/icon.png',
    apple: 'https://farcaster-fixel.vercel.app/icon.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
