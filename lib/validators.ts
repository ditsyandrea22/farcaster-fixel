/**
 * Zod Schema Validations for API Routes
 * Provides runtime validation for all API inputs
 */

import { z } from 'zod'

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Ethereum wallet address validation
 */
export const EthereumAddressSchema = z.string().regex(
  /^0x[a-fA-F0-9]{40}$/,
  'Invalid Ethereum address format'
)

/**
 * FarCaster ID validation (positive integer)
 */
export const FidSchema = z.string()
  .regex(/^\d+$/, 'FID must be a positive integer')
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0 && val <= 999999999, 'FID out of valid range')

/**
 * Token ID validation
 */
export const TokenIdSchema = z.string()
  .regex(/^\d+$/, 'Token ID must be a positive integer')
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, 'Token ID must be positive')

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  limit: z.string().optional()
    .transform((val) => val ? parseInt(val, 10) : 20)
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  cursor: z.string().optional(),
})

// ============================================================================
// API Route Schemas
// ============================================================================

/**
 * User profile API validation
 */
export const UserProfileQuerySchema = z.object({
  fid: FidSchema,
})

/**
 * FID from address API validation
 */
export const FidFromAddressQuerySchema = z.object({
  address: EthereumAddressSchema,
})

/**
 * NFT image API validation
 */
export const NftImageQuerySchema = z.object({
  fid: FidSchema.optional(),
  address: EthereumAddressSchema.optional(),
  tokenId: TokenIdSchema.optional(),
  random: z.string().optional().transform((val) => val === 'true'),
}).refine(
  (data) => data.fid || data.address || data.tokenId || data.random,
  'At least one of fid, address, tokenId, or random=true is required'
)

/**
 * NFT metadata API validation
 */
export const NftMetadataQuerySchema = NftImageQuerySchema

/**
 * Frame API validation
 */
export const FrameBodySchema = z.object({
  fid: z.number().positive().optional(),
  buttonIndex: z.number().int().positive().optional(),
  castId: z.object({
    fid: z.number().positive(),
    hash: z.string(),
  }).optional(),
})

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate request query against schema
 * Returns { success: true, data: T } or { success: false, error: string }
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  query: Record<string, unknown> | undefined
): { success: true; data: T } | { success: false; error: string } {
  if (!query) {
    return { success: false, error: 'No query parameters provided' }
  }

  const result = schema.safeParse(query)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errorMessages = result.error.errors.map((err) => 
    `${err.path.join('.')}: ${err.message}`
  ).join('; ')
  
  return { success: false, error: errorMessages }
}

/**
 * Validate request body against schema
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' }
  }

  const result = schema.safeParse(body)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errorMessages = result.error.errors.map((err) => 
    `${err.path.join('.')}: ${err.message}`
  ).join('; ')
  
  return { success: false, error: errorMessages }
}

/**
 * Create error response from validation result
 */
export function createValidationErrorResponse(error: string) {
  return new Response(JSON.stringify({ 
    error: 'Validation Error',
    details: error,
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ============================================================================
// Export Zod for schema building
// ============================================================================

export { z }
