/**
 * Smart Contract Requirements for NFT Metadata
 * 
 * The smart contract MUST implement tokenURI to return metadata URL:
 * 
 * ```solidity
 * string private constant BASE_URI = "https://your-domain.com/api/nft-metadata?tokenId=";
 * 
 * function tokenURI(uint256 tokenId) public view override returns (string memory) {
 *     return string(abi.encodePacked(BASE_URI, Strings.toString(tokenId)));
 * }
 * ```
 * 
 * This allows OpenSea and other marketplaces to fetch NFT metadata dynamically.
 */

export const NFT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "implementation", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "target", type: "address" },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "implementation", type: "address" },
    ],
    name: "ERC1967InvalidImplementation",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC1967NonPayable",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedInnerCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "implementation", type: "address" },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
] as const

// Contract address
export const CONTRACT_ADDRESS = "0xBee2A3b777445E212886815A5384f6F4e8902d21"

// Rarity distribution constants for off-chain reference
export const RARITY_DISTRIBUTION = {
  COMMON: { min: 1, max: 800000, percentage: 80 },
  UNCOMMON: { min: 800001, max: 950000, percentage: 15 },
  SILVER: { min: 950001, max: 990000, percentage: 4 },
  GOLD: { min: 990001, max: 999900, percentage: 0.99 },
  PLATINUM: { min: 999901, max: 1000000, percentage: 0.01 },
} as const

export const MAX_SUPPLY = 30000
