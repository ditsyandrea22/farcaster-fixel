import { useAccount, useConnect, useDisconnect, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useFarcasterWallet } from '@/lib/farcaster-sdk'
import { base } from 'wagmi/chains'
import { useCallback, useEffect, useState } from 'react'
import { type WriteContractReturnType } from 'viem'

// Extend window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

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
   * Estimate gas for a contract call with fallback
   * Returns the gas limit with 20% buffer
   */
  const estimateGasWithFallback = useCallback(async (
    contractAddress: `0x${string}`,
    _abi: readonly unknown[],
    _functionName: string,
    _args: unknown[],
    value?: bigint
  ): Promise<bigint> => {
    setIsEstimatingGas(true)
    setGasEstimateError(null)
    
    try {
      // Method 1: Try ethereum provider's eth_estimateGas
      if (window.ethereum) {
        try {
          const result = await window.ethereum.request({
            method: 'eth_estimateGas',
            params: [{
              from: effectiveAddress || undefined,
              to: contractAddress,
              data: '0x', // Minimal data for simple transfer/mint estimation
              ...(value && { value: '0x' + value.toString(16) }),
            }],
          })
          
          if (typeof result === 'string' || typeof result === 'number') {
            const estimatedGas = BigInt(result)
            setGasEstimate(estimatedGas)
            // Add 20% buffer for safety
            const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100)
            setIsEstimatingGas(false)
            console.log(`Gas estimated: ${estimatedGas.toString()}, with buffer: ${gasWithBuffer.toString()}`)
            return gasWithBuffer
          }
        } catch (rpcError) {
          console.warn('RPC gas estimation failed, using fallback:', rpcError)
        }
      }
      
      // Method 2: Fallback to a reasonable gas limit for NFT mint
      // NFT mint operations typically use 100000-200000 gas
      // We'll use 200000 with 20% buffer = 240000
      const fallbackGas = BigInt(240000)
      setGasEstimate(fallbackGas)
      setIsEstimatingGas(false)
      console.log('Using fallback gas limit:', fallbackGas.toString())
      return fallbackGas
      
    } catch (error) {
      console.error('Gas estimation completely failed:', error)
      setGasEstimateError(error instanceof Error ? error.message : 'Gas estimation failed')
      
      // Final fallback - use a high but reasonable gas limit for NFT mint
      const finalFallback = BigInt(300000)
      setGasEstimate(finalFallback)
      setIsEstimatingGas(false)
      return finalFallback
    }
  }, [effectiveAddress])

  /**
   * Write contract with gas estimation
   * Automatically estimates gas and adds buffer before writing
   */
  const writeContractWithGas = useCallback(async (
    params: {
      address: `0x${string}`
      abi: readonly unknown[]
      functionName: string
      args?: unknown[]
      value?: bigint
    }
  ): Promise<WriteContractReturnType | undefined> => {
    setIsEstimatingGas(true)
    setGasEstimateError(null)
    
    try {
      const gasLimit = await estimateGasWithFallback(
        params.address,
        params.abi,
        params.functionName,
        params.args || [],
        params.value
      )
      
      console.log(`Submitting transaction with gas limit: ${gasLimit.toString()}`)
      
      const result = await writeContract({
        ...params,
        gas: gasLimit,
      })
      
      setIsEstimatingGas(false)
      return result
    } catch (error) {
      setIsEstimatingGas(false)
      setGasEstimateError(error instanceof Error ? error.message : 'Contract write failed')
      throw error
    }
  }, [estimateGasWithFallback, writeContract])

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
    writeContractWithGas,
    isWritingContract,
    writeError,
    hash,
    
    // Gas estimation
    gasEstimate,
    isEstimatingGas,
    gasEstimateError,
    estimateGasWithFallback,
    
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
    combinedError: connectError || switchChainError || writeError || confirmError || farcasterWalletError || (gasEstimateError ? new Error(gasEstimateError) : null),
  }
}

export default useWallet
