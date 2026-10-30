import { create } from 'zustand'
import type { Eip1193Provider, BrowserProvider, JsonRpcSigner } from 'ethers'
import type { ConnectorType, ConnectResult } from './wallet/wallets'
import type { WalletCtx } from './lib/tokens'

export interface PbxsEntry {
  depositAddr: string | null
  withdrawAddr: string | null
}

export interface MarketSaleInfo {
  priceToken: string
  ptName: string
  price: string
  desc: string
  /** '-self' when the connected wallet is the seller (contract-side marker) */
  seller: string
}

export interface PbtItem {
  id: string
  uri?: string
  /** raw image field from metadata (may be ipfs://), resolved by NftImage */
  image?: string | null
  name?: string
  loading: boolean
  /** key: coin index (string) */
  pbxs?: Record<string, PbxsEntry>
  /** set for tokens held by the market contract */
  market?: MarketSaleInfo
}

interface AppState {
  connector: ConnectorType | null
  eip1193: Eip1193Provider | null
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  /** bundle of provider/signer/address/chainId for contract calls */
  ctx: WalletCtx | null
  address: string | null
  chainId: number | null

  myList: Record<string, PbtItem>
  listLoaded: boolean
  currentPbtId: string | null
  currentCoin: number | null
  /** key: coin index; value: formatted balance */
  wBalance: Record<number, string>

  marketList: Record<string, PbtItem>
  mySaleList: Record<string, PbtItem>
  marketLoaded: boolean
  /** total value locked in USD, as computed by pbp.loadTvl */
  tvl: number

  setWallet: (res: ConnectResult, provider: BrowserProvider, signer: JsonRpcSigner) => void
  clearWallet: () => void

  setPbtItem: (id: string, patch: Partial<PbtItem>) => void
  removePbtItem: (id: string) => void
  setListLoaded: (done: boolean) => void
  setCurrentPbt: (id: string | null) => void
  setCurrentCoin: (index: number | null) => void
  setWBalance: (index: number, value: string) => void

  /** classify a market-held token into mySaleList / marketList (old-site rule) */
  upsertMarketItem: (item: PbtItem) => void
  removeMarketItem: (id: string) => void
  setMarketLoaded: (done: boolean) => void
  setTvl: (tvl: number) => void
}

export const LAST_CONNECTOR_KEY = 'plotbridge-last-connector'

export const useAppStore = create<AppState>((set) => ({
  connector: null,
  eip1193: null,
  provider: null,
  signer: null,
  ctx: null,
  address: null,
  chainId: null,

  myList: {},
  listLoaded: false,
  currentPbtId: null,
  currentCoin: null,
  wBalance: {},

  marketList: {},
  mySaleList: {},
  marketLoaded: false,
  tvl: 0,

  setWallet: (res, provider, signer) =>
    set({
      connector: res.connector,
      eip1193: res.eip1193,
      provider,
      signer,
      ctx: { provider, signer, address: res.address, chainId: res.chainId },
      address: res.address,
      chainId: res.chainId,
      myList: {},
      listLoaded: false,
      currentPbtId: null,
      currentCoin: null,
      wBalance: {},
      marketList: {},
      mySaleList: {},
      marketLoaded: false,
      tvl: 0,
    }),

  clearWallet: () =>
    set({
      connector: null,
      eip1193: null,
      provider: null,
      signer: null,
      ctx: null,
      address: null,
      chainId: null,
      myList: {},
      listLoaded: false,
      currentPbtId: null,
      currentCoin: null,
      wBalance: {},
      marketList: {},
      mySaleList: {},
      marketLoaded: false,
      tvl: 0,
    }),

  setPbtItem: (id, patch) =>
    set((state) => {
      const prev = state.myList[id] ?? { id, loading: true }
      return { myList: { ...state.myList, [id]: { ...prev, ...patch } } }
    }),

  removePbtItem: (id) =>
    set((state) => {
      if (!(id in state.myList)) return state
      const myList = { ...state.myList }
      delete myList[id]
      const patch: Partial<AppState> = { myList }
      if (state.currentPbtId === id) patch.currentPbtId = null
      return patch
    }),

  setListLoaded: (done) => set({ listLoaded: done }),
  setCurrentPbt: (id) => set({ currentPbtId: id }),
  setCurrentCoin: (index) => set({ currentCoin: index }),
  setWBalance: (index, value) =>
    set((state) => ({ wBalance: { ...state.wBalance, [index]: value } })),

  upsertMarketItem: (item) =>
    set((state) => {
      const marketList = { ...state.marketList }
      const mySaleList = { ...state.mySaleList }
      if (item.market?.seller === '-self') mySaleList[item.id] = item
      if (item.market && item.market.price !== '0.0') marketList[item.id] = item
      return { marketList, mySaleList }
    }),

  removeMarketItem: (id) =>
    set((state) => {
      const patch: Partial<AppState> = {}
      if (id in state.marketList) {
        const marketList = { ...state.marketList }
        delete marketList[id]
        patch.marketList = marketList
      } else if (id in state.mySaleList) {
        const mySaleList = { ...state.mySaleList }
        delete mySaleList[id]
        patch.mySaleList = mySaleList
      }
      if (state.currentPbtId === id) patch.currentPbtId = null
      return Object.keys(patch).length ? patch : state
    }),

  setMarketLoaded: (done) => set({ marketLoaded: done }),
  setTvl: (tvl) => set({ tvl }),
}))

/** current NFT for the market page: own list first, then my sales, then market */
export function selectMarketNft(state: AppState): PbtItem | null {
  if (!state.currentPbtId) return null
  const id = state.currentPbtId
  return state.myList[id] ?? state.mySaleList[id] ?? state.marketList[id] ?? null
}

/** current NFT derived from myList + currentPbtId */
export function selectCurrentNft(state: AppState): PbtItem | null {
  if (!state.currentPbtId) return null
  return state.myList[state.currentPbtId] ?? null
}

// dev-only debug handle for the browser console / e2e smoke tests
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__pbstore = useAppStore
}
