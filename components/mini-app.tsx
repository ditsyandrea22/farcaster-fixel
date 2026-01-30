'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { config } from '@/lib/wagmi'
import { base } from 'wagmi/chains'
import { NFT_ABI } from '@/lib/contractAbi'
import { getUserProfile, type UserProfile, getFidFromAddress, generateNftImageUrl } from '@/lib/neynar'
import { 
  useInitializeSdk, 
  useMiniAppDetection, 
  useUserContext, 
  useFarcasterWallet, 
  useChainCapabilities,
  formatAddress 
} from '@/lib/farcaster-sdk'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, CheckCircle2, Wallet, Sparkles, RefreshCw, Globe, Shield, Terminal, Terminal as TerminalIcon } from 'lucide-react'
import styles from '@/styles/animations.module.css'

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF'
const MINT_PRICE = '0.001' // ETH
const BASE_CHAIN_ID = base.id

export function MiniApp() {
  // SDK State
  const { isReady: sdkReady, error: sdkError } = useInitializeSdk()
  const { isInMiniApp, isLoading: isDetectingMiniApp } = useMiniAppDetection()
  const { context: userContext, isLoading: isLoadingContext, error: contextError } = useUserContext()
  const { capabilities, isLoading: isLoadingCapabilities } = useChainCapabilities()
  
  // App State
  const [fid, setFid] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nftImageUrl, setNftImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [lookingUpFid, setLookingUpFid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  // Wallet State using wagmi (with fallback to new SDK)
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
  const isWrongNetwork = isConnected && chainId && chainId !== BASE_CHAIN_ID
  
  // Check if Base chain is supported by the mini app
  const isBaseSupported = capabilities?.supportedChains?.some?.((chain: { id: number }) => chain.id === BASE_CHAIN_ID) ?? true

  // Set FID from user context (new SDK) - priority source
  useEffect(() => {
    if (userContext?.fid) {
      console.log('FID from SDK context:', userContext.fid)
      setFid(userContext.fid)
    }
  }, [userContext])

  // Extract FID from URL as fallback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlFid = params.get('fid')

    if (urlFid && !fid) {
      const parsed = parseInt(urlFid, 10)
      if (!isNaN(parsed) && parsed > 0) {
        console.log('FID from URL:', parsed)
        setFid(parsed)
      }
    }
  }, [fid])

  // Auto-lookup FID from wallet address only when SDK context is NOT available
  useEffect(() => {
    // Only lookup if:
    // 1. Wallet is connected
    // 2. We have an address
    // 3. No FID from SDK or URL yet
    // 4. Not already looking up
    // 5. Not in mini app (SDK should provide FID)
    const needsLookup = isConnected && address && !fid && !lookingUpFid && !isInMiniApp
    
    if (needsLookup) {
      console.log('Wallet connected, no SDK FID, falling back to Neynar lookup for:', address)
      lookupFidFromWallet()
    } else if (!fid && !lookingUpFid && isInMiniApp) {
      // In mini app but no FID from SDK - this is an error state
      console.log('In mini app but no FID from SDK')
      setError('Could not retrieve your FarCaster ID. Please try reopening the mini app.')
    }
  }, [isConnected, address, fid, lookingUpFid, isInMiniApp])

  const lookupFidFromWallet = async () => {
    if (!address) return
    setLookingUpFid(true)
    setError(null)
    try {
      console.log('Starting FID lookup for:', address)
      const result = await getFidFromAddress(address)
      if (result) {
        console.log('FID found:', result.fid)
        setFid(result.fid)
      } else {
        console.log('No FID found for address:', address)
        // Provide a more helpful message
        setError(
          isInMiniApp 
            ? 'Could not retrieve your FarCaster ID. Please try reconnecting.'
            : 'No FarCaster account linked to this wallet. Make sure your wallet is connected to the address you use on FarCaster.'
        )
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'API_LIMIT_REACHED') {
          setError('API limit reached. Please upgrade your Neynar plan or try again later.')
        } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
          setError('Rate limit exceeded. Please try again later.')
        } else {
          console.error('Error looking up FID:', err)
          setError('Failed to look up FarCaster account. Please check your connection and try again.')
        }
      } else {
        console.error('Error looking up FID:', err)
        setError('Failed to look up FarCaster account. Please check your connection and try again.')
      }
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

  // Show loading while SDK is initializing
  if (!sdkReady || isDetectingMiniApp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-dark">
        <Card className="w-full max-w-md p-8 text-center terminal-box">
          <div className={styles.pixelLoaderTerminal}></div>
          <p className="text-foreground mt-6 font-mono font-medium">Initializing...</p>
          <p className="text-muted-foreground text-sm mt-2 font-mono">Setting up FarCaster Mini App</p>
          <div className="mt-4 font-mono text-xs text-primary">
            <p>{'>'} Loading SDK modules...</p>
            <p className="animation-delay-100">{'>'} Establishing connection...</p>
            <p className="animation-delay-200">{'>'} Preparing environment...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!fid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-dark">
        <Card className="w-full max-w-md p-6 text-center terminal-box">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
            <TerminalIcon className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm text-foreground">Fixel FID v1.0</span>
          </div>

          {/* Mini App Status Badge */}
          <div className="flex justify-center gap-2 mb-4">
            {isInMiniApp ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary text-xs font-mono rounded-full border border-primary/30">
                <Shield size={12} />
                In Mini App
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/50 text-muted-foreground text-xs font-mono rounded-full">
                <Globe size={12} />
                Standalone Mode
              </span>
            )}
          </div>

          {lookingUpFid ? (
            <>
              <div className={styles.pulseLoaderTerminal}>
                <Loader2 className="mx-auto text-primary" size={40} />
              </div>
              <p className="text-foreground mt-6 font-mono font-medium">{'>'} Looking up your FarCaster account...</p>
              <p className="text-muted-foreground text-sm mt-2 font-mono">This may take a moment</p>
              <div className="mt-4 font-mono text-xs text-muted-foreground">
                <p>{'>'} Querying Neynar API...</p>
                <p className="animation-delay-100">{'>'} Resolving FID...</p>
              </div>
            </>
          ) : (
            <>
              <TerminalIcon className="mx-auto mb-4 text-primary/50" size={40} />
              <p className="text-foreground font-semibold text-lg font-mono">Connect Wallet</p>
              <p className="text-muted-foreground text-sm mt-2 font-mono">
                {isConnected 
                  ? 'No FarCaster account linked to this wallet'
                  : 'Connect your wallet to get started'}
              </p>
              
              {/* Error Message with Retry Button */}
              {error && isConnected && (
                <div className="mt-4 p-3 bg-destructive/20 border border-destructive/30 rounded-lg">
                  <div className="flex gap-2 items-start">
                    <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm font-mono text-left">{error}</p>
                  </div>
                  <Button
                    onClick={lookupFidFromWallet}
                    disabled={lookingUpFid}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-border text-foreground hover:bg-secondary/50 font-mono"
                  >
                    {lookingUpFid ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={14} />
                        Looking up...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} className="mr-2" />
                        ./retry.sh
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Chain Support Warning */}
              {!isBaseSupported && (
                <div className="mt-4 p-3 bg-accent/20 border border-accent/30 rounded-lg flex gap-2">
                  <AlertCircle size={18} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-accent text-sm text-left font-mono">
                    Base chain may not be fully supported in this mini app environment.
                  </p>
                </div>
              )}

              {!isConnected && (
                <div className="mt-6 space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      onClick={() => connect({ connector })}
                      disabled={isConnecting}
                      className="w-full bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
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
                  <p className="text-center text-muted-foreground text-xs mt-4 font-mono">
                    {'>'} Make sure you have a wallet installed
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="max-w-md mx-auto">
        {/* Terminal Header */}
        <div className="text-center mb-6 mt-4">
          {/* Terminal Window Header */}
          <div className="terminal-box p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">bash — mint</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-mono font-bold text-foreground mb-1">
            <span className="text-primary">&gt;</span> Mint NFT
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Base Mainnet • FID #{fid}</p>
          
          {/* Status Indicators */}
          <div className="flex justify-center gap-2 mt-3">
            {isInMiniApp ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs font-mono rounded-full border border-primary/30">
                <Shield size={10} />
                Mini App
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/50 text-muted-foreground text-xs font-mono rounded-full">
                <Globe size={10} />
                Standalone
              </span>
            )}
            {sdkError && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/20 text-destructive text-xs font-mono rounded-full border border-destructive/30">
                SDK Error
              </span>
            )}
          </div>
        </div>

        {/* Loading State for NFT Generation */}
        {loading && (
          <Card className="mb-6 p-8 terminal-box">
            <div className="flex flex-col items-center justify-center py-8">
              <div className={styles.pixelLoaderTerminal}></div>
              <p className="text-foreground mt-6 font-mono font-medium">{'>'} Generating your pixel NFT...</p>
              <p className="text-muted-foreground text-xs mt-2 font-mono">Creating unique design from FID data</p>
              <div className="mt-4 font-mono text-xs text-muted-foreground">
                <p>{'>'} Processing FID #{fid}...</p>
                <p className="animation-delay-100">{'>'} Generating pixel patterns...</p>
                <p className="animation-delay-200">{'>'} Rendering NFT...</p>
              </div>
            </div>
          </Card>
        )}

        {/* NFT Preview Card */}
        {nftImageUrl && !loading && (
          <Card className={`mb-6 overflow-hidden terminal-box transition-all duration-500 ${styles.fadeIn}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none"></div>
              <div className={styles.nftGlowTerminal}></div>
              <img
                src={nftImageUrl || "/placeholder.svg"}
                alt="Your Base NFT"
                className="w-full h-auto"
              />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-primary" />
                <p className="text-xs font-semibold text-foreground font-mono">PIXEL NFT</p>
              </div>
              <p className="text-muted-foreground text-xs font-mono">Unique design generated from your FarCaster identity</p>
            </div>
          </Card>
        )}

        {/* Profile Card */}
        {profile && !loading && (
          <Card className={`mb-6 p-4 terminal-box transition-all duration-500 ${styles.slideUp}`} style={{ animationDelay: '0.1s' }}>
            <div className="flex gap-4 items-center">
              <img
                src={profile.pfp.url || "/placeholder.svg"}
                alt={profile.username}
                className="w-14 h-14 rounded-full border-2 border-primary/30"
              />
              <div className="flex-1">
                <h2 className="font-semibold text-foreground font-mono">{profile.displayName}</h2>
                <p className="text-muted-foreground text-sm font-mono">@{profile.username}</p>
                {profile.profile.bio.text && (
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2 font-mono">{profile.profile.bio.text}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Wallet Connection */}
        <Card className={`mb-6 p-4 terminal-box transition-all duration-500 ${styles.slideUp}`} style={{ animationDelay: '0.2s' }}>
          {!isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TerminalIcon size={16} className="text-primary" />
                <p className="text-foreground font-mono font-medium">Connect Wallet</p>
              </div>
              
              {connectError && (
                <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-lg flex gap-2">
                  <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-destructive text-sm font-mono">
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
                    className="w-full bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
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

              <p className="text-center text-muted-foreground text-xs mt-4 font-mono">
                {'>'} Make sure you have a wallet installed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TerminalIcon size={16} className="text-primary" />
                <p className="text-foreground font-mono text-sm">Connected</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1 font-mono">ADDRESS</p>
                <p className="text-foreground font-mono text-xs break-all">{address}</p>
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                className="w-full text-foreground border-border hover:bg-secondary/50 font-mono text-sm"
                size="sm"
              >
                ./disconnect.sh
              </Button>
            </div>
          )}
        </Card>

        {/* Mint Card */}
        {isConnected && (
          <Card className={`p-4 terminal-box transition-all duration-500 ${styles.slideUp}`} style={{ animationDelay: '0.3s' }}>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TerminalIcon size={16} className="text-primary" />
                <p className="text-muted-foreground text-sm font-mono">Mint Price</p>
              </div>
              <p className="text-3xl font-mono font-bold text-foreground">{MINT_PRICE}</p>
              <p className="text-muted-foreground text-xs mt-1 font-mono">ETH on Base Mainnet</p>
            </div>

            {isWrongNetwork && (
              <div className="mb-4 p-3 bg-accent/20 border border-accent/30 rounded-lg">
                <div className="flex gap-2 mb-3">
                  <AlertCircle size={18} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-accent text-sm font-mono">Wrong network detected</p>
                </div>
                <Button
                  onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
                  disabled={isSwitchingChain}
                  className="w-full bg-accent hover:bg-accent/80 text-terminal-dark font-mono text-sm"
                  size="sm"
                >
                  {isSwitchingChain ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Switching...
                    </>
                  ) : (
                    './switch-chain.sh --base'
                  )}
                </Button>
              </div>
            )}

            {/* Error Display */}
            {(error || writeError) && (
              <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive text-sm font-mono">{error || writeError?.message}</p>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-4 p-3 bg-primary/20 border border-primary/30 rounded-lg flex gap-2">
                <CheckCircle2 size={18} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-primary text-sm font-mono font-medium">NFT minted successfully!</p>
                  {txHash && (
                    <p className="text-muted-foreground text-xs mt-1 font-mono break-all">
                      Tx: {txHash.slice(0, 6)}...{txHash.slice(-4)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {isConfirming && (
              <div className="mb-4 p-3 bg-primary/20 border border-primary/30 rounded-lg flex gap-2">
                <Loader2 size={18} className="text-primary flex-shrink-0 mt-0.5 animate-spin" />
                <p className="text-foreground text-sm font-mono">Confirming transaction...</p>
              </div>
            )}

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={isWritingContract || !isConnected || loading || isWrongNetwork || isConfirming || isConfirmed}
              className="w-full bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold py-4 text-base disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              size="lg"
            >
              {isWritingContract ? (
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
                  ./mint.sh
                </>
              )}
            </Button>

            {/* Retry button on error */}
            {(error || isTxError) && (
              <Button
                onClick={resetAndRetry}
                variant="outline"
                className="w-full mt-3 text-foreground border-border hover:bg-secondary/50 font-mono text-sm"
                size="sm"
              >
                <RefreshCw size={16} className="mr-2" />
                ./retry.sh
              </Button>
            )}

            <p className="text-center text-muted-foreground text-xs mt-4 font-mono">
              {isConfirming 
                ? '{>} Please confirm the transaction in your wallet'
                : '{>} Sign transaction in your wallet to complete the mint'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
