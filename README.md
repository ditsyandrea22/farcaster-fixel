# Base Mainnet NFT Mint - FarCaster Mini App

A complete FarCaster Mini App for minting NFTs on Base mainnet. This application includes both a Frame v2 cast button and a full-featured mini app experience.

## Features

- **FarCaster Integration**: Seamlessly integrated with FarCaster Frames v2
- **Base Mainnet**: Native support for Base mainnet NFT minting
- **Wallet Connection**: Support for WalletConnect and injected wallets via wagmi
- **Neynar API**: Reads user profile data from FarCaster
- **Signature-based Minting**: Secure minting with ERC721 contract interaction
- **Dynamic UI**: Beautiful, responsive interface with Tailwind CSS

## Recent Improvements

### Code Quality
- ✅ **Centralized Rarity Logic**: All rarity-related code moved to [`lib/rarity.ts`](lib/rarity.ts) - single source of truth
- ✅ **TypeScript Strict Mode**: Improved type safety across the codebase
- ✅ **Input Validation**: Zod schema validation for all API routes in [`lib/validators.ts`](lib/validators.ts)
- ✅ **Rate Limiting**: Production-ready rate limiter with endpoint-specific configs in [`lib/rate-limit.ts`](lib/rate-limit.ts)

### Testing
- ✅ **Unit Tests**: 38 comprehensive tests for rarity logic in [`__tests__/rarity.test.ts`](__tests__/rarity.test.ts)
- ✅ **Vitest Configuration**: Ready-to-run test suite with coverage reporting

### Security
- ✅ **Security Headers**: Added HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- ✅ **TypeScript Build Errors**: Enabled strict mode for production builds

### Architecture
```
lib/
├── rarity.ts          # Centralized rarity system (SINGLE SOURCE OF TRUTH)
├── validators.ts       # Zod schema validation
├── rate-limit.ts      # Production-ready rate limiter
├── farcaster-sdk.ts   # FarCaster SDK utilities
├── neynar.ts          # Neynar API helpers
├── fid-utils.ts       # FID utilities
├── wagmi.ts           # Wagmi configuration
└── utils.ts           # Shared utilities

__tests__/
└── rarity.test.ts    # 38 unit tests (all passing)
```

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Install dependencies**:
```bash
pnpm install
```

2. **Environment Variables** (already configured in `.env.local`):
```
NEXT_PUBLIC_NEYNAR_API_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Start development server**:
```bash
pnpm dev
```

Visit `http://localhost:3000` to see the landing page.

## Project Structure

### Key Files

- **`/app/page.tsx`** - Landing page with information about the mint
- **`/app/mint/page.tsx`** - Mini app page (opened from FarCaster Frame)
- **`/components/mini-app.tsx`** - Main Mini App component with wallet connection and minting logic
- **`/components/connect-wallet.tsx`** - Reusable wallet connection UI component
- **`/hooks/useWallet.ts`** - Custom hook for wallet connection
- **`/app/api/frame/route.ts`** - Frame v2 endpoint for FarCaster integration
- **`/lib/wagmi.ts`** - Wagmi configuration for Base mainnet
- **`/lib/neynar.ts`** - Neynar API integration for profile fetching
- **`/lib/farcaster-sdk.ts`** - FarCaster Mini App SDK utilities
- **`/lib/contractAbi.ts`** - NFT contract ABI
- **`/public/.well-known/farcaster.json`** - FarCaster app registry

### Contract Details

- **Contract Address**: `0xBee2A3b777445E212886815A5384f6F4e8902d21`
- **Network**: Base Mainnet
- **Mint Price**: 0.001 ETH
- **Chain ID**: 8453

## How It Works

### Landing Page Flow

1. User visits the landing page at `/`
2. Page explains the feature and provides information about the NFT mint
3. FarCaster Frame button directs to `/api/frame` endpoint

### FarCaster Frame v2 Flow

1. Frame is shared as a cast in FarCaster
2. User clicks "Mint on Base" button in the Frame
3. Opens the mini app at `/mint?fid={user_fid}`
4. Mini app loads user profile via Neynar API
5. User connects wallet (WalletConnect or injected)
6. User clicks "Mint NFT" button
7. Wagmi writes to the contract
8. NFT is minted and transferred to the user's wallet

## Wallet Connection

