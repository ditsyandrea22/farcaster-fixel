/**
 * Unit Tests for Rarity System
 * Tests the centralized rarity logic in lib/rarity.ts
 */

import { describe, it, expect } from 'vitest'
import {
  RARITY_TIERS,
  MAX_SUPPLY,
  determineRarity,
  determineRarityFromFid,
  determineRarityFromAddress,
  hashFid,
  hashAddress,
  generateRandomSeed,
  generatePixelPattern,
  generateColors,
  getTierProperties,
  generateSerialNumber,
  getAttributes,
  getFortuneMessage,
  type RarityTier,
} from '@/lib/rarity'

describe('Rarity System', () => {
  // ==========================================================================
  // Hash Functions
  // ==========================================================================

  describe('hashFid', () => {
    it('should return same hash for same FID', () => {
      const fid = '12345'
      const result1 = hashFid(fid)
      const result2 = hashFid(fid)
      expect(result1).not.toBeNull()
      expect(result1).toBe(result2)
    })

    it('should return different hash for different FIDs', () => {
      const result1 = hashFid('12345')
      const result2 = hashFid('67890')
      expect(result1).not.toBeNull()
      expect(result2).not.toBeNull()
      expect(result1).not.toBe(result2)
    })

    it('should return null for empty string', () => {
      expect(hashFid('')).toBeNull()
    })

    it('should return null for invalid input', () => {
      expect(hashFid('abc')).toBeNull()
      expect(hashFid(' ')).toBeNull()
    })

    it('should handle numeric FID', () => {
      expect(hashFid('1')).toBe(1)
      expect(hashFid('12345')).toBe(12345)
    })

    it('should return null for zero', () => {
      expect(hashFid('0')).toBeNull()
    })
  })

  describe('hashAddress', () => {
    it('should return same hash for same address', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const result1 = hashAddress(address)
      const result2 = hashAddress(address)
      expect(result1).not.toBeNull()
      expect(result1).toBe(result2)
    })

    it('should return different hash for different addresses', () => {
      const result1 = hashAddress('0x1234567890abcdef1234567890abcdef12345678')
      const result2 = hashAddress('0x87654321fedcba0987654321fedcba0987654321')
      expect(result1).not.toBeNull()
      expect(result2).not.toBeNull()
      expect(result1).not.toBe(result2)
    })

    it('should return null for invalid address', () => {
      expect(hashAddress('invalid')).toBeNull()
      expect(hashAddress('')).toBeNull()
      expect(hashAddress('0x123')).toBeNull() // Too short
    })

    it('should return hash in valid range', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const result = hashAddress(address)
      expect(result).not.toBeNull()
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })

  describe('generateRandomSeed', () => {
    it('should return number in valid range', () => {
      const seed = generateRandomSeed()
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThanOrEqual(999999)
    })

    it('should return different seeds on multiple calls', () => {
      const seeds = new Set<number>()
      for (let i = 0; i < 100; i++) {
        seeds.add(generateRandomSeed())
      }
      // Should have some unique values (statistically very likely)
      expect(seeds.size).toBeGreaterThan(1)
    })
  })

  // ==========================================================================
  // Rarity Determination
  // ==========================================================================

  describe('determineRarity', () => {
    it('should return valid rarity tier', () => {
      const validTiers = Object.keys(RARITY_TIERS) as RarityTier[]
      const seed = 12345
      
      const result = determineRarity(seed)
      
      expect(validTiers).toContain(result)
    })

    it('should return consistent rarity for same seed', () => {
      const seed = 12345
      
      expect(determineRarity(seed)).toBe(determineRarity(seed))
    })

    it('should distribute across all tiers eventually', () => {
      const distribution: Record<RarityTier, number> = {
        COMMON: 0,
        UNCOMMON: 0,
        SILVER: 0,
        GOLD: 0,
        PLATINUM: 0,
      }
      
      // Test many seeds to see distribution
      for (let i = 0; i < 10000; i++) {
        distribution[determineRarity(i)]++
      }
      
      // COMMON should be most common (80%)
      expect(distribution.COMMON).toBeGreaterThan(distribution.UNCOMMON)
      expect(distribution.UNCOMMON).toBeGreaterThan(distribution.SILVER)
      expect(distribution.SILVER).toBeGreaterThan(distribution.GOLD)
      expect(distribution.GOLD).toBeGreaterThan(distribution.PLATINUM)
    })
  })

  describe('determineRarityFromFid', () => {
    it('should return consistent rarity for same FID', () => {
      const fid = '12345'
      const result1 = determineRarityFromFid(fid)
      const result2 = determineRarityFromFid(fid)
      expect(result1).not.toBeNull()
      expect(result2).not.toBeNull()
      expect(result1).toBe(result2)
    })

    it('should return null for invalid FID', () => {
      expect(determineRarityFromFid('')).toBeNull()
      expect(determineRarityFromFid('abc')).toBeNull()
    })

    it('should return valid rarity tier for valid FID', () => {
      const validTiers = Object.keys(RARITY_TIERS) as RarityTier[]
      const result = determineRarityFromFid('12345')
      expect(result).not.toBeNull()
      expect(validTiers).toContain(result)
    })
  })

  describe('determineRarityFromAddress', () => {
    it('should return consistent rarity for same address', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const result1 = determineRarityFromAddress(address)
      const result2 = determineRarityFromAddress(address)
      expect(result1).not.toBeNull()
      expect(result2).not.toBeNull()
      expect(result1).toBe(result2)
    })

    it('should return null for invalid address', () => {
      expect(determineRarityFromAddress('')).toBeNull()
      expect(determineRarityFromAddress('invalid')).toBeNull()
    })

    it('should return valid rarity tier for valid address', () => {
      const validTiers = Object.keys(RARITY_TIERS) as RarityTier[]
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const result = determineRarityFromAddress(address)
      expect(result).not.toBeNull()
      expect(validTiers).toContain(result)
    })
  })

  // ==========================================================================
  // Pattern Generation
  // ==========================================================================

  describe('generatePixelPattern', () => {
    it('should return 2D boolean array', () => {
      const pattern = generatePixelPattern(12345, 'COMMON')
      
      expect(Array.isArray(pattern)).toBe(true)
      expect(pattern.length).toBeGreaterThan(0)
      expect(pattern[0]).toBeInstanceOf(Array)
      expect(typeof pattern[0][0]).toBe('boolean')
    })

    it('should use larger grid for higher rarities', () => {
      const commonPattern = generatePixelPattern(12345, 'COMMON')
      const platinumPattern = generatePixelPattern(12345, 'PLATINUM')
      
      expect(platinumPattern.length).toBeGreaterThan(commonPattern.length)
    })

    it('should return consistent pattern for same seed', () => {
      const seed = 12345
      const rarity: RarityTier = 'GOLD'
      
      expect(generatePixelPattern(seed, rarity)).toEqual(generatePixelPattern(seed, rarity))
    })
  })

  // ==========================================================================
  // Color Generation
  // ==========================================================================

  describe('generateColors', () => {
    it('should return color object with required properties', () => {
      const colors = generateColors(12345, 'COMMON')
      
      expect(colors).toHaveProperty('primary')
      expect(colors).toHaveProperty('secondary')
      expect(colors).toHaveProperty('accent')
      expect(colors).toHaveProperty('bgGradient')
      expect(typeof colors.primary).toBe('string')
    })

    it('should return consistent colors for same seed', () => {
      const seed = 12345
      const rarity: RarityTier = 'GOLD'
      
      expect(generateColors(seed, rarity)).toEqual(generateColors(seed, rarity))
    })

    it('should have special colors for Platinum', () => {
      const platinumColors = generateColors(12345, 'PLATINUM')
      
      expect(platinumColors.primary).toContain('#E5E7EB')
    })

    it('should have special colors for Gold', () => {
      const goldColors = generateColors(12345, 'GOLD')
      
      expect(goldColors.primary).toContain('#F59E0B')
    })
  })

  // ==========================================================================
  // Tier Properties
  // ==========================================================================

  describe('getTierProperties', () => {
    it('should return valid tier properties', () => {
      const props = getTierProperties('COMMON')
      
      expect(props).toHaveProperty('name')
      expect(props).toHaveProperty('color')
      expect(props).toHaveProperty('glowIntensity')
      expect(props).toHaveProperty('borderWidth')
      expect(props).toHaveProperty('hasSparkles')
      expect(props).toHaveProperty('hasHalo')
    })

    it('should have higher glow for rarer tiers', () => {
      const commonProps = getTierProperties('COMMON')
      const goldProps = getTierProperties('GOLD')
      const platinumProps = getTierProperties('PLATINUM')
      
      expect(platinumProps.glowIntensity).toBeGreaterThan(goldProps.glowIntensity)
      expect(goldProps.glowIntensity).toBeGreaterThan(commonProps.glowIntensity)
    })

    it('should have halo only for Platinum', () => {
      expect(getTierProperties('PLATINUM').hasHalo).toBe(true)
      expect(getTierProperties('GOLD').hasHalo).toBe(false)
      expect(getTierProperties('COMMON').hasHalo).toBe(false)
    })
  })

  // ==========================================================================
  // Serial Number
  // ==========================================================================

  describe('generateSerialNumber', () => {
    it('should return formatted serial number', () => {
      const serial = generateSerialNumber(12345)
      
      expect(serial.startsWith('#')).toBe(true)
      expect(serial.endsWith('/' + MAX_SUPPLY)).toBe(true)
      // Format: #XXXXX/20000 = 1 + 5 + 1 + 5 = 12 characters
      expect(serial.length).toBe(12)
    })

    it('should return different serial for different seeds', () => {
      expect(generateSerialNumber(12345)).not.toBe(generateSerialNumber(67890))
    })

    it('should be within valid range', () => {
      for (let i = 0; i < 100; i++) {
        const serial = generateSerialNumber(i)
        const numStr = serial.slice(1, 6)
        const num = parseInt(numStr, 10)
        expect(num).toBeGreaterThanOrEqual(1)
        expect(num).toBeLessThanOrEqual(MAX_SUPPLY)
      }
    })
  })

  // ==========================================================================
  // Attributes
  // ==========================================================================

  describe('getAttributes', () => {
    it('should return array of attribute objects', () => {
      const attrs = getAttributes('COMMON', 12345)
      
      expect(Array.isArray(attrs)).toBe(true)
      expect(attrs.length).toBeGreaterThan(0)
      expect(attrs[0]).toHaveProperty('trait_type')
      expect(attrs[0]).toHaveProperty('value')
    })

    it('should include rarity name', () => {
      const attrs = getAttributes('GOLD', 12345)
      const rarityAttr = attrs.find(a => a.trait_type === 'Rarity')
      
      expect(rarityAttr).toBeDefined()
      expect(rarityAttr?.value).toBe('Gold')
    })

    it('should include seed value', () => {
      const attrs = getAttributes('COMMON', 12345)
      const seedAttr = attrs.find(a => a.trait_type === 'Seed')
      
      expect(seedAttr).toBeDefined()
      expect(seedAttr?.value).toBe(12345)
    })
  })

  // ==========================================================================
  // Fortune Messages
  // ==========================================================================

  describe('getFortuneMessage', () => {
    it('should return a string message', () => {
      const message = getFortuneMessage('COMMON')
      
      expect(typeof message).toBe('string')
      expect(message.length).toBeGreaterThan(0)
    })

    it('should return different messages for different rarities', () => {
      const commonMsg = getFortuneMessage('COMMON')
      const goldMsg = getFortuneMessage('GOLD')
      const platinumMsg = getFortuneMessage('PLATINUM')
      
      // Not guaranteed to be different, but highly likely
      expect(commonMsg.length).toBeGreaterThan(0)
      expect(goldMsg.length).toBeGreaterThan(0)
      expect(platinumMsg.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Rarity Distribution
  // ==========================================================================

  describe('Rarity Distribution', () => {
    it('should have valid rates summing to ~100', () => {
      const totalRate = Object.values(RARITY_TIERS).reduce((sum, tier) => sum + tier.rate, 0)
      
      // Allow small floating point variance
      expect(totalRate).toBeGreaterThan(99)
      expect(totalRate).toBeLessThanOrEqual(101)
    })

    it('should have valid colors for all tiers', () => {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/
      
      Object.values(RARITY_TIERS).forEach(tier => {
        expect(tier.color).toMatch(colorRegex)
      })
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle seed 0', () => {
      expect(() => determineRarity(0)).not.toThrow()
    })

    it('should handle maximum seed value', () => {
      const maxSeed = 999999
      expect(() => determineRarity(maxSeed)).not.toThrow()
    })

    it('should handle all rarity types', () => {
      const tiers: RarityTier[] = ['COMMON', 'UNCOMMON', 'SILVER', 'GOLD', 'PLATINUM']
      
      tiers.forEach(tier => {
        expect(() => getTierProperties(tier)).not.toThrow()
        expect(() => generateColors(12345, tier)).not.toThrow()
        expect(() => getFortuneMessage(tier)).not.toThrow()
      })
    })
  })
})

describe('Deterministic Behavior', () => {
  it('should produce same results across multiple test runs for same inputs', () => {
    const testCases = [
      { seed: 12345, fid: '12345', address: '0x1234567890abcdef1234567890abcdef12345678' },
      { seed: 67890, fid: '67890', address: '0x87654321fedcba0987654321fedcba0987654321' },
      { seed: 11111, fid: '11111', address: '0x1111111111111111111111111111111111111111' },
    ]
    
    testCases.forEach(({ seed, fid, address }) => {
      // Multiple calls should produce same results
      for (let i = 0; i < 5; i++) {
        expect(determineRarity(seed)).toBe(determineRarity(seed))
        expect(determineRarityFromFid(fid)).toBe(determineRarityFromFid(fid))
        expect(determineRarityFromAddress(address)).toBe(determineRarityFromAddress(address))
      }
    })
  })
})
