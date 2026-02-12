// Pinata IPFS Utility for NFT Metadata Storage
// Supports JWT and API Key + Secret authentication methods

const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'

// Get Pinata credentials from environment
function getPinataAuth(): { method: 'jwt' | 'basic'; token?: string; apiKey?: string; apiSecret?: string } {
  const jwt = process.env.PINATA_JWT
  const apiKey = process.env.PINATA_API_KEY
  const apiSecret = process.env.PINATA_API_SECRET

  if (jwt && jwt !== 'your_pinata_jwt_token_here') {
    return { method: 'jwt', token: jwt }
  }

  if (apiKey && apiKey !== 'your_pinata_api_key_here' && apiSecret && apiSecret !== 'your_pinata_api_secret_here') {
    return { method: 'basic', apiKey, apiSecret }
  }

  return { method: 'jwt' }
}

function getAuthHeaders(): Record<string, string> {
  const auth = getPinataAuth()

  if (auth.method === 'jwt' && auth.token) {
    return { Authorization: `Bearer ${auth.token}` }
  }

  if (auth.method === 'basic' && auth.apiKey && auth.apiSecret) {
    const credentials = Buffer.from(`${auth.apiKey}:${auth.apiSecret}`).toString('base64')
    return { Authorization: `Basic ${credentials}` }
  }

  return {}
}

// Interface for Pinata response
interface PinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
  isDuplicate?: boolean
}

/**
 * Upload JSON metadata to IPFS via Pinata
 * This ensures NFT metadata is permanently stored and indexed by OpenSea
 */
export async function uploadJSONToIPFS(
  metadata: Record<string, unknown>,
  options?: {
    name?: string
    customPinPolicy?: Record<string, unknown>
  }
): Promise<{ success: boolean; ipfsHash?: string; gatewayUrl?: string; error?: string }> {
  try {
    const auth = getPinataAuth()

    if ((auth.method === 'jwt' && !auth.token) || (auth.method === 'basic' && (!auth.apiKey || !auth.apiSecret))) {
      console.warn('Pinata credentials not configured. Skipping IPFS upload.')
      return { success: false, error: 'Pinata credentials not configured' }
    }

    const formData = new FormData()
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    formData.append('file', blob, (options?.name || 'metadata') + '.json')

    // Add pin options for NFT metadata
    const pinataMetadata = {
      name: options?.name || `pixelcaster-nft-${Date.now()}`,
      keyvalues: {
        collection: 'PixelCaster AI',
        type: 'nft-metadata',
        generated_at: new Date().toISOString(),
      },
    }
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata))

    // Add pin options for permanent storage
    const pinataOptions = {
      wrapWithDirectory: false,
    }
    formData.append('pinataOptions', JSON.stringify(pinataOptions))

    const response = await fetch(`${PINATA_API_URL}/pinFileToIPFS`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata upload failed:', errorText)
      return { success: false, error: `Pinata API error: ${response.status}` }
    }

    const data: PinataResponse = await response.json()
    const gatewayUrl = `${PINATA_GATEWAY_URL}${data.IpfsHash}`

    return {
      success: true,
      ipfsHash: data.IpfsHash,
      gatewayUrl,
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Upload image buffer to IPFS via Pinata
 * This stores the NFT image permanently on IPFS
 */
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  options?: {
    name?: string
    contentType?: string
  }
): Promise<{ success: boolean; ipfsHash?: string; gatewayUrl?: string; error?: string }> {
  try {
    const auth = getPinataAuth()

    if ((auth.method === 'jwt' && !auth.token) || (auth.method === 'basic' && (!auth.apiKey || !auth.apiSecret))) {
      console.warn('Pinata credentials not configured. Skipping IPFS upload.')
      return { success: false, error: 'Pinata credentials not configured' }
    }

    const formData = new FormData()
    const blob = new Blob([Uint8Array.from(imageBuffer)], { type: options?.contentType || 'image/png' })
    formData.append('file', blob, (options?.name || `nft-image-${Date.now()}`) + '.png')

    const pinataMetadata = {
      name: options?.name || `pixelcaster-image-${Date.now()}`,
      keyvalues: {
        collection: 'PixelCaster AI',
        type: 'nft-image',
        generated_at: new Date().toISOString(),
      },
    }
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata))

    const pinataOptions = {
      wrapWithDirectory: false,
    }
    formData.append('pinataOptions', JSON.stringify(pinataOptions))

    const response = await fetch(`${PINATA_API_URL}/pinFileToIPFS`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata image upload failed:', errorText)
      return { success: false, error: `Pinata API error: ${response.status}` }
    }

    const data: PinataResponse = await response.json()
    const gatewayUrl = `${PINATA_GATEWAY_URL}${data.IpfsHash}`

    return {
      success: true,
      ipfsHash: data.IpfsHash,
      gatewayUrl,
    }
  } catch (error) {
    console.error('Error uploading image to IPFS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Pinata is configured
 */
export function isPinataConfigured(): boolean {
  const auth = getPinataAuth()
  
  if (auth.method === 'jwt' && auth.token) {
    return true
  }
  
  if (auth.method === 'basic' && auth.apiKey && auth.apiSecret) {
    return true
  }
  
  return false
}

/**
 * Get gateway URL from IPFS hash
 */
export function getGatewayUrl(ipfsHash: string): string {
  return `${PINATA_GATEWAY_URL}${ipfsHash}`
}
