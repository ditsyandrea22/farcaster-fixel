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
  Wallet,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import styles from "@/styles/animations.module.css";

// Ubuntu Terminal Theme Colors
const THEME = {
  bg: '#1a1a2e',
  bgSecondary: '#16213e',
  bgTertiary: '#0f0f23',
  accent: '#e95420',
  text: '#ffffff',
  textMuted: '#999999',
  success: '#0e8420',
  border: '#333333',
};

// Sample NFT data for preview gallery with local image paths
const SAMPLE_NFTS = [
  { id: 1, seed: 12345, rarity: "COMMON" as const, name: "Pixel Pioneer", image: "/Pixel-Pioneer.png" },
  { id: 2, seed: 54321, rarity: "UNCOMMON" as const, name: "Crypto Explorer", image: "/Crypto Explorer.png" },
  { id: 3, seed: 11111, rarity: "SILVER" as const, name: "Silver Surfer", image: "/Silver Surfer.png" },
  { id: 4, seed: 99999, rarity: "GOLD" as const, name: "Golden Goose", image: "/Golden Goose.png" },
  { id: 5, seed: 88888, rarity: "PLATINUM" as const, name: "Legendary Lucker", image: "/Legendary-Lucker.png" },
];

// Rarity configuration for display
const RARITY_CONFIG = {
  COMMON: { name: "COMMON", color: "#6B7280", rate: "80%", icon: "⚫" },
  UNCOMMON: { name: "UNCOMMON", color: "#10B981", rate: "15%", icon: "🔥" },
  SILVER: { name: "SILVER", color: "#94A3B8", rate: "4%", icon: "⭐" },
  GOLD: { name: "GOLD", color: "#F59E0B", rate: "0.99%", icon: "👑" },
  PLATINUM: { name: "PLATINUM", color: "#A855F7", rate: "0.01%", icon: "💎" },
} as const;

