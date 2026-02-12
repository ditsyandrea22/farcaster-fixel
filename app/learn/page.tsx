"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Link from "next/link";
import { ArrowLeft, Terminal, Cpu, Database, Globe, Shield, Zap, BookOpen, Code, Layers, ExternalLink, CheckCircle2 } from "lucide-react";
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Globe size={28} style={{ color: THEME.accent }} />, title: "FarCaster MiniApp SDK", desc: "The official SDK that enables seamless integration with the FarCaster app. It provides APIs for user authentication, context awareness, and interaction with the FarCaster frame system.", color: "from-orange-500/20 to-pink-500/20" },
              { icon: <Layers size={28} style={{ color: '#3b82f6' }} />, title: "Next.js 14 Framework", desc: "A React-based full-stack framework that provides server-side rendering, API routes, and optimized performance with modern React patterns.", color: "from-blue-500/20 to-cyan-500/20" },
              { icon: <Database size={28} style={{ color: '#f97316' }} />, title: "Base Blockchain", desc: "An Ethereum Layer 2 blockchain built by Coinbase that offers fast and low-cost transactions for NFT minting.", color: "from-orange-500/20 to-yellow-500/20" },
              { icon: <Cpu size={28} style={{ color: THEME.success }} />, title: "Neynar API", desc: "A powerful API service that provides developer-friendly access to FarCaster is data and functionality for user verification.", color: "from-green-500/20 to-emerald-500/20" },
            ].map((item, index) => (
              <div key={index} className="p-6 border-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2 font-mono">{item.title}</h3>
                <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">
            <span style={{ color: THEME.accent }}></span> How It Works
          </h2>
          <div className="space-y-4">
            {[
              { number: "01", title: "User Authentication", desc: "When a user opens Fixel FID within the FarCaster app, the MiniApp SDK initializes and verifies the user is identity through the Neynar API. This process confirms the user is FID without requiring manual wallet connection." },
              { number: "02", title: "Wallet Connection", desc: "After identity verification, users connect their Ethereum wallet (MetaMask, Coinbase Wallet, etc.) through wagmi hooks. The wallet is used solely for transaction signing and NFT minting on Base." },
              { number: "03", title: "NFT Generation", desc: "The application generates a unique pixel art design based on the user is FID and profile data. Each FID produces a deterministic but visually unique pattern tied to their identity." },
              { number: "04", title: "Minting Process", desc: "The generated artwork is uploaded to IPFS for permanent storage, and a mint transaction is submitted to the Base smart contract. Once confirmed, the NFT is officially owned by the user is wallet." },
            ].map((step, index) => (
              <div key={index} className="p-6 border-2 rounded-lg transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                <div className="flex gap-6 items-start">
                  <div className="text-5xl font-mono font-bold" style={{ color: `${THEME.accent}40` }}>{step.number}</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white font-mono">{step.title}</h3>
                    <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Stack Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">
            <span style={{ color: THEME.accent }}></span> Technical Stack
          </h2>
          <TerminalWindow>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-mono font-bold mb-4" style={{ color: THEME.accent }}><Code size={18} /> Frontend</h3>
                <ul className="font-mono text-sm space-y-2" style={{ color: THEME.textMuted }}>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> TypeScript 5.x</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> React 18+</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Next.js 14</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Tailwind CSS</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> shadcn/ui</li>
                </ul>
              </div>
              <div>
                <h3 className="font-mono font-bold mb-4" style={{ color: '#3b82f6' }}><Zap size={18} /> Blockchain</h3>
                <ul className="font-mono text-sm space-y-2" style={{ color: THEME.textMuted }}>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> wagmi v2</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> viem</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Base Network</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> ERC-721 NFTs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> IPFS Storage</li>
                </ul>
              </div>
              <div>
                <h3 className="font-mono font-bold mb-4" style={{ color: THEME.success }}><Shield size={18} /> Services</h3>
                <ul className="font-mono text-sm space-y-2" style={{ color: THEME.textMuted }}>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Neynar API</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> FarCaster SDK</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Rate Limiting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Edge Deployment</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: THEME.success }} /> Type Safety</li>
                </ul>
              </div>
            </div>
          </TerminalWindow>
        </section>

        {/* Security Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">
            <span style={{ color: THEME.accent }}></span> Security Considerations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Authentication", desc: "All API endpoints implement rate limiting. User identity is verified through Neynar is secure API, ensuring only authenticated FarCaster users can access the mini-app.", icon: "🔐" },
              { title: "Wallet Security", desc: "Wallet connections are handled client-side through wagmi. Private keys are never exposed. All transactions require explicit user approval.", icon: "🔑" },
              { title: "Input Validation", desc: "All user inputs are validated on both client and server sides using TypeScript is type system and runtime validation libraries.", icon: "✓" },
              { title: "Smart Contract Safety", desc: "The NFT contract follows best practices for ERC-721 implementation and has been designed with security in mind.", icon: "⚙️" },
            ].map((item, index) => (
              <div key={index} className="p-6 border-2 rounded-lg transition-all duration-300" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 font-mono">{item.title}</h3>
                    <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">
            <span style={{ color: THEME.accent }}></span> Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "FarCaster Documentation", url: "https://docs.farcaster.xyz", desc: "Official documentation for building on FarCaster" },
              { title: "Neynar Developer Portal", url: "https://docs.neynar.com", desc: "API reference and integration guides" },
              { title: "Base Network Docs", url: "https://docs.base.org", desc: "Building on Base blockchain" },
            ].map((resource, index) => (
              <a key={index} href={resource.url} target="_blank" rel="noopener noreferrer" className="p-6 border-2 rounded-lg hover:border-orange-500/50 transition-all duration-300 hover:scale-105 group block" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors font-mono">{resource.title}</h3>
                  <ExternalLink size={16} className="text-gray-500 group-hover:text-orange-400" />
                </div>
                <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>{resource.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-white mb-4 font-mono">
            <span style={{ color: THEME.accent }}></span> Ready to Start?
          </h2>
          <p className="font-mono mb-8" style={{ color: THEME.textMuted }}>Generate your unique NFT based on your FarCaster identity</p>
          <Link href="/mint">
            <Button className="font-mono font-bold px-10 py-5 text-xl rounded-lg flex items-center gap-3 mx-auto transition-all duration-300 hover:scale-105" style={{ backgroundColor: THEME.accent, color: "#ffffff", border: `2px solid ${THEME.accent}` }}>
              <ExternalLink size={24} />
              ./launch.sh --mint
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 text-center" style={{ backgroundColor: THEME.bgSecondary, borderColor: THEME.border }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Terminal size={20} style={{ color: THEME.accent }} />
          <span className="font-mono font-bold text-white">Fixel FID</span>
        </div>
        <p className="font-mono text-sm" style={{ color: THEME.textMuted }}>Built with Base, FarCaster, Neynar, and wagmi</p>
        <p className="font-mono text-xs mt-2" style={{ color: "#666666" }}>{isLoaded ? "✓ Documentation loaded" : "Loading..."}</p>
      </footer>
    </div>
  );
}
