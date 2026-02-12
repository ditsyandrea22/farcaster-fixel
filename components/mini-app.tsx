'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { parseEther } from 'viem'
import { base } from 'wagmi/chains'
import { usePublicClient } from 'wagmi'
import { NFT_ABI } from '@/lib/contractAbi'
import { useInitializeSdk, 
  useMiniAppDetection, 
  useUserContext, 
  useFarcasterWallet, 
  useChainCapabilities,
  formatAddress 
} from '@/lib/farcaster-sdk'
import useWallet from '@/hooks/useWallet'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, CheckCircle2, Wallet, Sparkles, RefreshCw, Globe, Shield, Terminal as TerminalIcon, ArrowLeft, Share2, Download, ExternalLink, Copy, Check, Star, Zap, Gift, Flame, Crown, Gem, Coins } from 'lucide-react'
import styles from '@/styles/animations.module.css'
import {
  RARITY_TIERS,
  type RarityTier,
  determineRarityFromAddress,
  getTierProperties,
  getFortuneMessage,
  getAttributes,
  generateSerialNumber,
} from '@/lib/rarity'
import Confetti from 'react-confetti'
import canvasConfetti from 'canvas-confetti'

// Constants
export const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0xBee2A3b777445E212886815A5384f6F4e8902d21'
export const MINT_PRICE = '0.0002' // 0.0002 ETH
const BASE_CHAIN_ID = base.id
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://farcaster-fixel.vercel.app'

