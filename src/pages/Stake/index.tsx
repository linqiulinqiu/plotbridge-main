import { useEffect, useState } from 'react'
import { Button, Collapse, Input, Modal, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { pbpContracts, loadStakedPools, type StakePoolRow } from '../../pbp'
import { formatToken, isLpToken, lpTokensOf, parseToken, tokenBalance, tokenSymbol } from '../../lib/tokens'
import { formatDuration, formatRelTS, humanFormat } from '../../lib/time'
import ApproveGate from '../../components/ApproveGate'
import TokenLinkButtons from '../../components/TokenLinkButtons'

// stake pools (old-site StakeMain + StakeCollapse + StakeHeader + StakeOperation)
export default function StakePage() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)
  if (!address) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2>{t('look-info')}</h2>
      </div>
    )
  }
  return <StakeMain />
}

function StakeMain() {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [rows, setRows] = useState<StakePoolRow[] | null>(null)
  const [startMsg, setStartMsg] = useState('')

  async function refresh() {
    if (!ctx) return
    try {
      setRows(await loadStakedPools(ctx))
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  useEffect(() => {
    if (!ctx) return
    void refresh()
    const { pbp } = pbpContracts(ctx)
    void pbp.stakeStart().then((ts: bigint) => setStartMsg(formatRelTS(ts)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])

  if (!ctx) return null
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px' }}>
      <h1>{t('stake-pool')}</h1>
      <h3>{t('stake-for')}</h3>
      <p>
        {t('stake-start')}：{startMsg}
      </p>
      {rows === null ? (
        <p>{t('data')}</p>
      ) : rows.length === 0 ? (
        <p>{t('data')}</p>
      ) : (
        <Collapse
          accordion
          items={rows.map((row) => ({
            key: String(row.pid),
            label: <PoolHeader row={row} onRefresh={refresh} />,
            children: <PoolBody row={row} />,
          }))}
        />
      )}
    </div>
  )
}

interface PoolInfo {
  symbol: string
  balanceBn: bigint
  balance: string
  farmAmount: string
  withdrawWait: number
  earned: string
  apy: string
  isLp: boolean
  lpTokens: [string, string] | null
}

function loadPoolInfo(ctx: NonNullable<ReturnType<typeof useAppStore.getState>['ctx']>, row: StakePoolRow): Promise<PoolInfo> {
  return (async () => {
    const { staking, pbp } = pbpContracts(ctx)
    const [symbol, balanceBn, stakeds, earned] = await Promise.all([
      tokenSymbol(ctx, row.stakeAddr),
      tokenBalance(ctx, row.stakeAddr),
      staking.staked(row.pid, ctx.address),
      staking.earned(row.pid, ctx.address),
    ])
    const farmAmount = await formatToken(ctx, row.stakeAddr, stakeds[0])
    const apy = ((row.rewardSpeed * 365 * 86400 * 100) / parseFloat(row.lpamount)).toFixed(4)
    const isLp = await isLpToken(ctx, row.stakeAddr)
    return {
      symbol,
      balanceBn,
      balance: await formatToken(ctx, row.stakeAddr, balanceBn),
      farmAmount,
      withdrawWait: Number(stakeds[1]),
      earned: await formatToken(ctx, await pbp.getAddress(), earned),
      apy,
      isLp,
      lpTokens: isLp ? await lpTokensOf(ctx, row.stakeAddr) : null,
    }
  })()
}

function PoolHeader({ row, onRefresh }: { row: StakePoolRow; onRefresh: () => void }) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [info, setInfo] = useState<PoolInfo | null>(null)

  async function load() {
    if (!ctx) return
    try {
      setInfo(await loadPoolInfo(ctx, row))
    } catch {
      // keep previous info on transient RPC errors
    }
  }

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 12000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, row.pid])

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', minWidth: 640 }}>
      <span style={{ fontWeight: 700, minWidth: 140 }}>
        {info ? `${info.symbol} Pool` : `${t('data')}…`}{' '}
        <Button size="small" shape="circle" icon={<ReloadOutlined />} onClick={(e) => { e.stopPropagation(); void load(); onRefresh() }} />
      </span>
      <span>
        <span className="mini-font">{t('lock-time')}</span>
        <br />
        <span className="num-font">{formatDuration(row.locktime)}</span>
      </span>
      <span>
        <span className="mini-font">{t('total-staked')}</span>
        <br />
        <span className="num-font">{humanFormat(row.lpamount)}</span>
      </span>
      <span>
        <span className="mini-font">APR</span>
        <br />
        <span className="num-font">{info?.apy ?? '--'}%</span>
      </span>
      <span>
        <span className="mini-font">{t('staking')}</span>
        <br />
        <span className="num-font">
          {info ? humanFormat(info.farmAmount) : '--'}
          {info && parseFloat(info.farmAmount) > 0 && parseFloat(row.lpamount) > 0 && (
            <> ({humanFormat((parseFloat(info.farmAmount) * 100) / parseFloat(row.lpamount))}%)</>
          )}
        </span>
      </span>
      <span>
        <span className="mini-font">{t('earned')}</span>
        <br />
        <span className="num-font">{info ? humanFormat(info.earned) : '--'} PBP</span>
      </span>
    </div>
  )
}

