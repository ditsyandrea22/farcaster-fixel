import { useAccount, useConnect, useDisconnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useFarcasterWallet } from '@/lib/farcaster-sdk'
import { base } from 'wagmi/chains'
import { useCallback, useEffect } from 'react'

/**
 * Custom hook for wallet connection following FarCast Mini App guidelines.
 * Handles both in-app FarCast wallet and external wallet connections.
 * 
 * @returns Wallet state and functions for connection management
 */
export function useWallet() {
  // Wagmi hooks for external wallet connections
  const { 
    address, 
    isConnected, 
    chainId,
    chain,
    status: accountStatus 
  } = useAccount()
  
  const { 
    connect, 
    connectors, 
    isPending: isConnecting,
    error: connectError,
    failureReason
  } = useConnect()
  
  const { disconnect: disconnectExternal } = useDisconnect()
  const { switchChain, isPending: isSwitchingChain, error: switchChainError } = useSwitchChain()
  
  const { 
    writeContract, 
    isPending: isWritingContract,
    error: writeError,
    data: hash 
  } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    isError: isTxError,
    error: confirmError 
  } = useWaitForTransactionReceipt({ 
    hash: hash || undefined,
    query: { enabled: !!hash }
  })

  // FarCast SDK wallet integration
  const { 
    isConnected: isFarcasterWalletConnected,
    address: farcasterWalletAddress,
    chainId: farcasterChainId,
    isConnecting: isConnectingFarcasterWallet,
    error: farcasterWalletError,
    connect: connectFarcasterWallet,
    disconnect: disconnectFarcasterWallet,
    switchChain: switchChainFarcaster,
    sendTransaction
  } = useFarcasterWallet()

  // Combined wallet state
  const effectiveAddress = address || farcasterWalletAddress
  const effectiveIsConnected = isConnected || isFarcasterWalletConnected

  // Check if user is on the wrong network
  const isWrongNetwork = isConnected && chainId && chainId !== base.id

  // Check if Base chain is supported
  const isBaseSupported = chain?.unsupported !== true

  /**
   * Connect to an external wallet
   */
  const connectWallet = useCallback((connector?: Parameters<typeof connect>[0]['connector']) => {
    if (connector) {
      connect({ connector })
    } else {
      // Default to first available connector
      const defaultConnector = connectors[0]
      if (defaultConnector) {
        connect({ connector: defaultConnector })
      }
    }
  }, [connect, connectors])

  // Auto-switch to Base network after external wallet connection
  useEffect(() => {
    if (isConnected && chainId && chainId !== base.id && isBaseSupported) {
      switchChain({ chainId: base.id })
    }
  }, [isConnected, chainId, isBaseSupported, switchChain])

  // Auto-switch to Base network after FarCast wallet connection
  useEffect(() => {
    if (isFarcasterWalletConnected && farcasterChainId && farcasterChainId !== base.id) {
      switchChainFarcaster(base.id)
    }
  }, [isFarcasterWalletConnected, farcasterChainId, switchChainFarcaster])

  /**
   * Connect using FarCast mini-app wallet
   */
  const connectToFarcasterWallet = useCallback(async () => {
    try {
      await connectFarcasterWallet()
    } catch (error) {
      console.error('Failed to connect FarCast wallet:', error)
      throw error
    }
  }, [connectFarcasterWallet])

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    if (isFarcasterWalletConnected) {
      disconnectFarcasterWallet()
    }
    disconnectExternal()
  }, [disconnectExternal, isFarcasterWalletConnected, disconnectFarcasterWallet])

  /**
   * Switch to Base network
   */
  const switchToBase = useCallback(() => {
    if (!isWrongNetwork) return
    switchChain({ chainId: base.id })
  }, [switchChain, isWrongNetwork])

  return {
    // Connection state
    address: effectiveAddress,
    isConnected: effectiveIsConnected,
    chainId,
    status: accountStatus,
    
    // Wallet connection
    connectors,
    isConnecting,
    isConnectingFarcasterWallet,
    connectError,
    failureReason,
    connect: connectWallet,
    connectToFarcasterWallet,
    disconnect,
    
    // Chain management
    isWrongNetwork,
    isBaseSupported,
    switchChainError,
    switchToBase,
    isSwitchingChain,
    
    // Contract interaction
    writeContract,
    isWritingContract,
    writeError,
    hash,
    
    // Transaction confirmation
    isConfirming,
    isConfirmed,
    isTxError,
    confirmError,
    
    // FarCast specific
    isFarcasterWalletConnected,
    farcasterWalletAddress,
    farcasterChainId,
    sendTransaction,
    farcasterWalletError,
    
    // Combined error state
    error: connectError || switchChainError || writeError || confirmError || farcasterWalletError,
  }
}

export default useWallet
