import { useState } from 'react'
import { gatewayCount, gatewayUrl } from '../lib/ipfs'

// NFT image with gateway fallback: on load error, cycle to the next IPFS
// gateway (P1: old code gave up after the first gateway failure).
export default function NftImage({ uri, alt }: { uri?: string | null; alt?: string }) {
  const [idx, setIdx] = useState(0)
  if (!uri) {
    return <div className="nft-img-placeholder" aria-label={alt} />
  }
  return (
    <img
      src={gatewayUrl(uri, idx)}
      alt={alt ?? ''}
      loading="lazy"
      onError={() => setIdx((idx + 1) % gatewayCount())}
    />
  )
}
