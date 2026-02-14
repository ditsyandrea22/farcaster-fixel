"use client"

import { useEffect, useState } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { 
  Trophy, 
  Lock, 
  Unlock, 
  RefreshCw,
  Star,
  Sparkles,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

// Types
interface AchievementData {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  requirement: string
  unlocked: boolean
  unlockedAt: number | null
  progress: {
    current: number
    target: number
    percentage: number
  }
}

interface AchievementsResponse {
  userId: string
  stats: {
    totalMints: number
    platinumCount: number
    goldCount: number
    silverCount: number
    uncommonCount: number
    commonCount: number
    referralCount: number
  }
  achievements: AchievementData[]
  unlockedCount: number
  totalCount: number
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
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
}

const RARITY_COLORS: Record<string, string> = {
  common: THEME.common,
  uncommon: THEME.uncommon,
  rare: THEME.rare,
  epic: THEME.epic,
  legendary: THEME.legendary,
}

function AchievementCard({ achievement }: { achievement: AchievementData }) {
  const color = RARITY_COLORS[achievement.rarity]
  const isUnlocked = achievement.unlocked

  return (
    <Card 
      className={`transition-all ${isUnlocked ? 'hover:scale-[1.02]' : 'opacity-60'}`}
      style={{ 
        backgroundColor: THEME.bgSecondary, 
        borderColor: isUnlocked ? color : '#333',
        boxShadow: isUnlocked ? `0 0 20px ${color}30` : 'none'
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div 
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
              isUnlocked ? '' : 'grayscale'
            }`}
            style={{ 
              backgroundColor: isUnlocked ? `${color}20` : '#333',
              border: `2px solid ${isUnlocked ? color : '#444'}`
            }}
          >
            {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-500" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white truncate">{achievement.name}</h3>
              {isUnlocked && <Unlock className="w-4 h-4" style={{ color }} />}
            </div>
            
            <p className="text-sm text-gray-400 mb-2 line-clamp-2">
              {achievement.description}
            </p>

            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: color, 
                  color: color 
                }}
              >
                {achievement.rarity}
              </Badge>
              <span className="text-xs text-gray-500">{achievement.requirement}</span>
            </div>

            {/* Progress */}
            {!isUnlocked && achievement.progress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{achievement.progress.current} / {achievement.progress.target}</span>
                </div>
                <Progress 
                  value={achievement.progress.percentage} 
                  className="h-2"
                  style={{ 
                    backgroundColor: '#333',
                  }}
                />
              </div>
            )}

            {/* Unlocked timestamp */}
            {isUnlocked && achievement.unlockedAt && (
              <p className="text-xs" style={{ color: '#666' }}>
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string
  value: number | string
  icon: React.ReactNode
  color: string 
}) {
  return (
    <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: '#333' }}>
      <CardContent className="p-4 flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Mock address for demo - in production, get from connected wallet
      const response = await fetch('/api/achievements?address=0x742d35Cc6634C0532925a3b844Bc9e7595f8eB21')
      if (!response.ok) throw new Error('Failed to fetch achievements')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Failed to load achievements. Please try again.')
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
  }, [])

  const filteredAchievements = data?.achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked
    if (filter === 'locked') return !a.unlocked
    return true
  })

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
              <h1 className="text-3xl font-bold text-white">Achievements</h1>
              <p style={{ color: '#999' }}>Unlock badges and earn rewards</p>
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

        {/* Progress Overview */}
        {data && (
          <Card className="mb-8" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8" style={{ color: THEME.gold }} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Achievement Progress</h2>
                    <p style={{ color: '#999' }}>{data.unlockedCount} of {data.totalCount} unlocked</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: THEME.gold }}>
                    {Math.round((data.unlockedCount / data.totalCount) * 100)}%
                  </p>
                </div>
              </div>
              <Progress 
                value={(data.unlockedCount / data.totalCount) * 100} 
                className="h-3"
                style={{ backgroundColor: '#333' }}
              />
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Total Mints" 
              value={data.stats.totalMints} 
              icon={<Sparkles className="w-6 h-6" style={{ color: THEME.accent }} />}
              color={THEME.accent}
            />
            <StatsCard 
              title="Platinum" 
              value={data.stats.platinumCount} 
              icon={<span className="text-xl">💎</span>}
              color={THEME.platinum}
            />
            <StatsCard 
              title="Gold" 
              value={data.stats.goldCount} 
              icon={<span className="text-xl">👑</span>}
              color={THEME.gold}
            />
            <StatsCard 
              title="Referrals" 
              value={data.stats.referralCount} 
              icon={<span className="text-xl">🔗</span>}
              color={THEME.rare}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? '' : 'border-gray-700 text-gray-300'}
          >
            All
          </Button>
          <Button
            variant={filter === 'unlocked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unlocked')}
            className={filter === 'unlocked' ? '' : 'border-gray-700 text-gray-300'}
          >
            <Unlock className="w-4 h-4 mr-2" />
            Unlocked
          </Button>
          <Button
            variant={filter === 'locked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('locked')}
            className={filter === 'locked' ? '' : 'border-gray-700 text-gray-300'}
          >
            <Lock className="w-4 h-4 mr-2" />
            Locked
          </Button>
        </div>

        {/* Achievements List */}
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
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredAchievements && filteredAchievements.length > 0 ? (
          <div className="space-y-4">
            {filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p style={{ color: '#999' }}>No achievements found.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center pb-8">
          <Link href="/mint">
            <Button 
              className="text-lg px-8"
              style={{ backgroundColor: THEME.accent }}
            >
              Start Minting to Unlock Achievements
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
