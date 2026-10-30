import { Contract } from 'ethers'
import { wcoinAbi, pbpuzzlehashAbi, pbtAbi } from './config/abis'
import { chainById, enabledCoins, type WCoinInfo } from './config/chains'
import { fetchIpfsJson } from './lib/ipfs'
import { puzzleToAddress } from './lib/chia'
import { mapLimit } from './lib/utils'
import type { WalletCtx } from './lib/tokens'
import { useAppStore, type PbxsEntry } from './store'

// Keeper: loads the user's PBT list (metadata + deposit/withdraw puzzle-hash
// addresses per coin) and keeps it in sync via contract events.
// Loads run with bounded concurrency (no serial sleeps), metadata is cached
// per session and IPFS gateways are chained with retry (see lib/ipfs.ts).

export interface CoinContractInfo {
  info: WCoinInfo & { policy: { bridge?: boolean; withdrawOnly?: boolean }; address: string }
  contract: Contract
}

export interface BridgeContracts {
  /** key: coin index */
  coins: Record<number, CoinContractInfo>
  pbt: Contract
  puzzlehash: Contract
}

const contractsCache = new WeakMap<WalletCtx, BridgeContracts>()

export function bridgeContracts(ctx: WalletCtx): BridgeContracts {
  const cached = contractsCache.get(ctx)
  if (cached) return cached
  const chain = chainById(ctx.chainId)
  if (!chain) throw new Error(`unsupported chain: ${ctx.chainId}`)
  const coins: Record<number, CoinContractInfo> = {}
  for (const info of enabledCoins(chain)) {
    coins[info.index] = { info, contract: new Contract(info.address, wcoinAbi, ctx.signer) }
  }
  const pbt = new Contract(chain.contracts.pbt, pbtAbi, ctx.signer)
  const puzzlehash = new Contract(chain.contracts.pbpuzzlehash, pbpuzzlehashAbi, ctx.signer)
  const ctrs = { coins, pbt, puzzlehash }
  contractsCache.set(ctx, ctrs)
  return ctrs
}

export async function loadPbxs(ctx: WalletCtx, pbtId: string): Promise<Record<string, PbxsEntry>> {
  const bc = bridgeContracts(ctx)
  const coins = Object.values(bc.coins)
  const pbxs: Record<string, PbxsEntry> = {}
  await mapLimit(coins, 4, async ({ info }) => {
    try {
      const res = await bc.puzzlehash.pbtPuzzleHash(pbtId, info.index)
      pbxs[String(info.index)] = {
        depositAddr: puzzleToAddress(res[0], info.prefix),
        withdrawAddr: puzzleToAddress(res[1], info.prefix),
      }
    } catch {
      pbxs[String(info.index)] = { depositAddr: null, withdrawAddr: null }
    }
  })
  return pbxs
}

async function loadIds(ctx: WalletCtx): Promise<string[]> {
  const bc = bridgeContracts(ctx)
  const cnt = Number(await bc.pbt.balanceOf(ctx.address))
  const indexes = Array.from({ length: cnt }, (_, i) => i)
  return mapLimit(indexes, 3, async (i) => String(await bc.pbt.tokenOfOwnerByIndex(ctx.address, i)))
}

async function loadItemMeta(ctx: WalletCtx, id: string): Promise<void> {
  const bc = bridgeContracts(ctx)
  const store = useAppStore.getState()
  try {
    const uri: string = await bc.pbt.tokenURI(id)
    const meta = await fetchIpfsJson(uri)
    store.setPbtItem(id, {
      uri,
      image: (meta.image as string | undefined) ?? null,
      name: meta.name as string | undefined,
      loading: false,
    })
  } catch {
    store.setPbtItem(id, { image: null, loading: false })
  }
}

export async function loadPbtList(ctx: WalletCtx): Promise<void> {
  const store = useAppStore.getState()
  try {
    const ids = await loadIds(ctx)
    for (const id of ids) {
      if (!useAppStore.getState().myList[id]) store.setPbtItem(id, { id, loading: true })
    }
    await mapLimit(ids, 3, (id) => loadItemMeta(ctx, id))
    await mapLimit(ids, 3, async (id) => {
      const pbxs = await loadPbxs(ctx, id)
      useAppStore.getState().setPbtItem(id, { pbxs })
    })
  } finally {
    useAppStore.getState().setListLoaded(true)
  }
}

async function reloadPbxsIntoList(ctx: WalletCtx, pbtId: string): Promise<void> {
  const store = useAppStore.getState()
  if (!(pbtId in store.myList)) return
  const pbxs = await loadPbxs(ctx, pbtId)
  store.setPbtItem(pbtId, { pbxs })
}

export function startKeeper(ctx: WalletCtx): void {
  const bc = bridgeContracts(ctx)
  const user = ctx.address
  void loadPbtList(ctx)

  bc.pbt.on(bc.pbt.filters.Transfer(null, user), async (_from, _to, tokenId) => {
    const id = tokenId.toString()
    useAppStore.getState().setPbtItem(id, { id, loading: true })
    await loadItemMeta(ctx, id)
    const pbxs = await loadPbxs(ctx, id)
    useAppStore.getState().setPbtItem(id, { pbxs })
  })
  bc.pbt.on(bc.pbt.filters.Transfer(user, null), (_from, _to, tokenId) => {
    useAppStore.getState().removePbtItem(tokenId.toString())
  })
  bc.puzzlehash.on(bc.puzzlehash.filters.WithdrawPuzzleHashChanged(null, null, null), (pbtId) => {
    void reloadPbxsIntoList(ctx, pbtId.toString())
  })
  bc.puzzlehash.on(bc.puzzlehash.filters.DepositPuzzleHashChanged(null, null, null), (pbtId) => {
    void reloadPbxsIntoList(ctx, pbtId.toString())
  })
}
