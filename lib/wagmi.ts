import { createConfig, http, type CreateConnectorFn } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";

// Base Builder Code Attribution (ERC-7739)
// Get your Builder Code from https://base.dev > Settings > Builder Codes
const BUILDER_CODE = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE || "bc_cir668rj";

// ERC-7739/ERC-8021 Data Suffix for Builder Code
function createBuilderCodeDataSuffix(builderCode: string): `0x${string}` {
  // The data suffix is the builder code prefixed with 0x
  return `0x${builderCode.replace(/^0x/, '')}` as `0x${string}`;
}

const DATA_SUFFIX = createBuilderCodeDataSuffix(BUILDER_CODE);

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

// Singleton config instance
let wagmiConfig: ReturnType<typeof createConfig> | null = null;
let configPromise: Promise<ReturnType<typeof createConfig>> | null = null;
let configInitialized = false;

// Mutex for thread-safe initialization
type InitializeConfigFn = () => ReturnType<typeof createConfig>;
let initFn: InitializeConfigFn | null = null;

export async function getWagmiConfig() {
  // Return cached config if already initialized
  if (configInitialized && wagmiConfig) {
    return wagmiConfig;
  }
  
  // Return existing promise if initialization is in progress
  if (configPromise) {
    return configPromise;
  }
  
  // Create initialization function
  const initialize = async (): Promise<ReturnType<typeof createConfig>> => {
    const metaMaskConnector = await getMetaMaskConnector();
    
    const connectors: CreateConnectorFn[] = [
      farcasterFrame(),
      injected(),
    ];
    
    // Only add metaMask connector on client side
    if (metaMaskConnector) {
      connectors.push(metaMaskConnector);
    }
    
    // Add coinbaseWallet
    connectors.push(coinbaseWallet({
      appName: "Farcaster Mini App",
      appLogoUrl: "https://example.com/logo.png",
    }));
    
    wagmiConfig = createConfig({
      chains: [base],
      connectors,
      transports: {
        [base.id]: BASE_RPC_URL ? http(BASE_RPC_URL) : http(),
      },
      dataSuffix: DATA_SUFFIX,
    });
    
    configInitialized = true;
    return wagmiConfig;
  };
  
  configPromise = initialize();
  
  try {
    const result = await configPromise;
    return result;
  } finally {
    // Clear promise after completion to allow garbage collection
    configPromise = null;
  }
}

// Re-export base chain for convenience
export { base };
