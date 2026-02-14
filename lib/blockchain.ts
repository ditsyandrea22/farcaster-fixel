/**
 * Blockchain Utilities - Read real data from Base Mainnet
 * 
 * Uses Alchemy SDK or direct RPC calls for reliable blockchain queries
 * With proper error handling for proxy contracts
 */

import { CONTRACT_ADDRESS, MAX_SUPPLY } from './contractAbi'

// Alchemy API Key
const ALCHEMY_API_KEY = process.env.NEXT_ALCHEMY_API_KEY
const BASE_URL = ALCHEMY_API_KEY 
  ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : null

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make JSON-RPC call to Base mainnet
 */
async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  if (!BASE_URL) {
    throw new Error('Alchemy API key not configured')
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  })

  const result = await response.json()
  if (result.error) {
    throw new Error(result.error.message)
  }
  return result.result
}

// ============================================================================
// Contract Read Functions with Fallbacks
// ============================================================================

/**
 * ERC721 balanceOf
 */
export async function getBalance(address: string): Promise<number> {
  try {
    const result = await rpcCall('eth_call', [
      {
        to: CONTRACT_ADDRESS,
        data: `0x6352211e${address.slice(2).padStart(64, '0')}`
      },
      'latest'
    ])
    return parseInt(result as string, 16)
  } catch (error) {
    console.error('Error getting balance:', error)
    return 0
  }
}

/**
 * ERC721 ownerOf (tokenId)
 */
export async function getOwnerOf(tokenId: number): Promise<string> {
  try {
    const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0')
    const result = await rpcCall('eth_call', [
      {
        to: CONTRACT_ADDRESS,
        data: `0x6352211e${tokenIdHex}`
      },
      'latest'
    ])
    const addressBytes = (result as string).slice(-40)
    return `0x${addressBytes}`
  } catch (error) {
    console.error('Error getting owner:', error)
    return '0x0000000000000000000000000000000000000000'
  }
}

/**
 * Get multiple token owners in batch (optimized)
 */
export async function getTokenOwners(tokenIds: number[]): Promise<Map<number, string>> {
  const owners = new Map<number, string>()
  
  if (!BASE_URL) {
    return owners
  }

  try {
    const calls = tokenIds.map(tokenId => {
      const tokenIdHex = BigInt(tokenId).toString(16).padStart(64, '0')
      return {
        jsonrpc: '2.0',
        id: tokenId,
        method: 'eth_call',
        params: [
          {
            to: CONTRACT_ADDRESS,
            data: `0x6352211e${tokenIdHex}`
          },
          'latest'
        ]
      }
    })

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calls),
    })

    const results = await response.json()
    
    results.forEach((result: { result?: string }, index: number) => {
      if (result.result) {
        const addressBytes = result.result.slice(-40)
        owners.set(tokenIds[index], `0x${addressBytes}`)
      }
    })
  } catch (error) {
    console.error('Error getting token owners:', error)
  }

  return owners
}

/**
 * Get total supply - with fallback for contracts without this function
 */
export async function getTotalSupply(): Promise<number> {
  // Default fallback value
  const DEFAULT_SUPPLY = 0
  
  if (!BASE_URL) {
    return DEFAULT_SUPPLY
  }
  
  try {
    const result = await rpcCall('eth_call', [
      {
        to: CONTRACT_ADDRESS,
        data: '0x18160ddd' // totalSupply()
      },
      'latest'
    ])
    return parseInt(result as string, 16)
  } catch (error) {
    console.log('TotalSupply not available, using fallback')
    return DEFAULT_SUPPLY
  }
}

/**
 * Get mint price - with fallback
 */
export async function getMintPrice(): Promise<string> {
  // Default mint price
  const DEFAULT_PRICE = '0.001'
  
  if (!BASE_URL) {
    return DEFAULT_PRICE
  }
  
  try {
    const result = await rpcCall('eth_call', [
      {
        to: CONTRACT_ADDRESS,
        data: '0x01879be5' // mintPrice()
      },
      'latest'
    ])
    const priceWei = BigInt(result as string)
    return (Number(priceWei) / 1e18).toFixed(4)
  } catch (error) {
    console.log('MintPrice not available, using default')
    return DEFAULT_PRICE
  }
}

/**
 * Check if contract is paused - with fallback
 */
export async function getPaused(): Promise<boolean> {
  if (!BASE_URL) {
    return false
  }
  
  try {
    const result = await rpcCall('eth_call', [
      {
        to: CONTRACT_ADDRESS,
        data: '0x5c60da1b' // paused()
      },
      'latest'
    ])
    return (result as string) === '0x01'
  } catch (error) {
    console.log('Paused check not available, assuming not paused')
    return false
  }
}

