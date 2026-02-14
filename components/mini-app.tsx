'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { parseEther } from 'viem'
import { base } from 'wagmi/chains'
import { usePublicClient } from 'wagmi'
import { NFT_ABI } from '@/lib/contractAbi'
import { useInitializeSdk, useMiniAppDetection, useUserContext, useChainCapabilities } from '@/lib/farcaster-sdk'
import { sdk } from '@farcaster/miniapp-sdk'
import useWallet from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle, Loader2, CheckCircle2, Wallet, Sparkles, RefreshCw, Globe, Shield, Terminal as TerminalIcon, ArrowLeft, Zap, Terminal } from 'lucide-react'
import styles from '@/styles/animations.module.css'
import { RARITY_TIERS, type RarityTier, determineRarity, determineRarityFromAddress, getTierProperties, getFortuneMessage, generateSerialNumber, generateRandomSeed, hashAddress } from '@/lib/rarity'
import Confetti from 'react-confetti'
import canvasConfetti from 'canvas-confetti'
import { TwitterShare } from '@/components/twitter-share'

export const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0xBee2A3b777445E212886815A5384f6F4e8902d21'
export const MINT_PRICE = '0.0002'
const BASE_CHAIN_ID = base.id

const THEME = {
  bg: '#1a1a2e',
  bgSecondary: '#16213e',
  bgTertiary: '#0f0f23',
  accent: '#e95420',
  success: '#0e8420',
  error: '#c7162b',
  border: '#333333',
}

function BackButton() {
  const handleBack = () => {
    try {
      if (sdk && typeof sdk.actions.close === 'function') {
        sdk.actions.close()
      } else {
        window.history.back()
      }
    } catch {
      window.history.back()
    }
  }
  return (
    <button onClick={handleBack} className="flex items-center gap-2 px-3 py-1.5 bg-transparent border rounded font-mono text-sm transition-colors" style={{ borderColor: '#e95420', color: '#e95420' }}>
      <ArrowLeft size={14} />
      <span>cd ..</span>
    </button>
  )
}

