"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, Terminal, Cpu, Database, Globe, Shield, Zap, BookOpen, Code, Layers, ExternalLink, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "@/styles/animations.module.css";

// Ubuntu Terminal Theme Colors
const THEME = {
  bg: '#1a1a2e',
  bgSecondary: '#16213e',
  bgTertiary: '#0f0f23',
  accent: '#e95420',
  success: '#0e8420',
  border: '#333333',
  text: '#ffffff',
  textMuted: '#999999',
};

function TerminalHeader({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-50 border-b-2" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.accent }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f0c674' }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME.success }}></div>
          </div>
          <span className="font-mono text-sm" style={{ color: THEME.textMuted }}>bash — {title}</span>
        </div>
        <Link href="/">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-transparent border rounded font-mono text-sm transition-colors" style={{ borderColor: THEME.accent, color: THEME.accent }}>
            <ArrowLeft size={14} />
            <span>cd ..</span>
          </button>
        </Link>
      </div>
    </div>
  );
}

function TerminalWindow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 rounded-lg overflow-hidden ${className}`} style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2" style={{ backgroundColor: THEME.bgTertiary, borderColor: THEME.border }}>
        <Terminal size={14} style={{ color: THEME.accent }} />
        <span className="font-mono text-xs" style={{ color: THEME.textMuted }}>user@farcaster-fixel:~$</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function LearnPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let called = false;
    async function ready() {
      try {
        if (called) return;
        called = true;
        await sdk.actions.ready();
        console.log("✅ Learn Page READY");
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
        <TerminalHeader title="learn" />

        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
              <BookOpen size={16} style={{ color: THEME.accent }} />
              <span className="font-mono text-sm" style={{ color: THEME.textMuted }}>Documentation</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-mono">
              What is Fixel FID?
            </h1>
            <p className="text-xl font-mono max-w-3xl mx-auto" style={{ color: THEME.textMuted }}>
              A decentralized mini-application built for the FarCaster ecosystem that enables users to generate and mint unique pixel art NFTs on the Base blockchain.
            </p>
          </div>

          {/* Architecture Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 font-mono">
              <span style={{ color: THEME.accent }}></span> Architecture Overview
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TerminalWindow>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(233, 84, 32, 0.2)" }}>
                    <Globe size={20} style={{ color: THEME.accent }} />
                  </div>
                  <h3 className="text-xl font-semibold text-white font-mono">FarCaster MiniApp</h3>
                </div>
                <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>
                  The frontend interface embedded directly within the FarCaster app, providing seamless user experience without leaving the platform. Built with Next.js for optimal performance.
                </p>
              </TerminalWindow>
              
              <TerminalWindow>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(14, 132, 32, 0.2)" }}>
                    <Database size={20} style={{ color: THEME.success }} />
                  </div>
                  <h3 className="text-xl font-semibold text-white font-mono">Neynar API</h3>
                </div>
                <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>
                  Handles user authentication and FID retrieval, enabling wallet auto-connect and identity verification through secure OAuth flow.
                </p>
              </TerminalWindow>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 font-mono">
              <span style={{ color: THEME.success }}></span> How It Works
            </h2>
            <div className="space-y-6">
              {[
                { step: 1, icon: <Wallet size={20} />, title: "Connect Wallet", desc: "User connects their wallet which is automatically detected and linked to their FarCaster identity via Neynar API.", color: THEME.accent },
                { step: 2, icon: <Cpu size={20} />, title: "Generate Pixel Art", desc: "AI algorithm creates unique pixel art based on wallet address and FID seed, ensuring each NFT is truly one-of-a-kind.", color: "#f0c674" },
                { step: 3, icon: <Shield size={20} />, title: "Verify & Sign", desc: "User reviews the generated design and signs the transaction with their wallet to authorize the minting process.", color: THEME.success },
                { step: 4, icon: <Zap size={20} />, title: "Mint on Base", desc: "NFT is minted on Base mainnet with metadata stored on IPFS via Pinata, ensuring permanent availability.", color: "#a855f7" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-6 p-6 border-2 rounded-lg" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    {item.step}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-white font-mono">{item.title}</h3>
                    </div>
                    <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Details */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 font-mono">
              <span style={{ color: '#a855f7' }}></span> Technical Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Layers size={20} />, title: "Base Chain", desc: "Layer 2 Ethereum network for fast, low-cost transactions", color: "#3b82f6" },
                { icon: <Code size={20} />, title: "IPFS Storage", desc: "Decentralized metadata storage via Pinata for permanent availability", color: "#10b981" },
                { icon: <Terminal size={20} />, title: "Wagmi/Viem", desc: "Modern React hooks for Ethereum interaction and wallet management", color: "#f59e0b" },
                { icon: <Zap size={20} />, title: "Next.js 14", desc: "Server components and App Router for optimal performance", color: "#ec4899" },
              ].map((item, index) => (
                <div key={index} className="p-4 border-2 rounded-lg hover:border-opacity-50 transition-all" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                  <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3" style={{ backgroundColor: `${item.color}20` }}>
                    <div style={{ color: item.color }}>{item.icon}</div>
                  </div>
                  <h3 className="font-semibold text-white mb-1 font-mono">{item.title}</h3>
                  <p className="font-mono text-xs" style={{ color: THEME.textMuted }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Rarity System */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 font-mono">
              <span style={{ color: '#f59e0b' }}></span> Rarity System
            </h2>
            <TerminalWindow>
              <div className="space-y-4">
                {[
                  { name: "COMMON", rate: "80%", color: "#6B7280", icon: "⚫" },
                  { name: "UNCOMMON", rate: "15%", color: "#10B981", icon: "🔥" },
                  { name: "SILVER", rate: "4%", color: "#94A3B8", icon: "⭐" },
                  { name: "GOLD", rate: "0.99%", color: "#F59E0B", icon: "👑" },
                  { name: "PLATINUM", rate: "0.01%", color: "#A855F7", icon: "💎" },
                ].map((rarity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${rarity.color}10`, border: `1px solid ${rarity.color}30` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{rarity.icon}</span>
                      <span className="font-bold font-mono" style={{ color: rarity.color }}>{rarity.name}</span>
                    </div>
                    <span className="font-mono text-sm" style={{ color: THEME.textMuted }}>Rate: {rarity.rate}</span>
                  </div>
                ))}
              </div>
            </TerminalWindow>
          </section>

          {/* Footer CTA */}
          <div className="text-center py-12 border-t-2" style={{ borderColor: THEME.border }}>
            <p className="font-mono text-lg mb-6" style={{ color: THEME.textMuted }}>
              Ready to start your pixel NFT journey?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/mint">
                <Button className="font-mono font-bold px-8 py-4 text-lg rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105" style={{ backgroundColor: THEME.accent, color: "#ffffff", border: `2px solid ${THEME.accent}` }}>
                  <Wallet size={20} />
                  Start Minting
                  <ExternalLink size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
