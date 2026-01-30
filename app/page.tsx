"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import styles from "@/styles/animations.module.css";

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
    <div className="min-h-screen bg-terminal-dark">
      {/* Terminal-style Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm border-b border-border/50 bg-terminal-dark/95">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">
              <span className="text-primary">&gt;</span> Fixel FID
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
            <Button
              variant="outline"
              className="border-border px-8 py-4 text-lg rounded-md font-mono hover:bg-secondary/50 hover:text-foreground text-muted-foreground transition-all duration-300"
            >
              ./learn.sh
            </Button>
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
              <span className="text-primary">&gt;</span> Built for FarCaster
            </h3>
            <p className="text-muted-foreground font-mono">
              Seamlessly integrated with FarCaster Mini Apps & Frames.
              Experience the future of decentralized identity.
            </p>
            <div className="terminal-box p-4 font-mono text-sm">
              <p className="text-muted-foreground mb-2">$ cat architecture.txt</p>
              <p className="text-primary">&boxvr; FarCaster MiniApp SDK</p>
              <p className="text-primary">&boxvr; Base Mainnet</p>
              <p className="text-primary">&boxvr; Neynar API</p>
              <p className="text-primary">&boxdr; wagmi/v2</p>
            </div>
          </div>

          <Card className="p-6 terminal-box bg-transparent">
            <div className="font-mono text-sm break-all text-primary">
              <span className="text-muted-foreground">$</span>{" "}
              <span className="text-accent-foreground">cast send</span>{" "}
              <span className="text-muted-foreground">--to</span>{" "}
              0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu size={16} className="text-primary" />
                <span className="text-xs">Contract: 0x5717...978cF</span>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className={`py-16 border-t text-center space-y-6 border-border ${styles.slideUp}`}>
          <h3 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">&gt;</span> Ready to Mint?
          </h3>
          <Link href="/mint">
            <Button className="bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold px-8 py-4 text-lg rounded-md border border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              ./launch.sh --mint
            </Button>
          </Link>
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
