"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Link from "next/link";
import { ArrowLeft, Terminal, Cpu, Database, Globe, Shield, Zap, BookOpen, Code, Layers, Gift, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import styles from "@/styles/animations.module.css";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Gift size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Fixel FID <span className="text-gray-500">/ Learn</span>
            </h1>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4">
            <BookOpen size={16} className="text-purple-400" />
            <span className="text-sm text-purple-300">Documentation</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            What is Fixel FID?
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A decentralized mini-application built for the FarCaster ecosystem that enables 
            users to generate and mint unique pixel art NFTs on the Base blockchain.
          </p>
        </div>

        {/* Architecture Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Cpu size={32} className="text-purple-400" />
            Architecture Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Globe size={28} className="text-purple-400" />,
                title: "FarCaster MiniApp SDK",
                description: "The official SDK that enables seamless integration with the FarCaster app. It provides APIs for user authentication, context awareness, and interaction with the FarCaster frame system.",
                color: "from-purple-500/20 to-pink-500/20",
              },
              {
                icon: <Layers size={28} className="text-blue-400" />,
                title: "Next.js 14 Framework",
                description: "A React-based full-stack framework that provides server-side rendering, API routes, and optimized performance with modern React patterns.",
                color: "from-blue-500/20 to-cyan-500/20",
              },
              {
                icon: <Database size={28} className="text-orange-400" />,
                title: "Base Blockchain",
                description: "An Ethereum Layer 2 blockchain built by Coinbase that offers fast and low-cost transactions for NFT minting.",
                color: "from-orange-500/20 to-yellow-500/20",
              },
              {
                icon: <Cpu size={28} className="text-green-400" />,
                title: "Neynar API",
                description: "A powerful API service that provides developer-friendly access to FarCaster's data and functionality for user verification.",
                color: "from-green-500/20 to-emerald-500/20",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className={`p-6 bg-gradient-to-br ${item.color} border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Zap size={32} className="text-yellow-400" />
            How It Works
          </h2>
          
          <div className="space-y-4">
            {[
              {
                number: "01",
                title: "User Authentication",
                description: "When a user opens Fixel FID within the FarCaster app, the MiniApp SDK initializes and verifies the user's identity through the Neynar API. This process confirms the user's FID without requiring manual wallet connection.",
              },
              {
                number: "02",
                title: "Wallet Connection",
                description: "After identity verification, users connect their Ethereum wallet (MetaMask, Coinbase Wallet, etc.) through wagmi hooks. The wallet is used solely for transaction signing and NFT minting on Base.",
              },
              {
                number: "03",
                title: "NFT Generation",
                description: "The application generates a unique pixel art design based on the user's FID and profile data. Each FID produces a deterministic but visually unique pattern tied to their identity.",
              },
              {
                number: "04",
                title: "Minting Process",
                description: "The generated artwork is uploaded to IPFS for permanent storage, and a mint transaction is submitted to the Base smart contract. Once confirmed, the NFT is officially owned by the user's wallet.",
              },
            ].map((step, index) => (
              <Card
                key={index}
                className="p-6 bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex gap-6 items-start">
                  <div className="text-5xl font-bold text-purple-500/30">{step.number}</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Stack Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Code size={32} className="text-green-400" />
            Technical Stack
          </h2>
          
          <Card className="p-8 bg-gradient-to-br from-white/10 to-white/5 border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-purple-400 font-semibold mb-4 flex items-center gap-2">
                  <Code size={18} /> Frontend
                </h3>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> TypeScript 5.x
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> React 18+
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Next.js 14
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Tailwind CSS
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> shadcn/ui
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
                  <Zap size={18} /> Blockchain
                </h3>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> wagmi v2
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> viem
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Base Network
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> ERC-721 NFTs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> IPFS Storage
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <Shield size={18} /> Services
                </h3>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Neynar API
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> FarCaster SDK
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Rate Limiting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Edge Deploy
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" /> Type Safety
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Security Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Shield size={32} className="text-green-400" />
            Security Considerations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Authentication",
                description: "All API endpoints implement rate limiting. User identity is verified through Neynar's secure API, ensuring only authenticated FarCaster users can access the mini-app.",
                icon: "🔐",
              },
              {
                title: "Wallet Security",
                description: "Wallet connections are handled client-side through wagmi. Private keys are never exposed. All transactions require explicit user approval.",
                icon: "🔑",
              },
              {
                title: "Input Validation",
                description: "All user inputs are validated on both client and server sides using TypeScript's type system and runtime validation libraries.",
                icon: "✓",
              },
              {
                title: "Smart Contract Safety",
                description: "The NFT contract follows best practices for ERC-721 implementation and has been designed with security in mind.",
                icon: "⚙️",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="p-6 bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <BookOpen size={32} className="text-pink-400" />
            Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "FarCaster Documentation",
                url: "https://docs.farcaster.xyz",
                description: "Official documentation for building on FarCaster",
              },
              {
                title: "Neynar Developer Portal",
                url: "https://docs.neynar.com",
                description: "API reference and integration guides",
              },
              {
                title: "Base Network Docs",
                url: "https://docs.base.org",
                description: "Building on Base blockchain",
              },
            ].map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105 group block"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {resource.title}
                  </h3>
                  <ExternalLink size={16} className="text-gray-500 group-hover:text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm">{resource.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-400 mb-8">
            Generate your unique NFT based on your FarCaster identity
          </p>
          <Link href="/mint">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-10 py-5 text-xl rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-3 mx-auto">
              <Gift size={24} />
              Mint Your NFT
            </Button>
          </Link>
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
          {isLoaded ? "✓ Documentation loaded" : "Loading..."}
        </p>
      </footer>
    </div>
  );
}
