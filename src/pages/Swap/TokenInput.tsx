import { useEffect, useRef, useState } from 'react'
import { Button, Input, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { formatToken, parseToken, tokenBalance } from '../../lib/tokens'
import { isValidAmount } from '../../lib/utils'

export interface SwapSide {
  addr: string
  amount: bigint | null
  number: string
  lastEdit: number
  lastSet: number
  isSwap: boolean
}

export interface TokenOption {
  bsymbol: string
  address: string
}

// one side of the swap form: amount + MAX + token select (old-site TokenInput)
export default function TokenInput({
  title,
  coins,
  banCoin,
  side,
  onChange,
}: {
  title: string
  coins: TokenOption[]
  banCoin?: string
  side: SwapSide
  onChange: (next: SwapSide) => void
}) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [text, setText] = useState('')
  const [balance, setBalance] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // refresh balance on token change / after a swap
  useEffect(() => {
    if (!ctx || !side.addr) return
    let cancelled = false
    tokenBalance(ctx, side.addr)
      .then(async (raw) => {
        if (cancelled) return
        setBalance(await formatToken(ctx, side.addr, raw))
      })
      .catch(() => setBalance(''))
    return () => {
      cancelled = true
    }
  }, [ctx, side.addr, side.isSwap])

  // passive side: reflect amounts estimated from the other side
  useEffect(() => {
    if (side.lastEdit < side.lastSet) {
      setText(side.amount && side.amount > 0n ? side.number : '')
    } else if (side.isSwap) {
      setText('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side.lastEdit, side.lastSet, side.isSwap, side.number])

  function emitText(next: string, immediate = false) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const run = async () => {
      const valid = ctx && isValidAmount(next)
      const amount = valid ? await parseToken(ctx, side.addr, next) : null
      onChange({ ...side, amount, number: valid ? next : '', lastEdit: Date.now(), isSwap: false })
    }
    if (immediate) void run()
    else debounceRef.current = setTimeout(() => void run(), 800)
  }

  function select(addr: string) {
    // active side keeps its edit timestamp; passive side is reset for
    // estimation (same lastEdit/lastSet protocol as the old site)
    const active = side.lastEdit > side.lastSet
    const next: SwapSide = { ...side, addr }
    if (active) {
      next.lastEdit = Date.now()
    } else {
      next.lastSet = 0
      next.amount = null
    }
    if (ctx && isValidAmount(text)) {
      void parseToken(ctx, addr, text).then((amount) => onChange({ ...next, amount }))
    } else {
      onChange(next)
    }
  }

  return (
    <div className="swap-input">
      <p>
        {title}
        <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.65)' }}>
          {t('balance')}: {balance}
        </span>
      </p>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            emitText(e.target.value)
          }}
          maxLength={20}
        />
        <Button onClick={() => { setText(balance); emitText(balance, true) }}>{t('all')}</Button>
      </div>
      <Select
        value={side.addr || undefined}
        onChange={select}
        placeholder={t('select')}
        style={{ width: 180 }}
        options={coins.map((c) => ({
          value: c.address,
          label: c.bsymbol,
          disabled: banCoin === c.address,
        }))}
      />
    </div>
  )
}
