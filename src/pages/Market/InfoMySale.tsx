import { useState } from 'react'
import { Button, Card, Input, Select, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { retreatNFT, setSellInfo } from '../../market'
import { isValidAmount } from '../../lib/utils'

// actions on own listed NFT: change price/description, retreat from sale
// (old-site InfoMySale.vue; price tokens BNB/PBP as before)
export default function InfoMySale({
  id,
  curPrice,
  curDesc,
  curPtName,
  onDone,
}: {
  id: string
  curPrice: string
  curDesc: string
  curPtName: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [ptName, setPtName] = useState(curPtName || 'BNB')
  const [price, setPrice] = useState(curPrice)
  const [desc, setDesc] = useState(curDesc)
  const [saving, setSaving] = useState(false)
  const [retreating, setRetreating] = useState(false)

  async function save() {
    if (!ctx) return
    if (!isValidAmount(price)) {
      message.error(t('price-tips'))
      return
    }
    setSaving(true)
    try {
      const tx = await setSellInfo(ctx, id, ptName, price, desc)
      await ctx.provider.waitForTransaction(tx.hash)
      setSaving(false)
      onDone()
    } catch (e) {
      setSaving(false)
      message.error((e as Error).message)
    }
  }

  async function retreat() {
    if (!ctx) return
    setRetreating(true)
    try {
      const tx = await retreatNFT(ctx, id)
      await ctx.provider.waitForTransaction(tx.hash)
      setRetreating(false)
      onDone()
    } catch (e) {
      setRetreating(false)
      message.error((e as Error).message)
    }
  }

  return (
    <Card className="panel-card">
      <label className="field-label">{t('change-price')}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input value={price} onChange={(e) => setPrice(e.target.value)} maxLength={20} style={{ width: 200 }} />
        <Select value={ptName} onChange={setPtName} style={{ width: 110 }}>
          <Select.Option value="BNB">BNB</Select.Option>
          <Select.Option value="PBP">PBP</Select.Option>
        </Select>
      </div>
      <label className="field-label">{t('desc')}</label>
      <Input value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={50} showCount />
      <p style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Button type="primary" loading={saving} onClick={() => void save()}>
          {t('save')}
        </Button>
        <Button type="primary" loading={retreating} onClick={() => void retreat()}>
          {t('retreat')}
        </Button>
        <Button className="btn-cancel" onClick={onDone}>
          {t('cancel')}
        </Button>
      </p>
    </Card>
  )
}
