import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { walletConnect, injected, metaMask } from 'wagmi/connectors'

// App metadata for WalletConnect
const appMetadata = {
  name: 'Farcaster Mini App',
  description: 'Mint NFT with your Farcaster identity',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['/pixel-logo.svg'],
}

// Get WalletConnect project ID from env
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Build connectors array conditionally
const connectors = [
  injected(),
  metaMask(),
]

// Only add WalletConnect if project ID is configured
if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: appMetadata,
    })
  )
}

export const config = createConfig({
  chains: [base],
  connectors,
  transports: {
    [base.id]: http(),
  },
})
