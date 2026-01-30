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
