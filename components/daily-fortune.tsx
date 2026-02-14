"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Clock, 
  Gift, 
  Zap, 
  Star, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RarityTier = "COMMON" | "UNCOMMON" | "SILVER" | "GOLD" | "PLATINUM";

interface FortuneData {
  tier: RarityTier;
  message: string;
  isRevealed: boolean;
  lastDrawTime: number;
  streak: number;
}

const RARITY_CONFIG: Record<RarityTier, { color: string; icon: string; message: string }> = {
  PLATINUM: { color: "#A855F7", icon: "💎", message: "The stars align in your favor today!" },
  GOLD: { color: "#F59E0B", icon: "👑", message: "Golden rays of opportunity await you!" },
  SILVER: { color: "#94A3B8", icon: "⭐", message: "A shimmering path lies ahead!" },
  UNCOMMON: { color: "#10B981", icon: "🔥", message: "Good fortune blows in the wind!" },
  COMMON: { color: "#6B7280", icon: "⚫", message: "Every journey begins with a step!" },
};

const THEME = {
  bg: "#0f0f23",
  bgSecondary: "#1a1a2e",
  accent: "#e95420",
  gold: "#F59E0B",
  platinum: "#A855F7",
};

interface DailyFortuneProps {
  address?: string;
}

// Calculate deterministic fortune based on address + date
const calculateFortune = (addr?: string): RarityTier => {
  let hash = 0;
  if (addr) {
    for (let i = 0; i < addr.length; i++) {
      hash = ((hash << 5) - hash) + addr.charCodeAt(i);
      hash = hash & hash;
    }
    const today = new Date();
    hash = hash + (today.getDate() * 100) + (today.getMonth() * 1000);
  } else {
    hash = Math.random() * 1000000;
  }
  
  // Use 10000 scale for 0.01% precision (PLATINUM)
  const rand = Math.abs(hash) % 10000;
  if (rand < 1) return "PLATINUM";       // 0.01%
  if (rand < 100) return "GOLD";          // 1% (100/10000)
  if (rand < 500) return "SILVER";        // 5% (500/10000 - cumulative)
  if (rand < 2000) return "UNCOMMON";     // 20% (2000/10000 - cumulative)
  return "COMMON";                         // 80%
};

export function DailyFortune({ address }: DailyFortuneProps) {
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [canDraw, setCanDraw] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // Check if user can draw today - fetch from API
  useEffect(() => {
    const checkFortune = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user-profile?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          const today = new Date().toDateString();
          
          if (data.last_fortune_date) {
            const lastDrawDate = new Date(data.last_fortune_date).toDateString();
            if (lastDrawDate === today) {
              // Already drew today
              const tier = calculateFortune(address);
              setFortune({
                tier,
                message: RARITY_CONFIG[tier].message,
                isRevealed: true,
                lastDrawTime: new Date(data.last_fortune_date).getTime(),
                streak: data.current_streak || 1,
              });
              setCanDraw(false);
            } else {
              // New day, can draw
              setFortune({
                tier: "COMMON",
                message: "",
                isRevealed: false,
                lastDrawTime: 0,
                streak: data.current_streak || 0,
              });
              setCanDraw(true);
            }
          } else {
            setFortune({
              tier: "COMMON",
              message: "",
              isRevealed: false,
              lastDrawTime: 0,
              streak: data.current_streak || 0,
            });
            setCanDraw(true);
          }
        }
      } catch (err) {
        console.error("Error fetching fortune:", err);
      } finally {
        setLoading(false);
      }
    };

    checkFortune();
  }, [address]);

  // Countdown timer
  useEffect(() => {
    if (canDraw) return;
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [canDraw]);

  const drawFortune = async () => {
    const tier = calculateFortune(address);
    const newStreak = (fortune?.streak || 0) + 1;
    
    const newFortune: FortuneData = {
      tier,
      message: RARITY_CONFIG[tier].message,
      isRevealed: false,
      lastDrawTime: Date.now(),
      streak: newStreak,
    };

    setIsDrawing(true);
    
    // Save to API if address connected
    if (address) {
      try {
        await fetch('/api/user-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            address, 
            action: 'update_fortune',
            tier,
            streak: newStreak 
          }),
        });
      } catch (err) {
        console.error("Error saving fortune:", err);
      }
    }

    setTimeout(() => {
      newFortune.isRevealed = true;
      setFortune(newFortune);
      setCanDraw(false);
      setIsDrawing(false);
    }, 2000);
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: "#333" }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: THEME.accent }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: THEME.accent }} />
            <span className="font-mono text-white">Daily Fortune</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <Gift className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.accent }} />
            <p className="text-gray-400 font-mono text-sm">Connect wallet to check your daily fortune!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: THEME.accent }} />
            <span className="font-mono text-white">Daily Fortune</span>
          </div>
          {fortune && (
            <div className="flex items-center gap-1 text-xs font-mono" style={{ color: THEME.gold }}>
              <Star className="w-3 h-3" />
              <span>Streak: {fortune.streak}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isDrawing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full border-4 border-dashed animate-spin mb-4" style={{ borderColor: THEME.accent }}></div>
            <p className="font-mono text-white">Reading your fortune...</p>
          </div>
        ) : !canDraw && fortune?.isRevealed ? (
          <div className="space-y-4">
            <div className="p-6 rounded-lg text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${RARITY_CONFIG[fortune.tier].color}20, transparent)`, border: `2px solid ${RARITY_CONFIG[fortune.tier].color}` }}>
              <div className="relative">
                <div className="text-6xl mb-3 filter drop-shadow-lg" style={{ textShadow: `0 0 30px ${RARITY_CONFIG[fortune.tier].color}` }}>
                  {RARITY_CONFIG[fortune.tier].icon}
                </div>
                <p className="font-mono text-lg font-bold" style={{ color: RARITY_CONFIG[fortune.tier].color }}>{fortune.tier} DAY!</p>
                <p className="font-mono text-sm text-gray-400 mt-2">{fortune.message}</p>
              </div>
            </div>
            {fortune.tier !== "COMMON" && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg }}>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4" style={{ color: RARITY_CONFIG[fortune.tier].color }} />
                  <span className="font-mono text-gray-300">+{fortune.tier === "PLATINUM" ? "5" : fortune.tier === "GOLD" ? "3" : "1"}% bonus chance!</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm font-mono" style={{ color: "#666" }}>
              <Clock className="w-4 h-4" /><span>Next: {countdown}</span>
            </div>
          </div>
        ) : canDraw ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Gift className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.accent }} />
              <p className="font-mono text-white mb-2">Check Your Daily Fortune!</p>
              <p className="font-mono text-sm text-gray-400">Get bonus rarity chance!</p>
            </div>
            <Button onClick={drawFortune} className="w-full font-mono" style={{ backgroundColor: THEME.accent }}>
              <Sparkles className="w-4 h-4 mr-2" />Reveal My Fortune
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default DailyFortune;
