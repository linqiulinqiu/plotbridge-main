import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Button, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { ZeroAddress } from 'ethers'
import { useAppStore } from '../store'
import { tokenAllowance, tokenApprove } from '../lib/tokens'

// gate rendered as an Approve button until `spender` holds at least `minReq`
// of `token`; native tokens pass straight through (old-site ApproveButton)
export default function ApproveGate({
  token,
  spender,
  minReq,
  children,
}: {
  token: string
  spender: string
  /** required allowance as raw bigint; 0/undefined means any */
  minReq?: bigint | null
  children: ReactNode
}) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [checking, setChecking] = useState(false)
  const [needApprove, setNeedApprove] = useState(false)
  const [approving, setApproving] = useState(false)

  const check = useCallback(async () => {
    if (!ctx) return
    if (token === ZeroAddress) {
      setNeedApprove(false)
      return
    }
    setChecking(true)
    try {
      const allow = await tokenAllowance(ctx, token, spender)
      setNeedApprove(!(minReq && minReq > 0n ? allow >= minReq : allow > 0n))
    } catch {
      setNeedApprove(true)
    }
    setChecking(false)
  }, [ctx, token, spender, minReq])

  useEffect(() => {
    void check()
  }, [check])

  if (!ctx) return null
  if (checking) return <Spin size="small" />

  async function approve() {
    if (!ctx) return
    setApproving(true)
    try {
      await tokenApprove(ctx, token, spender)
      await check()
    } catch {
      // user rejected or RPC hiccup — stay on the approve button
    }
    setApproving(false)
  }

  if (needApprove) {
    return (
      <Button type="primary" loading={approving} onClick={() => void approve()}>
        {t('approve')}
      </Button>
    )
  }
  return <>{children}</>
}
