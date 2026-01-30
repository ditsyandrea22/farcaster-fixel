/**
 * FarCaster Mini App SDK utilities
 * Based on the new SDK: https://miniapps.farcaster.xyz/docs/sdk/
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserContext {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  bio: string;
}

export interface WalletState {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

export interface ChainInfo {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
  };
  blockExplorers: {
    default: {
      url: string;
      name: string;
    };
  };
}

export interface MiniAppState {
  isInMiniApp: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface CapabilityInfo {
  supportedChains: ChainInfo[];
  features: {
    signMessage: boolean;
    signTypedData: boolean;
    sendTransaction: boolean;
  };
}

// ============================================================================
// SDK Initialization Hook
// ============================================================================

/**
 * Initialize the FarCaster SDK
 * Call this once at the app level
 */
export function useInitializeSdk() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (sdk && typeof sdk.actions.ready === 'function') {
          await sdk.actions.ready();
          setIsReady(true);
          console.log('FarCaster SDK initialized successfully');
        } else {
          // SDK might not be available in standalone mode
          setIsReady(true);
          console.warn('FarCaster SDK not available, running in standalone mode');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize SDK'));
        console.error('Failed to initialize FarCaster SDK:', err);
        // Continue anyway - user can still use the app
        setIsReady(true);
      }
    };

    init();
  }, []);

  return { isReady, error };
}

// ============================================================================
// Mini App Detection Hook
// ============================================================================

/**
 * Detect if the app is running inside the FarCaster mini app
 * Uses the new SDK's detection capabilities
 * https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
 */
export function useMiniAppDetection(): MiniAppState {
  const [state, setState] = useState<MiniAppState>({
    isInMiniApp: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detect = async () => {
      try {
        // Check if we're in a mini app using the SDK
        // The new SDK provides isInMiniApp() or similar detection
        let inMiniApp = false;
        
        if (sdk && sdk.isInMiniApp) {
          inMiniApp = sdk.isInMiniApp();
        } else if (typeof window !== 'undefined') {
          // Fallback: check for parent frame or Warpcast environment
          inMiniApp = window.parent !== window || 
            navigator.userAgent.includes('Warpcast') ||
            navigator.userAgent.includes('farcaster');
        }
        
        setState({
          isInMiniApp: inMiniApp,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState({
          isInMiniApp: false,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Detection failed'),
        });
      }
    };

    detect();
  }, []);

  return state;
}

// ============================================================================
// User Context Hook
// ============================================================================

/**
 * Get the current user's context (FID, username, etc.)
 * https://miniapps.farcaster.xyz/docs/sdk/context
 */
export function useUserContext(): {
  context: { fid: number; username?: string; displayName?: string; pfp?: string } | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [context, setContext] = useState<{ fid: number; username?: string; displayName?: string; pfp?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        let ctx = null;
        
        if (sdk && sdk.getContext) {
          ctx = await sdk.getContext();
        } else {
          // Try to get FID from URL params as fallback
          const params = new URLSearchParams(window.location.search);
          const urlFid = params.get('fid');
          if (urlFid) {
            const fid = parseInt(urlFid, 10);
            if (!isNaN(fid)) {
              ctx = { fid };
            }
          }
        }
        
        setContext(ctx);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch context'));
        setIsLoading(false);
      }
    };

    fetchContext();
  }, []);

  return { context, isLoading, error };
}

// ============================================================================
// Wallet Hook (using new SDK)
// ============================================================================

/**
 * Use the new wallet SDK for wallet operations
 * https://miniapps.farcaster.xyz/docs/sdk/wallet
 */