// Terminal Window Component
function TerminalWindow({ children, className = "", title = "" }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={`border-2 rounded-lg overflow-hidden ${className}`} style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
      <div className="px-4 py-2 border-b-2 flex items-center justify-between" style={{ backgroundColor: THEME.bgTertiary, borderColor: THEME.border }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f0c674' }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.success }}></div>
          </div>
          {title && <span className="font-mono text-xs" style={{ color: THEME.textMuted }}>{title}</span>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// NFT Preview Card Component
function NFTPreviewCard({ nft, config }: { nft: typeof SAMPLE_NFTS[0]; config: typeof RARITY_CONFIG[keyof typeof RARITY_CONFIG] }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(nft.image || "/placeholder.svg");

  useEffect(() => {
    const img = new window.Image();
    img.src = nft.image || "/placeholder.svg";
    img.onload = () => {
      setImgSrc(nft.image || "/placeholder.svg");
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImgSrc("/placeholder.svg");
      setImageLoaded(true);
    };
  }, [nft.image]);

  return (
    <div className="p-4 border-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
      <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-black/30">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin" style={{ borderColor: THEME.accent }}></div>
          </div>
        )}
        <img src={imgSrc} alt={nft.name} className={`w-full h-full object-cover ${imageLoaded ? "opacity-100" : "opacity-0"}`} />
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${config.color}20`, border: `1px solid ${config.color}40`, color: config.color }}>
          {config.icon} {config.name}
        </div>
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-semibold text-white truncate">{nft.name}</p>
        <p className="text-gray-500 font-mono text-xs mt-1">Rate: {config.rate}</p>
      </div>
    </div>
  );
}

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
        <style>{`
          * {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
          }
          h1, h2, h3, h4, h5, h6, p, span, div, a, button, li, td, th {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
          }
        `}</style>
      </Head>
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <nav className="sticky top-0 z-50 border-b-2" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(233, 84, 32, 0.2)" }}>
                <Terminal size={20} style={{ color: THEME.accent }} />
              </div>
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">Fixel FID</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: "rgba(14, 132, 32, 0.2)", borderColor: THEME.success }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME.success }}></div>
              <p className="font-mono text-xs text-green-400">Base Mainnet</p>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6">
          <div className={`py-20 text-center space-y-6 ${styles.slideUp}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
              <Sparkles size={16} style={{ color: THEME.accent }} />
              <span className="font-mono text-sm" style={{ color: THEME.textMuted }}>AI-Powered NFT Generator</span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-bold text-white leading-tight font-mono">
              Generate & Mint{" "}
              <span style={{ color: THEME.accent }}>Pixel NFTs</span>
              <br />
              <span className="text-3xl lg:text-5xl" style={{ color: THEME.textMuted }}>from Base Mainnet</span>
            </h2>

            <p className="text-xl max-w-2xl mx-auto font-mono" style={{ color: THEME.textMuted }}>
              Connect your wallet, auto-detect your FarCaster identity, and instantly mint unique pixel art NFTs on Base with AI-powered generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/mint">
                <Button className="font-mono font-bold px-8 py-4 text-lg rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105" style={{ backgroundColor: THEME.accent, color: "#ffffff", border: `2px solid ${THEME.accent}` }}>
                  <Wallet size={20} />
                  Start Minting
                  <ExternalLink size={20} />
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="outline" className="px-8 py-4 text-lg rounded-lg font-mono transition-all duration-300" style={{ borderColor: THEME.border, color: THEME.textMuted }}>
                  ./learn.sh
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-16">
            {[
              { icon: <Sparkles size={24} style={{ color: THEME.accent }} />, title: "> Auto Generate", desc: "Unique pixel NFT designs generated instantly based on your FarCaster FID and wallet address." },
              { icon: <Lock size={24} style={{ color: THEME.success }} />, title: "> Verified Identity", desc: "Wallet auto-connects to FarCaster via Neynar API for seamless authentication." },
              { icon: <Zap size={24} style={{ color: "#f0c674" }} />, title: "> Instant Mint", desc: "One-click minting on Base network with real-time transaction confirmation." },
            ].map((feature, index) => (
              <TerminalWindow key={index} className="hover:border-orange-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-md flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{feature.icon}</div>
                <h3 className="font-mono text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>{feature.desc}</p>
              </TerminalWindow>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: "rgba(233, 84, 32, 0.1)", borderColor: THEME.accent }}>
                <Cpu size={14} style={{ color: THEME.accent }} />
                <span className="font-mono text-sm" style={{ color: THEME.accent }}>Built for FarCaster</span>
              </div>
              <h3 className="text-3xl font-bold text-white font-mono">
                <span style={{ color: THEME.accent }}>&gt;</span> Built for FarCaster
              </h3>
              <p className="text-lg font-mono" style={{ color: THEME.textMuted }}>
                Seamlessly integrated with FarCaster Mini Apps & Frames. Experience the future of decentralized identity and collectibles.
              </p>
              <div className="flex flex-wrap gap-2">
                {["FarCaster MiniApp SDK", "Base Mainnet", "Neynar API", "wagmi/v2"].map((tech) => (
                  <span key={tech} className="px-3 py-1.5 rounded-lg font-mono text-sm border" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border, color: THEME.textMuted }}>{tech}</span>
                ))}
              </div>
            </div>

            <TerminalWindow title="bash — contract">
              <div className="font-mono text-sm space-y-2">
                <p className="text-gray-500">$ cast send --to</p>
                <p style={{ color: THEME.accent }}>0xBee2A3b777445E212886815A5384f6F4e8902d21</p>
                <div className="pt-4 border-t" style={{ borderColor: THEME.border }}>
                  <div className="flex items-center gap-2" style={{ color: THEME.success }}>
                    <Zap size={14} />
                    <span>Contract deployed on Base</span>
                  </div>
                </div>
              </div>
            </TerminalWindow>
          </div>

          <div className={`py-20 text-center space-y-6 ${styles.slideUp}`}>
            <h3 className="text-4xl font-bold text-white font-mono">
              <span style={{ color: THEME.accent }}>&gt;</span> Ready to Reveal Your Luck?
            </h3>
            <p className="text-lg font-mono max-w-xl mx-auto" style={{ color: THEME.textMuted }}>
              Generate your unique NFT based on your wallet is destiny. Rare rarities like PLATINUM await!
            </p>
            <Link href="/mint">
              <Button className="font-mono font-bold px-10 py-5 text-xl rounded-lg flex items-center gap-3 mx-auto transition-all duration-300 hover:scale-105" style={{ backgroundColor: THEME.accent, color: "#ffffff", border: `2px solid ${THEME.accent}` }}>
                <ExternalLink size={24} />
                ./launch.sh --mint
              </Button>
            </Link>
          </div>

          <div className={`py-16 ${styles.slideUp}`}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white font-mono mb-2">
                <span style={{ color: THEME.accent }}>&gt;</span> Preview Your Destiny
              </h3>
              <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>Sample NFTs with different rarities - your luck awaits!</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {SAMPLE_NFTS.map((nft) => (
                <NFTPreviewCard key={nft.id} nft={nft} config={RARITY_CONFIG[nft.rarity as keyof typeof RARITY_CONFIG]} />
              ))}
            </div>

            <div className="mt-12 max-w-3xl mx-auto">
              <h4 className="font-mono font-bold text-white text-center mb-4">
                <span style={{ color: THEME.accent }}>&gt;</span> Rarity Distribution
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(RARITY_CONFIG).map(([key, config]) => (
                  <div key={key} className="text-center p-4 rounded-lg border" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                    <div className="text-2xl mb-2">{config.icon}</div>
                    <p className="font-bold font-mono text-sm" style={{ color: config.color }}>{config.name}</p>
                    <p className="text-xs font-mono" style={{ color: THEME.textMuted }}>{config.rate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t py-8 text-center" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Terminal size={20} style={{ color: THEME.accent }} />
            <span className="font-mono font-bold text-white">Fixel FID</span>
          </div>
          <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>Built with Base, FarCaster, Neynar, and wagmi</p>
          <p className="font-mono text-xs mt-2" style={{ color: "#666666" }}>Minting on Base Network • {isLoaded ? "✓ System ready" : "Loading..."}</p>
        </footer>
      </div>
    </>
  );
}
