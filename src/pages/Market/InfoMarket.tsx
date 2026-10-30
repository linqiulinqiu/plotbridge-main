import { useState } from 'react'
import { Button, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { buyNFT, ensureBuyAllowance } from '../../market'
import { parseToken } from '../../lib/tokens'

// buy a token listed by someone else (old-site InfoMarket.vue):
// ERC20-priced sales need one Approve click, then Buy
export default function InfoMarket({
  id,
  priceToken,
  price,
  onDone,
}: {
  id: string
  priceToken: string
  price: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [buying, setBuying] = useState(false)

  async function buy() {
    if (!ctx) return
    setBuying(true)
    try {
      const amount = await parseToken(ctx, priceToken, price)
      const ready = await ensureBuyAllowance(ctx, priceToken, amount)
      if (!ready) {
        // approval just confirmed — user clicks Buy again (old-site two-step)
        setBuying(false)
        return
      }
      const tx = await buyNFT(ctx, priceToken, id, price)
      await ctx.provider.waitForTransaction(tx.hash)
      setBuying(false)
      onDone()
    } catch (e) {
      setBuying(false)
      message.error((e as Error).message)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button type="primary" loading={buying} onClick={() => void buy()}>
        {t('buy')}
      </Button>
      <Button className="btn-cancel" onClick={onDone}>
        {t('cancel')}
      </Button>
    </div>
  )
}
