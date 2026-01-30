'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import { MiniApp } from '@/components/mini-app'
import { useState } from 'react'

const queryClient = new QueryClient()

export default function MintPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
