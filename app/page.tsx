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
} from "lucide-react";
import Link from "next/link";
import styles from "@/styles/animations.module.css";

// Sample NFT data for preview gallery - each has a deterministic seed
const SAMPLE_NFTS = [
  { id: 1, seed: 12345, rarity: 'COMMON' as const, name: 'Pixel Pioneer' },
  { id: 2, seed: 54321, rarity: 'UNCOMMON' as const, name: 'Crypto Explorer' },
  { id: 3, seed: 11111, rarity: 'SILVER' as const, name: 'Silver Surfer' },
  { id: 4, seed: 99999, rarity: 'GOLD' as const, name: 'Golden Goose' },
  { id: 5, seed: 88888, rarity: 'PLATINUM' as const, name: 'Legendary Lucker' },
]

// Rarity configuration for display
const RARITY_CONFIG = {
  COMMON: { name: 'COMMON', color: '#6B7280', rate: '80%', icon: null },
  UNCOMMON: { name: 'UNCOMMON', color: '#10B981', rate: '15%', icon: null },
  SILVER: { name: 'SILVER', color: '#94A3B8', rate: '4%', icon: Star },
  GOLD: { name: 'GOLD', color: '#F59E0B', rate: '0.99%', icon: Crown },
  PLATINUM: { name: 'PLATINUM', color: '#E5E7EB', rate: '0.01%', icon: Gem },
} as const

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const fullText = "> Initialize Fixel FID...";

  useEffect(() => {
    let called = false;

    async function ready() {
      try {
        if (called) return;
        called = true;

        await sdk.actions.ready();
        console.log("✅ FarCaster Mini App READY");
      } catch (err) {
        console.error("❌ sdk.actions.ready failed", err);
      }
    }

    ready();
  }, []);

  // Typing animation effect
  useEffect(() => {
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <meta name="base:app_id" content="6989f2196dea3c7b8e14a0d9" />
      </Head>
      <div className="min-h-screen bg-terminal-dark">
      {/* Terminal-style Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm border-b border-border/50 bg-terminal-dark/95">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">
              <span className="text-primary">></span> Fixel FID
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-sm font-mono text-muted-foreground">Base Mainnet</p>
          </div>
        </div>
      </nav>

      {/* Terminal-style Hero Section */}
      <main className="max-w-7xl mx-auto px-6 bg-terminal-dark">
        <div className={`py-20 text-center space-y-6 ${styles.slideUp}`}>
          {/* Terminal Header */}
          <div className="terminal-box p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2 border-b border-border/50 pb-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-xs text-muted-foreground font-mono">bash — 80x24</span>
            </div>
            <div className="font-mono text-left text-sm text-primary">
              <p className="typing-effect">{typedText}</p>
              <p className="text-green-400 mt-1 opacity-80">
                ✓ Connected to FarCaster Network
              </p>
              <p className="text-green-400 opacity-80">
                ✓ Base Mainnet RPC Active
              </p>
              <p className="text-green-400 opacity-80">
                ✓ Neynar API Ready
              </p>
              <p className="text-muted-foreground mt-2">
                <span className="text-primary animate-pulse">_</span>
              </p>
            </div>
          </div>

          <h2 className="text-4xl lg:text-6xl font-mono font-bold text-foreground leading-tight">
            Generate & Mint{" "}
            <span className="text-primary text-glow">
              Pixel NFTs
            </span>
            <br />
            <span className="text-muted-foreground">from FarCaster</span>
          </h2>

          <p className="text-lg max-w-2xl mx-auto text-muted-foreground font-mono">
            Connect your wallet, auto-detect your FarCaster identity, and
            instantly mint unique pixel art NFTs on Base.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/mint">
              <Button className="bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold px-8 py-4 text-lg rounded-md border border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <TerminalIcon className="mr-2 w-5 h-5" />
                ./mint.sh
              </Button>
            </Link>
            <Link href="/learn">
              <Button
                variant="outline"
                className="border-border px-8 py-4 text-lg rounded-md font-mono hover:bg-secondary/50 hover:text-foreground text-muted-foreground transition-all duration-300"
              >
                ./learn.sh
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-16 border-t border-border">
          <Feature
            icon={<Sparkles size={24} className="text-primary" />}
            title="> Auto Generate"
            desc="Unique pixel NFT designs generated instantly based on your FarCaster FID."
            command="--generate"
          />
          <Feature
            icon={<Lock size={24} className="text-primary" />}
            title="> Verified Identity"
            desc="Wallet auto-connects to FarCaster via Neynar API."
            command="--verify"
          />
          <Feature
            icon={<Zap size={24} className="text-primary" />}
            title="> Instant Mint"
            desc="One-click minting with elegant loading animations."
            command="--mint"
          />
        </div>

        {/* Technical Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 border-t items-center border-border">
          <div className="space-y-6">
            <h3 className="text-2xl font-mono font-bold text-foreground">
              <span className="text-primary">></span> Built for FarCaster
            </h3>
            <p className="text-muted-foreground font-mono">
              Seamlessly integrated with FarCaster Mini Apps & Frames.
              Experience the future of decentralized identity.
            </p>
            <div className="terminal-box p-4 font-mono text-sm">
              <p className="text-muted-foreground mb-2">$ cat architecture.txt</p>
              <p className="text-primary">| FarCaster MiniApp SDK</p>
              <p className="text-primary">| Base Mainnet</p>
              <p className="text-primary">| Neynar API</p>
              <p className="text-primary">| wagmi/v2</p>
            </div>
          </div>

          <Card className="p-6 terminal-box bg-transparent">
            <div className="font-mono text-sm break-all text-primary">
              <span className="text-muted-foreground">$</span>{" "}
              <span className="text-accent-foreground">cast send</span>{" "}
              <span className="text-muted-foreground">--to</span>{" "}
              0x955e339e27d2689b95BfB25C5e2Bce2223321cAA
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu size={16} className="text-primary" />
                <span className="text-xs">Contract: 0x955e339e27d2689b95BfB25C5e2Bce2223321cAA</span>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className={`py-16 border-t text-center space-y-6 border-border ${styles.slideUp}`}>
          <h3 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">></span> Ready to Mint?
          </h3>
          <Link href="/mint">
            <Button className="bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold px-8 py-4 text-lg rounded-md border border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              ./launch.sh --mint
            </Button>
          </Link>
        </div>

        {/* NFT Preview Gallery */}
        <div className={`py-16 border-t border-border ${styles.slideUp}`}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-mono font-bold text-foreground mb-2">
              <span className="text-primary">></span> Preview Your Destiny
            </h3>
            <p className="text-muted-foreground font-mono text-sm">
              Sample NFTs with different rarities - your luck awaits!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SAMPLE_NFTS.map((nft) => {
              const config = RARITY_CONFIG[nft.rarity as keyof typeof RARITY_CONFIG]
              const Icon = config.icon
              return (
                <div
                  key={nft.id}
                  className="terminal-box p-4 hover:border-primary/50 transition-all duration-300 group"
                >
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                    <img
                      src={`/api/nft-image?tokenId=${nft.id}&random=true`}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    <div
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold font-mono"
                      style={{
                        backgroundColor: `${config.color}20`,
                        border: `1px solid ${config.color}60`,
                        color: config.color,
                      }}
                    >
                      {config.name}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-mono font-semibold text-foreground truncate">
                      {nft.name}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      Rate: {config.rate}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rarity Distribution Info */}
          <div className="mt-8 p-4 terminal-box max-w-2xl mx-auto">
            <h4 className="text-sm font-mono font-bold text-foreground mb-3">
              <span className="text-primary">></span> Rarity Distribution
            </h4>
            <div className="grid grid-cols-5 gap-2 text-xs font-mono">
              {Object.entries(RARITY_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <div
                    key={key}
                    className="text-center p-2 rounded-lg"
                    style={{
                      backgroundColor: `${config.color}10`,
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    <div className="flex justify-center mb-1">
                      {Icon ? <Icon size={14} style={{ color: config.color }} /> : <Trophy size={14} style={{ color: config.color }} />}
                    </div>
                    <p style={{ color: config.color }} className="font-bold">
                      {config.name}
                    </p>
                    <p className="text-muted-foreground">{config.rate}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-border py-8 text-center bg-terminal-dark">
        <div className="terminal-box p-4 max-w-md mx-auto font-mono text-sm">
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> echo "Built with Base, FarCaster, Neynar, and wagmi"
          </p>
          <p className="text-primary mt-1">
            ✓ System ready
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}

function Feature({
  icon,
  title,
  desc,
  command,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  command: string;
}) {
  return (
    <div className="terminal-box p-6 space-y-4 hover:border-primary/50 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-md flex items-center justify-center bg-secondary/50 border border-border group-hover:border-primary/50 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-mono font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground font-mono text-sm">{desc}</p>
      <p className="text-xs font-mono text-primary opacity-60">{command}</p>
    </div>
  );
}

