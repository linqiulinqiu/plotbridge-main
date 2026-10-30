import { useEffect, useState } from 'react'
import { Alert, Button, Input, Modal, Skeleton, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { EditOutlined, ExportOutlined } from '@ant-design/icons'
import { useAppStore } from '../../store'
import { bridgeContracts, loadPbxs } from '../../keeper'
import {
  afterFee,
  bindWithdrawAddr,
  burnWcoin,
  clearWithdrawAddr,
  type AfterFeeResult,
} from '../../bridge'
import { formatToken, tokenBalance } from '../../lib/tokens'
import type { CoinInfo } from './hooks'
import { useCurrentNft, usePbxsEntry, useWithdrawBinded } from './hooks'

// withdraw (burn) flow shared by every coin, incl. withdraw-only ones:
// bind native-chain address on the selected PBT, then burn W tokens — the
// burn event is the payout request, settled manually by the team
export default function WithdrawTab({ coin }: { coin: CoinInfo }) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const wBalance = useAppStore((s) => s.wBalance)
  const nft = useCurrentNft()
  const pbxs = usePbxsEntry()
  const binded = useWithdrawBinded(coin.index)
  const [wAddr, setWAddr] = useState('')
  const [wAmount, setWAmount] = useState('')
  const [result, setResult] = useState<AfterFeeResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState<'bind' | 'clear' | 'burn' | null>(null)

  const pbtId = nft?.id
  const balance = wBalance[coin.index]

  useEffect(() => {
    setWAddr('')
    setWAmount('')
    setResult(null)
  }, [coin.index, pbtId])

  useEffect(() => {
    if (wAmount === '' || !ctx) {
      setResult(wAmount === '' ? null : { kind: 'invalid' })
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const bc = bridgeContracts(ctx)
        const ctr = bc.coins[coin.index]?.contract
        if (!ctr) return
        const r = await afterFee(ctx, ctr, 'withdraw', wAmount, balance)
        if (!cancelled) setResult(r)
      } catch {
        if (!cancelled) setResult({ kind: 'invalid' })
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [wAmount, ctx, coin.index, balance])

  async function reloadPbxs() {
    if (!ctx || !pbtId) return
    const fresh = await loadPbxs(ctx, pbtId)
    const prev = useAppStore.getState().myList[pbtId]?.pbxs ?? {}
    useAppStore.getState().setPbtItem(pbtId, { pbxs: { ...prev, ...fresh } })
  }

  async function refreshBalance() {
    if (!ctx) return
    const bc = bridgeContracts(ctx)
    const coinCtr = bc.coins[coin.index]
    if (!coinCtr) return
    const bal = await tokenBalance(ctx, coinCtr.info.address)
    useAppStore.getState().setWBalance(coin.index, await formatToken(ctx, coinCtr.info.address, bal))
  }

  function errText(e: unknown): string {
    const err = e as { shortMessage?: string; message?: string }
    return err.shortMessage ?? err.message ?? String(e)
  }

  async function bind() {
    if (!ctx || !pbtId) return
    setBusy('bind')
    try {
      const ok = await bindWithdrawAddr(ctx, pbtId, coin.index, coin.prefix, wAddr)
      if (!ok) {
        message.warning(t('correct-waddr'))
        return
      }
      await reloadPbxs()
      setDialogOpen(false)
      setWAddr('')
    } catch (e) {
      message.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  async function clear() {
    if (!ctx || !pbtId) return
    setBusy('clear')
    try {
      await clearWithdrawAddr(ctx, pbtId, coin.index)
      await reloadPbxs()
      setDialogOpen(false)
    } catch (e) {
      message.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  async function withdraw() {
    if (!ctx || result?.kind !== 'ok') return
    setBusy('burn')
    try {
      const bc = bridgeContracts(ctx)
      const ctr = bc.coins[coin.index]!.contract
      await burnWcoin(ctx, ctr, wAmount, balance)
      await refreshBalance()
      setWAmount('')
      setResult(null)
    } catch (e) {
      message.error(errText(e))
    } finally {
      setBusy(null)
    }
  }

  if (!pbxs) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  const withdrawAddr = pbxs.withdrawAddr
  const abUrl = `https://alltheblocks.net/${coin.name.toLowerCase()}/address/${withdrawAddr}`

  if (!withdrawAddr) {
    return (
      <div style={{ padding: '12px 0' }}>
        {binded > 0 && (
          <p style={{ color: 'rgba(255,255,255,0.65)' }}>{t('tips-waddr')}</p>
        )}
        {binded === 0 && (
          <>
            <p>
              {t('input-addr')}
              <span style={{ fontSize: 13 }}> ({t('correct-addr')})</span>
            </p>
            <div className="bridge-amount-row">
              <Input
                style={{ width: 380, maxWidth: '100%' }}
                value={wAddr}
                placeholder={t('bind-waddr')}
                onChange={(e) => setWAddr(e.target.value.trim())}
              />
              <Button type="primary" loading={busy === 'bind'} onClick={() => void bind()}>
                {t('bind')}
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {binded > 1 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('bind-waddr-tips', { wbind: binded, ubind: binded - 1 })}
        />
      )}
      <p>
        {t('w-addr', { bcoin: coin.symbol })} :
        <br />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          {t('correct-addr')}
        </span>
      </p>
      <div className="addr-box">
        <span className="font-accent mono" style={{ flex: 1 }}>
          {withdrawAddr}
        </span>
        <a href={abUrl} target="_blank" rel="noreferrer" aria-label="alltheblocks">
          <ExportOutlined />
        </a>
        <Button size="small" icon={<EditOutlined />} onClick={() => setDialogOpen(true)} />
      </div>
      <div className="bridge-amount-row" style={{ marginTop: 12 }}>
        <span>{t('burn')} :</span>
        <Input
          className="bridge-amount-input"
          value={wAmount}
          maxLength={20}
          onChange={(e) => setWAmount(e.target.value.trim())}
        />
        <Button size="small" onClick={() => setWAmount(balance ?? '')}>
          {t('all')}
        </Button>
        <span>{coin.bsymbol}，</span>
        <Button
          type="primary"
          loading={busy === 'burn'}
          disabled={result?.kind !== 'ok'}
          onClick={() => void withdraw()}
        >
          {t('withdraw')}
        </Button>
      </div>
      {wAmount !== '' && (
        <div style={{ marginTop: 12, lineHeight: 2 }}>
          <p>
            {t('get')}{' '}
            {result?.kind === 'ok' ? (
              <span className="font-accent">{result.value}</span>
            ) : (
              '---'
            )}{' '}
            {coin.symbol}
          </p>
          {result && result.kind !== 'ok' && (
            <i style={{ color: 'rgba(255,255,255,0.65)' }}>
              {result.kind === 'fund'
                ? t('tips-amount2')
                : result.kind === 'small'
                  ? t('tips-amount1')
                  : t('correct-amount')}
            </i>
          )}
        </div>
      )}

      <Modal
        title={t('bind-waddr')}
        open={dialogOpen}
        footer={null}
        onCancel={() => setDialogOpen(false)}
      >
        <p>
          {t('input-addr')}
          <span style={{ fontSize: 13 }}> ({t('correct-addr')})</span>
          <Button
            size="small"
            danger
            style={{ float: 'right' }}
            loading={busy === 'clear'}
            onClick={() => void clear()}
          >
            {t('clear-waddr')}
          </Button>
        </p>
        <div className="bridge-amount-row" style={{ marginTop: 12 }}>
          <Input
            style={{ flex: 1 }}
            value={wAddr}
            onChange={(e) => setWAddr(e.target.value.trim())}
          />
          <Button type="primary" loading={busy === 'bind'} onClick={() => void bind()}>
            {t('bind-waddr')}
          </Button>
          <Button onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
        </div>
      </Modal>
    </div>
  )
}
