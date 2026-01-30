import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from './providers'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Base NFT Mint',
  description: 'Mint exclusive NFTs on Base Mainnet via FarCaster',
  
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
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
