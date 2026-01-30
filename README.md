# Base Mainnet NFT Mint - Farcaster Mini App

A complete Farcaster Mini App for minting NFTs on Base mainnet. This application includes both a Frame v2 cast button and a full-featured mini app experience.

## Features

- **Farcaster Integration**: Seamlessly integrated with Farcaster Frames v2
- **Base Mainnet**: Native support for Base mainnet NFT minting
- **Wallet Connection**: Support for WalletConnect and injected wallets via wagmi
- **Neynar API**: Reads user profile data from Farcaster
- **Signature-based Minting**: Secure minting with ERC721 contract interaction
- **Dynamic UI**: Beautiful, responsive interface with Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Environment Variables** (already configured in `.env.local`):
```
NEXT_PUBLIC_NEYNAR_API_KEY=99444B06-5A19-493E-B66D-3F746EC2B622
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=f03daf2432f860f65def7efa1dfe7324
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Start development server**:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

## Project Structure

### Key Files

- **`/app/page.tsx`** - Landing page with information about the mint
- **`/app/mint/page.tsx`** - Mini app page (opened from Farcaster Frame)
- **`/components/mini-app.tsx`** - Main Mini App component with wallet connection and minting logic
- **`/app/api/frame/route.ts`** - Frame v2 endpoint for Farcaster integration
- **`/lib/wagmi.ts`** - Wagmi configuration for Base mainnet
- **`/lib/neynar.ts`** - Neynar API integration for profile fetching
- **`/lib/contractAbi.ts`** - NFT contract ABI
- **`/public/.well-known/farcaster.json`** - Farcaster app registry

### Contract Details

- **Contract Address**: `0x5717EEFadDEACE4DbB7e7189C860A88b4D9978cF`
- **Network**: Base Mainnet
- **Mint Price**: 0.001 ETH
- **Chain ID**: 8453

## How It Works

### Landing Page Flow

1. User visits the landing page at `/`
2. Page explains the feature and provides information about the NFT mint
3. Farcaster Frame button directs to `/api/frame` endpoint

### Farcaster Frame v2 Flow

1. Frame is shared as a cast in Farcaster
2. User clicks "Mint on Base" button in the Frame
3. Opens the mini app at `/mint?fid={user_fid}`
4. Mini app loads user profile via Neynar API
5. User connects wallet (WalletConnect or injected)
6. User clicks "Mint NFT" button
7. Wagmi writes to the contract
8. NFT is minted and transferred to the user's wallet

### Mini App Components

**Wallet Connection**
- Supports WalletConnect and injected wallets
- Displays connected address
- Shows balance and connection status

**Profile Display**
- Fetches Farcaster profile via Neynar API
- Shows avatar, username, and display name
- Displays FID (Farcaster ID)

**Minting**
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

### Add to Farcaster Frame Registry

1. Host the app on a domain
2. Share Frame casts that link to `/api/frame?fid={fid}`
3. Users can interact with the Frame and mint NFTs

## API Routes

### GET `/api/frame`

Returns Frame v2 HTML with image and button.

```
Query Params:
- fid (optional): Farcaster ID
```

### POST `/api/frame`

Processes Frame action (supports both GET/POST for flexibility).

## Customization

### Change Mint Price

Edit `/lib/wagmi.ts` and `/components/mini-app.tsx`:
```typescript
const MINT_PRICE = '0.002' // 0.002 ETH
```

### Change Contract Address

Update `/components/mini-app.tsx`:
```typescript
const NFT_CONTRACT_ADDRESS = '0x...'
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

## Dependencies

- **Next.js 16**: React framework
- **Wagmi 2**: Web3 library
- **Viem**: Ethereum utilities
- **Neynar**: Farcaster API
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components

## Troubleshooting

### Wallet Connection Issues

- Ensure WalletConnect Project ID is correct
- Check that wallet supports Base mainnet
- Try injected wallet (MetaMask, Coinbase Wallet)

### Neynar API Errors

- Verify API key is correct
- Check API rate limits (free tier: 100 req/min)
- Ensure FID is valid and public

### Contract Interaction Fails

- Confirm contract address is correct on Base mainnet
- Check wallet has sufficient balance (0.001+ ETH)
- Ensure contract is not paused

## License

MIT
