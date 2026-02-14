"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Crown, Gem, Star, Flame } from "lucide-react";

// Types
interface RecentMint {
  id: string;
  address: string;
  rarity: "COMMON" | "UNCOMMON" | "SILVER" | "GOLD" | "PLATINUM";
  timestamp: number;
}

// Rarity configuration
const RARITY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  COMMON: { color: "#6B7280", icon: "⚫", label: "Common" },
  UNCOMMON: { color: "#10B981", icon: "🔥", label: "Uncommon" },
  SILVER: { color: "#94A3B8", icon: "⭐", label: "Silver" },
  GOLD: { color: "#F59E0B", icon: "👑", label: "Gold" },
  PLATINUM: { color: "#A855F7", icon: "💎", label: "Platinum" },
};

interface LiveMintFeedProps {
  className?: string;
}

export function LiveMintFeed({ className = "" }: LiveMintFeedProps) {
  const [mints, setMints] = useState<RecentMint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  const fetchMints = async () => {
    try {
      setError(null);
      const response = await fetch("/api/gallery?page=1&pageSize=20&sortBy=recent");
      if (!response.ok) {
        throw new Error("Failed to fetch gallery");
      }
      const data = await response.json();
      
      // Transform API data to RecentMint format
      const transformedMints: RecentMint[] = (data.nfts || []).map((nft: any, idx: number) => ({
        id: nft.id || `mint-${idx}`,
        address: nft.owner ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}` : "Unknown",
        rarity: nft.rarity as RecentMint["rarity"],
        timestamp: nft.mintedAt || Date.now() - (idx * 60000),
      }));
      
      setMints(transformedMints);
    } catch (err) {
      console.error("Error fetching mints:", err);
      setError("Unable to load recent mints");
      setMints([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMints();
  }, []);

  // Poll for new mints every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        fetchMints();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll through mints
  useEffect(() => {
    if (isPaused || mints.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(mints.length, 5));
    }, 3000);

    return () => clearInterval(interval);
  }, [mints.length, isPaused]);

  // Get current mint safely
  const currentMint = mints[currentIndex] || mints[0];
  const config = currentMint ? RARITY_CONFIG[currentMint.rarity] : null;

  const getRarityEmoji = (rarity: string) => {
    switch (rarity) {
      case "PLATINUM": return "💎";
      case "GOLD": return "👑";
      case "SILVER": return "⭐";
      case "UNCOMMON": return "🔥";
      default: return "⚫";
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Show loading state
  if (loading) {
    return (
      <div 
        className={`relative overflow-hidden rounded-lg border-2 ${className}`}
        style={{ 
          backgroundColor: "rgba(26, 26, 46, 0.95)", 
          borderColor: "#333" 
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-gray-500">
                LOADING
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no mints
  if (!loading && mints.length === 0) {
    return (
      <div 
        className={`relative overflow-hidden rounded-lg border-2 ${className}`}
        style={{ 
          backgroundColor: "rgba(26, 26, 46, 0.95)", 
          borderColor: "#333" 
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: "#e95420" }} />
              <span className="text-sm font-mono text-white">Recent Mints</span>
            </div>
          </div>
          <div className="text-center py-4">
            <p className="text-gray-500 font-mono text-sm">Be the first to mint!</p>
            <p className="text-gray-600 font-mono text-xs mt-1">No mints yet on the blockchain</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border-2 ${className}`}
      style={{ 
        backgroundColor: "rgba(26, 26, 46, 0.95)", 
        borderColor: "#333" 
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background glow for rare mints */}
      {currentMint?.rarity === "PLATINUM" && (
        <div 
          className="absolute inset-0"
          style={{ 
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
            animation: "pulse 2s infinite"
          }}
        />
      )}
      {currentMint?.rarity === "GOLD" && (
        <div 
          className="absolute inset-0"
          style={{ 
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)" 
          }}
        />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-mono font-bold" style={{ color: "#10B981" }}>
                LIVE
              </span>
            </div>
            <Sparkles className="w-4 h-4" style={{ color: "#e95420" }} />
            <span className="text-sm font-mono text-white">Recent Mints</span>
          </div>
          <TrendingUp className="w-4 h-4" style={{ color: "#10B981" }} />
        </div>

        {/* Main ticker */}
        <div className="flex items-center gap-3 py-2">
          {/* Rarity icon with glow effect */}
          <div className="relative flex-shrink-0">
            <span 
              className="text-2xl filter drop-shadow-lg"
              style={{ 
                textShadow: currentMint?.rarity === "PLATINUM" 
                  ? "0 0 20px rgba(168, 85, 247, 0.8)" 
                  : currentMint?.rarity === "GOLD"
                  ? "0 0 15px rgba(245, 158, 11, 0.6)"
                  : "none"
              }}
            >
              {getRarityEmoji(currentMint?.rarity || "COMMON")}
            </span>
            {currentMint?.rarity === "PLATINUM" && (
              <Gem className="absolute -top-1 -right-1 w-3 h-3" style={{ color: "#A855F7", fill: "#A855F7" }} />
            )}
          </div>

          {/* Mint info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span 
                className="font-mono text-sm font-bold truncate"
                style={{ color: config?.color || "#666" }}
              >
                {config?.label || "Unknown"}
              </span>
              {currentMint?.rarity === "PLATINUM" && (
                <Crown className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "#999" }}>
              <span className="truncate">{currentMint?.address}</span>
              <span>•</span>
              <span>{getTimeAgo(currentMint?.timestamp || Date.now())}</span>
            </div>
          </div>

          {/* Stats dots */}
          <div className="flex items-center gap-1">
            {mints.slice(0, 5).map((mint, idx) => (
              <button
                key={mint.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? "scale-125" : "opacity-50"
                }`}
                style={{ 
                  backgroundColor: RARITY_CONFIG[mint.rarity]?.color || "#666",
                  border: idx === currentIndex ? "2px solid white" : "none"
                }}
                title={`${mint.rarity} - ${mint.address}`}
              />
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#333" }}>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1">
              <Gem className="w-3 h-3" style={{ color: "#A855F7" }} />
              <span style={{ color: "#A855F7" }}>
                {mints.filter(m => m.rarity === "PLATINUM").length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3" style={{ color: "#F59E0B" }} />
              <span style={{ color: "#F59E0B" }}>
                {mints.filter(m => m.rarity === "GOLD").length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ color: "#94A3B8" }} />
              <span style={{ color: "#94A3B8" }}>
                {mints.filter(m => m.rarity === "SILVER").length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono" style={{ color: "#666" }}>
            <Flame className="w-3 h-3" style={{ color: "#e95420" }} />
            <span>{mints.length} mints total</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LiveMintFeed;
