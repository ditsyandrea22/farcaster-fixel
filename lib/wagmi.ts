import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
})
