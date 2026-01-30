"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Link from "next/link";
import { ArrowLeft, Terminal, Cpu, Database, Globe, Shield, Zap, BookOpen, Code, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "@/styles/animations.module.css";

export default function LearnPage() {
  const [typedText, setTypedText] = useState("");
  const fullText = "> Loading Documentation...";

  useEffect(() => {
    let called = false;

    async function ready() {
      try {
        if (called) return;
        called = true;
        await sdk.actions.ready();
        console.log("✅ Learn Page READY");
      } catch (err) {
        console.error("❌ sdk.actions.ready failed", err);
      }
    }

    ready();
  }, []);

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
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm border-b border-border/50 bg-terminal-dark/95">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-primary animate-pulse" />
            <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">
              <span className="text-primary">{'>'}</span> Fixel FID / Learn
            </h1>
          </div>
          <Link href="/">
            <Button variant="outline" className="font-mono text-sm">
              <ArrowLeft className="mr-2 w-4 h-4" />
              cd ..
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Terminal Header */}
        <div className="terminal-box p-4 mb-12 max-w-2xl">
          <div className="flex items-center gap-2 mb-2 border-b border-border/50 pb-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <span className="ml-2 text-xs text-muted-foreground font-mono">bash — 80x24</span>
          </div>
          <div className="font-mono text-sm text-primary">
            <p className="typing-effect">{typedText}</p>
            <p className="text-green-400 mt-1 opacity-80">✓ Documentation loaded</p>
            <p className="text-muted-foreground mt-2">
              <span className="text-primary animate-pulse">_</span>
            </p>
          </div>
        </div>

        {/* Introduction Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> What is Fixel FID?
          </h2>
          <div className="terminal-box p-6 bg-transparent">
            <p className="text-muted-foreground font-mono leading-relaxed">
              Fixel FID is a decentralized mini-application built for the FarCaster ecosystem that enables 
              users to generate and mint unique pixel art NFTs (Non-Fungible Tokens) on the Base blockchain. 
              The application leverages FarCaster's identity system (FID - FarCaster ID) to create personalized 
              digital collectibles that represent each user's unique identity on the social network.
            </p>
          </div>
        </section>

        {/* Architecture Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> Architecture Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ArchitectureCard
              icon={<Globe className="w-6 h-6 text-primary" />}
              title="FarCaster MiniApp SDK"
              description="The official SDK that enables seamless integration with the FarCaster app. It provides APIs for user authentication, context awareness, and interaction with the FarCaster frame system. This SDK allows the mini-app to verify user identity and receive signals from the FarCaster client."
            />
            <ArchitectureCard
              icon={<Layers className="w-6 h-6 text-primary" />}
              title="Next.js 14 Framework"
              description="A React-based full-stack framework that provides server-side rendering, API routes, and optimized performance. Next.js 14 with the App Router enables modern React patterns, efficient routing, and seamless deployment on edge networks."
            />
            <ArchitectureCard
              icon={<Database className="w-6 h-6 text-primary" />}
              title="Base Blockchain"
              description="An Ethereum Layer 2 blockchain built by Coinbase that offers fast and low-cost transactions. Fixel FID deploys NFT smart contracts on Base, ensuring affordable minting fees and high throughput for users worldwide."
            />
            <ArchitectureCard
              icon={<Cpu className="w-6 h-6 text-primary" />}
              title="Neynar API"
              description="A powerful API service that provides developer-friendly access to FarCaster's data and functionality. Neynar handles user verification, profile data retrieval, and signer management, making it easy to build applications on top of FarCaster."
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> How It Works
          </h2>
          
          <div className="space-y-4">
            <StepCard
              number="01"
              title="User Authentication"
              description="When a user opens Fixel FID within the FarCaster app, the MiniApp SDK initializes and verifies the user's identity through the Neynar API. This process confirms the user's FID (FarCaster ID) without requiring manual wallet connection, leveraging the existing FarCaster authentication system."
            />
            <StepCard
              number="02"
              title="Wallet Connection"
              description="After identity verification, users connect their Ethereum wallet (MetaMask, Coinbase Wallet, etc.) through wagmi hooks. The wallet is used solely for transaction signing and NFT minting on the Base blockchain. No private keys are ever stored on our servers."
            />
            <StepCard
              number="03"
              title="NFT Generation"
              description="The application generates a unique pixel art design based on the user's FID and profile data. Each FID produces a deterministic but visually unique pattern, ensuring that every user's NFT is different yet tied to their identity."
            />
            <StepCard
              number="04"
              title="Minting Process"
              description="The generated artwork is uploaded to IPFS (InterPlanetary File System) for permanent storage, and a mint transaction is submitted to the Base smart contract. Once confirmed, the NFT is officially owned by the user's wallet address."
            />
          </div>
        </section>

        {/* Technical Stack Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> Technical Stack
          </h2>
          
          <div className="terminal-box p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-primary font-mono font-bold mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Frontend
                </h3>
                <ul className="text-sm font-mono text-muted-foreground space-y-2">
                  <li>• TypeScript 5.x</li>
                  <li>• React 18+</li>
                  <li>• Next.js 14 (App Router)</li>
                  <li>• Tailwind CSS</li>
                  <li>• shadcn/ui Components</li>
                  <li>• Lucide Icons</li>
                </ul>
              </div>
              <div>
                <h3 className="text-primary font-mono font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Blockchain
                </h3>
                <ul className="text-sm font-mono text-muted-foreground space-y-2">
                  <li>• wagmi v2</li>
                  <li>• viem</li>
                  <li>• Base Network</li>
                  <li>• ERC-721 NFTs</li>
                  <li>• IPFS Storage</li>
                </ul>
              </div>
              <div>
                <h3 className="text-primary font-mono font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Services
                </h3>
                <ul className="text-sm font-mono text-muted-foreground space-y-2">
                  <li>• Neynar API</li>
                  <li>• FarCaster SDK</li>
                  <li>• Rate Limiting</li>
                  <li>• Edge Deployment</li>
                  <li>• Type Safety</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* API Endpoints Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> API Endpoints
          </h2>
          
          <div className="space-y-4">
            <ApiEndpoint
              method="GET"
              path="/api/fid-from-address"
              description="Converts an Ethereum wallet address to a FarCaster FID using Neynar's user search functionality. Useful for cross-referencing blockchain addresses with FarCaster identities."
            />
            <ApiEndpoint
              method="GET"
              path="/api/user-profile"
              description="Fetches the complete FarCaster user profile including username, display name, bio, avatar URL, and other metadata associated with the authenticated user's FID."
            />
            <ApiEndpoint
              method="POST"
              path="/api/frame"
              description="Handles Frame-related interactions, allowing Fixel FID to receive signals from FarCaster Frames and process user actions within the mini-app context."
            />
            <ApiEndpoint
              method="POST"
              path="/api/nft-image"
              description="Generates the NFT image on-the-fly based on the user's FID, creating a deterministic pixel art pattern that can be used for minting or preview."
            />
          </div>
        </section>

        {/* Smart Contract Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> Smart Contract
          </h2>
          
          <div className="terminal-box p-6">
            <p className="text-muted-foreground font-mono mb-4">
              The Fixel FID NFT contract is an ERC-721 implementation deployed on Base Mainnet. 
              It supports the following key features:
            </p>
            <ul className="text-sm font-mono text-muted-foreground space-y-2">
              <li>• <span className="text-primary">Standard:</span> ERC-721 (Non-Fungible Token)</li>
              <li>• <span className="text-primary">Mint Function:</span> Allows authorized minting with FID绑定</li>
              <li>• <span className="text-primary">Metadata:</span> IPFS-based dynamic metadata storage</li>
              <li>• <span className="text-primary">Royalty:</span> Standard ERC-2981 royalty support</li>
              <li>• <span className="text-primary">Ownership:</span> Full contract ownership controls</li>
            </ul>
          </div>
        </section>

        {/* Security Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> Security Considerations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SecurityCard
              title="Authentication"
              description="All API endpoints implement rate limiting to prevent abuse. User identity is verified through Neynar's secure API, ensuring that only authenticated FarCaster users can access the mini-app."
            />
            <SecurityCard
              title="Wallet Security"
              description="Wallet connections are handled entirely client-side through wagmi. Private keys are never exposed to the server. All transactions require explicit user approval through their wallet interface."
            />
            <SecurityCard
              title="Input Validation"
              description="All user inputs are validated on both client and server sides using TypeScript's type system and runtime validation libraries. This prevents injection attacks and malformed data processing."
            />
            <SecurityCard
              title="Smart Contract Safety"
              description="The NFT contract has been audited and follows best practices for ERC-721 implementation. No admin keys with destructive capabilities are stored in accessible locations."
            />
          </div>
        </section>

        {/* Getting Started Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> Getting Started
          </h2>
          
          <div className="terminal-box p-6 font-mono text-sm">
            <p className="text-muted-foreground mb-4"># Clone and install dependencies</p>
            <p className="text-primary mb-2">$ git clone https://github.com/ditsyandrea22/farcaster-fixel.git</p>
            <p className="text-primary mb-2">$ cd farcaster-fixel</p>
            <p className="text-primary mb-6">$ pnpm install</p>
            
            <p className="text-muted-foreground mb-4"># Configure environment variables</p>
            <p className="text-primary mb-2">$ cp .env.example .env.local</p>
            <p className="text-primary mb-6"># Add your Neynar API key and other credentials</p>
            
            <p className="text-muted-foreground mb-4"># Start development server</p>
            <p className="text-primary mb-2">$ pnpm dev</p>
            <p className="text-green-400">✓ Server running at http://localhost:3000</p>
          </div>
        </section>

        {/* Resources Section */}
        <section className={`mb-16 space-y-6 ${styles.slideUp}`}>
          <h2 className="text-3xl font-mono font-bold text-foreground">
            <span className="text-primary">{'>'}</span> Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResourceCard
              title="FarCaster Documentation"
              url="https://docs.farcaster.xyz"
              description="Official documentation for building on FarCaster"
            />
            <ResourceCard
              title="Neynar Developer Portal"
              url="https://docs.neynar.com"
              description="API reference and integration guides"
            />
            <ResourceCard
              title="Base Network Docs"
              url="https://docs.base.org"
              description="Building on Base blockchain"
            />
          </div>
        </section>

        {/* Navigation Footer */}
        <div className="border-t border-border pt-8 text-center">
          <Link href="/mint">
            <Button className="bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold px-8 py-4 text-lg rounded-md border border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <Terminal className="mr-2 w-5 h-5" />
              ./mint.sh
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center bg-terminal-dark mt-12">
        <div className="terminal-box p-4 max-w-md mx-auto font-mono text-sm">
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> cat README.md
          </p>
          <p className="text-primary mt-1">
            ✓ Documentation complete
          </p>
        </div>
      </footer>
    </div>
  );
}

function ArchitectureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="terminal-box p-6 space-y-4 hover:border-primary/50 transition-all duration-300 group">
      <div className="w-12 h-12 rounded-md flex items-center justify-center bg-secondary/50 border border-border group-hover:border-primary/50 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-mono font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground font-mono text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="terminal-box p-6 flex gap-6 hover:border-primary/50 transition-all duration-300 group">
      <div className="text-4xl font-mono font-bold text-primary opacity-30 group-hover:opacity-60 transition-opacity">
        {number}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-mono font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground font-mono text-sm">{description}</p>
      </div>
    </div>
  );
}

function ApiEndpoint({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColors: Record<string, string> = {
    GET: "text-blue-400",
    POST: "text-green-400",
    PUT: "text-yellow-400",
    DELETE: "text-red-400",
  };

  return (
    <div className="terminal-box p-4 flex gap-4 items-start hover:border-primary/50 transition-all duration-300">
      <code className={`font-mono text-sm font-bold ${methodColors[method] || "text-muted-foreground"}`}>
        {method}
      </code>
      <div className="flex-1">
        <code className="font-mono text-sm text-primary">{path}</code>
        <p className="text-muted-foreground font-mono text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

function SecurityCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="terminal-box p-4 space-y-2 hover:border-primary/50 transition-all duration-300">
      <h3 className="text-lg font-mono font-semibold text-foreground text-primary">{title}</h3>
      <p className="text-muted-foreground font-mono text-sm">{description}</p>
    </div>
  );
}

function ResourceCard({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="terminal-box p-6 space-y-3 hover:border-primary/50 transition-all duration-300 group block"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-muted-foreground font-mono text-sm">{description}</p>
      <p className="text-xs font-mono text-primary opacity-60">{url}</p>
    </a>
  );
}
