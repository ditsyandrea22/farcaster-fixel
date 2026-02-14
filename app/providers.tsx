'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useConfig } from 'wagmi'
import { getWagmiConfig } from '@/lib/wagmi'
import type { Config } from 'wagmi'

function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getWagmiConfig()
      .then(setConfig)
      .catch(console.error)
  }, [])

  // During SSR or before mount, render children without providers
  if (!isMounted || !config) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiWrapper>
        {children}
      </WagmiWrapper>
    </QueryClientProvider>
  )
}
