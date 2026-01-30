"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { getWagmiConfig } from "@/lib/wagmi";
import { MiniApp } from "@/components/mini-app";

const queryClient = new QueryClient();

export default function MintPage() {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<Awaited<ReturnType<typeof getWagmiConfig>> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await sdk.actions.ready();
        console.log("✅ Farrcaster READY (mint)");
        setReady(true);
        
        // Initialize wagmi config asynchronously
        const wagmiConfig = await getWagmiConfig();
        setConfig(wagmiConfig);
      } catch (e) {
        console.error("❌ Farrcaster ready failed", e);
      }
    }

    init();
  }, []);

  // ⛔ Jangan render Wagmi sebelum Farrcaster siap
  if (!ready || !config) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Initializing Farrcaster…
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
