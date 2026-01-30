"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Lock,
  Sparkles,
  Palette,
  Network,
  CloudLightning as Lightning,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    let called = false;

    async function ready() {
      try {
        if (called) return;
        called = true;

        await sdk.actions.ready();
        console.log("✅ Farcaster Mini App READY");
      } catch (err) {
        console.error("❌ sdk.actions.ready failed", err);
      }
    }

    ready();
  }, []);

  return (
    <div className="min-h-screen bg-sky-600">
      {/* Navigation */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-sm border-sky-700 bg-sky-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500"></div>
            <h1 className="text-lg text-card-foreground font-extrabold underline italic">
              Fixel FID
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-600">Base Mainnet</p>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 bg-sky-600">
        <div className="py-24 text-center space-y-8">
          <div className="inline-block">
            <span className="text-sm font-semibold text-blue-600 px-4 py-2 rounded-full bg-foreground italic">
              NFT Generation on Base Mainnet
            </span>
          </div>

          <h2 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight italic">
            Generate & Mint <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-lime-400">
              Pixel NFTs
            </span>
            <br />
            from Farcaster
          </h2>

          <p className="text-xl max-w-2xl mx-auto text-foreground italic">
            Connect your wallet, auto-detect your Farcaster identity, and
            instantly mint unique pixel art NFTs on Base.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/mint">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-lg font-semibold italic">
                Start Minting
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-gray-300 px-8 py-6 text-lg rounded-lg font-semibold hover:bg-gray-50 bg-transparent text-foreground italic"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-24 border-t border-popover-foreground">
          <Feature
            icon={<Sparkles size={24} className="text-blue-600" />}
            title="Auto Generate"
            desc="Unique pixel NFT designs generated instantly based on your Farcaster FID."
          />
          <Feature
            icon={<Lock size={24} className="text-cyan-600" />}
            title="Verified Identity"
            desc="Wallet auto-connects to Farcaster via Neynar API."
          />
          <Feature
            icon={<Lightning size={24} className="text-blue-600" />}
            title="Instant Mint"
            desc="One-click minting with elegant loading animations."
          />
        </div>

        {/* Technical */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-24 border-t items-center border-popover-foreground">
          <div className="space-y-8">
            <h3 className="text-3xl font-bold italic">
              Built for Farcaster
            </h3>
            <p className="text-lg italic">
              Seamlessly integrated with Farcaster Mini Apps & Frames.
            </p>
          </div>

          <Card className="p-8 bg-gradient-to-br from-gray-50 to-white">
            <p className="font-mono text-sm break-all italic">
              0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="py-24 border-t text-center space-y-8 border-popover-foreground">
          <h3 className="text-4xl font-bold italic">Ready to Mint?</h3>
          <Link href="/mint">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-lg font-semibold italic">
              Launch App
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 text-center">
        <p className="text-sm italic">
          Built with Base, Farcaster, Neynar, and wagmi
        </p>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-card-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold italic">{title}</h3>
      <p className="italic">{desc}</p>
    </div>
  );
}