export function useFarcasterWallet(): WalletState & {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  sendTransaction: (params: { to: string; value: string; data?: string }) => Promise<`0x${string}`>;
} {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Use the new SDK wallet if available
  const connect = useCallback(async () => {
    setWalletState((prev: WalletState) => ({ ...prev, isConnecting: true, error: null }));
    try {
      if (sdk && sdk.wallet) {
        await sdk.wallet.connect();
      } else {
        // Fallback: use window.ethereum if available
        const ethereum = getBrowserProvider();
        if (ethereum) {
          const accounts = await ethereum.request({
            method: 'eth_requestAccounts',
          }) as string[];
          if (accounts.length > 0) {
            setWalletState({
              address: accounts[0] as `0x${string}`,
              chainId: null,
              isConnected: true,
              isConnecting: false,
              error: null,
            });
          }
        } else {
          throw new Error('No wallet provider found');
        }
      }
    } catch (err) {
      setWalletState((prev: WalletState) => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err : new Error('Connection failed'),
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (sdk && sdk.wallet) {
        await sdk.wallet.disconnect();
      }
      setWalletState({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    try {
      if (sdk && sdk.wallet) {
        await sdk.wallet.switchChain(chainId);
      } else {
        const ethereum = getBrowserProvider();
        if (ethereum) {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
        }
      }
    } catch (err) {
      setWalletState((prev: WalletState) => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Chain switch failed'),
      }));
    }
  }, []);

  const sendTransaction = useCallback(async (params: { to: string; value: string; data?: string }): Promise<`0x${string}`> => {
    try {
      if (sdk && sdk.wallet) {
        return await sdk.wallet.sendTransaction(params);
      } else {
        const ethereum = getBrowserProvider();
        if (!ethereum) throw new Error('No wallet provider');
        
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletState.address,
            to: params.to,
            value: params.value.startsWith('0x') ? params.value : `0x${parseInt(params.value).toString(16)}`,
            data: params.data || '0x',
          }],
        });
        return txHash as `0x${string}`;
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Transaction failed');
    }
  }, [walletState.address]);

  return {
    ...walletState,
    connect,
    disconnect,
    switchChain,
    sendTransaction,
  };
}

// ============================================================================
// Chain Capabilities Hook
// ============================================================================

/**
 * Detect supported chains and capabilities
 * https://miniapps.farcaster.xyz/docs/sdk/detecting-capabilities
 */
export function useChainCapabilities(): {
  capabilities: CapabilityInfo | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [capabilities, setCapabilities] = useState<CapabilityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        let caps: CapabilityInfo | null = null;
        
        if (sdk && sdk.getCapabilities) {
          caps = await sdk.getCapabilities();
        } else {
          // Default capabilities for common chains
          caps = {
            supportedChains: [
              {
                id: 8453, // Base
                name: 'Base',
                nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
                blockExplorers: { default: { url: 'https://basescan.org', name: 'BaseScan' } },
              },
              {
                id: 10, // Optimism
                name: 'Optimism',
                nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } },
                blockExplorers: { default: { url: 'https://optimistic.etherscan.io', name: 'Optimism Explorer' } },
              },
              {
                id: 7777777, // Zora
                name: 'Zora',
                nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                rpcUrls: { default: { http: ['https://rpc.zora.energy'] } },
                blockExplorers: { default: { url: 'https://zora.superseed.xyz', name: 'Zora Explorer' } },
              },
            ],
            features: {
              signMessage: true,
              signTypedData: true,
              sendTransaction: true,
            },
          };
        }
        
        setCapabilities(caps);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch capabilities'));
        setIsLoading(false);
      }
    };

    fetchCapabilities();
  }, []);

  return { capabilities, isLoading, error };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a specific chain is supported
 */
export function isChainSupported(
  supportedChains: ChainInfo[],
  chainId: number
): boolean {
  return supportedChains.some(chain => chain.id === chainId);
}

/**
 * Get chain info by ID
 */
export function getChainById(
  supportedChains: ChainInfo[],
  chainId: number
): ChainInfo | undefined {
  return supportedChains.find(chain => chain.id === chainId);
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: `0x${string}` | null, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get the browser wallet provider if available
 */
export function getBrowserProvider(): any {
  if (typeof window === 'undefined') return null;
  
  // Check for various wallet providers
  const ethereum = (window as any).ethereum;
  if (ethereum?.providers) {
    // Multiple providers injected
    return ethereum.providers.find((p: any) => p.isMetaMask) || ethereum.providers[0];
  }
  return ethereum;
}

/**
 * Detect current chain from provider
 */
export async function getCurrentChain(): Promise<number | null> {
  const ethereum = getBrowserProvider();
  if (!ethereum) return null;
  
  try {
    const chainId = await ethereum.request({
      method: 'eth_chainId',
    });
    return parseInt(chainId, 16);
  } catch {
    return null;
  }
}
