/**
 * CSRF Protection Utility
 * 
 * Provides CSRF token validation for API routes
 */

import { NextRequest, NextResponse } from 'next/server'

// CSRF token header name
const CSRF_TOKEN_HEADER = 'x-csrf-token'

// Origin header for cross-origin check
const ORIGIN_HEADER = 'origin'
const REFERER_HEADER = 'referer'

/**
 * Safe list of allowed origins for production
 * In production, this should be set via environment variable
 */
const ALLOWED_ORIGINS = [
  'https://farcaster-fixel.vercel.app',
  'https://warpcast.com',
  'https://frame.farcaster.xyz',
  'http://localhost:3000',
  'http://localhost:5173',
]

/**
 * Check if the request is from an allowed origin
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true // Same-origin requests don't have origin header
  
  // Check against allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true
  }
  
  // Check if environment has custom allowed origins
  const customOrigins = process.env.CSRF_ALLOWED_ORIGINS
  if (customOrigins) {
    const allowedList = customOrigins.split(',').map(o => o.trim())
    return allowedList.some(allowed => 
      origin === allowed || 
      origin.endsWith(allowed.replace('*', ''))
    )
  }
  
  return false
}

/**
 * Generate a simple CSRF token (for development)
 * In production, use a proper session-based CSRF token
 */
export function generateCsrfToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

/**
 * Validate CSRF token for state-changing requests
 */
export function validateCsrfToken(
  request: NextRequest,
  options: {
    allowSameOrigin?: boolean
    requiredForMethods?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { 
    allowSameOrigin = true, 
    requiredForMethods = ['POST', 'PUT', 'DELETE', 'PATCH'] 
  } = options

  // Only validate for state-changing methods
  if (!requiredForMethods.includes(request.method)) {
    return { valid: true }
  }

  // Check origin for cross-origin requests
  const origin = request.headers.get(ORIGIN_HEADER) || 
                request.headers.get(REFERER_HEADER)
  
  const isSameOrigin = !origin || 
                       origin.includes(request.headers.get('host') || '')
  
  // Same-origin requests are generally safe if we have proper SameSite cookies
  if (isSameOrigin && allowSameOrigin) {
    // For SameSite cookies, we need SameSite=Strict or Lax
    // This is a basic check - production should use proper session tokens
    return { valid: true }
  }

  // For cross-origin requests, validate the origin
  if (!isSameOrigin) {
    if (!isAllowedOrigin(origin)) {
      return { 
        valid: false, 
        error: 'Origin not allowed' 
      }
    }
  }

  // Check for CSRF token in header (if implemented with session)
  const csrfToken = request.headers.get(CSRF_TOKEN_HEADER)
  if (!csrfToken) {
    // In production, you would validate against a session token
    // For now, we'll just check origin for cross-origin requests
    return { valid: true }
  }

  // TODO: Implement proper session-based CSRF validation
  // This would involve:
  // 1. Setting a CSRF token in a cookie
  // 2. Requiring the same token in the header
  // 3. Validating they match

  return { valid: true }
}

/**
 * Create a CSRF error response
 */
export function createCsrfErrorResponse(message: string = 'CSRF validation failed'): NextResponse {
  return new NextResponse(JSON.stringify({
    error: 'CSRF Error',
    message,
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Middleware function to wrap API route handlers with CSRF protection
 */
export function withCsrfProtection<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: Parameters<typeof validateCsrfToken>[1] = {}
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest
    const validation = validateCsrfToken(request, options)
    
    if (!validation.valid) {
      return createCsrfErrorResponse(validation.error)
    }
    
    return handler(...args)
  }) as T
}
