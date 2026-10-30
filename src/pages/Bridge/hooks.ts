import { useMemo } from 'react'
import { chainById, enabledCoins, type WCoinInfo, type WCoinPolicy } from '../../config/chains'
import { useAppStore, type PbtItem } from '../../store'

export type CoinInfo = WCoinInfo & { policy: WCoinPolicy; address: string }

export function useCoinlist(): CoinInfo[] {
  const chainId = useAppStore((s) => s.chainId)
  return useMemo(() => {
    const chain = chainById(chainId)
    return chain ? (enabledCoins(chain) as CoinInfo[]) : []
  }, [chainId])
}

export function useCurrentCoin(): CoinInfo | null {
  const coins = useCoinlist()
  const currentCoin = useAppStore((s) => s.currentCoin)
  return coins.find((c) => c.index === currentCoin) ?? null
}

export function useCurrentNft(): PbtItem | null {
  const myList = useAppStore((s) => s.myList)
  const currentPbtId = useAppStore((s) => s.currentPbtId)
  if (!currentPbtId) return null
  return myList[currentPbtId] ?? null
}

export function usePbxsEntry(): { depositAddr: string | null; withdrawAddr: string | null } | null {
  const nft = useCurrentNft()
  const currentCoin = useAppStore((s) => s.currentCoin)
  if (!nft?.pbxs || currentCoin === null) return null
  return nft.pbxs[String(currentCoin)] ?? null
}

/** count of PBTs owning a bound withdraw address for the given coin */
export function useWithdrawBinded(coinIndex: number | null): number {
  const myList = useAppStore((s) => s.myList)
  if (coinIndex === null) return 0
  let binded = 0
  for (const item of Object.values(myList)) {
    if (item.pbxs?.[String(coinIndex)]?.withdrawAddr) binded++
  }
  return binded
}
