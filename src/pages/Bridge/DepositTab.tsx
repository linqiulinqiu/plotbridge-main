import { useEffect, useState } from 'react'
import { Button, Input, Skeleton, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { CopyOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import { bridgeContracts, loadPbxs } from '../../keeper'
import { afterFee, bindDepositAddr, type AfterFeeResult } from '../../bridge'
import type { CoinInfo } from './hooks'
import { useCurrentNft, usePbxsEntry } from './hooks'
import ContactLinks from '../../components/ContactLinks'

// deposit flow (bridge-enabled coins only): show/assign the deposit address
// bound to the selected PBT, ported from bridge/Deposit.vue
export default function DepositTab({ coin }: { coin: CoinInfo }) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const nft = useCurrentNft()
  const pbxs = usePbxsEntry()
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState<AfterFeeResult | null>(null)
  const [binding, setBinding] = useState(false)
  const [bindables, setBindables] = useState<number | null>(null)

  const pbtId = nft?.id

  useEffect(() => {
    setAmount('')
    setResult(null)
  }, [coin.index, pbtId])

  // when no address assigned yet, check the contract pool
  useEffect(() => {
    if (!ctx || !pbxs || pbxs.depositAddr || bindables !== null) return
    const bc = bridgeContracts(ctx)
    void bc.puzzlehash
      .bindables(coin.index)
      .then((n: bigint) => setBindables(Number(n)))
      .catch(() => setBindables(0))
  }, [ctx, pbxs, bindables, coin.index])

  useEffect(() => {
    if (!amount || !ctx) {
      setResult(amount ? { kind: 'invalid' } : null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const bc = bridgeContracts(ctx)
        const ctr = bc.coins[coin.index]?.contract
        if (!ctr) return
        const r = await afterFee(ctx, ctr, 'deposit', amount)
        if (!cancelled) setResult(r)
      } catch {
        if (!cancelled) setResult({ kind: 'invalid' })
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [amount, ctx, coin.index])

  if (!pbxs) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  async function getDepositAddr() {
    if (!ctx || !pbtId) return
    setBinding(true)
    try {
      const res = await bindDepositAddr(ctx, pbtId, coin.index)
      if (res === 'none') {
        setBindables(0)
        message.info(t('getaddr'))
        return
      }
      const fresh = await loadPbxs(ctx, pbtId)
      const prev = useAppStore.getState().myList[pbtId]?.pbxs ?? {}
      useAppStore.getState().setPbtItem(pbtId, { pbxs: { ...prev, ...fresh } })
    } catch (e) {
      const msg = (e as { shortMessage?: string; message?: string }).shortMessage ?? (e as Error).message
      if (/bound|revert/i.test(msg)) {
        message.info(t('dep-rebind'))
      } else {
        message.error(msg)
      }
    } finally {
      setBinding(false)
    }
  }

  if (!pbxs.depositAddr) {
    if ((bindables ?? 1) > 0) {
      return (
        <div style={{ padding: '12px 0' }}>
          <Button type="primary" loading={binding} onClick={() => void getDepositAddr()}>
            {t('dep-addr', { bcoin: coin.symbol })}
          </Button>
        </div>
      )
    }
    return (
      <div style={{ padding: '12px 0', lineHeight: 2 }}>
        <p>{t('getaddr')}</p>
        <ContactLinks />
      </div>
    )
  }

  const depositAddr = pbxs.depositAddr

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(depositAddr)
      message.success(t('copy-ok'))
    } catch {
      message.error(t('copy-err'))
    }
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <div className="bridge-amount-row">
        <span>{t('deposit')}:</span>
        <Input
          className="bridge-amount-input"
          value={amount}
          maxLength={20}
          onChange={(e) => setAmount(e.target.value.trim())}
          placeholder={coin.symbol}
        />
      </div>
      <div className="addr-box">
        <span className="mono">{depositAddr}</span>
        <Button size="small" icon={<CopyOutlined />} onClick={() => void onCopy()} />
      </div>
      {amount !== '' && (
        <div style={{ marginTop: 12, lineHeight: 2 }}>
          <div>
            {t('get')}{' '}
            {result?.kind === 'ok' ? (
              <span className="font-accent">{result.value}</span>
            ) : (
              '---'
            )}{' '}
            {coin.bsymbol}，{t('inbsc')}。
          </div>
          {(result?.kind === 'invalid' || result?.kind === 'small') && (
            <i style={{ color: 'rgba(255,255,255,0.65)' }}>
              {result.kind === 'small' ? t('tips-amount1') : t('correct-amount')}
            </i>
          )}
        </div>
      )}
    </div>
  )
}
