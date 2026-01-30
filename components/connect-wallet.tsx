'use client'

import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Wallet, Loader2, AlertCircle } from 'lucide-react'
import { formatAddress } from '@/lib/farcaster-sdk'
import { cn } from '@/lib/utils'

interface ConnectWalletProps {
  showOnlyWhenConnected?: boolean
  className?: string
  onConnect?: () => void
}

export function ConnectWallet({ 
  showOnlyWhenConnected = false, 
  className,
  onConnect 
}: ConnectWalletProps) {
  const {
    address,
    isConnected,
    connectors,
    isConnecting,
    isConnectingFarcasterWallet,
    connectError,
    connect: connectWallet,
    connectToFarcasterWallet,
    disconnect,
    isWrongNetwork,
    switchToBase,
    isSwitchingChain,
    isFarcasterWalletConnected,
  } = useWallet()

  const isAnyConnecting = isConnecting || isConnectingFarcasterWallet

  // If showOnlyWhenConnected is true and not connected, return null
  if (showOnlyWhenConnected && !isConnected) {
    return null
  }

  // Connected state
  if (isConnected) {
    return (
      <Card className={cn("p-4 border border-gray-200 bg-white", className)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Connected</span>
            <div className="flex items-center gap-2">
              {isFarcasterWalletConnected && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  FarCast Wallet
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="font-mono text-sm text-gray-900 break-all">
              {address && formatAddress(address, 6)}
            </p>
          </div>

          {/* Wrong network warning */}
          {isWrongNetwork && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-700 text-sm font-medium">Wrong network</p>
                <Button
                  onClick={switchToBase}
                  disabled={isSwitchingChain}
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                >
                  {isSwitchingChain ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={14} />
                      Switching...
                    </>
                  ) : (
                    'Switch to Base'
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={() => disconnect()}
            variant="outline"
            className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      </Card>
    )
  }

  // Not connected state
  return (
    <Card className={cn("p-4 border border-gray-200 bg-white", className)}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-gray-600" />
          <span className="font-medium text-gray-900">Connect Wallet</span>
        </div>

        {/* Error display */}
        {connectError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">
              {connectError.message.includes('no matching chain')
                ? 'Please switch to Base network in your wallet'
                : connectError.message}
            </p>
          </div>
        )}

        {/* FarCast Wallet option (only in mini app context) */}
        {isFarcasterWalletConnected === false && typeof window !== 'undefined' && (() => {
          // Check if we're in a mini app context (Farcaster app)
          const isMiniApp = window.parent !== window || navigator.userAgent.includes('Farcaster');
          
          if (isMiniApp) {
            return (
              <Button
                onClick={async () => {
                  await connectToFarcasterWallet()
                  onConnect?.()
                }}
                disabled={isAnyConnecting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                size="lg"
              >
                {isConnectingFarcasterWallet ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet size={18} className="mr-2" />
                    Use FarCast Wallet
                  </>
                )}
              </Button>
            )
          }
          return null;
        })()}

        {/* External wallet options */}
        <div className="space-y-2">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              onClick={() => {
                connectWallet(connector)
                onConnect?.()
              }}
              disabled={isConnecting}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 font-medium"
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
  )
}

export default ConnectWallet
