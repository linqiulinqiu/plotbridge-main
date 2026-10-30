import { useEffect, useState } from 'react'
import { Button, Modal, Tooltip, message } from 'antd'
import { SettingOutlined, DownOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ZeroAddress } from 'ethers'
import { chainById, enabledCoins } from '../../config/chains'
import { useAppStore } from '../../store'
import { estimateSwap, sendSwap, sendSwapForExact } from '../../pbp'
import { formatToken, tokenDecimals } from '../../lib/tokens'
import { watchAsset } from '../../wallet/wallets'
import ApproveGate from '../../components/ApproveGate'
import TokenLinkButtons from '../../components/TokenLinkButtons'
import TokenInput, { type SwapSide, type TokenOption } from './TokenInput'

// simple swap over PancakeSwap (old-site SwapMain.vue): exact-in / exact-out
// with slippage guard, routed WCoin<->PBP or via WBNB
const SLIPPAGE_OPTIONS = [20, 50, 100, 200] // basis points: 0.2% / 0.5% / 1% / 2%
const SWAP_DEADLINE_SEC = 120

const EMPTY_SIDE: SwapSide = { addr: '', amount: null, number: '', lastEdit: 0, lastSet: 0, isSwap: false }

export default function SwapMain() {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [coins, setCoins] = useState<TokenOption[]>([])
  const [from, setFrom] = useState<SwapSide>(EMPTY_SIDE)
  const [to, setTo] = useState<SwapSide>(EMPTY_SIDE)
  const [dir, setDir] = useState<'from' | 'to'>('from')
  const [slipAmount, setSlipAmount] = useState(100)
  const [slipOpen, setSlipOpen] = useState(false)
  const [slipMin, setSlipMin] = useState<{ big: bigint; fmt: string } | null>(null)
  const [slipMax, setSlipMax] = useState<{ big: bigint; fmt: string } | null>(null)
  const [swapping, setSwapping] = useState(false)

  // token list: BNB / PBP / stablecoins / enabled wrapped coins
  useEffect(() => {
    if (!ctx) return
    const chain = chainById(ctx.chainId)
    if (!chain) return
    const list: TokenOption[] = [
      { bsymbol: 'BNB', address: ZeroAddress },
      { bsymbol: 'PBP', address: chain.contracts.pbp },
      { bsymbol: 'USDT', address: chain.contracts.usdt },
      { bsymbol: 'BUSD', address: chain.contracts.busd },
    ]
    if (chain.contracts.usdc) list.push({ bsymbol: 'USDC', address: chain.contracts.usdc })
    for (const c of enabledCoins(chain)) list.push({ bsymbol: c.bsymbol, address: c.address })
    setCoins(list)
    setFrom({ ...EMPTY_SIDE, addr: chain.contracts.pbp })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])

  async function estimate(nextFrom: SwapSide, nextTo: SwapSide) {
    if (!ctx) return
    let active: 'from' | 'to' | null = null
    let amount: bigint | null = null
    if (nextFrom.lastEdit > nextTo.lastEdit && nextFrom.lastEdit > nextTo.lastSet) {
      active = 'from'
      amount = nextFrom.amount
    } else if (nextTo.lastEdit > nextFrom.lastEdit && nextTo.lastEdit > nextFrom.lastSet) {
      active = 'to'
      amount = nextTo.amount
    }
    if (!active || !amount || amount === 0n) return
    setDir(active)
    try {
      if (active === 'from') {
        const out = await estimateSwap(ctx, nextFrom.addr, nextTo.addr, amount)
        const number = await formatToken(ctx, nextTo.addr, out)
        setTo((s) => (s.lastEdit > Date.now() - 2000 ? s : { ...s, amount: out, number, lastSet: Date.now() }))
      } else {
        const inp = await estimateSwap(ctx, nextFrom.addr, nextTo.addr, undefined, amount)
        const number = await formatToken(ctx, nextFrom.addr, inp)
        setFrom((s) => (s.lastEdit > Date.now() - 2000 ? s : { ...s, amount: inp, number, lastSet: Date.now() }))
      }
    } catch {
      // pair may not exist yet
    }
  }

  function updateSide(which: 'from' | 'to', next: SwapSide) {
    const f = which === 'from' ? next : from
    const tt = which === 'from' ? to : next
    if (which === 'from') setFrom(next)
    else setTo(next)
    void estimate(f, tt)
  }

  // slippage guard values, recomputed on amounts/direction change
  useEffect(() => {
    setSlipMin(null)
    setSlipMax(null)
    if (!ctx) return
    const bps = BigInt(slipAmount)
    if (dir === 'from' && to.amount && to.addr) {
      const min = to.amount - (to.amount * bps) / 10000n
      void formatToken(ctx, to.addr, min).then((fmt) => setSlipMin({ big: min <= 0n ? 0n : min, fmt: min <= 0n ? '0' : fmt }))
    } else if (dir === 'to' && from.amount && from.addr) {
      const max = from.amount + (from.amount * bps) / 10000n
      void formatToken(ctx, from.addr, max).then((fmt) => setSlipMax({ big: max, fmt }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, dir, slipAmount, from.amount, from.addr, to.amount, to.addr])

  function reverseSides() {
    const f = from
    const tt = to
    setDir(dir === 'from' ? 'to' : 'from')
    setFrom(tt)
    setTo(f)
  }

  async function doSwap() {
    if (!ctx) return
    setSwapping(true)
    try {
      let tx
      if (dir === 'from') {
        if (!from.amount || !slipMin) return setSwapping(false)
        tx = await sendSwap(ctx, from.addr, to.addr, from.amount, slipMin.big, SWAP_DEADLINE_SEC)
      } else {
        if (!to.amount || !slipMax) return setSwapping(false)
        tx = await sendSwapForExact(ctx, from.addr, to.addr, to.amount, slipMax.big, SWAP_DEADLINE_SEC)
      }
      await ctx.provider.waitForTransaction(tx.hash)
      const cleared = { ...EMPTY_SIDE, addr: dir === 'from' ? from.addr : to.addr, isSwap: true }
      const clearedOther = { ...EMPTY_SIDE, addr: dir === 'from' ? to.addr : from.addr, isSwap: true }
      setFrom(dir === 'from' ? cleared : clearedOther)
      setTo(dir === 'from' ? clearedOther : cleared)
      setSwapping(false)
    } catch (e) {
      setSwapping(false)
      message.error((e as Error).message)
    }
  }

  async function addPbpToWallet() {
    const state = useAppStore.getState()
    if (!state.eip1193 || !state.ctx) return
    const chain = chainById(state.ctx.chainId)
    if (!chain) return
    try {
      await watchAsset(state.eip1193, {
        address: chain.contracts.pbp,
        symbol: 'PBP',
        decimals: await tokenDecimals(state.ctx, chain.contracts.pbp),
        image: window.location.origin + '/image/pbp.png',
      })
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  if (!ctx) return null
  const chain = chainById(ctx.chainId)!
  const pbpAddr = chain.contracts.pbp
  const symbolOf = (addr: string) => coins.find((c) => c.address === addr)?.bsymbol ?? ''
  const forward = from.number && to.number && parseFloat(from.number) > 0 ? parseFloat(from.number) / parseFloat(to.number) : ''
  const reverse = from.number && to.number && parseFloat(to.number) > 0 ? parseFloat(to.number) / parseFloat(from.number) : ''

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <h3>{t('s-swap')}</h3>
        <p>{t('s-swap1')}</p>
        <Tooltip title={t('setting')}>
          <Button
            shape="circle"
            icon={<SettingOutlined />}
            style={{ position: 'absolute', top: 0, right: 0 }}
            onClick={() => setSlipOpen(true)}
          />
        </Tooltip>
      </div>

      <TokenInput title="From" coins={coins} banCoin={to.addr} side={from} onChange={(n) => updateSide('from', n)} />
      <div style={{ textAlign: 'center', margin: '4px 0' }}>
        <Button shape="circle" size="large" icon={<DownOutlined />} onClick={reverseSides} disabled={!from.addr || !to.addr} />
      </div>
      <TokenInput title="To" coins={coins} banCoin={from.addr} side={to} onChange={(n) => updateSide('to', n)} />

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <ApproveGate token={from.addr} spender={chain.contracts.router} minReq={from.amount}>
          <Button type="primary" style={{ width: 110 }} loading={swapping} disabled={from.addr === to.addr} onClick={() => void doSwap()}>
            {t('swap')}
          </Button>
        </ApproveGate>
      </div>

      {(slipMin || slipMax) && (
        <div style={{ textAlign: 'center', lineHeight: 2 }}>
          {slipMin && (
            <h5>
              {t('slip-min')}：<span className="font-accent">{slipMin.fmt}</span>{' '}
              <span className="mono">{symbolOf(to.addr)}</span>
            </h5>
          )}
          {slipMax && (
            <h5>
              {t('slip-max')}：<span className="font-accent">{slipMax.fmt}</span>{' '}
              <span className="mono">{symbolOf(from.addr)}</span>
            </h5>
          )}
          <h5>{t('exchange')} :</h5>
          <h5 className="font-weight-normal">
            {forward !== '' && (
              <>
                <span className="font-accent">{forward}</span>{' '}
                <span className="mono">
                  {symbolOf(to.addr)} per {symbolOf(from.addr)}
                </span>
                <br />
              </>
            )}
            {reverse !== '' && (
              <>
                <span className="font-accent">{reverse}</span>{' '}
                <span className="mono">
                  {symbolOf(from.addr)} per {symbolOf(to.addr)}
                </span>
              </>
            )}
          </h5>
        </div>
      )}

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        {from.addr === pbpAddr && (
          <Button className="btn-link" onClick={() => void addPbpToWallet()}>
            {t('add-to-wallet', { coin: 'PBP' })}
          </Button>
        )}
        {from.addr && from.addr !== ZeroAddress && <TokenLinkButtons token={from.addr} />}
      </div>

      <Modal title={t('setting')} open={slipOpen} onCancel={() => setSlipOpen(false)} footer={null} width={420}>
        <h3>
          {t('slippage')}
          <Tooltip title={t('slip-tip')}>
            <Button shape="circle" size="small" style={{ marginLeft: 8 }}>
              ?
            </Button>
          </Tooltip>
        </h3>
        <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
          {SLIPPAGE_OPTIONS.map((i) => (
            <Button
              key={i}
              className={i === slipAmount ? 'slip-btn active' : 'slip-btn'}
              onClick={() => setSlipAmount(i)}
            >
              {i / 100}%
            </Button>
          ))}
        </div>
        {slipAmount === 20 && <p>{t('slip-fail')}</p>}
      </Modal>
    </div>
  )
}
