'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { config } from '@/lib/wagmi'
import { base } from 'wagmi/chains'
import { NFT_ABI } from '@/lib/contractAbi'
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
import { AlertCircle, Loader2, CheckCircle2, Wallet, Sparkles, RefreshCw, Globe, Shield, Terminal, Terminal as TerminalIcon, Star, Crown, Gem, Dice } from 'lucide-react'
import styles from '@/styles/animations.module.css'

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x955e339e27d2689b95BfB25C5e2Bce2223321cAA'
const MINT_PRICE = '0.0001' // ETH ($0.3 at $3000/ETH)
const BASE_CHAIN_ID = base.id

// Rarity tiers
const RARITY_TIERS = {
  COMMON: { name: 'COMMON', rate: 80, color: '#6B7280', icon: null },
  UNCOMMON: { name: 'UNCOMMON', rate: 15, color: '#10B981', icon: null },
  SILVER: { name: 'SILVER', rate: 4, color: '#94A3B8', icon: Star },
  GOLD: { name: 'GOLD', rate: 0.99, color: '#F59E0B', icon: Crown },
  PLATINUM: { name: 'PLATINUM', rate: 0.01, color: '#E5E7EB', icon: Gem },
} as const

type RarityTier = keyof typeof RARITY_TIERS

// Determine rarity based on wallet address (deterministic)
function determineRarity(address: string): RarityTier {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const rand = (Math.abs(hash) % 10000) / 100 // 0-100 scale
  
  let cumulative = 0
  const rates = [
    { tier: 'COMMON' as RarityTier, rate: 80 },
    { tier: 'UNCOMMON' as RarityTier, rate: 15 },
    { tier: 'SILVER' as RarityTier, rate: 4 },
    { tier: 'GOLD' as RarityTier, rate: 0.99 },
    { tier: 'PLATINUM' as RarityTier, rate: 0.01 },
  ]
  
  for (const { tier, rate } of rates) {
    cumulative += rate
    if (rand <= cumulative) {
      return tier
    }
  }
  return 'COMMON'
}

