/**
 * Environment Variable Validation for Production
 * 
 * This file validates that required environment variables are set
 * before the application starts in production mode.
 */

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  { key: 'NEXT_PUBLIC_BASE_RPC_URL', required: false, description: 'RPC URL for Base network (optional if using default)' },
  { key: 'NEXT_PUBLIC_NFT_CONTRACT_ADDRESS', required: true, description: 'NFT contract address on Base' },
  { key: 'NEYNAR_API_KEY', required: true, description: 'Neynar API key for FarCaster user lookup' },
  { key: 'PINATA_JWT', required: false, description: 'Pinata JWT for IPFS uploads (optional)' },
  { key: 'NEXT_PUBLIC_BASE_URL', required: true, description: 'Base URL for the application' },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 * Should be called during application initialization
 */
export function validateEnvVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate in production
  if (process.env.NODE_ENV !== 'production') {
    return { valid: true, errors: [], warnings: [] };
  }

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.key];

    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.key} - ${envVar.description}`);
    } else if (!envVar.required && !value) {
      warnings.push(`Optional environment variable not set: ${envVar.key} - ${envVar.description}`);
    }
  }

  // Check for insecure configurations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
      warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production');
    }

    // Warn about default contract address
    if (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS === '0xBee2A3b777445E212886815A5384f6F4e8902d21') {
      warnings.push('Using default NFT contract address - consider setting NEXT_PUBLIC_NFT_CONTRACT_ADDRESS for production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and log environment variables on startup
 * Call this in your application entry point
 */
export function initEnvValidation(): void {
  const result = validateEnvVariables();

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment Variable Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (!result.valid) {
    console.error('❌ Environment Variable Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Missing required environment variables: ${result.errors.join(', ')}`);
  }

  console.log('✅ Environment variables validated successfully');
}
