import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { injected, metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors";

// Base mainnet RPC - can be overridden with environment variable
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? 
    `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` : 
    undefined;

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterFrame(),
    injected(),
    metaMask(),
    coinbaseWallet({
      appName: "Farcaster Mini App",
      appLogoUrl: "https://example.com/logo.png",
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    }),
  ],
  transports: {
    [base.id]: BASE_RPC_URL ? http(BASE_RPC_URL) : http(),
  },
});

// Re-export base chain for convenience
export { base };