This project uses wagmi for wallet connection following the [FarCast Mini App wallet guidelines](https://miniapps.farcaster.xyz/docs/guides/wallets).

### Using the useWallet Hook

The [`useWallet`](hooks/useWallet.ts) hook provides a unified interface for wallet connections:

```typescript
import { useWallet } from '@/hooks/useWallet'

function MyComponent() {
  const {
    address,
    isConnected,
    chainId,
    connect,
    disconnect,
    isConnecting,
    writeContract,
    isWritingContract,
    isConfirmed,
  } = useWallet()

  // Connect to wallet
  const handleConnect = () => connect()

  // Disconnect from wallet
  const handleDisconnect = () => disconnect()

  // Write to contract
  const handleMint = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'mint',
      args: [BigInt(fid)],
      value: parseEther('0.001'),
    })
  }

  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

### Using the ConnectWallet Component

The [`ConnectWallet`](components/connect-wallet.tsx) component provides a ready-to-use UI:

```typescript
import { ConnectWallet } from '@/components/connect-wallet'

function MyPage() {
  return (
    <div>
      <ConnectWallet />
    </div>
  )
}
```

#### Props

- `showOnlyWhenConnected`: If true, only renders when wallet is connected
- `className`: Additional CSS classes
- `onConnect`: Callback fired after successful connection

### Supported Wallets

- **Injected Wallets**: MetaMask, Coinbase Wallet, Brave Wallet
- **WalletConnect**: Via WalletConnect modal (requires `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)
- **FarCast Wallet**: Native wallet when running inside the FarCast app

### Network Support

- **Base Mainnet** (chain ID: 8453)
- Network switching is handled automatically

## Mini App Components

### Wallet Connection

- Supports WalletConnect and injected wallets
- Displays connected address
- Shows balance and connection status
- Native FarCast wallet support when in mini app

### Profile Display

- Fetches FarCaster profile via Neynar API
- Shows avatar, username, and display name
- Displays FID (FarCaster ID)

### Minting

- Shows mint price and network
- Handles contract interaction via wagmi
- Shows loading and error states
- Displays success confirmation

## Configuration

### Update App URL

When deploying, update `NEXT_PUBLIC_APP_URL` in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Also update `/public/.well-known/farcaster.json`:
```json
{
  "url": "https://your-domain.com",
  "splashImage": "https://your-domain.com/og-image.png",
  "buttons": {
    "1": {
      "target": "https://your-domain.com/mint"
    }
  },
  "homeUrl": "https://your-domain.com"
}
```

### Add to FarCaster Frame Registry

1. Host the app on a domain
2. Share Frame casts that link to `/api/frame?fid={fid}`
3. Users can interact with the Frame and mint NFTs

## API Routes

### GET `/api/frame`

Returns Frame v2 HTML with image and button.

```
Query Params:
- fid (optional): FarCaster ID
```

### POST `/api/frame`

Processes Frame action (supports both GET/POST for flexibility).

## NFT Metadata & OpenSea Integration

### Overview

This project uses **dynamic NFT metadata** - the NFT image and attributes are generated on-demand based on the token's seed (derived from tokenId, FID, or wallet address). This means:

- **No IPFS storage required** - images are generated by the server
- **Consistent metadata** - same tokenId always produces same image
- **OpenSea compatible** - ERC721 compliant metadata format

### API Endpoints

#### GET `/api/nft-metadata?tokenId=X`

Returns ERC721 compliant JSON metadata for a token:

```json
{
  "name": "PixelCaster AI #00001",
  "description": "A unique pixel pattern generated by AI...",
  "image": "https://your-domain.com/api/nft-image?tokenId=1",
  "image_url": "https://your-domain.com/api/nft-image?tokenId=1",
  "external_url": "https://your-domain.com/nft/1",
  "background_color": "6B7280",
  "traits": [...],
  "attributes": [...]  
}
```

#### GET `/api/nft-image?tokenId=X`

Returns generated PNG image (1200x1200) for the NFT.

### Smart Contract Integration

For OpenSea to display your NFTs correctly, the smart contract must implement `tokenURI`:

```solidity
// In your smart contract
string private constant BASE_URI = "https://your-domain.com/api/nft-metadata?tokenId=";

function tokenURI(uint256 tokenId) public view override returns (string memory) {
    return string(abi.encodePacked(BASE_URI, Strings.toString(tokenId)));
}
```

### Environment Variables

Set `NEXT_PUBLIC_BASE_URL` in `.env.local` to your production domain:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

This ensures the metadata URLs in OpenSea point to the correct domain.

## Customization

### Change Mint Price

Edit `/components/mini-app.tsx`:
```typescript
const MINT_PRICE = '0.002' // 0.002 ETH
```

### Change Contract Address

Update `/components/mini-app.tsx`:
```typescript
const NFT_CONTRACT_ADDRESS = '0xBee2A3b777445E212886815A5384f6F4e8902d21'
```

### Update Colors and Styling

The app uses Tailwind CSS with a dark theme. Colors are defined using Tailwind classes in components:
- Primary: `from-blue-600 to-blue-700`
- Background: `from-slate-900 via-blue-900 to-slate-900`

## Deployment

### Vercel Deployment

1. Connect your GitHub repository
2. Deploy to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_NEYNAR_API_KEY`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)

### Docker Deployment

```bash
docker build -t base-mint .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_NEYNAR_API_KEY=... \
  -e NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=... \
  -e NEXT_PUBLIC_APP_URL=... \
  base-mint
```

## License

MIT
