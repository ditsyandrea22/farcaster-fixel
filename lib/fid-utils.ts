/**
 * FID Utilities for Farmin App
 * 
 * Best practices for FID handling:
 * - FID is always a number, never a string
 * - Validate FID before sending to Neynar API
 * - Use Frame v2 trusted context when available
 * - Handle empty strings and invalid types gracefully
 */

// ============================================================================
// FID Validation
// ============================================================================

/**
 * Parse FID from various input types
 * @param fid - FID as number, string, or unknown
 * @returns Parsed FID as number, or null if invalid
 */
export function parseFid(fid: unknown): number | null {
  if (fid === null || fid === undefined) {
    return null
  }
  
  // If already a number and valid
  if (typeof fid === 'number' && Number.isInteger(fid) && fid > 0) {
    return fid
  }
  
  // If it's a string, parse it
  if (typeof fid === 'string') {
    // Reject empty strings
    if (fid.trim() === '') {
      return null
    }
    
    const parsed = parseInt(fid, 10)
    
    // Reject if NaN or invalid number
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      return null
    }
    
    return parsed
  }
  
  // Reject other types
  return null
}

/**
 * Validate FID with comprehensive checks
 * @param fid - FID to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateFid(fid: unknown): { isValid: boolean; error?: string } {
  const parsed = parseFid(fid)
  
  if (parsed === null) {
    return { 
      isValid: false, 
      error: typeof fid === 'string' && fid.trim() === '' 
        ? 'FID is an empty string' 
        : 'FID is invalid or not a positive integer' 
    }
  }
  
  // FID should be within reasonable bounds (Farcaster has millions of users, but not billions)
  if (parsed > 999999999) {
    return { isValid: false, error: 'FID exceeds maximum expected value' }
  }
  
  return { isValid: true }
}

/**
 * Assert FID is valid, throw if not
 * @param fid - FID to assert
 * @throws Error if FID is invalid
 */
export function assertFid(fid: unknown, context?: string): asserts fid is number {
  const validation = validateFid(fid)
  
  if (!validation.isValid) {
    const contextStr = context ? ` in ${context}` : ''
    throw new Error(`Invalid FID${contextStr}: ${validation.error}`)
  }
}

// ============================================================================
// Frame v2 Message Verification
// ============================================================================

/**
 * Extract FID from Frame v2 trusted message bytes
 * Requires @farcaster/hub-nodejs package
 * 
 * @param messageBytes - Base64 encoded message bytes from trustedData
 * @returns Extracted FID, or null if extraction fails
 */
export async function extractFidFromFrameMessage(messageBytes: string): Promise<number | null> {
  try {
    // Dynamic import to avoid requiring @farcaster/hub-nodejs if not installed
    const { Message } = await import('@farcaster/hub-nodejs')
    
    // Use atob for base64 decoding (works in browser and Node.js)
    const binaryString = atob(messageBytes)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    const message = Message.decode(bytes)
    const fid = message.data?.fid
    
    if (fid === undefined || fid === null) {
      console.warn('No FID found in Frame message')
      return null
    }
    
    return fid as number
  } catch (error) {
    console.error('Failed to extract FID from Frame message:', error)
    return null
  }
}

/**
 * Validate and extract FID from Frame v2 request body
 * @param body - Request body containing trustedData
 * @returns Extracted FID, or null if invalid
 */
export async function extractFidFromFrameRequest(body: any): Promise<number | null> {
  if (!body?.trustedData?.messageBytes) {
    console.warn('No trustedData.messageBytes found in Frame request')
    return null
  }
  
  return extractFidFromFrameMessage(body.trustedData.messageBytes)
}

// ============================================================================
// Neynar API Helpers
// ============================================================================

const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster'

/**
 * Fetch user profile by FID using Neynar API
 * @param fid - Farmin ID (must be a number)
 * @param apiKey - Neynar API key
 * @returns User profile object, or null if not found
 */
export async function getUserByFid(fid: number, apiKey: string): Promise<any | null> {
  assertFid(fid, 'getUserByFid')
  
  const response = await fetch(
    `${NEYNAR_BASE_URL}/user/by_fid?fid=${fid}`,
    {
      headers: {
        'x-api-key': apiKey,
      },
    }
  )
  
  if (!response.ok) {
    console.error(`Neynar API error for FID ${fid}:`, response.statusText)
    return null
  }
  
  const data = await response.json()
  return data.user || null
}

/**
 * Fetch user by wallet address using Neynar API
 * @param address - Ethereum wallet address
 * @param apiKey - Neynar API key
 * @returns User object with FID, or null if not found
 */
