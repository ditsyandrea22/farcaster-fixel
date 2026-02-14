"use client";

import { useState, useEffect } from "react";
import { 
  Flame, 
  ArrowRight, 
  Shield, 
  Info, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

// Types
type RarityTier = "COMMON" | "UNCOMMON" | "SILVER" | "GOLD" | "PLATINUM";

interface NFT {
  id: string;
  tokenId: number;
  rarity: RarityTier;
  name: string;
  image: string;
  owner: string;
  mintedAt: number;
}

interface BurnResult {
  success: boolean;
  newRarity?: RarityTier;
  message: string;
}

// Theme colors
const THEME = {
  bg: '#0f0f23',
  bgSecondary: '#1a1a2e',
  accent: '#e95420',
  gold: '#F59E0B',
  platinum: '#A855F7',
};

// Rarity configuration
const RARITY_CONFIG: Record<RarityTier, { color: string; icon: string }> = {
  COMMON: { color: "#6B7280", icon: "⚫" },
  UNCOMMON: { color: "#10B981", icon: "🔥" },
  SILVER: { color: "#94A3B8", icon: "⭐" },
  GOLD: { color: "#F59E0B", icon: "👑" },
  PLATINUM: { color: "#A855F7", icon: "💎" },
};

// Burn rules
const BURN_RULES = [
  { from: "COMMON", to: "UNCOMMON", cost: 2, chance: 25 },
  { from: "UNCOMMON", to: "SILVER", cost: 2, chance: 15 },
  { from: "SILVER", to: "GOLD", cost: 2, chance: 10 },
  { from: "GOLD", to: "PLATINUM", cost: 2, chance: 5 },
];

interface BurnPageProps {
  walletAddress?: string;
}

export default function BurnPage() {
  const [selectedNFTs, setSelectedNFTs] = useState<NFT[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [result, setResult] = useState<BurnResult | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const router = useRouter();

  // Get wallet address from localStorage (set by mini-app) with fallback
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    if (savedAddress && savedAddress.startsWith('0x')) {
      setWalletAddress(savedAddress);
    } else {
      // Try to get from session storage
      const sessionAddress = sessionStorage.getItem('wallet_address');
      if (sessionAddress && sessionAddress.startsWith('0x')) {
        setWalletAddress(sessionAddress);
      }
    }
  }, []);

  // Fetch user's NFTs from API
  const fetchUserNFTs = async (address: string) => {
    setLoadingNFTs(true);
    try {
      // Fetch from gallery API filtered by owner
      const response = await fetch(`/api/gallery?owner=${address}&pageSize=100`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform API data to NFT format
        const nfts: NFT[] = (data.nfts || []).map((nft: any) => ({
          id: nft.id,
          tokenId: nft.tokenId,
          rarity: nft.rarity as RarityTier,
          name: nft.name || `Pixel #${nft.tokenId}`,
          image: `/api/nft-image?tokenId=${nft.tokenId}&seed=${nft.seed || nft.tokenId * 9999}`,
          owner: nft.owner,
          mintedAt: nft.mintedAt,
        }));
        
        setUserNFTs(nfts);
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setUserNFTs([]);
    } finally {
      setLoadingNFTs(false);
      setLoading(false);
    }
  };

  // Initial load - use wallet address from state
  useEffect(() => {
    if (walletAddress) {
      fetchUserNFTs(walletAddress);
    } else {
      setLoading(false);
    }
  }, [walletAddress]);

  const toggleNFT = (nft: NFT) => {
    if (selectedNFTs.find(n => n.id === nft.id)) {
      setSelectedNFTs(selectedNFTs.filter(n => n.id !== nft.id));
    } else if (selectedNFTs.length < 2) {
      setSelectedNFTs([...selectedNFTs, nft]);
    }
  };

  const getAvailableUpgrades = () => {
    if (selectedNFTs.length !== 2) return null;
    if (selectedNFTs[0].rarity !== selectedNFTs[1].rarity) return null;
    
    const rule = BURN_RULES.find(r => r.from === selectedNFTs[0].rarity);
    return rule;
  };

  const upgrade = getAvailableUpgrades();

  const handleBurn = async () => {
    if (!upgrade || !walletAddress || selectedNFTs.length !== 2) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIds: selectedNFTs.map(n => n.tokenId),
          owner: walletAddress,
        }),
      });

      const data = await response.json();
      
      setResult({
        success: data.upgraded || false,
        newRarity: data.newRarity as RarityTier,
        message: data.message,
      });

      // Remove burned NFTs from user's list
      setUserNFTs(prev => prev.filter(nft => 
        !selectedNFTs.find(sel => sel.id === nft.id)
      ));
    } catch (err) {
      console.error("Error burning NFTs:", err);
      setResult({
        success: false,
        message: "Failed to process burn. Please try again.",
      });
    } finally {
      setSelectedNFTs([]);
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: THEME.bg }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.accent }} />
          </div>
        </div>
      </div>
    );
  }

  // Render wallet not connected state
  if (!walletAddress) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: THEME.bg }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="icon" className="border-gray-700 hover:bg-gray-800">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.accent}20` }}>
                <Flame className="w-6 h-6" style={{ color: THEME.accent }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Burn to Upgrade</h1>
                <p style={{ color: '#999' }}>Merge 2 NFTs for a chance at a higher tier!</p>
              </div>
            </div>
          </div>

          {/* Not Connected */}
          <Card style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
            <CardContent className="p-8 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4" style={{ color: THEME.accent }} />
              <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Connect your wallet to see your NFTs and burn them for upgrades!</p>
              <Link href="/mint">
                <Button style={{ backgroundColor: THEME.accent }}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: THEME.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="icon" className="border-gray-700 hover:bg-gray-800">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.accent}20` }}>
              <Flame className="w-6 h-6" style={{ color: THEME.accent }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Burn to Upgrade</h1>
              <p style={{ color: '#999' }}>Merge 2 NFTs for a chance at a higher tier!</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-gray-500">Connected</p>
            <p className="text-sm font-mono text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          </div>
        </div>

        {/* How it works */}
        <Card className="mb-6" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white font-mono">
              <Info className="w-5 h-5" style={{ color: THEME.accent }} />
              How it Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Select 2 NFTs", desc: "Choose 2 NFTs of the same tier" },
                { step: "2", title: "Burn Them", desc: "Both NFTs will be destroyed" },
                { step: "3", title: "Roll the Dice", desc: "Chance-based upgrade attempt" },
                { step: "4", title: "Get Reward", desc: "Higher tier or keep trying!" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2" style={{ backgroundColor: `${THEME.accent}30`, color: THEME.accent }}>
                    {item.step}
                  </div>
                  <p className="font-mono text-sm text-white">{item.title}</p>
                  <p className="font-mono text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade chances */}
        <Card className="mb-6" style={{ backgroundColor: THEME.bgSecondary, borderColor: "#333" }}>
          <CardContent className="p-4">
            <p className="font-mono text-sm text-gray-400 mb-3">Upgrade Chances</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BURN_RULES.map((rule) => (
                <div key={rule.from + rule.to} className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg }}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span style={{ color: RARITY_CONFIG[rule.from as RarityTier].color }}>{RARITY_CONFIG[rule.from as RarityTier].icon}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                    <span style={{ color: RARITY_CONFIG[rule.to as RarityTier].color }}>{RARITY_CONFIG[rule.to as RarityTier].icon}</span>
                  </div>
                  <p className="font-mono text-xs" style={{ color: "#666" }}>{rule.chance}% chance</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected NFTs */}
        <Card className="mb-6" style={{ 
          backgroundColor: THEME.bgSecondary, 
          borderColor: upgrade ? THEME.accent : "#333" 
        }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-white font-mono">Select 2 NFTs to Burn</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNFTs.length === 0 ? (
              <p className="text-center text-gray-500 font-mono py-8">Select 2 NFTs of the same tier below</p>
            ) : selectedNFTs.length === 1 ? (
              <p className="text-center text-gray-500 font-mono py-8">Select 1 more NFT</p>
            ) : upgrade ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  {selectedNFTs.map((nft) => (
                    <div key={nft.id} className="flex items-center gap-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: RARITY_CONFIG[nft.rarity].color + "20", border: "2px solid " + RARITY_CONFIG[nft.rarity].color }}>
                        <span className="text-2xl">{RARITY_CONFIG[nft.rarity].icon}</span>
                      </div>
                      {selectedNFTs.indexOf(nft) === 0 && <Flame className="w-6 h-6" style={{ color: THEME.accent }} />}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Badge style={{ backgroundColor: THEME.accent + "30", color: THEME.accent }}>
                    {upgrade.chance}% chance to upgrade to {upgrade.to}
                  </Badge>
                </div>
                <Button onClick={handleBurn} disabled={loading} className="w-full font-mono" style={{ backgroundColor: THEME.accent }}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Burning...</> : <><Flame className="w-4 h-4 mr-2" />Burn & Upgrade</>}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-yellow-500 font-mono py-4">
                <AlertCircle className="w-5 h-5" />
                <span>Select 2 NFTs of the same tier to upgrade</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User's NFTs */}
        <Card className="mb-6" style={{ backgroundColor: THEME.bgSecondary, borderColor: "#333" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-sm text-gray-400">Your NFTs ({userNFTs.length})</p>
              {loadingNFTs && <Loader2 className="w-4 h-4 animate-spin" style={{ color: THEME.accent }} />}
            </div>
            
            {userNFTs.length === 0 && !loadingNFTs ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-mono mb-4">You don't have any NFTs yet.</p>
                <Link href="/mint">
                  <Button style={{ backgroundColor: THEME.accent }}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Mint Your First NFT
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {userNFTs.map((nft) => {
                  const isSelected = selectedNFTs.find(n => n.id === nft.id);
                  return (
                    <button
                      key={nft.id}
                      onClick={() => toggleNFT(nft)}
                      disabled={selectedNFTs.length >= 2 && !isSelected}
                      className={`p-3 rounded-lg border-2 transition-all ${isSelected ? "scale-105" : "hover:scale-105"}`}
                      style={{ 
                        backgroundColor: isSelected ? RARITY_CONFIG[nft.rarity].color + "20" : THEME.bg,
                        borderColor: isSelected ? RARITY_CONFIG[nft.rarity].color : "#333",
                        opacity: selectedNFTs.length >= 2 && !isSelected ? 0.5 : 1
                      }}
                    >
                      <div className="aspect-square mb-2 rounded overflow-hidden bg-black/30">
                        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <span className="text-xl">{RARITY_CONFIG[nft.rarity].icon}</span>
                        <p className="font-mono text-xs text-white mt-1 truncate">{nft.name}</p>
                        <p className="font-mono text-xs" style={{ color: RARITY_CONFIG[nft.rarity].color }}>{nft.rarity}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="mb-6" style={{ backgroundColor: THEME.bgSecondary, borderColor: result.success ? THEME.platinum : "#333" }}>
            <CardContent className="p-6 text-center">
              {result.success ? <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: THEME.platinum }} /> : <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#666" }} />}
              <p className="font-mono text-lg text-white">{result.message}</p>
              <div className="mt-4">
                <Link href="/mint">
                  <Button style={{ backgroundColor: THEME.accent }}>Mint More NFTs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
