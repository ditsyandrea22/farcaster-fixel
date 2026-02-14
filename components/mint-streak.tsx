"use client";

import { useState, useEffect } from "react";
import { Flame, Crown, Gem, Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalMints: number;
}

const THEME = {
  bg: "#0f0f23",
  bgSecondary: "#1a1a2e",
  accent: "#e95420",
  gold: "#F59E0B",
  platinum: "#A855F7",
};

interface MintStreakProps {
  address?: string;
}

export function MintStreak({ address }: MintStreakProps) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalMints: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch streak data from API
  useEffect(() => {
    const fetchStreak = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user-profile?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          setStreak({
            currentStreak: data.current_streak || 0,
            longestStreak: data.longest_streak || 0,
            totalMints: data.total_mints || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching streak:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [address]);

  const getStreakBonus = (streakCount: number) => {
    if (streakCount >= 30) return { bonus: "+5%", tier: "LEGEND", color: THEME.platinum };
    if (streakCount >= 14) return { bonus: "+3%", tier: "MASTER", color: THEME.gold };
    if (streakCount >= 7) return { bonus: "+2%", tier: "EXPERT", color: "#3B82F6" };
    if (streakCount >= 3) return { bonus: "+1%", tier: "REGULAR", color: "#10B981" };
    return { bonus: "+0%", tier: "NOVICE", color: "#6B7280" };
  };

  const streakBonus = getStreakBonus(streak.currentStreak);
  const milestones = [3, 7, 14, 30];
  const nextMilestone = milestones.find(m => m > streak.currentStreak) || milestones[milestones.length - 1];
  const progressToNext = streak.currentStreak > 0 ? (streak.currentStreak / nextMilestone) * 100 : 0;

  if (loading) {
    return (
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: "#333" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: THEME.accent }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: streakBonus.color }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" style={{ color: THEME.accent }} />
              <span className="font-mono text-white">Mint Streak</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-400 font-mono text-sm">Connect wallet to track your streak!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: streakBonus.color }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5" style={{ color: streakBonus.color }} />
            <span className="font-mono text-white">Mint Streak</span>
          </div>
          {streak.currentStreak > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-mono font-bold" style={{ backgroundColor: streakBonus.color + "30", color: streakBonus.color }}>
              {streakBonus.tier}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Streak Display */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2">
            <Flame className={`w-12 h-12 ${streak.currentStreak > 0 ? "animate-pulse" : ""}`} style={{ color: streak.currentStreak > 0 ? THEME.accent : "#666", fill: streak.currentStreak > 0 ? THEME.accent : "transparent" }} />
            <span className="text-5xl font-bold font-mono" style={{ color: streak.currentStreak > 0 ? streakBonus.color : "#666" }}>
              {streak.currentStreak}
            </span>
          </div>
          <p className="font-mono text-sm text-gray-400 mt-2">
            {streak.currentStreak === 0 ? "Mint today to start!" : streak.currentStreak === 1 ? "day streak" : "day streak"}
          </p>
        </div>

        {/* Streak Bonus */}
        {streak.currentStreak > 0 && (
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: streakBonus.color + "15", border: "1px solid " + streakBonus.color + "30" }}>
            <span className="font-mono text-sm text-white">Streak Bonus</span>
            <span className="font-mono font-bold" style={{ color: streakBonus.color }}>{streakBonus.bonus} rarity!</span>
          </div>
        )}

        {/* Progress */}
        {streak.currentStreak > 0 && streak.currentStreak < 30 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span style={{ color: "#666" }}>Next: {nextMilestone} days</span>
              <span style={{ color: "#666" }}>{Math.round(progressToNext)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: progressToNext + "%", backgroundColor: streakBonus.color }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: "#333" }}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Crown className="w-4 h-4" style={{ color: THEME.gold }} />
              <span className="text-lg font-bold font-mono text-white">{streak.longestStreak}</span>
            </div>
            <p className="text-xs font-mono text-gray-500">Best</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Gem className="w-4 h-4" style={{ color: THEME.platinum }} />
              <span className="text-lg font-bold font-mono text-white">{streak.totalMints}</span>
            </div>
            <p className="text-xs font-mono text-gray-500">Total Mints</p>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2 pt-3 border-t" style={{ borderColor: "#333" }}>
          <p className="text-xs font-mono text-gray-500">Milestones</p>
          <div className="flex justify-between">
            {milestones.map((milestone) => (
              <div key={milestone} className={`flex flex-col items-center ${streak.currentStreak >= milestone ? "" : "opacity-40"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${streak.currentStreak >= milestone ? "animate-bounce" : ""}`} style={{ backgroundColor: streak.currentStreak >= milestone ? streakBonus.color + "30" : "#333", border: "2px solid " + (streak.currentStreak >= milestone ? streakBonus.color : "#444") }}>
                  {streak.currentStreak >= milestone ? <Star className="w-4 h-4" style={{ color: streakBonus.color }} /> : <span className="text-xs font-mono text-gray-500">{milestone}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MintStreak;
