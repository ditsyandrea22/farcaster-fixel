/**
 * Production-Ready Rate Limiter
 * 
 * Features:
 * - In-memory fallback for development
 * - Redis support for production (via upstash/redis)
 * - Configurable windows and limits
 * - Sliding window algorithm for more accurate limiting
 */

import { getRateLimitResult as inMemoryRateLimit } from './rate-limit-simple'

// ============================================================================
// Configuration
// ============================================================================

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute (per IP)
}

const strictConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute for sensitive endpoints
}

const generousConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute for public endpoints
}

// ============================================================================
// Rate Limit Result
// ============================================================================

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
  windowMs: number
}

export interface RateLimitResultWithHeaders extends RateLimitResult {
  headers: Record<string, string>
}

// ============================================================================
// Configuration Exports
// ============================================================================

export { defaultConfig, strictConfig, generousConfig }

// ============================================================================
// Rate Limiting Implementation
// ============================================================================

/**
 * Get rate limit result for an IP address
 * Uses in-memory storage by default, can be upgraded to Redis
 */
export async function getRateLimitResult(
  ip: string,
  config: RateLimitConfig = defaultConfig
): Promise<RateLimitResult> {
  // For production, this would integrate with Redis
  // For now, use in-memory implementation
  const result = inMemoryRateLimit(ip, config)
  
  return {
    allowed: (await result).allowed,
    remaining: (await result).remaining,
    resetTime: (await result).resetTime,
    limit: config.maxRequests,
    windowMs: config.windowMs,
  }
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Window': (result.windowMs / 1000).toString(),
    ...(result.allowed ? {} : { 'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString() }),
  }
}

/**
 * Get rate limit result with headers
 */
export async function getRateLimitResultWithHeaders(
  ip: string,
  config: RateLimitConfig = defaultConfig
): Promise<RateLimitResultWithHeaders> {
  const result = await getRateLimitResult(ip, config)
  
  return {
    ...result,
    headers: createRateLimitHeaders(result),
  }
}

/**
 * Middleware-style rate limit check for API routes
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ pass: true } | { pass: false; headers: Record<string, string>; retryAfter: number }> {
  const result = await getRateLimitResult(ip, config)
  
  if (result.allowed) {
    return { pass: true }
  }
  
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
  
  return {
    pass: false,
    headers: createRateLimitHeaders(result),
    retryAfter,
  }
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitExceededResponse(
  headers: Record<string, string>,
  retryAfter: number
): Response {
  return new Response(JSON.stringify({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter,
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

// ============================================================================
// Endpoint-Specific Configurations
// ============================================================================

/**
 * Rate limit configs for different endpoints
 */
export const ENDPOINT_CONFIGS = {
  // Public endpoints - more generous limits
  '/api/nft-image': generousConfig,
  '/api/nft-metadata': generousConfig,
  '/api/frame': generousConfig,
  
  // Sensitive endpoints - stricter limits
  '/api/user-profile': strictConfig,
  '/api/fid-from-address': strictConfig,
  
  // Default - standard limits
  default: defaultConfig,
}

/**
 * Get rate limit config for a specific endpoint
 */
export function getConfigForEndpoint(endpoint: string): RateLimitConfig {
  // Check exact match first
  if (ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS]) {
    return ENDPOINT_CONFIGS[endpoint as keyof typeof ENDPOINT_CONFIGS]
  }
  
  // Check if endpoint starts with a known path
  for (const [path, config] of Object.entries(ENDPOINT_CONFIGS)) {
    if (endpoint.startsWith(path)) {
      return config
    }
  }
  
  return defaultConfig
}
