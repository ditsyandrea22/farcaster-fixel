"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { config } from "@/lib/wagmi";
import { MiniApp } from "@/components/mini-app";

const queryClient = new QueryClient();

export default function MintPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await sdk.actions.ready();
        console.log("✅ Farcaster READY (mint)");
        setReady(true);
      } catch (e) {
        console.error("❌ Farcaster ready failed", e);
      }
    }

    init();
  }, []);

  // ⛔ Jangan render Wagmi sebelum Farcaster siap
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Initializing Farcaster…
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
