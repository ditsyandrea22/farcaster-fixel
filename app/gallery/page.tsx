"use client"

import { useEffect, useState } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { 
  Grid, 
  Filter, 
  SortAsc, 
  Search,
  RefreshCw,
  ExternalLink,
  Loader2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

// Types
interface GalleryNFT {
  id: string
  tokenId: number
  seed: number
  owner: string
  rarity: 'COMMON' | 'UNCOMMON' | 'SILVER' | 'GOLD' | 'PLATINUM'
  mintedAt: number
  name: string
  image: string
}

interface GalleryResponse {
  nfts: GalleryNFT[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  filters: {
    rarity: string[]
    sortBy: string
  }
}

// Theme
const THEME = {
  bg: '#0f0f23',
  bgSecondary: '#1a1a2e',
  accent: '#e95420',
  platinum: '#A855F7',
  gold: '#F59E0B',
  silver: '#94A3B8',
  uncommon: '#10B981',
  common: '#6B7280',
}

const RARITY_CONFIG: Record<string, { color: string; icon: string }> = {
  COMMON: { color: THEME.common, icon: '⚫' },
  UNCOMMON: { color: THEME.uncommon, icon: '🔥' },
  SILVER: { color: THEME.silver, icon: '⭐' },
  GOLD: { color: THEME.gold, icon: '👑' },
  PLATINUM: { color: THEME.platinum, icon: '💎' },
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function NFTCard({ nft }: { nft: GalleryNFT }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const config = RARITY_CONFIG[nft.rarity]

  return (
    <Card 
      className="overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ backgroundColor: THEME.bgSecondary, borderColor: '#333' }}
    >
      <div className="relative aspect-square bg-black/30">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.accent }} />
          </div>
        )}
        <img 
          src={nft.image} 
          alt={nft.name}
          className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        <Badge 
          className="absolute top-2 right-2 font-bold"
          style={{ 
            backgroundColor: `${config.color}20`, 
            color: config.color,
            borderColor: config.color 
          }}
        >
          {config.icon} {nft.rarity}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-white truncate mb-2">{nft.name}</h3>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: '#999' }}>Owner</span>
          <span className="font-mono text-gray-300">{shortenAddress(nft.owner)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span style={{ color: '#999' }}>Minted</span>
          <span style={{ color: '#666' }}>{formatDate(nft.mintedAt)}</span>
        </div>
        <Link 
          href={`/mint?nft=${nft.tokenId}`}
          className="mt-3 w-full"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function NFTCardSkeleton() {
  return (
    <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: '#333' }}>
      <Skeleton className="aspect-square" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-1" />
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
    </Card>
  )
}

export default function GalleryPage() {
  const [data, setData] = useState<GalleryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [rarity, setRarity] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '12',
        sortBy,
      })
      if (rarity !== 'all') {
        params.set('rarity', rarity)
      }
      
      const response = await fetch(`/api/gallery?${params}`)
      if (!response.ok) throw new Error('Failed to fetch gallery')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Failed to load gallery. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    try {
      sdk.actions.ready()
    } catch (e) {
      // Not in Warpcast environment
    }
  }, [page, rarity, sortBy])

  const handleRarityChange = (value: string) => {
    setRarity(value)
    setPage(1)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: THEME.bg }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button 
                variant="outline" 
                size="icon"
                className="border-gray-700 hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.accent}20` }}>
              <Grid className="w-6 h-6" style={{ color: THEME.accent }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">NFT Gallery</h1>
              <p style={{ color: '#999' }}>Explore all minted PixelCaster NFTs</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={rarity} onValueChange={handleRarityChange}>
              <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-gray-200">
                <SelectValue placeholder="Filter by rarity" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: THEME.bgSecondary }}>
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value="PLATINUM">
                  <span style={{ color: THEME.platinum }}>💎 Platinum</span>
                </SelectItem>
                <SelectItem value="GOLD">
                  <span style={{ color: THEME.gold }}>👑 Gold</span>
                </SelectItem>
                <SelectItem value="SILVER">
                  <span style={{ color: THEME.silver }}>⭐ Silver</span>
                </SelectItem>
                <SelectItem value="UNCOMMON">
                  <span style={{ color: THEME.uncommon }}>🔥 Uncommon</span>
                </SelectItem>
                <SelectItem value="COMMON">
                  <span style={{ color: THEME.common }}>⚫ Common</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-gray-400" />
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: THEME.bgSecondary }}>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rarity">Rarity (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto text-sm" style={{ color: '#999' }}>
            {data && (
              <span>
                Showing {data.nfts.length} of {data.total} NFTs
              </span>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <NFTCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.nfts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.nfts.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Previous
                </Button>
                <span className="text-gray-400 px-4">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p style={{ color: '#999' }}>No NFTs found matching your filters.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center pb-8">
          <Link href="/mint">
            <Button 
              className="text-lg px-8"
              style={{ backgroundColor: THEME.accent }}
            >
              Mint Your Own NFT
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
