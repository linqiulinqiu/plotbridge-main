import { Alert, Button, Skeleton, Tabs, Tooltip, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { bridgeContracts } from '../../keeper'
import { tokenDecimals } from '../../lib/tokens'
import { watchAsset } from '../../wallet/wallets'
import { tList } from '../../i18n'
import { useCurrentCoin, useCurrentNft } from './hooks'
import BridgeFee from './BridgeFee'
import DepositTab from './DepositTab'
import WithdrawTab from './WithdrawTab'
import RedeemTab from './RedeemTab'

export default function BridgeMain() {
  const { t } = useTranslation()
  const myList = useAppStore((s) => s.myList)
  const wBalance = useAppStore((s) => s.wBalance)
  const coin = useCurrentCoin()
  const nft = useCurrentNft()

  if (Object.keys(myList).length === 0) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <h1>{t('bridge-guide')}</h1>
        <div style={{ marginTop: 16, lineHeight: 2 }}>
          <h4>1.{t('b-guide1')}</h4>
          <h4>2.{t('b-guide2')}</h4>
          <h4>3.{t('b-guide3')}</h4>
        </div>
      </div>
    )
  }
  if (!nft) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <h3>{t('openNFT')}</h3>
      </div>
    )
  }
  if (!coin) {
    return (
      <div style={{ padding: '40px 24px' }}>
        <h3>{t('select-coin')}</h3>
      </div>
    )
  }

  const balance = wBalance[coin.index]
  const withdrawOnly = !!coin.policy.withdrawOnly

  async function addToken() {
    try {
      const state = useAppStore.getState()
      if (!state.eip1193 || !state.ctx) return
      const bc = bridgeContracts(state.ctx)
      const coinCtr = bc.coins[coin!.index]
      if (!coinCtr) return
      await watchAsset(state.eip1193, {
        address: coin!.address,
        symbol: coin!.bsymbol,
        decimals: await tokenDecimals(state.ctx, coin!.address),
        image: window.location.origin + '/image/' + coin!.ctrname + '.png',
      })
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <div className="bridge-amount-row" style={{ marginBottom: 12 }}>
        <span>
          {t('balance')}:{' '}
          {balance === undefined ? <Skeleton.Node active style={{ width: 60, height: 20 }} /> : <span className="font-accent">{balance}</span>}
          <span style={{ marginLeft: 6 }}>{coin.bsymbol}</span>
        </span>
        <Tooltip title={t('add-token-tip')}>
          <Button size="small" onClick={() => void addToken()}>
            {t('add-token')}
          </Button>
        </Tooltip>
        <BridgeFee coin={coin} />
      </div>

      {withdrawOnly && (
        <Alert
          className="wo-notice"
          type="warning"
          showIcon
          closable={false}
          message={t('wo-notice-title')}
          description={tList('wo-notice').map((line) => (
            <p key={line} style={{ margin: '2px 0' }}>
              {line}
            </p>
          ))}
          style={{ marginBottom: 12 }}
        />
      )}

      <Tabs
        items={[
          ...(withdrawOnly
            ? []
            : [{ key: 'deposit', label: t('deposit'), children: <DepositTab coin={coin} /> }]),
          { key: 'withdraw', label: t('withdraw'), children: <WithdrawTab coin={coin} /> },
          { key: 'redeem', label: t('redeem'), children: <RedeemTab /> },
        ]}
      />
    </div>
  )
}
