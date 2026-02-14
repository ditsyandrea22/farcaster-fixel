"use client";

import { useState } from "react";
import { Share2, Twitter, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type RarityTier = "COMMON" | "UNCOMMON" | "SILVER" | "GOLD" | "PLATINUM";

interface TwitterShareProps {
  rarity: RarityTier;
  address?: string;
}

// Rarity configuration for share messages
const RARITY_CONFIG: Record<RarityTier, { color: string; emoji: string; message: string }> = {
  PLATINUM: { 
    color: "#A855F7", 
    emoji: "💎",
    message: "I just minted a LEGENDARY PLATINUM NFT on Fixel FID! The universe has chosen me! 🌟"
  },
  GOLD: { 
    color: "#F59E0B", 
    emoji: "👑",
    message: "Royal fortune smiles upon me! I got a GOLD NFT on Fixel FID! 👑"
  },
  SILVER: { 
    color: "#94A3B8", 
    emoji: "⭐",
    message: "Shimmering silver path ahead! Got a SILVER NFT on Fixel FID! ✨"
  },
  UNCOMMON: { 
    color: "#10B981", 
    emoji: "🔥",
    message: "Good fortune blows my way! Got an UNCOMMON NFT on Fixel FID! 🍀"
  },
  COMMON: { 
    color: "#6B7280", 
    emoji: "⚫",
    message: "Every journey begins somewhere! I just minted my first NFT on Fixel FID! 🎮"
  },
};

export function TwitterShare({ rarity, address }: TwitterShareProps) {
  const [copied, setCopied] = useState(false);
  const config = RARITY_CONFIG[rarity];

  const shareToTwitter = () => {
    const text = config.message;
    const url = "https://farcaster-fixel.vercel.app";
    window.open(
      "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url),
      "_blank"
    );
  };

  const copyToClipboard = async () => {
    const text = config.message + " https://farcaster-fixel.vercel.app";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-mono text-gray-400 text-center">
        Share your luck with the world!
      </p>
      
      <div className="flex gap-2">
        <Button
          onClick={shareToTwitter}
          className="flex-1 font-mono"
          style={{ backgroundColor: "#1DA1F2" }}
        >
          <Twitter className="w-4 h-4 mr-2" />
          Share on X
        </Button>
        <Button
          onClick={copyToClipboard}
          variant="outline"
          className="font-mono"
          style={{ borderColor: "#333", color: "#999" }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      <div 
        className="p-3 rounded-lg text-sm font-mono"
        style={{ backgroundColor: "#0f0f23", border: "1px solid #333" }}
      >
        <p style={{ color: config.color }}>
          {config.emoji} {config.message}
        </p>
        <p className="text-gray-500 mt-1 text-xs">
          https://farcaster-fixel.vercel.app
        </p>
      </div>
    </div>
  );
}

// Helper function to trigger share modal
export function triggerShare(rarity: RarityTier) {
  const config = RARITY_CONFIG[rarity];
  const text = config.message;
  const url = "https://farcaster-fixel.vercel.app";
  window.open(
    "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url),
    "_blank"
  );
}

export default TwitterShare;
