import { useEffect, useState } from 'react'
import { Button, Dropdown, Modal, message } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  connectInjected,
  connectWalletConnect,
  discoverInjected,
  hasWindowEthereum,
  wcAvailable,
  type Eip6963ProviderDetail,
} from '../wallet/wallets'
import { applyConnection, disconnectWallet } from '../wallet/session'
import { useAppStore } from '../store'
import { shortAddr } from '../lib/utils'

// Connect entry (header). Browser wallets are listed via EIP-6963 discovery,
// WalletConnect v2 covers mobile / extension-less wallets (replacing the dead
// v1 path). The keeper starts in the background via applyConnection.

export default function ConnectButton() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)
  const chainId = useAppStore((s) => s.chainId)
  const [open, setOpen] = useState(false)
  const [wallets, setWallets] = useState<Eip6963ProviderDetail[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void discoverInjected().then((list) => {
      if (!cancelled) setWallets(list)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const testnet = chainId === 97

  async function handleInjected(detail: Eip6963ProviderDetail | null) {
    const provider = detail?.provider ?? (hasWindowEthereum() ? window.ethereum : null)
    if (!provider) return
    setConnecting(detail?.info.uuid ?? 'browser')
    try {
      await applyConnection(await connectInjected(provider))
      setOpen(false)
    } catch (e) {
      if ((e as Error).message === 'unsupported network') {
        message.error(t('relink-wallet'))
      } else {
        message.error((e as Error).message)
      }
    } finally {
      setConnecting(null)
    }
  }

  async function handleWalletConnect() {
    setConnecting('walletconnect')
    try {
      await applyConnection(await connectWalletConnect())
      setOpen(false)
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setConnecting(null)
    }
  }

  if (address) {
    return (
      <Dropdown
        menu={{
          items: [{ key: 'disconnect', label: t('disconnect') }],
          onClick: ({ key }) => {
            if (key === 'disconnect') void disconnectWallet()
          },
        }}
      >
        <Button block type="primary" ghost>
          {shortAddr(address)}
          {testnet ? ' (TESTNET)' : ''}
        </Button>
      </Dropdown>
    )
  }

  const noWalletAtAll = wallets.length === 0 && !hasWindowEthereum() && !wcAvailable()

  return (
    <>
      <Button block type="primary" onClick={() => setOpen(true)}>
        {t('connect')}
      </Button>
      <Modal
        title={t('connect')}
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        width={380}
      >
        {noWalletAtAll ? (
          <div className="connect-install">
            <h4>{t('con-f1')}</h4>
            <p>{t('con-f2')}</p>
            <p>{t('con-f3')}</p>
            <ul>
              <li>
                <a href="https://chrome.google.com/webstore/search/metamask" target="_blank" rel="noreferrer">
                  Chrome
                </a>
              </li>
              <li>
                <a href="https://chrome.google.com/webstore/search/metamask" target="_blank" rel="noreferrer">
                  Brave
                </a>
              </li>
              <li>
                <a
                  href="https://addons.mozilla.org/firefox/addon/ether-metamask"
                  target="_blank"
                  rel="noreferrer"
                >
                  Firefox
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <div className="connect-list">
            {wallets.map((w) => (
              <Button
                key={w.info.uuid}
                block
                size="large"
                loading={connecting === w.info.uuid}
                onClick={() => void handleInjected(w)}
              >
                <img src={w.info.icon} alt="" width={22} height={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                {w.info.name}
              </Button>
            ))}
            {wallets.length === 0 && hasWindowEthereum() && (
              <Button
                block
                size="large"
                loading={connecting === 'browser'}
                onClick={() => void handleInjected(null)}
              >
                {t('connect')}
              </Button>
            )}
            {wcAvailable() && (
              <Button
                block
                size="large"
                loading={connecting === 'walletconnect'}
                onClick={() => void handleWalletConnect()}
              >
                WalletConnect
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