export async function getUserByAddress(address: string, apiKey: string): Promise<any | null> {
  if (!address || typeof address !== 'string') {
    console.error('Invalid address provided to getUserByAddress')
    return null
  }
  
  // Clean address (lowercase, remove checksum for API)
  const cleanAddress = address.toLowerCase().trim()
  
  try {
    // Method 1: Try custody address lookup (most reliable for connected wallets)
    const custodyResponse = await fetch(
      `${NEYNAR_BASE_URL}/user/custody?custody_address=${cleanAddress}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    )
    
    if (custodyResponse.ok) {
      const data = await custodyResponse.json()
      if (data.fid) {
        console.log(`Found user by custody address: FID ${data.fid}`)
        return {
          fid: data.fid,
          username: data.username,
          displayName: data.display_name,
        }
      }
    }
    
    // Method 2: Try search by verified addresses
    const searchResponse = await fetch(
      `${NEYNAR_BASE_URL}/user/search?verified_addresses.ethereum=${cleanAddress}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    )
    
    if (!searchResponse.ok) {
      console.error('Neynar API error:', searchResponse.statusText)
      return null
    }
    
    const data = await searchResponse.json()
    const users = data.users || []
    
    // Find user with matching verified address
    const user = users.find((u: any) =>
      u.verified_addresses?.ethereum?.some((addr: string) =>
        addr.toLowerCase() === cleanAddress
      )
    )
    
    if (user) {
      console.log(`Found user by verified address: FID ${user.fid}`)
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
      }
    }
    
    console.log(`No user found for address: ${cleanAddress}`)
    return null
  } catch (error) {
    console.error('Error fetching user by address:', error)
    return null
  }
}

/**
 * Fetch user by username using Neynar API
 * @param username - Farmin username (without @)
 * @param apiKey - Neynar API key
 * @returns User object with FID, or null if not found
 */
export async function getUserByUsername(username: string, apiKey: string): Promise<any | null> {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    console.error('Invalid username provided to getUserByUsername')
    return null
  }
  
  const cleanUsername = username.trim().replace(/^@/, '')
  
  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/user/by_username?username=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    )
    
    if (!response.ok) {
      console.error(`Neynar API error for username ${cleanUsername}:`, response.statusText)
      return null
    }
    
    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error fetching user by username:', error)
    return null
  }
}

/**
 * Bulk fetch users by FIDs using Neynar API
 * @param fids - Array of Farmin IDs
 * @param apiKey - Neynar API key
 * @returns Array of user objects
 */
export async function getUsersByFids(fids: number[], apiKey: string): Promise<any[]> {
  if (!fids || fids.length === 0) {
    return []
  }
  
  // Validate all FIDs
  const validFids = fids.filter(fid => validateFid(fid).isValid)
  
  if (validFids.length === 0) {
    console.error('No valid FIDs provided to getUsersByFids')
    return []
  }
  
  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/user/bulk?fids=${validFids.join(',')}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    )
    
    if (!response.ok) {
      console.error('Neynar bulk user fetch error:', response.statusText)
      return []
    }
    
    const data = await response.json()
    return data.users || []
  } catch (error) {
    console.error('Error fetching users by FIDs:', error)
    return []
  }
}

// ============================================================================
// Debugging Utilities
// ============================================================================

/**
 * Debug FID handling - logs detailed information about FID validation
 * @param source - Source of the FID (for logging)
 * @param fid - FID value to debug
 */
export function debugFid(source: string, fid: unknown): void {
  console.group(`🔍 FID Debug: ${source}`)
  console.log('Input value:', fid)
  console.log('Input type:', typeof fid)
  console.log('Parsed FID:', parseFid(fid))
  console.log('Validation:', validateFid(fid))
  console.groupEnd()
}

/**
 * Create a comprehensive FID debug report
 * @param fid - FID to analyze
 * @param context - Additional context information
 */
export function createFidDebugReport(fid: unknown, context?: Record<string, any>): Record<string, any> {
  const parsed = parseFid(fid)
  const validation = validateFid(fid)
  
  const report: Record<string, any> = {
    input: fid,
    inputType: typeof fid,
    parsedValue: parsed,
    isValid: validation.isValid,
    error: validation.error,
    isNull: parsed === null,
    isNumber: typeof fid === 'number',
    isString: typeof fid === 'string',
    isEmptyString: typeof fid === 'string' && fid.trim() === '',
  }
  
  if (context) {
    report.context = context
  }
  
  return report
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if value is a valid FID
 */
export function isValidFid(fid: unknown): fid is number {
  return validateFid(fid).isValid
}

/**
 * Type guard to check if value could be a FID source (number or string)
 */
export function isFidSource(fid: unknown): fid is number | string {
  return typeof fid === 'number' || 
         (typeof fid === 'string' && fid.trim() !== '') ||
         fid === null ||
         fid === undefined
}