function PoolBody({ row }: { row: StakePoolRow }) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [info, setInfo] = useState<PoolInfo | null>(null)
  const [depOpen, setDepOpen] = useState(false)
  const [wdOpen, setWdOpen] = useState(false)
  const [depAmount, setDepAmount] = useState('')
  const [wdAmount, setWdAmount] = useState('')
  const [busy, setBusy] = useState<'deposit' | 'withdraw' | 'force' | 'claim' | null>(null)

  async function load() {
    if (!ctx) return
    try {
      setInfo(await loadPoolInfo(ctx, row))
    } catch {
      // ignore transient errors
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, row.pid])

  if (!ctx) return null
  const staking = pbpContracts(ctx).staking
  const hasStake = !!info && parseFloat(info.farmAmount) > 0

  async function sendStakingTx(kind: 'deposit' | 'withdraw' | 'force' | 'claim', amount: bigint) {
    setBusy(kind)
    try {
      const tx =
        kind === 'deposit'
          ? await staking.deposit(row.pid, amount)
          : kind === 'claim'
            ? await staking.withdraw(row.pid, amount)
            : kind === 'force'
              ? await staking.forceWithdraw(row.pid, amount)
              : await staking.withdraw(row.pid, amount)
      await ctx!.provider.waitForTransaction(tx.hash)
      setBusy(null)
      setDepOpen(false)
      setWdOpen(false)
      setDepAmount('')
      setWdAmount('')
      await load()
    } catch (e) {
      setBusy(null)
      message.error((e as Error).message)
    }
  }

  async function claim() {
    if (!info) return
    if (info.withdrawWait === 0) {
      await sendStakingTx('claim', 0n)
      return
    }
    Modal.confirm({
      title: t('locked1', { time: formatDuration(info.withdrawWait) }),
      content: t('locked2'),
      okText: t('force-claim'),
      cancelText: t('cancel'),
      onOk: () => sendStakingTx('claim', 0n).then(() => undefined),
    })
  }

  async function deposit() {
    if (!info) return
    if (!/^\d+\.?\d*$/.test(depAmount) || parseFloat(depAmount) <= 0) {
      message.error(t('amount'))
      return
    }
    const amount = await parseToken(ctx!, row.stakeAddr, depAmount)
    if (amount > info.balanceBn) {
      message.error(t('amount'))
      return
    }
    await sendStakingTx('deposit', amount)
  }

  async function withdraw(force: boolean) {
    const amount = await parseToken(ctx!, row.stakeAddr, wdAmount)
    if (amount <= 0n) {
      message.error(force ? t('correct-amount') : t('amount'))
      return
    }
    await sendStakingTx(force ? 'force' : 'withdraw', amount)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {hasStake && (
          <Button className="stake-btn" loading={busy === 'claim'} onClick={() => void claim()}>
            {t('claim')}
          </Button>
        )}
        <Button className="stake-btn" onClick={() => setDepOpen(true)}>
          {t('deposit')}
        </Button>
        {hasStake && (
          <Button className="stake-btn" onClick={() => setWdOpen(true)}>
            {t('withdraw')}
          </Button>
        )}
        {info?.isLp && info.lpTokens ? (
          <TokenLinkButtons token={info.lpTokens[0]} btoken={info.lpTokens[1]} onlyLp />
        ) : (
          <Button className="stake-btn">
            <a href="#/Swap">{t('buy')}</a>
          </Button>
        )}
      </div>

      <Modal
        title={t('set-s-amount')}
        open={depOpen}
        onCancel={() => setDepOpen(false)}
        footer={null}
        width={480}
      >
        <p>
          {t('balance')}：{info?.balance ?? '--'} {info?.symbol ?? ''}
        </p>
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <Input value={depAmount} onChange={(e) => setDepAmount(e.target.value)} maxLength={20} />
          <Button onClick={() => setDepAmount(info?.balance ?? '')}>{t('all')}</Button>
        </div>
        {info && (
          <ApproveGate
            token={row.stakeAddr}
            spender={String(pbpContracts(ctx).staking.target)}
            minReq={info.balanceBn}
          >
            <Button type="primary" loading={busy === 'deposit'} onClick={() => void deposit()}>
              {t('deposit')}
            </Button>
          </ApproveGate>
        )}
      </Modal>

      <Modal title={t('withdraw')} open={wdOpen} onCancel={() => setWdOpen(false)} footer={null} width={480}>
        <p>
          {t('balance')}：{info?.farmAmount ?? '--'} {info?.symbol ?? ''}
        </p>
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <Input value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} maxLength={20} />
          <Button onClick={() => setWdAmount(info?.farmAmount ?? '')}>{t('all')}</Button>
        </div>
        {info && info.withdrawWait === 0 ? (
          <Button type="primary" loading={busy === 'withdraw'} onClick={() => void withdraw(false)}>
            {t('withdraw')}
          </Button>
        ) : (
          <>
            <p>{info ? t('locked', { time: formatDuration(info.withdrawWait) }) : ''}</p>
            <Button loading={busy === 'force'} onClick={() => void withdraw(true)}>
              {t('force-w')}
            </Button>
          </>
        )}
      </Modal>
    </div>
  )
}