// Rarity icons component
const RarityIcon = ({ tier, size = 24 }: { tier: RarityTier; size?: number }) => {
  const icons: Record<RarityTier, React.ReactNode> = {
    PLATINUM: <Gem size={size} className="text-purple-300" />,
    GOLD: <Crown size={size} className="text-yellow-400" />,
    SILVER: <Star size={size} className="text-gray-300" />,
    UNCOMMON: <Flame size={size} className="text-orange-400" />,
    COMMON: <Coins size={size} className="text-gray-400" />,
  }
  return icons[tier] || null
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
  const [seed, setSeed] = useState<number>(0)
  
  // New states for Generate → Mint flow
  const [isGenerated, setIsGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [fortuneMessage, setFortuneMessage] = useState<string>('')
  const [revealedRarity, setRevealedRarity] = useState<RarityTier | null>(null)
  
  // Share functionality state
  const [showCopiedToast, setShowCopiedToast] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Public client untuk polling manual jika useWaitForTransactionReceipt gagal
  const publicClient = usePublicClient()

  // Ref for NFT image
  const nftImageRef = useRef<HTMLImageElement>(null)

  // Get window size for confetti
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [])

  // Trigger confetti on success
  useEffect(() => {
    if (success && rarity) {
      setShowConfetti(true)
      // Trigger canvas confetti for more effects
      const duration = 3000
      const end = Date.now() + duration
      const colors = [RARITY_TIERS[rarity].color, '#22c55e', '#3b82f6', '#a855f7']
      
      const frame = () => {
        canvasConfetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        })
        canvasConfetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        })
        
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      
      frame()
      
      // Stop confetti after duration
      setTimeout(() => setShowConfetti(false), duration)
    }
  }, [success, rarity])

  // Wallet State using our custom hook with gas estimation
  const { 
    address: walletAddress, 
    isConnected, 
    chainId,
    writeContractWithGas,
    isWritingContract,
    writeError,
    gasEstimate,
    isEstimatingGas,
    gasEstimateError,
    connect,
    connectors,
    isConnecting,
    disconnect,
  } = useWallet()
  
  // Wait for transaction confirmation - gunakan polling manual sebagai fallback
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'error'>('idle')
  
  // Effect untuk polling transaction status secara manual
  useEffect(() => {
    if (!txHash || txStatus !== 'pending') return
    
    let intervalId: NodeJS.Timeout
    
    const checkTxStatus = async () => {
      try {
        if (!publicClient) {
          console.log('⏳ Public client not available, waiting...')
          return
        }
        const tx = await publicClient.getTransaction({ hash: txHash })
        if (tx.blockNumber) {
          // Transaction sudah dikonfirmasi
          setTxStatus('confirmed')
          setSuccess(true)
          setIsGenerating(false)
          
          // Mark wallet as minted
          if (walletAddress) {
            const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '{}')
            mintedWallets[walletAddress.toLowerCase()] = true
            localStorage.setItem('mintedWallets', JSON.stringify(mintedWallets))
            setHasMinted(true)
          }
          
          // Stop polling
          clearInterval(intervalId)
          
          // Show success message
          console.log('✅ Transaction confirmed:', txHash)
        }
      } catch (err) {
        // Transaction belum dikonfirmasi, terus polling
        console.log('⏳ Waiting for transaction confirmation...')
      }
    }
    
    // Check immediately
    checkTxStatus()
    
    // Then poll every 2 seconds
    intervalId = setInterval(checkTxStatus, 2000)
    
    // Timeout setelah 120 detik
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      if (txStatus === 'pending') {
        console.log('⚠️ Transaction confirmation timeout')
        setIsGenerating(false)
        setError('Transaction confirmation timed out. Please check Basescan for status.')
        setTxStatus('error')
      }
    }, 120000)
    
    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [txHash, txStatus, walletAddress, publicClient])
  
  // Reset txStatus saat txHash berubah
  useEffect(() => {
    if (txHash) {
      setTxStatus('pending')
      setIsGenerating(true)
      setError(null)
      setSuccess(false)
    }
  }, [txHash])
  
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

  // Handle transaction confirmation (fallback untuk errors)
  useEffect(() => {
    if (writeError) {
      setError(writeError.message || 'Transaction failed')
      setTxStatus('error')
      setIsGenerating(false)
    }
  }, [writeError])
  
  // Reset states saat retry
  const resetAndRetry = useCallback(() => {
    setError(null)
    setSuccess(false)
    setTxHash(null)
    setTxStatus('idle')
  }, [])

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
    setTxStatus('idle')

    try {
      const effectiveFid = getEffectiveFid()
      console.log('🔄 Starting mint transaction...')
      
      const hash = await writeContractWithGas({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        value: parseEther(MINT_PRICE),
      })
      
      if (hash) {
        console.log('✅ Transaction hash received:', hash)
        setTxHash(hash)
        setTxStatus('pending')
      }
    } catch (err) {
      console.error('❌ Mint failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Mint failed'
      
      // Handle specific error cases
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request') || errorMessage.includes('cancelled')) {
        setError('Transaction was cancelled. Click "Mint NFT" to try again.')
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient')) {
        setError('Insufficient funds. Please add ETH to your wallet.')
      } else if (errorMessage.includes('nonce')) {
        setError('Transaction nonce error. Please try again.')
      } else if (errorMessage.includes('already minted')) {
        setError('You have already minted an NFT with this wallet')
        setHasMinted(true)
      } else {
        setError(errorMessage)
      }
      
      setTxStatus('error')
      setIsGenerating(false)
    }
  }

  // Helper function to hash address for token ID
  function hashAddress(addr: string): bigint {
    let hash = BigInt(0)
    for (let i = 0; i < addr.length; i++) {
      const char = BigInt(addr.charCodeAt(i))
      hash = (hash << BigInt(5)) - hash + char
      hash = hash & hash
    }
    return (hash % BigInt(20000)) + BigInt(1)
  }

  // Get effective FID - use SDK FID or derive from wallet address
  const getEffectiveFid = (): number => {
    if (fid && fid > 0) {
      return fid
    }
    if (walletAddress) {
      return Number(hashAddress(walletAddress))
    }
    return 0
  }

  const getRarityStyle = (tier: RarityTier) => {
    const tierConfig = RARITY_TIERS[tier]
    const glowColors: Record<RarityTier, string> = {
      PLATINUM: '0 0 40px rgba(168, 85, 247, 0.5)',
      GOLD: '0 0 30px rgba(234, 179, 8, 0.5)',
      SILVER: '0 0 25px rgba(156, 163, 175, 0.5)',
      UNCOMMON: '0 0 20px rgba(251, 146, 60, 0.4)',
      COMMON: '0 0 15px rgba(156, 163, 175, 0.3)',
    }
    return {
      borderColor: tierConfig.color,
      boxShadow: glowColors[tier],
      background: `linear-gradient(135deg, ${tierConfig.color}15, transparent)`,
    }
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

  // Generate NFT based on luck (hoki) - then directly mint
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
    const walletRarity = determineRarityFromAddress(walletAddress)
    setRarity(walletRarity)
    setRevealedRarity(walletRarity)
    setFortuneMessage(getFortuneMessage(walletRarity))
    
    // Generate unique NFT image based on FID or wallet
    const imageUrl = fid ? `/api/nft-image?fid=${fid}` : `/api/nft-image?address=${walletAddress}`
    setNftImageUrl(imageUrl)

    // Now directly mint the NFT - writeContract triggers wallet approval
    try {
      console.log('🚀 Starting NFT mint...')
      console.log('Contract:', NFT_CONTRACT_ADDRESS)
      console.log('Value:', MINT_PRICE, 'ETH')
      console.log('Gas Estimate:', gasEstimate?.toString() || 'Estimating...')
      
      const hash = await writeContractWithGas({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        value: parseEther(MINT_PRICE),
      })
      
      console.log('✅ Transaction submitted:', hash)
      setTxHash(hash || null)
      // isGenerating stays true until isConfirmed or error
    } catch (err) {
      console.error('❌ Mint failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Mint failed - Please check your wallet'
      
      // Handle specific error cases
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request') || errorMessage.includes('cancelled')) {
        setError('Transaction was cancelled. Click "Reveal My NFT!" to try again.')
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient')) {
        setError('Insufficient funds. Please add ETH to your wallet.')
      } else if (errorMessage.includes('nonce')) {
        setError('Transaction nonce error. Please try again.')
      } else {
        setError(errorMessage)
      }
      
      setIsGenerating(false)
      setIsGenerated(true) // Show the NFT preview even if mint failed
    }
  }

  // Safety timeout to prevent infinite spinner
  useEffect(() => {
    // If we're pending but no confirmation after 120 seconds, show warning
    const timeoutId = setTimeout(() => {
      if (txStatus === 'pending' && !success) {
        console.log('⚠️ Long wait: Transaction still pending after timeout')
        setError('Transaction is taking longer than expected. Please check Basescan for status.')
      }
    }, 120000) // 120 seconds timeout

    return () => clearTimeout(timeoutId)
  }, [txStatus, success])

  // Reset and try your luck again
  const handleRegenerate = () => {
    setIsGenerated(false)
    setRevealedRarity(null)
    setFortuneMessage('')
    setSuccess(false)
    setTxHash(null)
  }

  // Get rarity tier badge color
  const getTierBadgeColor = (tier: RarityTier) => {
    const colors: Record<RarityTier, string> = {
      PLATINUM: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      GOLD: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SILVER: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
      UNCOMMON: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      COMMON: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return colors[tier]
  }

  // Show loading while SDK is initializing
  if (!sdkReady || isDetectingMiniApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
                <Sparkles size={40} className="text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20"></div>
            </div>
            <p className="text-white text-xl font-semibold mb-2">Loading...</p>
            <p className="text-gray-400 text-sm">Preparing your NFT experience</p>
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce animation-delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce animation-delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not connected state
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-4">
              {isInMiniApp ? (
                <>
                  <Shield size={16} className="text-green-400" />
                  <span className="text-sm text-gray-300">Running in Mini App</span>
                </>
              ) : (
                <>
                  <Globe size={16} className="text-blue-400" />
                  <span className="text-sm text-gray-300">Standalone Mode</span>
                </>
              )}
            </div>
            
            {/* Logo/Icon */}
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Gift size={36} className="text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">AI NFT Generator</h1>
            <p className="text-gray-400">Generate your unique NFT based on luck!</p>
          </div>

          {/* Rarity Preview Cards */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 mb-3 text-center">Rarity Distribution</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { tier: 'PLATINUM' as RarityTier, icon: '💎', rate: '0.01%' },
                { tier: 'GOLD' as RarityTier, icon: '👑', rate: '0.99%' },
                { tier: 'SILVER' as RarityTier, icon: '⭐', rate: '4%' },
                { tier: 'UNCOMMON' as RarityTier, icon: '🔥', rate: '15%' },
                { tier: 'COMMON' as RarityTier, icon: '⚫', rate: '80%' },
              ].map(({ tier, icon, rate }) => (
                <div key={tier} className={`p-2 rounded-xl bg-gradient-to-b ${getTierBadgeColor(tier)} border text-center`}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-300">{rate}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chain Support Warning */}
          {!isBaseSupported && (
            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex gap-3">
              <AlertCircle size={20} className="text-orange-400 flex-shrink-0" />
              <p className="text-orange-400 text-sm text-left">
                Base chain may not be fully supported in this mini app environment.
              </p>
            </div>
          )}

          {/* Connect Wallet Card */}
          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Wallet size={28} className="text-white" />
                </div>
                <p className="text-white font-semibold">Connect Your Wallet</p>
                <p className="text-gray-400 text-sm mt-1">Connect to generate your unique NFT</p>
              </div>

              <div className="space-y-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect(connector)}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-purple-500/25"
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

              <p className="text-center text-gray-500 text-xs">
                Make sure you have a wallet installed
              </p>
            </div>
          </Card>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              Minting on Base Network • {MINT_PRICE} ETH
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Already minted state
  if (hasMinted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              🎉 Already Minted!
            </h1>
            <p className="text-gray-400">Your AI NFT is ready</p>
          </div>

          {/* NFT Preview Card */}
          {nftImageUrl && (
            <Card className={`mb-6 overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 ${styles.fadeIn}`} style={getRarityStyle(rarity)}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
                <img
                  src={nftImageUrl || "/placeholder.svg"}
                  alt="Your AI NFT"
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RarityIcon tier={rarity} size={20} />
                  <p className="text-lg font-bold text-white">{RARITY_TIERS[rarity].name}</p>
                  <RarityIcon tier={rarity} size={20} />
                </div>
                <p className="text-gray-400 text-xs text-center">
                  Your unique AI-generated NFT
                </p>
              </div>
            </Card>
          )}

          {/* Success Card */}
          <Card className="mb-6 p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <p className="text-white font-semibold text-lg">Successfully Minted!</p>
              <p className="text-gray-400 text-sm mt-1">Check your wallet for your NFT</p>
            </div>
          </Card>

          {/* Wallet Info */}
          <Card className="mb-6 p-4 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                <p className="text-white font-medium">Connected</p>
              </div>
              <Button
                onClick={() => disconnect()}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Disconnect
              </Button>
            </div>
            <div className="mt-3 p-3 bg-black/20 rounded-lg">
              <p className="text-gray-400 text-xs">Wallet Address</p>
              <p className="text-white font-mono text-sm">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Step 1: Show Generate button (wallet connected, not yet generated)
  if (walletAddress && !isGenerated && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              ✨ Reveal Your Luck
            </h1>
            <p className="text-gray-400">Generate your unique NFT</p>
          </div>

          {/* Generate Card */}
          <Card className="mb-6 p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
                <Sparkles size={36} className="text-white" />
              </div>
              
              <p className="text-white font-semibold text-lg mb-2">Your Fortune Awaits</p>
              <p className="text-gray-400 text-sm mb-6">
                Click below to reveal your NFT rarity based on your wallet's destiny
              </p>

              {/* Rarity Odds Preview */}
              <div className="grid grid-cols-2 gap-3 text-sm w-full mb-6">
                {[
                  { tier: 'PLATINUM', icon: '💎', rate: '0.01%', color: 'text-purple-400' },
                  { tier: 'GOLD', icon: '👑', rate: '0.99%', color: 'text-yellow-400' },
                  { tier: 'SILVER', icon: '⭐', rate: '4%', color: 'text-gray-300' },
                  { tier: 'UNCOMMON', icon: '🔥', rate: '15%', color: 'text-orange-400' },
                ].map(({ tier, icon, rate, color }) => (
                  <div key={tier} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <span>{icon}</span>
                    <span className={`font-medium ${color}`}>{tier}</span>
                    <span className="text-gray-500 ml-auto text-xs">{rate}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isWritingContract || txStatus === 'pending'}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-purple-500/25"
                size="lg"
              >
                {isGenerating || isWritingContract || txStatus === 'pending' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {txStatus === 'pending' ? 'Confirming...' : 'Generating...'}
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
          <Card className="p-4 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                <p className="text-white">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Step 2: Generating animation
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              🔮 Reading Your Destiny...
            </h1>
          </div>

          <Card className="mb-6 p-8 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex flex-col items-center justify-center py-8">
              {/* Animated sparkle container */}
              <div className="relative w-32 h-32 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 to-purple-950 flex items-center justify-center">
                  <Sparkles size={40} className="text-purple-400 animate-spin" />
                </div>
              </div>
              
              <p className="text-white font-semibold mb-4">Calculating your fate...</p>
              
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <span>Analyzing wallet pattern...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse animation-delay-100"></div>
                  <span>Consulting the hash oracles...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse animation-delay-200"></div>
                  <span>Determining your rarity...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse animation-delay-300"></div>
                  <span>Finalizing your NFT...</span>
                </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-white mb-1">
              🌟 Your Destiny Revealed!
            </h1>
          </div>

          {/* Fortune Message */}
          <Card className={`mb-4 p-4 bg-gradient-to-r ${getTierBadgeColor(currentRarity)} border-2 transition-all duration-500`}>
            <div className="flex items-center justify-center gap-2 text-center">
              <Sparkles size={20} className="text-yellow-400" />
              <p className="text-white font-semibold" style={{ color: RARITY_TIERS[currentRarity].color }}>
                {fortuneMessage}
              </p>
              <Sparkles size={20} className="text-yellow-400" />
            </div>
          </Card>

          {/* NFT Preview Card */}
          <Card className={`mb-6 overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 ${styles.fadeIn}`} style={currentStyle}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
              <img
                src={nftImageUrl || "/placeholder.svg"}
                alt="Your AI NFT"
                className="w-full h-auto"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <RarityIcon tier={currentRarity} size={24} />
                <Sparkles size={16} className="text-purple-400" />
                <p className="text-xl font-bold uppercase" style={{ color: RARITY_TIERS[currentRarity].color }}>
                  {RARITY_TIERS[currentRarity].name}
                </p>
                <Sparkles size={16} className="text-purple-400" />
                <RarityIcon tier={currentRarity} size={24} />
              </div>
              <p className="text-center text-gray-400 text-xs">
                Rarity Rate: {RARITY_TIERS[currentRarity].rate}%
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="mb-6 p-4 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="space-y-3">
              {/* Mint Button */}
              <Button
                onClick={handleMint}
                disabled={isWritingContract || txStatus === 'pending'}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-green-500/25"
                size="lg"
              >
                {isWritingContract || txStatus === 'pending' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    {txStatus === 'pending' ? 'Confirming...' : 'Minting...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap size={18} />
                    Mint NFT ({MINT_PRICE} ETH)
                  </span>
                )}
              </Button>

              {/* Disconnect */}
              <Button
                onClick={() => disconnect()}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                Disconnect Wallet
              </Button>
            </div>
          </Card>

          {/* Error Display */}
          {(error || writeError) && (
            <Card className="mb-6 p-4 bg-red-500/10 border-red-500/30">
              <div className="flex gap-3 items-start">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm">{error || writeError?.message}</p>
                  <Button
                    onClick={resetAndRetry}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Transaction Progress */}
          {txHash && (
            <Card className="mb-6 p-4 bg-white/5 backdrop-blur-sm border-white/10">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-purple-400" size={20} />
                <div className="flex-1">
                  <p className="text-white font-medium">Transaction Pending</p>
                  <p className="text-gray-400 text-xs">Confirming on Base network...</p>
                </div>
              </div>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 text-sm mt-2 hover:underline flex items-center gap-1"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)} <ExternalLink size={12} />
              </a>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Step 4: Success - Show minted NFT with full details
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}
      
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/25">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            🎉 NFT Minted Successfully!
          </h1>
          <p className="text-gray-400">Your unique NFT is now in your wallet</p>
        </div>

        {/* Minted NFT Display */}
        <Card className={`mb-6 overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 ${styles.fadeIn}`} style={getRarityStyle(rarity)}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
            <img
              src={nftImageUrl || "/placeholder.svg"}
              alt="Your Minted NFT"
              className="w-full h-auto"
            />
            {/* Minted Badge */}
            <div className="absolute top-3 right-3 bg-green-500 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <CheckCircle2 size={14} className="text-white" />
              <span className="text-white font-semibold text-xs">MINTED</span>
            </div>
          </div>
          <div className="p-4">
            {/* Rarity Header */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <RarityIcon tier={rarity} size={24} />
              <Sparkles size={18} className="text-purple-400" />
              <p className="text-xl font-bold uppercase" style={{ color: RARITY_TIERS[rarity].color }}>
                {RARITY_TIERS[rarity].name}
              </p>
              <Sparkles size={18} className="text-purple-400" />
              <RarityIcon tier={rarity} size={24} />
            </div>
            
            {/* Fortune Message */}
            <div className="text-center mb-3 p-3 bg-white/5 rounded-xl">
              <p className="text-white font-semibold" style={{ color: RARITY_TIERS[rarity].color }}>
                {fortuneMessage}
              </p>
            </div>
            
            {/* NFT Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-400">Rarity</span>
                <span className="font-semibold" style={{ color: RARITY_TIERS[rarity].color }}>{RARITY_TIERS[rarity].name}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-400">Rate</span>
                <span className="text-white">{RARITY_TIERS[rarity].rate}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-400">Wallet</span>
                <span className="text-white font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction Details */}
        {txHash && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={20} className="text-green-400" />
              <p className="text-white font-semibold">Transaction Confirmed!</p>
            </div>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 text-sm hover:underline flex items-center gap-1"
            >
              View on Basescan <ExternalLink size={12} />
            </a>
          </Card>
        )}

        {/* Wallet Info */}
        <Card className="mb-6 p-4 bg-white/5 backdrop-blur-sm border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Connected</p>
                <p className="text-gray-400 text-xs">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
              </div>
            </div>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Disconnect
            </Button>
          </div>
        </Card>

        {/* Celebration Message */}
        <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-white font-semibold text-lg">Congratulations!</p>
            <p className="text-gray-400 text-sm mt-1">
              Your {RARITY_TIERS[rarity].name} NFT has been added to your collection
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
