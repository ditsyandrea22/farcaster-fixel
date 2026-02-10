// @ts-nocheck
import { createConfig, http, type CreateConnectorFn } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";

// Base mainnet RPC - can be overridden with environment variable
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 
  process.env.NEXT_ALCHEMY_API_KEY ? 
    `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_ALCHEMY_API_KEY}` : 
    undefined;

// Dynamically import metaMask connector only on client side to avoid SSR issues
async function getMetaMaskConnector() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const { metaMask } = await import("wagmi/connectors");
    return metaMask();
  } catch (error) {
    console.warn('Failed to load metaMask connector:', error);
    return null;
  }
}

// Create config with dynamic connectors
let configPromise: Promise<ReturnType<typeof createConfig>> | null = null;

export async function getWagmiConfig() {
  if (configPromise) {
    return configPromise;
  }
  
  configPromise = (async () => {
    const metaMaskConnector = await getMetaMaskConnector();
    
    const connectors: CreateConnectorFn[] = [
      farcasterFrame(),
      injected(),
    ];
    
    // Only add metaMask connector on client side
    if (metaMaskConnector) {
      // @ts-expect-error - MetaMask connector type mismatch with Wagmi v2
      connectors.push(metaMaskConnector);
    }
    
    // Add coinbaseWallet
    // @ts-expect-error - Coinbase wallet connector type mismatch with Wagmi v2
    connectors.push(coinbaseWallet({
      appName: "Farcaster Mini App",
      appLogoUrl: "https://example.com/logo.png",
    }));
    
    return createConfig({
      chains: [base],
      connectors,
      transports: {
        [base.id]: BASE_RPC_URL ? http(BASE_RPC_URL) : http(),
      },
    });
  })();
  
  return configPromise;
}

// Re-export base chain for convenience
export { base };
