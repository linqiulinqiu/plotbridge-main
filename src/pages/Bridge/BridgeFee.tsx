import { useState } from 'react'
import { Button, Popover, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { bridgeContracts } from '../../keeper'
import { getFee } from '../../bridge'
import { formatToken } from '../../lib/tokens'
import type { CoinInfo } from './hooks'

interface FeeDisplay {
  depSuggest: string
  wLimit: string
  dFee: string
  dRate: number
  wFee: string
  wRate: number
}

// fee & limit popover, ported from bridge/BridgeFee.vue
export default function BridgeFee({ coin }: { coin: CoinInfo }) {
  const { t } = useTranslation()
  const [info, setInfo] = useState<FeeDisplay | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const ctx = useAppStore.getState().ctx!
      const bc = bridgeContracts(ctx)
      const ctr = bc.coins[coin.index]?.contract
      if (!ctr) return
      const [minRaw, maxRaw]: [bigint, bigint] = await ctr.cWAmount()
      const [depSuggest, wLimit, dFee, wFee] = await Promise.all([
        formatToken(ctx, coin.address, (maxRaw - minRaw) / 2n),
        formatToken(ctx, coin.address, minRaw),
        getFee(ctx, ctr, 'deposit'),
        getFee(ctx, ctr, 'withdraw'),
      ])
      setInfo({
        depSuggest,
        wLimit,
        dFee: dFee.min,
        dRate: dFee.rate,
        wFee: wFee.min,
        wRate: wFee.rate,
      })
    } catch {
      // popover stays empty on failure; retry by clicking again
    } finally {
      setLoading(false)
    }
  }

  const content = info ? (
    <div style={{ lineHeight: 1.9 }}>
      {t('dep-limit')} : {info.depSuggest}
      <br />
      {t('w-limit')}：{info.wLimit}
      <br />
      {t('beyond-limit')}
      <br />
      {t('dep-rate')}: {info.dRate / 100}%，{t('dep-minFee')}：{info.dFee}
      {coin.symbol}
      <br />
      {t('w-rate')}：{info.wRate / 100}%，{t('w-minFee')}：{info.wFee}
      {coin.symbol}
    </div>
  ) : (
    <Spin />
  )

  return (
    <Popover content={content} title="fees" trigger="click" onOpenChange={(o) => o && void load()}>
      <Button shape="circle" type="primary" ghost size="small" loading={loading}>
        {loading ? '' : 'i'}
      </Button>
    </Popover>
  )
}