export function MiniApp() {
  // SDK State
  const { isReady: sdkReady, error: sdkError } = useInitializeSdk()
  const { isInMiniApp, isLoading: isDetectingMiniApp } = useMiniAppDetection()
  const { context: userContext, isLoading: isLoadingContext, error: contextError } = useUserContext()
  const { capabilities, isLoading: isLoadingCapabilities } = useChainCapabilities()
  
  // App State
  const [fid, setFid] = useState<number | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [rarity, setRarity] = useState<RarityTier>('COMMON')
  const [nftImageUrl, setNftImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [hasMinted, setHasMinted] = useState(false)
  const [isCheckingMint, setIsCheckingMint] = useState(false)
  
  // New states for Generate → Mint flow
  const [isGenerated, setIsGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [fortuneMessage, setFortuneMessage] = useState<string>('')
  const [revealedRarity, setRevealedRarity] = useState<RarityTier | null>(null)

  // Wallet State using wagmi
  const { address: walletAddress, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, isPending: isWritingContract, error: writeError } = useWriteContract()
  
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

  // Set FID from user context (FarCaster SDK) and check wallet mint status
  useEffect(() => {
    if (userContext?.fid) {
      console.log('FID from SDK context:', userContext.fid)
      setFid(userContext.fid)
    }
    
    if (walletAddress) {
      const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '{}')
      if (mintedWallets[walletAddress.toLowerCase()]) {
        setHasMinted(true)
      }
      setAddress(walletAddress)
    }
  }, [userContext, walletAddress])

  // Generate NFT data when wallet is connected (but don't auto-generate)
  useEffect(() => {
    if (walletAddress) {
      // Just prepare the data, don't generate yet
      // User must click "Generate" to reveal their luck
      setAddress(walletAddress)
    }
  }, [walletAddress])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setSuccess(true)
      setError(null)
      // Mark wallet as minted
      if (walletAddress) {
        const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '{}')
        mintedWallets[walletAddress.toLowerCase()] = true
        localStorage.setItem('mintedWallets', JSON.stringify(mintedWallets))
        setHasMinted(true)
      }
    }
    if (isTxError && confirmError) {
      setError(confirmError.message || 'Transaction failed')
    }
  }, [isConfirmed, isTxError, confirmError, walletAddress])

  const handleMint = async () => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    if (hasMinted) {
      setError('You have already minted an NFT with this wallet')
      return
    }

    setError(null)
    setSuccess(false)
    setTxHash(null)

    try {
      const effectiveFid = getEffectiveFid()
      const hash = await writeContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        value: parseEther(MINT_PRICE),
      })
      setTxHash(hash || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed')
    }
  }

  // Helper function to hash address for token ID
  function hashAddress(addr: string): number {
    let hash = 0
    for (let i = 0; i < addr.length; i++) {
      const char = addr.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash) % 20000 + 1
  }

  // Get effective FID - use SDK FID or derive from wallet address
  const getEffectiveFid = (): number => {
    if (fid && fid > 0) {
      return fid
    }
    if (walletAddress) {
      return hashAddress(walletAddress)
    }
    return 0
  }

  const resetAndRetry = useCallback(() => {
    setError(null)
    setSuccess(false)
    setTxHash(null)
  }, [])

  const getRarityIcon = (tier: RarityTier) => {
    const Icon = RARITY_TIERS[tier].icon
    if (!Icon) return null
    return <Icon size={20} />
  }

  const getRarityStyle = (tier: RarityTier) => {
    const tierConfig = RARITY_TIERS[tier]
    if (tier === 'PLATINUM' || tier === 'GOLD' || tier === 'SILVER') {
      return {
        borderColor: tierConfig.color,
        boxShadow: `0 0 20px ${tierConfig.color}40`,
        background: `linear-gradient(135deg, ${tierConfig.color}10, transparent)`,
      }
    }
    return { borderColor: tierConfig.color }
  }

  // Fortune messages based on rarity
  const getFortuneMessage = (tier: RarityTier): string => {
    const messages = {
      PLATINUM: [
        "🌟 LEGENDARY! Your luck is cosmic!",
        "✨ The universe has chosen you!",
        "💎 Pure platinum destiny awaits!",
      ],
      GOLD: [
        "👑 Royal fortune smiles upon you!",
        "🌅 Golden rays of opportunity!",
        "✨ Majestic destiny unfolds!",
      ],
      SILVER: [
        "⭐ Shimmering silver path ahead!",
        "🌙 Gentle luck guides your way!",
        "✨ Bright prospects incoming!",
      ],
      UNCOMMON: [
        "🍀 Good fortune favors you!",
        "🌿 A lucky breeze blows your way!",
        "✨ Opportunities await!",
      ],
      COMMON: [
        "🤝 Every journey begins somewhere!",
        "🎯 Your unique path awaits!",
        "✨ Your NFT, uniquely yours!",
      ],
    }
    const tierMessages = messages[tier]
    return tierMessages[Math.floor(Math.random() * tierMessages.length)]
  }

  // Generate NFT based on luck (kehokian) - then directly mint
  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(false)
    setTxHash(null)
    setIsGenerated(false)
    
    if (!walletAddress) {
      setError('Wallet not connected')
      setIsGenerating(false)
      return
    }

    if (hasMinted) {
      setError('You have already minted an NFT with this wallet')
      setIsGenerating(false)
      return
    }

    // Determine rarity based on wallet address
    const walletRarity = determineRarity(walletAddress)
    setRarity(walletRarity)
    setRevealedRarity(walletRarity)
    setFortuneMessage(getFortuneMessage(walletRarity))
    
    // Generate unique NFT image based on FID or wallet
    const imageUrl = fid ? `/api/nft-image?fid=${fid}&rarity=${walletRarity}` : `/api/nft-image?address=${walletAddress}&rarity=${walletRarity}`
    setNftImageUrl(imageUrl)

    // Now directly mint the NFT - writeContract triggers wallet approval
    try {
      console.log('🚀 Starting NFT mint...')
      console.log('Contract:', NFT_CONTRACT_ADDRESS)
      console.log('Value:', MINT_PRICE, 'ETH')
      
      const hash = await writeContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        value: parseEther(MINT_PRICE),
      })
      
      console.log('✅ Transaction submitted:', hash)
      setTxHash(hash)
      // isGenerating stays true until isConfirmed
    } catch (err) {
      console.error('❌ Mint failed:', err)
      setError(err instanceof Error ? err.message : 'Mint failed - Please check your wallet')
      setIsGenerating(false)
    }
  }

  // Reset isGenerating when transaction completes
  useEffect(() => {
    if (isConfirmed || isTxError) {
      setIsGenerating(false)
    }
  }, [isConfirmed, isTxError])

  // Reset and try your luck again
  const handleRegenerate = () => {
    setIsGenerated(false)
    setRevealedRarity(null)
    setFortuneMessage('')
    setSuccess(false)
    setTxHash(null)
  }

  // Show loading while SDK is initializing
  if (!sdkReady || isDetectingMiniApp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-dark">
        <Card className="w-full max-w-md p-8 text-center terminal-box">
          <div className={styles.pixelLoaderTerminal}></div>
          <p className="text-foreground mt-6 font-mono font-medium">Initializing...</p>
          <p className="text-muted-foreground text-sm mt-2 font-mono">Setting up AI NFT Generator</p>
          <div className="mt-4 font-mono text-xs text-primary">
            <p className="text-primary">&gt; Loading AI modules...</p>
            <p className="animation-delay-100">&gt; Establishing connection...</p>
            <p className="animation-delay-200">&gt; Preparing environment...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Not connected state
  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-dark">
        <Card className="w-full max-w-md p-6 text-center terminal-box">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
            <TerminalIcon className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm text-foreground">AI NFT Generator v1.0</span>
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

          <TerminalIcon className="mx-auto mb-4 text-primary/50" size={40} />
          <p className="text-foreground font-semibold text-lg font-mono">Connect Wallet</p>
          <p className="text-muted-foreground text-sm mt-2 font-mono">
            Connect your wallet to generate your unique AI NFT
          </p>

          {/* Rarity Info */}
          <div className="mt-4 p-3 bg-secondary/20 border border-border rounded-lg">
            <p className="text-xs font-mono text-muted-foreground mb-2">&gt; Rarity Distribution:</p>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
              <span className="text-gray-400">✨ PLATINUM: 0.01%</span>
              <span className="text-yellow-500">👑 GOLD: 0.99%</span>
              <span className="text-silver">⭐ SILVER: 4%</span>
              <span className="text-green-500">🟢 UNCOMMON: 15%</span>
              <span className="text-gray-500">⚫ COMMON: 80%</span>
            </div>
          </div>
          
          {/* Chain Support Warning */}
          {!isBaseSupported && (
            <div className="mt-4 p-3 bg-accent/20 border border-accent/30 rounded-lg flex gap-2">
              <AlertCircle size={18} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-accent text-sm text-left font-mono">
                Base chain may not be fully supported in this mini app environment.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isConnecting}
                className="w-full bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold flex items-center justify-center gap-2 disabled:opacity50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
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
        </Card>
      </div>
    )
  }

  // Already minted state
  if (hasMinted) {
    return (
      <div className="min-h-screen bg-terminal-dark">
        <div className="max-w-md mx-auto">
          {/* Terminal Header */}
          <div className="text-center mb-6 mt-4">
            <div className="terminal-box p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">bash — minted</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-mono font-bold text-foreground mb-1">
              <span className="text-primary">&gt;</span> NFT Minted!
            </h1>
            <p className="text-muted-foreground text-sm font-mono">You have already claimed your AI NFT</p>
          </div>

          {/* NFT Preview Card */}
          {nftImageUrl && (
            <Card className={`mb-6 overflow-hidden terminal-box transition-all duration-500 ${styles.fadeIn}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none"></div>
                <div className={styles.nftGlowTerminal}></div>
                <img
                  src={nftImageUrl || "/placeholder.svg"}
                  alt="Your AI NFT"
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  {getRarityIcon(rarity)}
                  <p className="text-xs font-semibold text-foreground font-mono">{RARITY_TIERS[rarity].name} NFT</p>
                </div>
                <p className="text-muted-foreground text-xs font-mono">Your unique AI-generated NFT from wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>
            </Card>
          )}

          {/* Wallet Connected */}
          <Card className="mb-6 p-4 terminal-box">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon size={16} className="text-primary" />
                <p className="text-foreground font-mono text-sm">Connected</p>
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                size="sm"
                className="font-mono text-xs"
              >
                Disconnect
              </Button>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 border border-border mt-3">
              <p className="text-muted-foreground text-xs font-mono mb-1">Wallet Address</p>
              <p className="text-foreground font-mono text-sm">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            </div>
          </Card>

          {/* Success Message */}
          <Card className="mb-6 p-4 terminal-box border-green-500/30">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 size={48} className="text-green-500 mb-2" />
              <p className="text-foreground font-semibold font-mono">NFT Successfully Minted!</p>
              <p className="text-muted-foreground text-sm font-mono mt-1">Check your wallet for your new NFT</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Step 1: Show Generate button (wallet connected, not yet generated)
  if (walletAddress && !isGenerated && !success) {
    return (
      <div className="min-h-screen bg-terminal-dark">
        <div className="max-w-md mx-auto">
          {/* Terminal Header */}
          <div className="text-center mb-6 mt-4">
            <div className="terminal-box p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">bash — generate</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-mono font-bold text-foreground mb-1">
              <span className="text-primary">&gt;</span> Reveal Your Luck
            </h1>
            <p className="text-muted-foreground text-sm font-mono">Generate your unique NFT based on kehokian!</p>
          </div>

          {/* Generate Card */}
          <Card className="mb-6 p-6 terminal-box">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-primary" />
              </div>
              <p className="text-foreground font-mono text-sm mb-2">Your Fortune Awaits</p>
              <p className="text-muted-foreground text-xs font-mono mb-4">
                Click below to reveal your NFT rarity based on your wallet's destiny
              </p>
              
              {/* Rarity Odds Preview */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4 w-full">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">💎</span>
                  <span className="text-gray-400">PLATINUM</span>
                  <span className="text-muted-foreground ml-auto">0.01%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">👑</span>
                  <span className="text-yellow-500">GOLD</span>
                  <span className="text-muted-foreground ml-auto">0.99%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-silver">⭐</span>
                  <span className="text-silver">SILVER</span>
                  <span className="text-muted-foreground ml-auto">4%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-500">🍀</span>
                  <span className="text-green-500">UNCOMMON</span>
                  <span className="text-muted-foreground ml-auto">15%</span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isWritingContract || isConfirming}
                className="w-full bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                size="lg"
              >
                {isGenerating || isWritingContract || isConfirming ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {isConfirming ? 'Confirming on blockchain...' : 'Minting your NFT...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Reveal My NFT!
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Wallet Info */}
          <Card className="mb-6 p-4 terminal-box">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon size={16} className="text-primary" />
                <p className="text-foreground font-mono text-sm">Connected</p>
              </div>
              <p className="text-muted-foreground text-xs font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Step 2: Generating animation
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-terminal-dark">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 mt-4">
            <div className="terminal-box p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">bash — fortune</span>
              </div>
            </div>
            <h1 className="text-2xl font-mono font-bold text-foreground mb-1">
              <span className="text-primary">&gt;</span> Calculating Your Destiny...
            </h1>
          </div>

          <Card className="mb-6 p-8 terminal-box">
            <div className="flex flex-col items-center justify-center py-8">
              <div className={styles.pixelLoaderTerminal}></div>
              <p className="text-foreground mt-6 font-mono font-medium">Reading the blockchain stars...</p>
              <div className="mt-6 font-mono text-xs text-muted-foreground space-y-2">
                <p className="animation-delay-100">&gt; Analyzing wallet pattern...</p>
                <p className="animation-delay-200">&gt; Consulting the hash oracles...</p>
                <p className="animation-delay-300">&gt; Determining your fate...</p>
                <p className="animation-delay-400">&gt; Finalizing rarity...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Step 3: Show generated NFT with fortune message, then Mint
  if (walletAddress && isGenerated && !success) {
    const currentRarity = revealedRarity || rarity
    const currentStyle = getRarityStyle(currentRarity)
    
    return (
      <div className="min-h-screen bg-terminal-dark">
        <div className="max-w-md mx-auto">
          {/* Terminal Header */}
          <div className="text-center mb-6 mt-4">
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
              <span className="text-primary">&gt;</span> Your Destiny Revealed!
            </h1>
          </div>

          {/* Fortune Message */}
          <Card className={`mb-4 p-4 terminal-box border-2 transition-all duration-500 ${styles.slideUp}`} style={{ borderColor: RARITY_TIERS[currentRarity].color }}>
            <div className="flex flex-col items-center text-center">
              <p className="text-foreground font-mono font-medium text-lg" style={{ color: RARITY_TIERS[currentRarity].color }}>
                {fortuneMessage}
              </p>
            </div>
          </Card>

          {/* NFT Preview Card */}
          <Card className={`mb-6 overflow-hidden terminal-box transition-all duration-500 ${styles.fadeIn}`} style={currentStyle}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none"></div>
              <div className={styles.nftGlowTerminal}></div>
              <img
                src={nftImageUrl || "/placeholder.svg"}
                alt="Your AI NFT"
                className="w-full h-auto"
              />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-center gap-3 mb-2">
                {getRarityIcon(currentRarity)}
                <Sparkles size={16} className="text-primary" />
                <p className="text-lg font-bold font-mono uppercase" style={{ color: RARITY_TIERS[currentRarity].color }}>
                  {RARITY_TIERS[currentRarity].name}
                </p>
                {getRarityIcon(currentRarity)}
              </div>
              <p className="text-center text-muted-foreground text-xs font-mono">
                Rarity Rate: {RARITY_TIERS[currentRarity].rate}%
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="mb-6 p-4 terminal-box">
            <div className="space-y-3">
              {/* Mint Button */}
              <Button
                onClick={handleMint}
                disabled={isWritingContract || isConfirming}
                className="w-full bg-primary hover:bg-primary/80 text-terminal-dark font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                size="lg"
              >
                {isWritingContract || isConfirming ? (
                  <span>
                    <Loader2 className="animate-spin" size={18} />
                    {isConfirming ? 'Confirming...' : 'Minting...'}
                  </span>
                ) : (
                  <span>
                    <Sparkles size={18} />
                    Mint NFT ({MINT_PRICE} ETH)
                  </span>
                )}
              </Button>

              {/* Disconnect */}
              <Button
                onClick={() => disconnect()}
                variant="ghost"
                className="w-full font-mono text-xs"
              >
                Disconnect Wallet
              </Button>
            </div>
          </Card>

          {/* Error Display */}
          {(error || writeError) && (
            <Card className="mb-6 p-4 terminal-box border-destructive/30">
              <div className="flex gap-2 items-start">
                <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-destructive text-sm font-mono text-left">{error || writeError?.message}</p>
                  <Button
                    onClick={resetAndRetry}
                    variant="outline"
                    size="sm"
                    className="mt-2 font-mono text-xs"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Transaction Progress */}
          {txHash && (
            <Card className="mb-6 p-4 terminal-box">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={20} />
                <div className="flex-1">
                  <p className="text-foreground font-mono text-sm">Transaction Pending</p>
                  <p className="text-muted-foreground text-xs font-mono">Confirming on Base network...</p>
                </div>
              </div>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs font-mono mt-2 hover:underline block"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
              </a>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Step 4: Success - Show minted NFT with full details
  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="max-w-md mx-auto">
        {/* Terminal Header */}
        <div className="text-center mb-6 mt-4">
          <div className="terminal-box p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">bash — minted</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-mono font-bold text-foreground mb-1">
            <span className="text-primary">&gt;</span> NFT Minted Successfully!
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Your unique NFT is now in your wallet</p>
        </div>

        {/* Minted NFT Display */}
        <Card className={`mb-6 overflow-hidden terminal-box transition-all duration-500 ${styles.fadeIn}`} style={getRarityStyle(rarity)}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none"></div>
            <div className={styles.nftGlowTerminal}></div>
            <img
              src={nftImageUrl || "/placeholder.svg"}
              alt="Your Minted NFT"
              className="w-full h-auto"
            />
            {/* Minted Badge */}
            <div className="absolute top-3 right-3 bg-green-500 text-terminal-dark px-3 py-1 rounded-full font-mono text-xs font-bold flex items-center gap-1">
              <CheckCircle2 size={14} />
              MINTED
            </div>
          </div>
          <div className="p-4 border-t border-border">
            {/* Rarity Header */}
            <div className="flex items-center justify-center gap-3 mb-3">
              {getRarityIcon(rarity)}
              <Sparkles size={16} className="text-primary" />
              <p className="text-xl font-bold font-mono uppercase" style={{ color: RARITY_TIERS[rarity].color }}>
                {RARITY_TIERS[rarity].name}
              </p>
              {getRarityIcon(rarity)}
            </div>
            
            {/* Fortune Message */}
            <div className="text-center mb-3 p-2 bg-secondary/30 rounded-lg">
              <p className="text-foreground font-mono text-sm" style={{ color: RARITY_TIERS[rarity].color }}>
                {fortuneMessage}
              </p>
            </div>
            
            {/* NFT Details */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rarity</span>
                <span className="text-foreground" style={{ color: RARITY_TIERS[rarity].color }}>{RARITY_TIERS[rarity].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-foreground">{RARITY_TIERS[rarity].rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className="text-foreground">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction Details */}
        {txHash && (
          <Card className="mb-6 p-4 terminal-box border-green-500/30">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={20} className="text-green-500" />
              <p className="text-foreground font-mono font-semibold">Transaction Confirmed!</p>
            </div>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs font-mono hover:underline flex items-center gap-1"
            >
              View on Basescan ↗
            </a>
          </Card>
        )}

        {/* Wallet Info */}
        <Card className="mb-6 p-4 terminal-box">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalIcon size={16} className="text-primary" />
              <p className="text-foreground font-mono text-sm">Connected</p>
            </div>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              Disconnect
            </Button>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 border border-border mt-3">
            <p className="text-muted-foreground text-xs font-mono mb-1">Wallet Address</p>
            <p className="text-foreground font-mono text-sm">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
          </div>
        </Card>

        {/* Celebration Message */}
        <Card className="mb-6 p-4 terminal-box border-primary/30">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-foreground font-semibold font-mono">Congratulations!</p>
            <p className="text-muted-foreground text-xs font-mono mt-1">
              Your {RARITY_TIERS[rarity].name} NFT has been added to your collection
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
