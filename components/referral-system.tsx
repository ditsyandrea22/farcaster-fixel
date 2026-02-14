"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Crown, 
  Copy, 
  Check,
  Share2,
  Shield,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Types
interface ReferralTier {
  name: string;
  friendsRequired: number;
  bonus: string;
  color: string;
  icon: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalBonusMints: number;
  currentTier: string;
  referralCode: string;
}

// Theme colors
const THEME = {
  bg: "#0f0f23",
  bgSecondary: "#1a1a2e",
  accent: "#e95420",
  gold: "#F59E0B",
};

// Referral tiers configuration
const REFERRAL_TIERS = [
  { name: "Bronze", friendsRequired: 1, bonus: "+0.1% Platinum chance", color: "#CD7F32", icon: "⭐" },
  { name: "Silver", friendsRequired: 5, bonus: "+0.5% Platinum + Gold badge", color: "#94A3B8", icon: "🥈" },
  { name: "Gold", friendsRequired: 10, bonus: "+1% Platinum + Exclusive border", color: "#F59E0B", icon: "👑" },
  { name: "Diamond", friendsRequired: 25, bonus: "+2% Platinum + Featured profile", color: "#3B82F6", icon: "💠" },
];

interface ReferralSystemProps {
  address?: string;
}

export function ReferralSystem({ address }: ReferralSystemProps) {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalBonusMints: 0,
    currentTier: "None",
    referralCode: "",
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch real referral data from API
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user-profile?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          const referralCode = data.referral_code || `FIXEL-${address.slice(2, 8).toUpperCase()}`;
          const totalRefs = data.total_referrals || 0;
          
          // Calculate bonus based on referrals
          let bonus = 0;
          if (totalRefs >= 25) bonus = 2;
          else if (totalRefs >= 10) bonus = 1;
          else if (totalRefs >= 5) bonus = 0.5;
          else if (totalRefs >= 1) bonus = 0.1;
          
          setStats({
            totalReferrals: totalRefs,
            totalBonusMints: bonus,
            currentTier: data.current_tier || "None",
            referralCode: referralCode,
          });
        }
      } catch (err) {
        console.error("Error fetching referral data:", err);
        // Fallback to address-based code
        setStats({
          totalReferrals: 0,
          totalBonusMints: 0,
          currentTier: "None",
          referralCode: `FIXEL-${address.slice(2, 8).toUpperCase()}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, [address]);

  // Calculate tier progress
  const getCurrentTier = () => {
    const tierIndex = REFERRAL_TIERS.findIndex(t => stats.totalReferrals >= t.friendsRequired);
    return tierIndex >= 0 ? tierIndex + 1 : 0;
  };

  const tiers = REFERRAL_TIERS.map((tier: any, index: number) => ({
    ...tier,
    unlocked: index < getCurrentTier(),
  }));

  const copyToClipboard = async () => {
    const url = `https://farcaster-fixel.vercel.app/mint?ref=${stats.referralCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const url = `https://farcaster-fixel.vercel.app/mint?ref=${stats.referralCode}`;
    const text = "🎮 Join me on Fixel FID! Mint pixel NFTs on Base and win rare rarities! Use my referral link:";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: "#333" }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
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
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" style={{ color: THEME.accent }} />
            <span className="font-mono">Referral Program</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-gray-400 font-mono text-sm">
              Connect your wallet to get your unique referral code!
            </p>
          </div>
          
          {/* How it works */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.accent + "30", color: THEME.accent }}>1</div>
              <div><p className="font-mono text-sm text-white">Share your link</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.accent + "30", color: THEME.accent }}>2</div>
              <div><p className="font-mono text-sm text-white">Friend mints NFT</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.accent + "30", color: THEME.accent }}>3</div>
              <div><p className="font-mono text-sm text-white">Earn bonus + unlock tiers</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" style={{ color: THEME.accent }} />
            <span className="font-mono">Referral Program</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: THEME.bg }}>
            <p className="text-sm font-mono text-gray-400 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded font-mono text-lg text-white" style={{ backgroundColor: THEME.bgSecondary }}>
                {stats.referralCode}
              </code>
              <Button onClick={copyToClipboard} size="sm" className="font-mono" style={{ backgroundColor: THEME.accent }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button onClick={shareToTwitter} className="flex-1 font-mono" style={{ backgroundColor: "#1DA1F2" }}>
              <Share2 className="w-4 h-4 mr-2" />Share on X
            </Button>
            <Button onClick={copyToClipboard} className="flex-1 font-mono" variant="outline" style={{ borderColor: THEME.accent, color: THEME.accent }}>
              <Copy className="w-4 h-4 mr-2" />Copy Link
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: "#333" }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-white font-mono">{stats.totalReferrals}</p>
              <p className="text-xs font-mono text-gray-400">Friends Joined</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: THEME.gold }} font-mono>+{stats.totalBonusMints}%</p>
              <p className="text-xs font-mono text-gray-400">Bonus Chance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Progress */}
      <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: "#333" }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white font-mono text-lg">
            <Crown className="w-5 h-5" style={{ color: THEME.gold }} />Tier Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.map((tier: any, index: number) => (
            <div
              key={tier.name}
              className={tier.unlocked ? "p-3 rounded-lg border-2 transition-all scale-[1.02]" : "p-3 rounded-lg border-2 transition-all opacity-60"}
              style={{
                backgroundColor: tier.unlocked ? tier.color + "15" : THEME.bg,
                borderColor: tier.unlocked ? tier.color : "#333",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: tier.unlocked ? tier.color + "30" : "#333", color: tier.unlocked ? tier.color : "#666" }}>
                    {tier.icon}
                  </div>
                  <div>
                    <p className="font-bold font-mono" style={{ color: tier.unlocked ? tier.color : "#666" }}>{tier.name}</p>
                    <p className="text-xs font-mono text-gray-400">{tier.bonus}</p>
                  </div>
                </div>
                {tier.unlocked ? (
                  <div className="flex items-center gap-1 text-xs font-mono" style={{ color: THEME.accent }}>
                    <Shield className="w-4 h-4" /><span>Unlocked!</span>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-500">{Math.max(0, tier.friendsRequired - stats.totalReferrals)} more</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReferralSystem;
