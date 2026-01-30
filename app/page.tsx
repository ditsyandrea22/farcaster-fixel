import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Zap, Lock, Sparkles, Palette, Network, CloudLightning as Lightning } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-sky-600">
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-sm border-sky-700 bg-sky-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500"></div>
            <h1 className="text-lg text-card-foreground font-extrabold underline italic">Fixel FID</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-600">Base Mainnet</p>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 bg-sky-600">
        {/* Hero */}
        <div className="py-24 text-center space-y-8">
          <div className="inline-block">
            <span className="text-sm font-semibold text-blue-600 px-4 py-2 rounded-full bg-foreground italic">
              NFT Generation on Base Mainnet
            </span>
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight italic">
            Generate & Mint <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-lime-400">
              Pixel NFTs
            </span>
            <br />
            from Farcaster
          </h2>
          
          <p className="text-xl max-w-2xl mx-auto text-foreground italic">
            Connect your wallet, auto-detect your Farcaster identity, and instantly mint unique pixel art NFTs on Base. Secure, fast, and elegant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/mint">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-lg font-semibold italic">
                Start Minting
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-300 px-8 py-6 text-lg rounded-lg font-semibold hover:bg-gray-50 bg-transparent text-foreground italic">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-24 border-t border-popover-foreground">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-card-foreground">
              <Sparkles size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 italic">Auto Generate</h3>
            <p className="text-foreground italic">
              Unique pixel NFT designs generated instantly based on your Farcaster FID, no design needed.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-card-foreground">
              <Lock size={24} className="text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 italic">Verified Identity</h3>
            <p className="text-foreground italic">
              Wallet auto-connects to Farcaster via Neynar API, ensuring secure and verified minting.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-card-foreground">
              <Lightning size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 italic">Instant Mint</h3>
            <p className="text-foreground italic">
              One-click minting with elegant loading animations on Base mainnet blockchain.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-24 border-t items-center border-popover-foreground">
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 italic">Built for Farcaster</h3>
              <p className="text-lg text-foreground italic">
                Seamlessly integrated with Farcaster Frames v2, allowing users to discover and mint directly from their feed.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Network className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 italic">Base Mainnet</h4>
                  <p className="text-sm text-foreground italic">Deployed on Base for low fees and fast transactions</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Palette className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 italic">Unique Designs</h4>
                  <p className="text-sm text-foreground italic">Each NFT is deterministically generated from FID</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1 italic">Fast & Smooth</h4>
                  <p className="text-sm text-foreground italic">Elegant animations and instant generation</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 bg-sky-600">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2 italic">Contract Address</p>
                <p className="text-gray-900 font-mono text-sm break-all italic">
                  0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2 italic">Mint Price</p>
                  <p className="text-2xl font-bold text-gray-900 italic">0.001 ETH</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2 italic">Network</p>
                  <p className="text-2xl font-bold text-gray-900 italic">Base</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 italic">
                  Each mint creates a unique, deterministic pixel NFT from your Farcaster FID.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="py-24 border-t text-center space-y-8 border-popover-foreground">
          <h3 className="text-4xl font-bold text-gray-900 italic">Ready to Mint?</h3>
          <p className="text-lg max-w-2xl mx-auto text-foreground italic">
            Open Fixel FID from a Farcaster Frame or visit the app directly to get started.
          </p>
          <Link href="/mint">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-lg font-semibold italic">
              Launch App
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-sky-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-foreground italic">
            Built with Base, Farcaster, Neynar, and wagmi
          </p>
        </div>
      </footer>
    </div>
  )
}
