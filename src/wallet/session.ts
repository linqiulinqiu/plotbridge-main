import {
  toBrowserProvider,
  onWalletEvents,
  disconnectWalletConnect,
  restoreWalletConnect,
  discoverInjected,
  hasWindowEthereum,
  connectInjectedSilent,
  type ConnectResult,
} from './wallets'
import { startKeeper } from '../keeper'
import { LAST_CONNECTOR_KEY, useAppStore } from '../store'

// Connection session handling shared by the connect dialog and the page-load
// auto-reconnect. The keeper starts in the background so the connect click
// never blocks on NFT loading.

export async function applyConnection(res: ConnectResult): Promise<void> {
  // auto-reconnect may race a manual connect (same address); skip the
  // duplicate so the keeper is not started twice
  if (useAppStore.getState().address === res.address) return
  const provider = toBrowserProvider(res.eip1193, res.chainId)
  const signer = await provider.getSigner()
  useAppStore.getState().setWallet(res, provider, signer)
  localStorage.setItem(LAST_CONNECTOR_KEY, res.connector)
  onWalletEvents(res.eip1193, {
    accountsChanged: () => window.location.reload(),
    chainChanged: () => window.location.reload(),
    disconnect: () => window.location.reload(),
  })
  const ctx = useAppStore.getState().ctx
  if (ctx) startKeeper(ctx)
}

export async function disconnectWallet(): Promise<void> {
  const state = useAppStore.getState()
  if (state.connector === 'walletconnect') {
    await disconnectWalletConnect()
  }
  localStorage.removeItem(LAST_CONNECTOR_KEY)
  state.clearWallet()
}

/** silent auto-reconnect on page load; returns without connecting when nothing to restore */
export async function autoReconnect(): Promise<void> {
  const last = localStorage.getItem(LAST_CONNECTOR_KEY)
  if (!last) return
  if (useAppStore.getState().address) return
  try {
    if (last === 'walletconnect') {
      const res = await restoreWalletConnect()
      if (res) await applyConnection(res)
      return
    }
    if (last === 'injected') {
      const wallets = await discoverInjected()
      const pick = wallets[0]?.provider ?? (hasWindowEthereum() ? window.ethereum : null)
      if (!pick) return
      const res = await connectInjectedSilent(pick)
      if (res) await applyConnection(res)
    }
  } catch {
    // stale session — stay disconnected
  }
}