/**
 * Get contract owner - with fallback
 */
export async function getContractOwner(): Promise<string> {
  if (!BASE_URL) {
    return '0x0000000000000000000000000000000000000000'
  }
  
  try {
    const result = await rpcCall('eth_call', [
      {
        to: CONTRACT_ADDRESS,
        data: '0x8da5cb5b' // owner()
      },
      'latest'
    ])
    return (result as string)
  } catch (error) {
    console.log('Owner check not available')
    return '0x0000000000000000000000000000000000000000'
  }
}

/**
 * Get latest block number
 */
export async function getLatestBlock(): Promise<number> {
  if (!BASE_URL) {
    return 0
  }
  
  try {
    const result = await rpcCall('eth_blockNumber', [])
    return parseInt(result as string, 16)
  } catch (error) {
    console.error('Error getting block number:', error)
    return 0
  }
}

/**
 * Get block timestamp
 */
export async function getBlockTimestamp(blockNumber: number): Promise<number> {
  if (!BASE_URL) {
    return Date.now()
  }
  
  try {
    const result = await rpcCall('eth_getBlockByNumber', [
      `0x${blockNumber.toString(16)}`,
      false
    ])
    return parseInt((result as { timestamp: string }).timestamp, 16) * 1000
  } catch (error) {
    console.error('Error getting block timestamp:', error)
    return Date.now()
  }
}

// ============================================================================
// Event Logs for Analytics
// ============================================================================

export interface MintEvent {
  minter: string
  tokenId: number
  blockNumber: number
  timestamp: number
}

/**
 * Get Mint events (Transfer from zero address)
 */
export async function getMintEvents(
  fromBlock: number, 
  toBlock: number
): Promise<MintEvent[]> {
  if (!BASE_URL || toBlock - fromBlock > 10000) {
    // Limit range to avoid too many results
    toBlock = fromBlock + 10000
  }

  if (!BASE_URL) {
    return []
  }

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [{
          address: CONTRACT_ADDRESS,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          ],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
        }]
      })
    })

    const result = await response.json()
    if (!result.result) return []

    const events: MintEvent[] = []
    for (const log of result.result) {
      const tokenId = parseInt(log.topics[3], 16)
      const minter = `0x${log.topics[2].slice(26)}`
      const blockNumber = parseInt(log.blockNumber, 16)
      events.push({
        minter,
        tokenId,
        blockNumber,
        timestamp: 0,
      })
    }

    return events
  } catch (error) {
    console.error('Error getting mint events:', error)
    return []
  }
}

// ============================================================================
// Stats
// ============================================================================

export interface ContractStats {
  totalSupply: number
  mintPrice: string
  maxSupply: number
  isPaused: boolean
  contractOwner: string
  latestBlock: number
}

/**
 * Get comprehensive contract stats
 */
export async function getContractStats(): Promise<ContractStats> {
  const [totalSupply, mintPrice, paused, owner, latestBlock] = await Promise.all([
    getTotalSupply().catch(() => 0),
    getMintPrice().catch(() => '0.001'),
    getPaused().catch(() => false),
    getContractOwner().catch(() => '0x0000000000000000000000000000000000000000'),
    getLatestBlock().catch(() => 0),
  ])
  
  return {
    totalSupply,
    mintPrice,
    maxSupply: MAX_SUPPLY,
    isPaused: paused,
    contractOwner: owner,
    latestBlock,
  }
}

// ============================================================================
// Leaderboard Data
// ============================================================================

export interface UserMintStats {
  address: string
  mintCount: number
  firstMintBlock: number
  lastMintBlock: number
}

/**
 * Get top minters from recent blocks
 */
export async function getTopMinters(limit: number = 10): Promise<UserMintStats[]> {
  if (!BASE_URL) {
    return []
  }
  
  const latestBlock = await getLatestBlock()
  if (latestBlock === 0) {
    return []
  }
  
  const fromBlock = Math.max(0, latestBlock - 100000)
  
  const events = await getMintEvents(fromBlock, latestBlock)
  
  const mintsByAddress = new Map<string, UserMintStats>()
  for (const event of events) {
    const existing = mintsByAddress.get(event.minter.toLowerCase())
    if (existing) {
      existing.mintCount++
      existing.lastMintBlock = event.blockNumber
    } else {
      mintsByAddress.set(event.minter.toLowerCase(), {
        address: event.minter,
        mintCount: 1,
        firstMintBlock: event.blockNumber,
        lastMintBlock: event.blockNumber,
      })
    }
  }
  
  return Array.from(mintsByAddress.values())
    .sort((a, b) => b.mintCount - a.mintCount)
    .slice(0, limit)
}
