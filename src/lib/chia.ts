// Thin accessor for the vendored chia-utils (public/js/chia-utils.js,
// attached to window.ChiaUtils) used for puzzle hash <-> bech32m address.

interface ChiaUtilsLike {
  address_to_puzzle_hash(address: string): string
  puzzle_hash_to_address(puzzleHash: string, prefix: string): string
}

declare global {
  interface Window {
    ChiaUtils?: ChiaUtilsLike
  }
}

export function chiaUtils(): ChiaUtilsLike {
  if (!window.ChiaUtils) {
    throw new Error('chia-utils not loaded')
  }
  return window.ChiaUtils
}

const UNBOUND_PATTERN = '1qqqqq'

/** puzzle hash -> bech32m address; null when unbound (zero hash) */
export function puzzleToAddress(puzzleHash: string, prefix: string): string | null {
  if (!puzzleHash || /^0x0+$/.test(puzzleHash)) return null
  const addr = chiaUtils().puzzle_hash_to_address(puzzleHash, prefix)
  if (addr.slice(prefix.length, prefix.length + UNBOUND_PATTERN.length) === UNBOUND_PATTERN) {
    return null
  }
  return addr
}

/** bech32m address -> puzzle hash (0x-prefixed); null when prefix mismatched */
export function addressToPuzzleHash(address: string, prefix: string): string | null {
  if (!address || !address.startsWith(prefix)) return null
  try {
    return chiaUtils().address_to_puzzle_hash(address)
  } catch {
    return null
  }
}
