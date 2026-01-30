// Simple in-memory rate limiter for API routes
// Note: This is a basic implementation. For production, consider using Redis or a dedicated rate limiting service

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
}

// Export config for use in routes
export { defaultConfig, type RateLimitConfig }

// In-memory store (note: this will reset on server restart in development)
// For production, consider using Redis with upstash/ratelimit
const ipCache = new Map<string, { count: number; resetTime: number }>()

export function getRateLimitResult(ip: string, config: RateLimitConfig = defaultConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const existing = ipCache.get(ip)

  if (!existing || now > existing.resetTime) {
    // New request or expired window
    ipCache.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
    }
  }

  // Increment count
  existing.count++
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime,
  }
}

// Cleanup old entries periodically (call this occasionally or on each request)
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [ip, data] of ipCache.entries()) {
    if (now > data.resetTime) {
      ipCache.delete(ip)
    }
  }
}

// Call cleanup on each request (lightweight)
getRateLimitResult('')
