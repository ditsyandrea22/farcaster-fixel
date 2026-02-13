"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Head from "next/head";

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
        console.log("✅ FarCaster READY (mint)");
        setReady(true);
        
        // Initialize wagmi config asynchronously
        const wagmiConfig = await getWagmiConfig();
        setConfig(wagmiConfig);
      } catch (e) {
        console.error("❌ FarCaster ready failed", e);
      }
    }

    init();
  }, []);

  // ⛔ Jangan render Wagmi sebelum Farrcaster siap
  if (!ready || !config) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Initializing FarCaster…
      </div>
    );
  }

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
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <MiniApp />
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
