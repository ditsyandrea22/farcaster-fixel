import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";

// Base mainnet RPC - can be overridden with environment variable
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? 
    `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` : 
    undefined;

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterFrame(),
  ],
  transports: {
    [base.id]: BASE_RPC_URL ? http(BASE_RPC_URL) : http(),
  },
});

// Re-export base chain for convenience
export { base };
