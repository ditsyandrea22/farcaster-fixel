"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { sdk } from "@farcaster/miniapp-sdk";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Lock,
  Sparkles,
  Terminal,
  Terminal as TerminalIcon,
  Cpu,
  Star,
  Crown,
  Gem,
  Trophy,
  Wallet,
  Gift,
  ArrowRight,
  Flame,
} from "lucide-react";
import Link from "next/link";
import styles from "@/styles/animations.module.css";

// Sample NFT data for preview gallery - each has a deterministic seed
const SAMPLE_NFTS = [
  { id: 1, seed: 12345, rarity: "COMMON" as const, name: "Pixel Pioneer" },
  { id: 2, seed: 54321, rarity: "UNCOMMON" as const, name: "Crypto Explorer" },
  { id: 3, seed: 11111, rarity: "SILVER" as const, name: "Silver Surfer" },
  { id: 4, seed: 99999, rarity: "GOLD" as const, name: "Golden Goose" },
  { id: 5, seed: 88888, rarity: "PLATINUM" as const, name: "Legendary Lucker" },
];

// Rarity configuration for display
const RARITY_CONFIG = {
  COMMON: { name: "COMMON", color: "#6B7280", rate: "80%", icon: "⚫" },
  UNCOMMON: { name: "UNCOMMON", color: "#10B981", rate: "15%", icon: "🔥" },
  SILVER: { name: "SILVER", color: "#94A3B8", rate: "4%", icon: "⭐" },
  GOLD: { name: "GOLD", color: "#F59E0B", rate: "0.99%", icon: "👑" },
  PLATINUM: { name: "PLATINUM", color: "#E5E7EB", rate: "0.01%", icon: "💎" },
} as const;

// Rarity icons mapping
const RarityIcon = ({ rarity, size = 20 }: { rarity: keyof typeof RARITY_CONFIG; size?: number }) => {
  const icons: Record<string, React.ReactNode> = {
    PLATINUM: <Gem size={size} className="text-purple-300" />,
    GOLD: <Crown size={size} className="text-yellow-400" />,
    SILVER: <Star size={size} className="text-gray-300" />,
    UNCOMMON: <Flame size={size} className="text-orange-400" />,
    COMMON: <Trophy size={size} className="text-gray-400" />,
  };
  return icons[rarity] || null;
};

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let called = false;

    async function ready() {
      try {
        if (called) return;
        called = true;

        await sdk.actions.ready();
        console.log("✅ FarCaster Mini App READY");
        setIsLoaded(true);
      } catch (err) {
        console.error("❌ sdk.actions.ready failed", err);
        setIsLoaded(true);
      }
    }

    ready();
  }, []);

  return (
    <>
      <Head>
        <meta name="base:app_id" content="6989f2196dea3c7b8e14a0d9" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        {/* Modern Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Gift size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Fixel FID
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <p className="text-sm text-green-400">Base Mainnet</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6">
          <div className={`py-20 text-center space-y-8 ${styles.slideUp}`}>
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-4">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-sm text-gray-300">AI-Powered NFT Generator</span>
            </div>

            {/* Hero Title */}
            <h2 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
              Generate & Mint{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pixel NFTs
              </span>
              <br />
              <span className="text-gray-400 text-3xl lg:text-5xl">from FarCaster</span>
            </h2>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect your wallet, auto-detect your FarCaster identity, and
              instantly mint unique pixel art NFTs on Base with AI-powered generation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/mint">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                  <Wallet size={20} />
                  Start Minting
                  <ArrowRight size={20} />
                </Button>
              </Link>
              <Link href="/learn">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl transition-all duration-300"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-16">
            {[
              {
                icon: <Sparkles size={28} className="text-purple-400" />,
                title: "AI Generation",
                desc: "Unique pixel NFT designs generated instantly based on your FarCaster FID and wallet address.",
                color: "from-purple-500/20 to-pink-500/20",
              },
              {
                icon: <Lock size={28} className="text-green-400" />,
                title: "Verified Identity",
                desc: "Wallet auto-connects to FarCaster via Neynar API for seamless authentication.",
                color: "from-green-500/20 to-emerald-500/20",
              },
              {
                icon: <Zap size={28} className="text-yellow-400" />,
                title: "Instant Mint",
                desc: "One-click minting on Base network with real-time transaction confirmation.",
                color: "from-yellow-500/20 to-orange-500/20",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`p-6 bg-gradient-to-br ${feature.color} border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </Card>
            ))}
          </div>

          {/* Technical Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                <Cpu size={14} className="text-purple-400" />
                <span className="text-sm text-purple-300">Built for FarCaster</span>
              </div>
              <h3 className="text-3xl font-bold text-white">
                Seamless Integration
              </h3>
              <p className="text-gray-400 text-lg">
                Seamlessly integrated with FarCaster Mini Apps & Frames.
                Experience the future of decentralized identity and collectibles.
              </p>
              <div className="flex flex-wrap gap-3">
                {["FarCaster MiniApp SDK", "Base Mainnet", "Neynar API", "wagmi/v2"].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <Card className="p-6 bg-gradient-to-br from-white/10 to-white/5 border-white/10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <p className="text-gray-500">$ cast send --to</p>
                  <p className="text-purple-300">0xBee2A3b777445E212886815A5384f6F4e8902d21</p>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-green-400">
                      <Zap size={14} />
                      <span>Contract deployed on Base</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className={`py-20 text-center space-y-6 ${styles.slideUp}`}>
            <h3 className="text-4xl font-bold text-white">
              Ready to Reveal Your Luck?
            </h3>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Generate your unique NFT based on your wallet's destiny. 
              Rare rarities like PLATINUM await!
            </p>
            <Link href="/mint">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-10 py-5 text-xl rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-3">
                <Gift size={24} />
                Mint Your NFT
              </Button>
            </Link>
          </div>

          {/* NFT Preview Gallery */}
          <div className={`py-16 ${styles.slideUp}`}>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">
                Preview Your Destiny
              </h3>
              <p className="text-gray-400">
                Sample NFTs with different rarities - your luck awaits!
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {SAMPLE_NFTS.map((nft) => {
                const config = RARITY_CONFIG[nft.rarity as keyof typeof RARITY_CONFIG];
                return (
                  <Card
                    key={nft.id}
                    className="p-4 bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
                      <img
                        src={`/api/nft-image?tokenId=${nft.id}&random=true`}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div
                        className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${config.color}20`,
                          border: `1px solid ${config.color}40`,
                          color: config.color,
                        }}
                      >
                        {config.icon} {config.name}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white truncate">
                        {nft.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rate: {config.rate}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Rarity Distribution Info */}
            <div className="mt-12 max-w-3xl mx-auto">
              <h4 className="text-lg font-semibold text-white text-center mb-4">
                Rarity Distribution
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(RARITY_CONFIG).map(([key, config]) => (
                  <div
                    key={key}
                    className="text-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    style={{
                      background: `linear-gradient(135deg, ${config.color}15, transparent)`,
                    }}
                  >
                    <div className="text-2xl mb-2">{config.icon}</div>
                    <p className="font-bold text-sm" style={{ color: config.color }}>
                      {config.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{config.rate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 text-center bg-slate-900/50">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift size={20} className="text-purple-400" />
            <span className="text-white font-semibold">Fixel FID</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built with Base, FarCaster, Neynar, and wagmi
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Minting on Base Network • {isLoaded ? "✓ System ready" : "Loading..."}
          </p>
        </footer>
      </div>
    </>
  );
}