function TerminalHeader({ title, isInMiniApp }: { title: string; isInMiniApp: boolean }) {
  return (
    <div className="sticky top-0 z-50 border-b-2" style={{ backgroundColor: THEME.bgSecondary, borderColor: '#e95420' }}>
      <div className="max-w-md mx-auto px-4 h-10 flex items-center justify-between" style={{ backgroundColor: THEME.bgTertiary }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e95420' }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f0c674' }}></div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0e8420' }}></div>
          </div>
          <span className="font-mono text-xs" style={{ color: '#999999' }}>bash — {title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-transparent border rounded font-mono text-xs transition-colors" style={{ borderColor: '#e95420', color: '#e95420' }}>
              <ArrowLeft size={12} />
              <span>cd ..</span>
            </button>
          </Link>
          {isInMiniApp ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: '#0e8420', color: '#ffffff' }}>
              <Shield size={10} /> Mini App
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: THEME.bg, color: '#999999' }}>
              <Globe size={10} /> Standalone
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TerminalWindow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 rounded-lg overflow-hidden ${className}`} style={{ backgroundColor: THEME.bgSecondary, borderColor: '#333333' }}>
      <div className="px-4 py-2 border-b-2 flex items-center gap-2" style={{ backgroundColor: THEME.bgTertiary, borderColor: '#333333' }}>
        <Terminal size={14} style={{ color: '#e95420' }} />
        <span className="font-mono text-xs" style={{ color: '#999999' }}>user@farcaster-fixel:~$</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const RarityIcon = ({ tier, size = 24 }: { tier: RarityTier; size?: number }) => {
  const icons: Record<RarityTier, React.ReactNode> = {
    PLATINUM: <span style={{ color: '#a855f7' }}>💎</span>,
    GOLD: <span style={{ color: '#fbbf24' }}>👑</span>,
    SILVER: <span style={{ color: '#94a3b8' }}>⭐</span>,
    UNCOMMON: <span style={{ color: '#f97316' }}>🔥</span>,
    COMMON: <span style={{ color: '#6b7280' }}>⚫</span>,
  }
  return icons[tier] || null
}

function getTierBadgeStyle(tier: RarityTier) {
  const styles: Record<RarityTier, { bg: string; border: string; text: string }> = {
    PLATINUM: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)', text: '#a855f7' },
    GOLD: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.5)', text: '#fbbf24' },
    SILVER: { bg: 'rgba(148, 163, 184, 0.2)', border: 'rgba(148, 163, 184, 0.5)', text: '#94a3b8' },
    UNCOMMON: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.5)', text: '#f97316' },
    COMMON: { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.5)', text: '#6b7280' },
  }
  return styles[tier]
}

export function MiniApp() {
  const { isReady: sdkReady, error: sdkError } = useInitializeSdk()
  const { isInMiniApp } = useMiniAppDetection()
  const { context: userContext } = useUserContext()
  const { capabilities } = useChainCapabilities()
  
  const [fid, setFid] = useState<number | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [rarity, setRarity] = useState<RarityTier>('COMMON')
  const [nftImageUrl, setNftImageUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [hasMinted, setHasMinted] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [fortuneMessage, setFortuneMessage] = useState<string>('')
  const [revealedRarity, setRevealedRarity] = useState<RarityTier | null>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  
  const publicClient = usePublicClient()

  const { address: walletAddress, chainId, writeContractWithGas, isWritingContract, writeError, connect, connectors, isConnecting, disconnect } = useWallet()
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'error'>('idle')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [])

  useEffect(() => {
    if (success && rarity) {
      setShowConfetti(true)
      const duration = 3000
      const end = Date.now() + duration
      const colors = [RARITY_TIERS[rarity].color, '#0e8420', '#3b82f6', '#772953']
      const frame = () => {
        canvasConfetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors })
        canvasConfetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      setTimeout(() => setShowConfetti(false), duration)
    }
  }, [success, rarity])

  useEffect(() => {
    if (!txHash || txStatus !== 'pending') return
    let intervalId: NodeJS.Timeout
    const checkTxStatus = async () => {
      try {
        if (!publicClient) return
        const tx = await publicClient.getTransaction({ hash: txHash })
        if (tx.blockNumber) {
          setTxStatus('confirmed')
          setSuccess(true)
          setIsGenerating(false)
          if (walletAddress) {
            const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '{}')
            mintedWallets[walletAddress.toLowerCase()] = true
            localStorage.setItem('mintedWallets', JSON.stringify(mintedWallets))
            setHasMinted(true)
          }
          clearInterval(intervalId)
        }
      } catch (err) { console.log('Waiting for transaction...') }
    }
    checkTxStatus()
    intervalId = setInterval(checkTxStatus, 2000)
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      if (txStatus === 'pending') {
        setIsGenerating(false)
        setError('Transaction confirmation timed out. Please check Basescan for status.')
        setTxStatus('error')
      }
    }, 120000)
    return () => { clearInterval(intervalId); clearTimeout(timeoutId) }
  }, [txHash, txStatus, walletAddress, publicClient])

  useEffect(() => {
    if (txHash) {
      setTxStatus('pending')
      setIsGenerating(true)
      setError(null)
      setSuccess(false)
    }
  }, [txHash])

  const isBaseSupported = capabilities?.supportedChains?.some?.((chain: { id: number }) => chain.id === BASE_CHAIN_ID) ?? true

  useEffect(() => {
    if (userContext?.fid) { setFid(userContext.fid) }
    if (walletAddress) {
      const mintedWallets = JSON.parse(localStorage.getItem('mintedWallets') || '{}')
      if (mintedWallets[walletAddress.toLowerCase()]) { setHasMinted(true) }
      setAddress(walletAddress)
    }
  }, [userContext, walletAddress])

  useEffect(() => {
    if (walletAddress) { setAddress(walletAddress) }
  }, [walletAddress])

  useEffect(() => {
    if (writeError) {
      setError(writeError.message || 'Transaction failed')
      setTxStatus('error')
      setIsGenerating(false)
    }
  }, [writeError])

  const resetAndRetry = useCallback(() => {
    setError(null)
    setSuccess(false)
    setTxHash(null)
    setTxStatus('idle')
  }, [])

  const getEffectiveFid = (): number => {
    if (fid && fid > 0) return fid
    if (walletAddress) {
      const hashed = hashAddress(walletAddress)
      return hashed !== null ? hashed : 0
    }
    return 0
  }

  const getRarityStyle = (tier: RarityTier) => ({
    borderColor: RARITY_TIERS[tier].color,
    boxShadow: `0 0 20px ${RARITY_TIERS[tier].color}40`,
    background: `linear-gradient(135deg, ${RARITY_TIERS[tier].color}10, transparent)`,
  })

  // Use imported getFortuneMessage from lib/rarity.ts

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setSuccess(false)
    setTxHash(null)
    setIsGenerated(false)
    if (!walletAddress) { setError('Wallet not connected'); setIsGenerating(false); return }
    if (hasMinted) { setError('You have already minted an NFT with this wallet'); setIsGenerating(false); return }
    
    // Use truly random seed for fair distribution on each mint
    const randomSeed = generateRandomSeed()
    const walletRarity = determineRarity(randomSeed)
    
    setRarity(walletRarity)
    setRevealedRarity(walletRarity)
    setFortuneMessage(getFortuneMessage(walletRarity))
    const imageUrl = `/api/nft-image?random=true&seed=${randomSeed}`
    setNftImageUrl(imageUrl)
    try {
      const hash = await writeContractWithGas({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        value: parseEther(MINT_PRICE),
      })
      setTxHash(hash || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mint failed'
      if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
        setError('Transaction was cancelled.')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds. Please add ETH to your wallet.')
      } else if (errorMessage.includes('already minted')) {
        setError('You have already minted an NFT with this wallet')
        setHasMinted(true)
      } else {
        setError(errorMessage)
      }
      setIsGenerating(false)
      setIsGenerated(true)
    }
  }

  if (!sdkReady) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <TerminalHeader title="initializing" isInMiniApp={isInMiniApp} />
        <div className="flex items-center justify-center min-h-[calc(100vh-40px)] p-4">
          <TerminalWindow>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full border-4 border-dashed animate-spin mb-6" style={{ borderColor: '#e95420' }}></div>
              <p className="text-white font-mono font-medium mb-2">Initializing...</p>
              <p className="text-gray-500 font-mono text-sm">Setting up AI NFT Generator</p>
              <div className="mt-6 font-mono text-sm space-y-2" style={{ color: '#e95420' }}>
                <p> Loading SDK modules...</p>
                <p className="animation-delay-100"> Establishing connection...</p>
                <p className="animation-delay-200"> Preparing environment...</p>
              </div>
              {!isInMiniApp && (
                <div className="mt-6">
                  <BackButton />
                </div>
              )}
            </div>
          </TerminalWindow>
        </div>
      </div>
    )
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <TerminalHeader title="connect" isInMiniApp={isInMiniApp} />
        <div className="flex items-center justify-center min-h-[calc(100vh-40px)] p-4">
          <TerminalWindow>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(233, 84, 32, 0.2)' }}>
                <Wallet size={32} style={{ color: '#e95420' }} />
              </div>
              <p className="text-white font-mono font-semibold text-lg mb-2">Connect Wallet</p>
              <p className="text-gray-500 font-mono text-sm mb-6">Connect your wallet to generate your unique AI NFT</p>
              <div className="w-full p-3 rounded-lg mb-4 border" style={{ backgroundColor: THEME.bgTertiary, borderColor: '#333333' }}>
                <p className="text-gray-500 font-mono text-xs mb-2 text-left"> Rarity Distribution:</p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                  <span className="text-purple-400">PLATINUM: 0.01%</span>
                  <span className="text-yellow-400">GOLD: 0.99%</span>
                  <span className="text-gray-400">SILVER: 4%</span>
                  <span className="text-orange-400">UNCOMMON: 15%</span>
                  <span className="text-gray-600 col-span-2">COMMON: 80%</span>
                </div>
              </div>
              {!isBaseSupported && (
                <div className="w-full p-3 rounded-lg mb-4 border flex gap-2" style={{ backgroundColor: 'rgba(199, 22, 43, 0.1)', borderColor: '#c7162b' }}>
                  <AlertCircle size={18} style={{ color: '#c7162b' }} />
                  <p className="text-red-400 font-mono text-sm text-left text-xs">Base chain may not be fully supported in this mini app environment.</p>
                </div>
              )}
              <div className="w-full space-y-2">
                {connectors.map((connector) => (
                  <Button key={connector.uid} onClick={() => connect(connector)} disabled={isConnecting} className="w-full font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300" style={{ backgroundColor: '#e95420', color: '#ffffff', border: '2px solid #e95420' }} size="lg">
                    {isConnecting && connectors.some(c => c.uid === connector.uid) ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
                    {connector.name}
                  </Button>
                ))}
                <p className="text-center text-gray-600 font-mono text-xs mt-4"> Make sure you have a wallet installed</p>
              </div>
              {!isInMiniApp && (
                <div className="mt-4">
                  <BackButton />
                </div>
              )}
            </div>
          </TerminalWindow>
        </div>
      </div>
    )
  }

  if (hasMinted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <TerminalHeader title="minted" isInMiniApp={isInMiniApp} />
        <div className="max-w-md mx-auto p-4">
          <TerminalWindow className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: '#333333' }}>
                <CheckCircle2 size={16} style={{ color: '#0e8420' }} />
                <span className="font-mono text-sm text-white">NFT Minted Successfully!</span>
              </div>
              {!isInMiniApp && <BackButton />}
            </div>
            <h1 className="text-xl font-mono font-bold text-white mb-1 mt-3"><span style={{ color: '#e95420' }}></span> NFT Minted!</h1>
            <p className="text-gray-500 font-mono text-sm">You have already claimed your AI NFT</p>
          </TerminalWindow>
          {nftImageUrl && (
            <TerminalWindow className="mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>
                <img src={nftImageUrl && nftImageUrl.trim() ? nftImageUrl : "/placeholder.svg"} alt="Your AI NFT" className="w-full h-auto" />
              </div>
              <div className="pt-3 border-t" style={{ borderColor: '#333333' }}>
                <div className="flex items-center gap-2 mb-2">
                  <RarityIcon tier={rarity} size={18} />
                  <p className="font-mono font-semibold text-white">{RARITY_TIERS[rarity].name} NFT</p>
                </div>
                <p className="text-gray-500 font-mono text-xs">Your unique AI-generated NFT from wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>
            </TerminalWindow>
          )}
          <TerminalWindow className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} style={{ color: '#e95420' }} />
                <p className="font-mono text-sm text-white">Connected</p>
              </div>
              <Button onClick={() => disconnect()} variant="outline" size="sm" className="font-mono text-xs border-gray-600 text-gray-400 hover:bg-gray-800">Disconnect</Button>
            </div>
            <div className="mt-2 p-2 rounded" style={{ backgroundColor: THEME.bgTertiary }}>
              <p className="text-gray-500 font-mono text-xs">Wallet Address</p>
              <p className="font-mono text-sm text-white">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            </div>
          </TerminalWindow>
          <TerminalWindow className="border-green-500/30">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 size={48} style={{ color: '#0e8420' }} />
              <p className="font-mono font-semibold text-white mt-2">NFT Successfully Minted!</p>
              <p className="text-gray-500 font-mono text-sm mt-1">Check your wallet for your new NFT</p>
            </div>
          </TerminalWindow>
          {/* Twitter Share for Rare Mints */}
          {(rarity === 'GOLD' || rarity === 'PLATINUM' || rarity === 'SILVER') && (
            <TerminalWindow className="mb-4">
              <TwitterShare rarity={rarity} address={address || undefined} />
            </TerminalWindow>
          )}
        </div>
      </div>
    )
  }

  if (walletAddress && !isGenerated && !success) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <TerminalHeader title="generate" isInMiniApp={isInMiniApp} />
        <div className="max-w-md mx-auto p-4">
          <TerminalWindow className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: '#f0c674' }} />
                <span className="font-mono text-sm text-white">Your Fortune Awaits</span>
              </div>
              {!isInMiniApp && <BackButton />}
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-pulse" style={{ backgroundColor: 'rgba(233, 84, 32, 0.2)' }}>
                <Sparkles size={32} style={{ color: '#e95420' }} />
              </div>
              <p className="font-mono text-sm text-white mb-2">Your Fortune Awaits</p>
              <p className="text-gray-500 font-mono text-xs mb-4">Click below to reveal your NFT rarity - truly random on each mint!</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs w-full mb-4">
                <div className="flex items-center gap-1 p-2 rounded" style={{ backgroundColor: THEME.bgTertiary }}><span className="text-purple-400">💎</span><span className="text-purple-400">PLATINUM</span><span className="text-gray-600 ml-auto">0.01%</span></div>
                <div className="flex items-center gap-1 p-2 rounded" style={{ backgroundColor: THEME.bgTertiary }}><span className="text-yellow-400">👑</span><span className="text-yellow-400">GOLD</span><span className="text-gray-600 ml-auto">0.99%</span></div>
                <div className="flex items-center gap-1 p-2 rounded" style={{ backgroundColor: THEME.bgTertiary }}><span className="text-gray-400">⭐</span><span className="text-gray-400">SILVER</span><span className="text-gray-600 ml-auto">4%</span></div>
                <div className="flex items-center gap-1 p-2 rounded" style={{ backgroundColor: THEME.bgTertiary }}><span className="text-orange-400">🔥</span><span className="text-orange-400">UNCOMMON</span><span className="text-gray-600 ml-auto">15%</span></div>
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating || isWritingContract || txStatus === 'pending'} className="w-full font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300" style={{ backgroundColor: '#e95420', color: '#ffffff', border: '2px solid #e95420' }} size="lg">
                {isGenerating || isWritingContract || txStatus === 'pending' ? <><Loader2 className="animate-spin" size={18} />{txStatus === 'pending' ? 'Confirming on blockchain...' : 'Minting your NFT...'}</> : <><Sparkles size={18} />Reveal My NFT!</>}
              </Button>
            </div>
          </TerminalWindow>
          <TerminalWindow>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Terminal size={16} style={{ color: '#e95420' }} /><p className="font-mono text-sm text-white">Connected</p></div>
              <p className="font-mono text-xs text-gray-500">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            </div>
          </TerminalWindow>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <TerminalHeader title="fortune" isInMiniApp={isInMiniApp} />
        <div className="max-w-md mx-auto p-4">
          <TerminalWindow>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full border-4 border-dashed animate-spin mb-6" style={{ borderColor: '#e95420' }}></div>
              <p className="text-white font-mono font-medium mb-2">Reading the blockchain stars...</p>
              <div className="font-mono text-xs text-gray-500 space-y-2">
                <p> Analyzing wallet pattern...</p>
                <p className="animation-delay-100"> Consulting the hash oracles...</p>
                <p className="animation-delay-200"> Determining your fate...</p>
                <p className="animation-delay-300"> Finalizing rarity...</p>
              </div>
              {!isInMiniApp && (
                <div className="mt-6">
                  <BackButton />
                </div>
              )}
            </div>
          </TerminalWindow>
        </div>
      </div>
    )
  }

  if (walletAddress && isGenerated && !success) {
    const currentRarity = revealedRarity || rarity
    const currentStyle = getRarityStyle(currentRarity)
    const tierStyle = getTierBadgeStyle(currentRarity)
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
        <TerminalHeader title="mint" isInMiniApp={isInMiniApp} />
        <div className="max-w-md mx-auto p-4">
          <TerminalWindow className="mb-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: '#333333' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: '#f0c674' }} />
                <span className="font-mono text-sm text-white">Your Destiny Revealed!</span>
              </div>
              {!isInMiniApp && <BackButton />}
            </div>
            <h1 className="text-xl font-mono font-bold text-white mb-4 text-center"><span style={{ color: '#e95420' }}></span> Your Destiny Revealed!</h1>
            <div className="p-3 rounded-lg border mb-4 text-center" style={{ backgroundColor: tierStyle.bg, borderColor: tierStyle.border }}>
              <p className="font-mono font-medium" style={{ color: tierStyle.text }}>{fortuneMessage}</p>
            </div>
            <div className="overflow-hidden rounded-lg mb-4 transition-all duration-500" style={currentStyle}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>
                <img src={nftImageUrl && nftImageUrl.trim() ? nftImageUrl : "/placeholder.svg"} alt="Your AI NFT" className="w-full h-auto" />
              </div>
              <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RarityIcon tier={currentRarity} size={20} />
                  <Sparkles size={16} style={{ color: '#e95420' }} />
                  <p className="font-mono font-bold uppercase" style={{ color: RARITY_TIERS[currentRarity].color }}>{RARITY_TIERS[currentRarity].name}</p>
                  <Sparkles size={16} style={{ color: '#e95420' }} />
                  <RarityIcon tier={currentRarity} size={20} />
                </div>
                <p className="text-center text-gray-500 font-mono text-xs">Rarity Rate: {RARITY_TIERS[currentRarity].rate}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => {}} disabled className="w-full font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300" style={{ backgroundColor: '#0e8420', color: '#ffffff', border: '2px solid #0e8420' }} size="lg">
                {txStatus === 'pending' ? <><Loader2 className="animate-spin" size={18} />Confirming...</> : <><Zap size={18} />Mint NFT ({MINT_PRICE} ETH)</>}
              </Button>
              <Button onClick={() => disconnect()} variant="ghost" className="w-full font-mono text-xs text-gray-500 hover:text-white hover:bg-gray-800">Disconnect Wallet</Button>
            </div>
          </TerminalWindow>
          {(error || writeError) && (
            <TerminalWindow className="mb-4 border-red-500/30">
              <div className="flex gap-2 items-start">
                <AlertCircle size={18} style={{ color: '#c7162b' }} />
                <div className="flex-1">
                  <p className="font-mono text-sm text-red-400 text-left">{error || writeError?.message}</p>
                  <Button onClick={resetAndRetry} variant="outline" size="sm" className="mt-2 font-mono text-xs border-gray-600 text-gray-400 hover:bg-gray-800"><RefreshCw size={12} className="mr-1" />Retry</Button>
                </div>
              </div>
            </TerminalWindow>
          )}
          {txHash && (
            <TerminalWindow className="mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" style={{ color: '#e95420' }} size={20} />
                <div className="flex-1">
                  <p className="font-mono text-sm text-white">Transaction Pending</p>
                  <p className="text-gray-500 font-mono text-xs">Confirming on Base network...</p>
                </div>
              </div>
              <a 
                href={txHash ? `https://basescan.org/tx/${txHash}` : '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-xs mt-2 hover:underline block" 
                style={{ 
                  color: '#e95420',
                  pointerEvents: txHash ? 'auto' : 'none',
                  opacity: txHash ? 1 : 0.5 
                }}
              >
                {txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : 'Pending...'} ↗
              </a>
            </TerminalWindow>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}
      <TerminalHeader title="minted" isInMiniApp={isInMiniApp} />
      <div className="max-w-md mx-auto p-4">
        <TerminalWindow className="mb-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: '#333333' }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: '#0e8420' }} />
              <span className="font-mono text-sm text-white">NFT Minted Successfully!</span>
            </div>
            {!isInMiniApp && <BackButton />}
          </div>
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full" style={{ backgroundColor: 'rgba(14, 132, 32, 0.2)' }}>
              <CheckCircle2 size={32} style={{ color: '#0e8420' }} />
            </div>
            <h1 className="text-xl font-mono font-bold text-white mb-1"><span style={{ color: '#e95420' }}></span> NFT Minted Successfully!</h1>
            <p className="text-gray-500 font-mono text-sm">Your unique NFT is now in your wallet</p>
          </div>
          <div className="overflow-hidden rounded-lg mb-4 transition-all duration-500" style={getRarityStyle(rarity)}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>
              <img src={nftImageUrl && nftImageUrl.trim() ? nftImageUrl : "/placeholder.svg"} alt="Your Minted NFT" className="w-full h-auto" />
              <div className="absolute top-2 right-2 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg" style={{ backgroundColor: '#0e8420' }}>
                <CheckCircle2 size={14} className="text-white" />
                <span className="font-mono text-xs font-bold text-white">MINTED</span>
              </div>
            </div>
            <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <RarityIcon tier={rarity} size={20} />
                <Sparkles size={16} style={{ color: '#e95420' }} />
                <p className="font-mono font-bold uppercase" style={{ color: RARITY_TIERS[rarity].color }}>{RARITY_TIERS[rarity].name}</p>
                <Sparkles size={16} style={{ color: '#e95420' }} />
                <RarityIcon tier={rarity} size={20} />
              </div>
              <div className="p-2 rounded mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <p className="font-mono font-medium text-center" style={{ color: RARITY_TIERS[rarity].color }}>{fortuneMessage}</p>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Rarity</span><span style={{ color: RARITY_TIERS[rarity].color }}>{RARITY_TIERS[rarity].name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="text-white">{RARITY_TIERS[rarity].rate}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Wallet</span><span className="text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
              </div>
            </div>
          </div>
        </TerminalWindow>
        {txHash && (
          <TerminalWindow className="mb-4 border-green-500/30">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={20} style={{ color: '#0e8420' }} />
              <p className="font-mono font-semibold text-white">Transaction Confirmed!</p>
            </div>
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:underline flex items-center gap-1" style={{ color: '#e95420' }}>View on Basescan ↗</a>
          </TerminalWindow>
        )}
        <TerminalWindow className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Terminal size={16} style={{ color: '#e95420' }} /><p className="font-mono text-sm text-white">Connected</p></div>
            <Button onClick={() => disconnect()} variant="outline" size="sm" className="font-mono text-xs border-gray-600 text-gray-400 hover:bg-gray-800">Disconnect</Button>
          </div>
          <div className="mt-2 p-2 rounded" style={{ backgroundColor: THEME.bgTertiary }}>
            <p className="text-gray-500 font-mono text-xs">Wallet Address</p>
            <p className="font-mono text-sm text-white">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
          </div>
        </TerminalWindow>
        <TerminalWindow className="border-purple-500/30">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-mono font-semibold text-white">Congratulations!</p>
            <p className="text-gray-500 font-mono text-xs mt-1">Your {RARITY_TIERS[rarity].name} NFT has been added to your collection</p>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}
