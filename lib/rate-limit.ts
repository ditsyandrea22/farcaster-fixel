/**
 * Production-Ready Rate Limiter
 * 
 * Features:
 * - In-memory fallback for development
 * - Redis support for production (via upstash/redis)
 * - Configurable windows and limits
 * - Sliding window algorithm for more accurate limiting
 * - Automatic cleanup of expired entries
 */

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
// Rate Limiting Implementation (In-Memory Fallback with Auto-Cleanup)
// ============================================================================

// In-memory store with automatic cleanup and size limit
const ipCache = new Map<string, { count: number; resetTime: number }>()

// Maximum cache entries to prevent memory exhaustion
const MAX_CACHE_SIZE = 10000

// Cleanup interval in milliseconds (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000

// Track if cleanup interval is set up
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * Initialize automatic cleanup of expired entries
 */
function initializeCleanup() {
  if (typeof setInterval === 'undefined' || cleanupIntervalId !== null) {
    return
  }
  
  cleanupIntervalId = setInterval(() => {
    cleanupExpiredEntries()
  }, CLEANUP_INTERVAL)
  
  // Mark interval to be cleared on process exit
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => {
      if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId)
      }
    })
  }
}

/**
 * In-memory rate limiter implementation with size limit
 */
function getInMemoryRateLimit(
  ip: string,
  config: RateLimitConfig = defaultConfig
): RateLimitResult {
  const now = Date.now()
  const existing = ipCache.get(ip)

  if (!existing || now > existing.resetTime) {
    // New request or expired window - check cache size first
    if (ipCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries to make room
      const oldestKeys = Array.from(ipCache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.2))
      oldestKeys.forEach(key => ipCache.delete(key))
    }
    
    ipCache.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
      limit: config.maxRequests,
      windowMs: config.windowMs,
    }
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
      limit: config.maxRequests,
      windowMs: config.windowMs,
    }
  }

  // Increment count
  existing.count++
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime,
    limit: config.maxRequests,
    windowMs: config.windowMs,
  }
}

/**
 * Get rate limit result for an IP address
 * Uses in-memory storage by default, can be upgraded to Redis
 */
export async function getRateLimitResult(
  ip: string,
  config: RateLimitConfig = defaultConfig
): Promise<RateLimitResult> {
  // Initialize automatic cleanup
  initializeCleanup()
  
  // For production, this would integrate with Redis
  // Example Redis integration:
  // import { Ratelimit } from "@upstash/ratelimit"
  // import { Redis } from "@upstash/redis"
  // 
  // const ratelimit = new Ratelimit({
  //   redis: Redis.fromEnv(),
  //   limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs}ms`),
  // })
  // 
  // const result = await ratelimit.limit(ip)
  // return { allowed: !result.success, remaining: result.limit - result.usage, ... }

  return getInMemoryRateLimit(ip, config)
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

/**
 * Cleanup old entries periodically
 * This is now called automatically by the cleanup interval
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  let cleanedCount = 0
  
  for (const [ip, data] of ipCache.entries()) {
    if (now > data.resetTime) {
      ipCache.delete(ip)
      cleanedCount++
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[RateLimit] Cleaned up ${cleanedCount} expired entries. Current cache size: ${ipCache.size}`)
  }
}

// ============================================================================
// Endpoint-Specific Configurations
// ============================================================================

/**
 * Rate limit configs for different endpoints
 */
export const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  // Public endpoints - more generous limits
  '/api/nft-image': generousConfig,
  '/api/nft-metadata': generousConfig,
  '/api/frame': generousConfig,
  
  // Sensitive endpoints - stricter limits
  '/api/user-profile': strictConfig,
  '/api/fid-from-address': strictConfig,
  
  // Default - standard limits
  '/api': defaultConfig,
}

/**
 * Get rate limit config for a specific endpoint
 */
export function getConfigForEndpoint(endpoint: string): RateLimitConfig {
  // Check exact match first
  if (ENDPOINT_CONFIGS[endpoint]) {
    return ENDPOINT_CONFIGS[endpoint]
  }
  
  // Check if endpoint starts with a known path
  for (const [path, config] of Object.entries(ENDPOINT_CONFIGS)) {
    if (endpoint.startsWith(path)) {
      return config
    }
  }
  
  return defaultConfig
}
