export interface UserProfile {
  fid: number
  username: string
  displayName: string
  pfp: {
    url: string
  }
  profile: {
    bio: {
      text: string
    }
  }
}

export async function getUserProfile(fid: number): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/user-profile?fid=${fid}`)

    if (!response.ok) {
      console.error('Failed to fetch user profile:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export interface FidLookupResult {
  fid: number
  username: string
  displayName: string
}

export async function getFidFromAddress(address: string): Promise<FidLookupResult | null> {
  try {
    const response = await fetch(`/api/fid-from-address?address=${address}`)

    if (!response.ok) {
      console.error('Failed to fetch FID from address:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching FID from address:', error)
    return null
  }
}

export function generateNftImageUrl(fid: number, username: string): string {
  return `/api/nft-image?fid=${fid}&username=${encodeURIComponent(username)}`
}
