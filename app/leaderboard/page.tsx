"use client"

import { useEffect, useState } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { 
  Trophy, 
  Medal, 
  Flame, 
  TrendingUp, 
  Users,
  Crown,
  Sparkles,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Types from API
interface LeaderboardEntry {
  rank: number
  address: string
  mints: number
  platinum: number
  gold: number
  silver: number
  uncommon: number
  totalSpent: string
}

interface LeaderboardStats {
  totalMints: number
  totalUsers: number
  platinumMinted: number
  goldMinted: number
  silverMinted: number
  uncommonMinted: number
  commonMinted: number
  averageMintsPerUser: number
}

interface LeaderboardData {
  topMinters: LeaderboardEntry[]
  rareHunters: LeaderboardEntry[]
  weeklyTop: LeaderboardEntry[]
  stats: LeaderboardStats
}

// Theme colors
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

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getRarityColor(rarity: string): string {
  switch (rarity.toUpperCase()) {
    case 'PLATINUM': return THEME.platinum
    case 'GOLD': return THEME.gold
    case 'SILVER': return THEME.silver
    case 'UNCOMMON': return THEME.uncommon
    default: return THEME.common
  }
}

function LeaderboardRow({ entry, type }: { entry: LeaderboardEntry; type: 'mints' | 'rare' | 'weekly' }) {
  const isTop3 = entry.rank <= 3
  
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg mb-2 transition-all hover:scale-[1.01] ${
        isTop3 ? 'border-2' : 'border'
      }`}
      style={{ 
        backgroundColor: THEME.bgSecondary,
        borderColor: isTop3 ? getRarityColor(
          type === 'rare' ? (entry.platinum > 0 ? 'PLATINUM' : entry.gold > 0 ? 'GOLD' : 'SILVER') : 'COMMON'
        ) : '#333'
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
          entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
          entry.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
          'bg-gray-700/20 text-gray-400'
        }`}>
          {entry.rank <= 3 ? (
            <Crown className="w-5 h-5" />
          ) : (
            entry.rank
          )}
        </div>
        <div>
          <p className="font-mono text-white font-semibold">{shortenAddress(entry.address)}</p>
          <p className="text-sm" style={{ color: '#999' }}>{entry.totalSpent}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {type !== 'weekly' && (
          <div className="flex gap-2">
            {entry.platinum > 0 && (
              <Badge style={{ backgroundColor: `${THEME.platinum}20`, color: THEME.platinum, borderColor: THEME.platinum }}>
                💎 {entry.platinum}
              </Badge>
            )}
            {entry.gold > 0 && (
              <Badge style={{ backgroundColor: `${THEME.gold}20`, color: THEME.gold, borderColor: THEME.gold }}>
                👑 {entry.gold}
              </Badge>
            )}
            {entry.silver > 0 && (
              <Badge style={{ backgroundColor: `${THEME.silver}20`, color: THEME.silver, borderColor: THEME.silver }}>
                ⭐ {entry.silver}
              </Badge>
            )}
          </div>
        )}
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{entry.mints}</p>
          <p className="text-xs" style={{ color: '#999' }}>mints</p>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  subtitle?: string
}) {
  return (
    <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: '#333' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: '#999' }}>{title}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            {subtitle && <p className="text-xs" style={{ color: '#666' }}>{subtitle}</p>}
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RarityDistribution({ stats }: { stats: LeaderboardStats }) {
  const total = stats.platinumMinted + stats.goldMinted + stats.silverMinted + stats.uncommonMinted + stats.commonMinted
  
  const rarities = [
    { name: 'Platinum', count: stats.platinumMinted, color: THEME.platinum },
    { name: 'Gold', count: stats.goldMinted, color: THEME.gold },
    { name: 'Silver', count: stats.silverMinted, color: THEME.silver },
    { name: 'Uncommon', count: stats.uncommonMinted, color: THEME.uncommon },
    { name: 'Common', count: stats.commonMinted, color: THEME.common },
  ]

  return (
    <div className="space-y-3">
      {rarities.map((rarity) => {
        const percentage = total > 0 ? (rarity.count / total) * 100 : 0
        return (
          <div key={rarity.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span style={{ color: rarity.color }}>{rarity.name}</span>
              <span style={{ color: '#999' }}>{rarity.count} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: rarity.color 
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('mints')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/leaderboard')
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Failed to load leaderboard. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Check if running in Warpcast
    try {
      sdk.actions.ready()
    } catch (e) {
      // Not in Warpcast environment
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: THEME.bg }}>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Card style={{ backgroundColor: THEME.bgSecondary }}>
          <CardContent className="p-8 text-center">
            <p className="text-red-400 mb-4">{error || 'Failed to load data'}</p>
            <Button onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: THEME.bg }}>
      <div className="max-w-4xl mx-auto">
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
              <Trophy className="w-6 h-6" style={{ color: THEME.accent }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
              <p style={{ color: '#999' }}>Top minters & rare hunters</p>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title="Total Mints" 
            value={data.stats.totalMints.toLocaleString()} 
            icon={Sparkles}
            color="#e95420"
          />
          <StatsCard 
            title="Total Users" 
            value={data.stats.totalUsers.toLocaleString()} 
            icon={Users}
            color="#3B82F6"
          />
          <StatsCard 
            title="Avg Mints/User" 
            value={data.stats.averageMintsPerUser.toFixed(1)} 
            icon={TrendingUp}
            color="#10B981"
          />
          <StatsCard 
            title="Platinum NFTs" 
            value={data.stats.platinumMinted} 
            icon={Medal}
            color="#A855F7"
          />
        </div>

        {/* Rarity Distribution */}
        <Card className="mb-8" style={{ backgroundColor: THEME.bgSecondary, borderColor: '#333' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: THEME.platinum }} />
              Rarity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RarityDistribution stats={data.stats} />
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6" style={{ backgroundColor: THEME.bgSecondary }}>
            <TabsTrigger 
              value="mints"
              className="data-[state=active]:bg-gray-700"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Top Minters
            </TabsTrigger>
            <TabsTrigger 
              value="rare"
              className="data-[state=active]:bg-gray-700"
            >
              <Medal className="w-4 h-4 mr-2" />
              Rare Hunters
            </TabsTrigger>
            <TabsTrigger 
              value="weekly"
              className="data-[state=active]:bg-gray-700"
            >
              <Flame className="w-4 h-4 mr-2" />
              This Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mints">
            {data.topMinters.map((entry) => (
              <LeaderboardRow key={entry.address} entry={entry} type="mints" />
            ))}
          </TabsContent>

          <TabsContent value="rare">
            {data.rareHunters.map((entry) => (
              <LeaderboardRow key={entry.address} entry={entry} type="rare" />
            ))}
          </TabsContent>

          <TabsContent value="weekly">
            {data.weeklyTop.map((entry) => (
              <LeaderboardRow key={entry.address} entry={entry} type="weekly" />
            ))}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link href="/mint">
            <Button 
              className="text-lg px-8 py-6"
              style={{ backgroundColor: THEME.accent }}
            >
              Start Minting Now
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
