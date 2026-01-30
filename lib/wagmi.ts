import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

// App metadata for WalletConnect
const appMetadata = {
  name: 'Farcaster Mini App',
  description: 'Mint NFT with your Farcaster identity',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['/pixel-logo.svg'],
}

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      showQrModal: true,
      metadata: appMetadata,
    }),
  ],
  transports: {
    [base.id]: http(),
  },
})
