import { useAccount, useConnect, useDisconnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi'
import { useFarcasterWallet } from '@/lib/farcaster-sdk'
import { base } from 'wagmi/chains'
import { useCallback, useEffect, useState } from 'react'
import { type WriteContractReturnType, type Hex, type SimulateContractParameters } from 'viem'

// Extend window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

// Fixed gas limit for NFT mint (safe upper bound for most NFT mint operations)
const NFT_MINT_GAS_LIMIT = BigInt(300000)

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
    writeContract: wagmiWriteContract, 
    isPending: isWritingContract,
    error: writeError,
    data: hash 
  } = useWriteContract()
  
  // Use simulateContract to get gas estimate (if needed)
  const { data: simulateResult } = useSimulateContract({
    query: {
      enabled: false, // Disabled by default
    }
  })
  
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
    sendTransaction: farcastSendTransaction
  } = useFarcasterWallet()

  // Combined wallet state
  const effectiveAddress = address || farcasterWalletAddress
  const effectiveIsConnected = isConnected || isFarcasterWalletConnected
  const effectiveChainId = chainId || farcasterChainId

  // Check if user is on the wrong network
  const isWrongNetwork = isConnected && chainId && chainId !== base.id

  // Check if Base chain is supported
  const isBaseSupported = !!chain && !('unsupported' in chain && chain.unsupported)

  // Gas estimation state
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [isEstimatingGas, setIsEstimatingGas] = useState(false)
  const [gasEstimateError, setGasEstimateError] = useState<string | null>(null)

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

  /**
   * Write contract with gas estimation
   * Uses a fixed high gas limit to bypass gas estimation issues
   */
  const writeContractWithGas = useCallback(async (
    params: {
      address: `0x${string}`
      abi: readonly unknown[]
      functionName: string
      args?: unknown[]
      value?: bigint
    }
  ): Promise<`0x${string}` | undefined> => {
    setIsEstimatingGas(true)
    setGasEstimateError(null)
    
    try {
      console.log(`Submitting NFT mint transaction with fixed gas limit: ${NFT_MINT_GAS_LIMIT.toString()}`)
      
      // Build contract parameters - use const assertion for wagmi compatibility
      const contractParams = {
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        gas: NFT_MINT_GAS_LIMIT,
      } as const
      
      if (params.value !== undefined) {
        Object.assign(contractParams, { value: params.value })
      }
      
      // Write contract - wagmi useWriteContract returns void, hash is stored in the hash state
      await wagmiWriteContract(contractParams)
      
      setGasEstimate(NFT_MINT_GAS_LIMIT)
      setIsEstimatingGas(false)
      
      // Return the hash from state (set by wagmi after the transaction is submitted)
      return hash
    } catch (error) {
      setIsEstimatingGas(false)
      const errorMessage = error instanceof Error ? error.message : 'Contract write failed'
      setGasEstimateError(errorMessage)
      console.error('Contract write failed:', error)
      throw error
    }
  }, [wagmiWriteContract, hash])

  return {
    // Connection state
    address: effectiveAddress,
    isConnected: effectiveIsConnected,
    chainId: effectiveChainId,
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
    writeContract: wagmiWriteContract,
    writeContractWithGas,
    isWritingContract,
    writeError,
    hash,
    
    // Gas estimation
    gasEstimate,
    isEstimatingGas,
    gasEstimateError,
    estimateGasWithFallback: () => Promise.resolve(NFT_MINT_GAS_LIMIT),
    
    // Transaction confirmation
    isConfirming,
    isConfirmed,
    isTxError,
    confirmError,
    
    // FarCast specific
    isFarcasterWalletConnected,
    farcasterWalletAddress,
    farcasterChainId,
    sendTransaction: farcastSendTransaction,
    farcasterWalletError,
    
    // Combined error state
    combinedError: connectError || switchChainError || writeError || confirmError || farcasterWalletError || (gasEstimateError ? new Error(gasEstimateError) : null),
  }
}

export default useWallet
