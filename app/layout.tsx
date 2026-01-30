import type { Metadata } from 'next'
import { JetBrains_Mono, Ubuntu_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono',
})

const ubuntuMono = Ubuntu_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: '--font-terminal',
})

export const metadata: Metadata = {
  title: 'Fixel FID | Terminal NFT Mint',
  description: 'Generate & Mint Pixel NFTs on Base Mainnet via FarCaster',
  metadataBase: new URL('https://farcaster-fixel.vercel.app'),
  openGraph: {
    title: 'Fixel Pixel NFTs',
    description: 'Mint pixel NFTs from your FarCaster FID',
    url: 'https://farcaster-fixel.vercel.app',
    siteName: 'Fixel',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Fixel Pixel NFTs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fixel Pixel NFTs',
    description: 'Mint pixel NFTs from your FarCaster FID',
    images: ['/og.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': '/mint-card-bg.png',
    'fc:frame:button:1': 'Mint NFT',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://farcaster-fixel.vercel.app',
    'fc:frame:button:2': 'Learn More',
    'fc:frame:button:2:action': 'link',
    'fc:frame:button:2:target': 'https://farcaster-fixel.vercel.app/learn',
  },
  
  icons: {
    icon: [
      {
        url: '/nft-placeholder.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/nft-placeholder.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/mint-card-bg.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} ${ubuntuMono.variable} font-mono antialiased bg-terminal-dark text-terminal-green scanlines`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
