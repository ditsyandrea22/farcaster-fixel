'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { config } from '@/lib/wagmi'
import { NFT_ABI } from '@/lib/contractAbi'
import { getUserProfile, type UserProfile, getFidFromAddress, generateNftImageUrl } from '@/lib/neynar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, Loader2, CheckCircle2, Wallet, Sparkles } from 'lucide-react'
import styles from '@/styles/animations.module.css'

const NFT_CONTRACT_ADDRESS = '0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF'
const MINT_PRICE = '0.001' // ETH

export function MiniApp() {
  const [fid, setFid] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nftImageUrl, setNftImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [lookingUpFid, setLookingUpFid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, isPending } = useWriteContract()

  // Extract FID from URL or auto-lookup from wallet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlFid = params.get('fid')

    if (urlFid) {
      setFid(parseInt(urlFid, 10))
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
        setError('No Farcaster account found for this wallet')
      }
    } catch (err) {
      console.error('Error looking up FID:', err)
      setError('Failed to look up Farcaster account')
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

    try {
      writeContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [BigInt(fid)],
        value: parseEther(MINT_PRICE),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed')
    }
  }

  if (!fid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Card className="w-full max-w-md p-8 text-center border border-gray-200">
          {lookingUpFid ? (
            <>
              <div className={styles.pulseLoader}>
                <Loader2 className="mx-auto text-blue-600" size={40} />
              </div>
              <p className="text-gray-700 mt-6 font-medium">Looking up your Farcaster account...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </>
          ) : (
            <>
              <Sparkles className="mx-auto mb-4 text-gray-400" size={40} />
              <p className="text-gray-900 font-semibold text-lg">Connect Wallet</p>
              <p className="text-gray-600 text-sm mt-2">
                {isConnected 
                  ? 'No Farcaster account linked to this wallet'
                  : 'Connect your wallet to get started'}
              </p>
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
              <p className="text-gray-600 text-xs">Unique design generated from your Farcaster identity</p>
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
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2 font-medium"
                  size="lg"
                >
                  <Wallet size={18} />
                  {connector.name}
                </Button>
              ))}
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">NFT minted successfully!</p>
              </div>
            )}

            <Button
              onClick={handleMint}
              disabled={isPending || !isConnected || loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-6 text-base disabled:opacity-50 transition-all"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Minting...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Mint NFT
                </>
              )}
            </Button>

            <p className="text-center text-gray-500 text-xs mt-4">
              Sign transaction in your wallet to complete the mint
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
