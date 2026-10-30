import { BrowserProvider, type Eip1193Provider } from 'ethers'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { CHAINS, type ChainArg } from '../config/chains'

// Wallet connection layer:
//  - browser wallets via EIP-6963 multi-provider discovery (each wallet
//    announces its own provider, so MetaMask stays selectable even when
//    window.ethereum was taken over by another extension, e.g. Phantom);
//  - mobile / no-extension wallets via WalletConnect v2 relay (replaces the
//    long-dead WalletConnect v1 bridge of the old site).
// The WC projectId comes from VITE_WALLETCONNECT_PROJECT_ID (.env, see
// .env.example); without it the WC entry stays hidden and injected still works.

export type ConnectorType = 'injected' | 'walletconnect'

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

export interface Eip6963ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string }
  provider: Eip1193Provider
}

const WC_PROJECT_ID: string = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? ''

export function wcAvailable(): boolean {
  return WC_PROJECT_ID !== ''
}

/** EIP-6963 discovery: announce window for 300ms, MetaMask first (legacy fix) */
export function discoverInjected(): Promise<Eip6963ProviderDetail[]> {
  return new Promise((resolve) => {
    const providers: Eip6963ProviderDetail[] = []
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail
      if (detail && detail.info && detail.provider) providers.push(detail)
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      const metamask = providers.filter(
        (d) => d.info.rdns === 'io.metamask' || /metamask/i.test(d.info.name ?? ''),
      )
      const rest = providers.filter((d) => !metamask.includes(d))
      resolve([...metamask, ...rest])
    }, 300)
  })
}

export function hasWindowEthereum(): boolean {
  return typeof window.ethereum !== 'undefined'
}

export interface ConnectResult {
  connector: ConnectorType
  eip1193: Eip1193Provider
  address: string
  chainId: number
}

export async function connectInjected(eip1193: Eip1193Provider): Promise<ConnectResult> {
  const accounts = (await eip1193.request({ method: 'eth_requestAccounts' })) as string[]
  if (!accounts || accounts.length === 0) throw new Error('no accounts')
  let chainIdHex = (await eip1193.request({ method: 'eth_chainId' })) as string
  let chainId = parseInt(chainIdHex, 16)
  if (!CHAINS.some((c) => c.chainId === chainId)) {
    // desktop: auto-switch to BSC mainnet like the old pbwallet flow
    await ensureChain(eip1193, CHAINS[0])
    chainIdHex = (await eip1193.request({ method: 'eth_chainId' })) as string
    chainId = parseInt(chainIdHex, 16)
    if (!CHAINS.some((c) => c.chainId === chainId)) {
      throw new Error('unsupported network')
    }
  }
  return { connector: 'injected', eip1193, address: accounts[0], chainId }
}

/** silent injected reconnect: only when already authorized and on a supported chain */
export async function connectInjectedSilent(
  eip1193: Eip1193Provider,
): Promise<ConnectResult | null> {
  try {
    const accounts = (await eip1193.request({ method: 'eth_accounts' })) as string[]
    if (!accounts || accounts.length === 0) return null
    const chainId = parseInt((await eip1193.request({ method: 'eth_chainId' })) as string, 16)
    if (!CHAINS.some((c) => c.chainId === chainId)) return null
    return { connector: 'injected', eip1193, address: accounts[0], chainId }
  } catch {
    return null
  }
}

let wcProvider: Awaited<ReturnType<typeof EthereumProvider.init>> | null = null

async function initWC() {
  if (!wcProvider) {
    wcProvider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID,
      chains: [CHAINS[0].chainId],
      optionalChains: CHAINS.map((c) => c.chainId),
      showQrModal: true,
      metadata: {
        name: 'PlotBridge',
        description: 'Chia assets on BSC',
        url: window.location.origin,
        icons: [window.location.origin + '/image/logo_000.png'],
      },
      rpcMap: Object.fromEntries(CHAINS.map((c) => [c.chainId, c.rpcUrl])),
    })
  }
  return wcProvider
}

function wcResult(): ConnectResult {
  const p = wcProvider!
  const address = p.accounts[0]
  if (!address) throw new Error('walletconnect: no accounts')
  return {
    connector: 'walletconnect',
    eip1193: p as unknown as Eip1193Provider,
    address,
    chainId: Number(p.chainId),
  }
}

/** silent session restore (no QR modal); null when no persisted session */
export async function restoreWalletConnect(): Promise<ConnectResult | null> {
  if (!WC_PROJECT_ID) return null
  await initWC()
  if (!wcProvider!.session) return null
  return wcResult()
}

export async function connectWalletConnect(): Promise<ConnectResult> {
  if (!WC_PROJECT_ID) throw new Error('walletconnect disabled: no projectId')
  const p = await initWC()
  if (!p.session) await p.connect()
  return wcResult()
}

export async function disconnectWalletConnect(): Promise<void> {
  if (wcProvider?.session) {
    try {
      await wcProvider.disconnect()
    } catch {
      // session may already be gone
    }
  }
}

/** switch to the given BSC chain, adding it to the wallet when missing */
export async function ensureChain(eip1193: Eip1193Provider, chain: ChainArg): Promise<boolean> {
  try {
    await eip1193.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.hexChainId }],
    })
    return true
  } catch (e) {
    const code = (e as { code?: number }).code
    const CHAIN_NOT_ADDED = 4902
    if (code === CHAIN_NOT_ADDED) {
      try {
        await eip1193.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chain.hexChainId,
              chainName: chain.chainName,
              nativeCurrency: {
                name: chain.nativeSymbol,
                symbol: chain.nativeSymbol,
                decimals: 18,
              },
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.explorerUrl],
            },
          ],
        })
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

/** add a wrapped coin to the wallet watch list (injected wallets only) */
export async function watchAsset(
  eip1193: Eip1193Provider,
  options: { address: string; symbol: string; decimals: number; image: string },
): Promise<boolean> {
  try {
    return await eip1193.request({
      method: 'wallet_watchAsset',
      params: { type: 'ERC20', options },
    } as never)
  } catch {
    return false
  }
}

export function toBrowserProvider(eip1193: Eip1193Provider, chainId: number): BrowserProvider {
  return new BrowserProvider(eip1193, chainId)
}

/** wallet event names differ across providers; register defensively */
export function onWalletEvents(
  eip1193: Eip1193Provider,
  handlers: { accountsChanged?: () => void; chainChanged?: () => void; disconnect?: () => void },
): void {
  const anyProvider = eip1193 as unknown as {
    on?: (evt: string, cb: () => void) => void
    removeListener?: (evt: string, cb: () => void) => void
  }
  if (typeof anyProvider.on !== 'function') return
  if (handlers.accountsChanged) {
    anyProvider.on('accountsChanged', handlers.accountsChanged)
    anyProvider.on('networkChanged', handlers.accountsChanged) // legacy event
  }
  if (handlers.chainChanged) anyProvider.on('chainChanged', handlers.chainChanged)
  if (handlers.disconnect) anyProvider.on('disconnect', handlers.disconnect)
}
