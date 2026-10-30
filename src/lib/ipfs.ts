// IPFS helpers: session-level metadata cache + gateway chain retry.
// Gateway list keeps only services known alive (infura-ipfs.io is dead,
// nftstorage.link deprecated).

const GATEWAYS = [
  'https://cf-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://w3s.link/ipfs/',
]

export interface IpfsMeta {
  image?: string
  name?: string
  [k: string]: unknown
}

const metaCache = new Map<string, IpfsMeta>()

export function isIpfsUri(uri: string): boolean {
  return uri.startsWith('ipfs://') || uri.includes('/ipfs/')
}

export function gatewayUrl(uri: string, gatewayIndex = 0): string {
  if (!uri.startsWith('ipfs://')) return uri
  const g = GATEWAYS[((gatewayIndex % GATEWAYS.length) + GATEWAYS.length) % GATEWAYS.length]
  return g + uri.replace(/^ipfs:\/\//, '')
}

export function gatewayCount(): number {
  return GATEWAYS.length
}

/** fetch ipfs (or plain http) json, trying every gateway in order; cached per uri */
export async function fetchIpfsJson(uri: string): Promise<IpfsMeta> {
  const cached = metaCache.get(uri)
  if (cached) return cached
  const urls = uri.startsWith('http') ? [uri] : GATEWAYS.map((_, i) => gatewayUrl(uri, i))
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const json = (await res.json()) as IpfsMeta
      metaCache.set(uri, json)
      return json
    } catch {
      // try next gateway
    }
  }
  throw new Error(`ipfs fetch failed: ${uri}`)
}
