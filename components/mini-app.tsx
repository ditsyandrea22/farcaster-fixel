'use client'

import { useEffect, useState, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { config } from '@/lib/wagmi'
import { base } from 'wagmi/chains'
import { NFT_ABI } from '@/lib/contractAbi'
import { getUserProfile, type UserProfile, getFidFromAddress, generateNftImageUrl } from '@/lib/neynar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, CheckCircle2, Wallet, Sparkles, RefreshCw } from 'lucide-react'
import styles from '@/styles/animations.module.css'

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF'
const MINT_PRICE = '0.001' // ETH

export function MiniApp() {
  const [fid, setFid] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nftImageUrl, setNftImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [lookingUpFid, setLookingUpFid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, isPending: isWritingContract, error: writeError } = useWriteContract()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  
  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: confirmError } = 
    useWaitForTransactionReceipt({ 
      hash: txHash || undefined,
      query: { enabled: !!txHash }
    })
  
  // Check if user is on the wrong network
  const isWrongNetwork = isConnected && chainId && chainId !== base.id

  // Initialize SDK with proper error handling
  useEffect(() => {
    const initSdk = async () => {
      try {
        if (sdk && typeof sdk.actions.ready === 'function') {
          await sdk.actions.ready()
          setSdkReady(true)
        } else {
          console.warn('Farcaster SDK not available, running in standalone mode')
          setSdkReady(true) // Still mark as ready for standalone mode
        }
      } catch (err) {
        console.error('Failed to initialize FarCaster SDK:', err)
        // Continue anyway - user can still use the app
        setSdkReady(true)
      }
    }
    initSdk()
  }, [])

  // Extract FID from URL or auto-lookup from wallet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlFid = params.get('fid')

    if (urlFid) {
      const parsed = parseInt(urlFid, 10)
      if (!isNaN(parsed) && parsed > 0) {
        setFid(parsed)
      } else {
        console.warn('Invalid FID in URL:', urlFid)
      }
    }
  }, [])

  // Auto-lookup FID from wallet address when wallet connects
  useEffect(() => {
    if (isConnected && address && !fid) {
      lookupFidFromWallet()
    }
  }, [isConnected, address, fid])

  const lookupFidFromWallet = async () => {
    if (!address) return
    setLookingUpFid(true)
    try {
      const result = await getFidFromAddress(address)
      if (result) {
        setFid(result.fid)
      } else {
        setError('No FarCaster account found for this wallet')
      }
    } catch (err) {
      console.error('Error looking up FID:', err)
      setError('Failed to look up FarCaster account')
    } finally {
      setLookingUpFid(false)
    }
  }

  // Fetch user profile when FID is set
  useEffect(() => {
    if (fid) {
      fetchProfile()
    }
  }, [fid])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setSuccess(true)
      setError(null)
    }
    if (isTxError && confirmError) {
      setError(confirmError.message || 'Transaction failed')
    }
  }, [isConfirmed, isTxError, confirmError])

  const fetchProfile = async () => {
    if (!fid) return
    setLoading(true)
    setError(null)
    try {
      const userProfile = await getUserProfile(fid)
      if (userProfile) {
        setProfile(userProfile)
        // Generate unique NFT image based on FID and username
        const imageUrl = generateNftImageUrl(fid, userProfile.username)
        setNftImageUrl(imageUrl)
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Error fetching profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!address || !fid) {
      setError('Wallet not connected or FID missing')
      return
    }

    setError(null)
    setSuccess(false)
    setTxHash(null)

    try {
      const hash = await writeContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [BigInt(fid)],
        value: parseEther(MINT_PRICE),
      })
      setTxHash(hash || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed')
    }
  }

  const resetAndRetry = useCallback(() => {
    setError(null)
    setSuccess(false)
    setTxHash(null)
    if (fid) {
      fetchProfile()
    }
  }, [fid])

  if (!fid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Card className="w-full max-w-md p-8 text-center border border-gray-200">
          {lookingUpFid ? (
            <>
              <div className={styles.pulseLoader}>
                <Loader2 className="mx-auto text-blue-600" size={40} />
              </div>
              <p className="text-gray-700 mt-6 font-medium">Looking up your FarCaster account...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </>
          ) : (
            <>
              <Sparkles className="mx-auto mb-4 text-gray-400" size={40} />
              <p className="text-gray-900 font-semibold text-lg">Connect Wallet</p>
              <p className="text-gray-600 text-sm mt-2">
                {isConnected 
                  ? 'No FarCaster account linked to this wallet'
                  : 'Connect your wallet to get started'}
              </p>
              {!isConnected && (
                <div className="mt-6 space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      onClick={() => connect({ connector })}
                      disabled={isConnecting}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                      size="lg"
                    >
                      {isConnecting && connectors.some(c => c.uid === connector.uid) ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Wallet size={18} />
                      )}
                      {connector.name}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Mint NFT</h1>
          <p className="text-gray-600 text-sm">Base Mainnet • FID #{fid}</p>
          {!sdkReady && (
            <p className="text-amber-600 text-xs mt-1">SDK initializing...</p>
          )}
        </div>

        {/* Loading State for NFT Generation */}
        {loading && (
          <Card className="mb-6 p-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200">
            <div className="flex flex-col items-center justify-center py-8">
              <div className={styles.pixelLoader}></div>
              <p className="text-gray-600 mt-6 font-medium">Generating your pixel NFT...</p>
              <p className="text-gray-500 text-xs mt-2">Creating unique design from FID data</p>
            </div>
          </Card>
        )}

        {/* NFT Preview Card */}
        {nftImageUrl && !loading && (
          <Card className={`mb-6 overflow-hidden border border-gray-200 transition-all duration-500 ${styles.fadeIn}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 pointer-events-none"></div>
              <div className={styles.nftGlow}></div>
              <img
                src={nftImageUrl || "/placeholder.svg"}
                alt="Your Base NFT"
                className="w-full h-auto"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-blue-600" />
                <p className="text-xs font-semibold text-gray-600">PIXEL NFT</p>
              </div>
              <p className="text-gray-600 text-xs">Unique design generated from your FarCaster identity</p>
            </div>
          </Card>
        )}

        {/* Profile Card */}
        {profile && !loading && (
          <Card className={`mb-6 p-6 border border-gray-200 bg-white transition-all duration-500 ${styles.slideUp}`}>
            <div className="flex gap-4">
              <img
                src={profile.pfp.url || "/placeholder.svg"}
                alt={profile.username}
                className="w-14 h-14 rounded-full border border-gray-200"
              />
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{profile.displayName}</h2>
                <p className="text-gray-600 text-sm">@{profile.username}</p>
                {profile.profile.bio.text && (
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{profile.profile.bio.text}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Wallet Connection */}
        <Card className={`mb-6 p-6 border border-gray-200 bg-white transition-all duration-500 ${styles.slideUp}`} style={{ animationDelay: '0.1s' }}>
          {!isConnected ? (
            <div className="space-y-3">
              <p className="text-gray-700 font-medium mb-4">Connect Wallet</p>
              
              {connectError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">
                    {connectError.message.includes('no matching chain')
                      ? 'Please switch to Base network in your wallet'
                      : connectError.message}
                  </p>
                </div>
              )}

              {connectors
                .map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={isConnecting}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    size="lg"
                  >
                    {isConnecting && connectors.some(c => c.uid === connector.uid) ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Wallet size={18} />
                    )}
                    {connector.name}
                  </Button>
                ))}

              <p className="text-center text-gray-500 text-xs mt-4">
                Make sure you have a wallet installed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-semibold">Connected</p>
                <p className="text-gray-900 font-mono text-xs break-all">{address}</p>
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          )}
        </Card>

        {/* Mint Card */}
        {isConnected && (
          <Card className={`p-6 border border-gray-200 bg-white transition-all duration-500 ${styles.slideUp}`} style={{ animationDelay: '0.2s' }}>
            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-2 font-medium">Mint Price</p>
              <p className="text-3xl font-bold text-gray-900">{MINT_PRICE}</p>
              <p className="text-gray-600 text-xs mt-1">ETH on Base Mainnet</p>
            </div>

            {isWrongNetwork && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-2 mb-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-sm">Wrong network detected</p>
                </div>
                <Button
                  onClick={() => switchChain({ chainId: base.id })}
                  disabled={isSwitchingChain}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  {isSwitchingChain ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Switching...
                    </>
                  ) : (
                    'Switch to Base Mainnet'
                  )}
                </Button>
              </div>
            )}

            {/* Error Display */}
            {(error || writeError) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error || writeError?.message}</p>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-700 text-sm font-medium">NFT minted successfully!</p>
                  {txHash && (
                    <p className="text-green-600 text-xs mt-1 font-mono break-all">
                      Tx: {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {isConfirming && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                <Loader2 size={18} className="text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                <p className="text-blue-700 text-sm">Confirming transaction...</p>
              </div>
            )}

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isPending || !isConnected || loading || isWrongNetwork || isConfirming || isConfirmed}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-6 text-base disabled:opacity-50 transition-all"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Preparing...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Confirming...
                </>
              ) : isConfirmed ? (
                <>
                  <CheckCircle2 size={18} className="mr-2" />
                  Minted!
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Mint NFT
                </>
              )}
            </Button>

            {/* Retry button on error */}
            {(error || isTxError) && (
              <Button
                onClick={resetAndRetry}
                variant="outline"
                className="w-full mt-3 text-gray-700 border-gray-300 hover:bg-gray-50"
                size="sm"
              >
                <RefreshCw size={16} className="mr-2" />
                Retry
              </Button>
            )}

            <p className="text-center text-gray-500 text-xs mt-4">
              {isConfirming 
                ? 'Please confirm the transaction in your wallet'
                : 'Sign transaction in your wallet to complete the mint'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
