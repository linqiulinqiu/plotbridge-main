import { useState } from 'react'
import { Button, Card, Input, Modal, Select, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { burnNFT, sendToMarket, setSellInfo, transferPBT } from '../../market'
import { isValidAmount } from '../../lib/utils'

// actions on an owned, not-listed NFT: destroy / transfer / list for sale
// (old-site InfoMy.vue)
export default function InfoMy({ id, onDone }: { id: string; onDone: () => void }) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [burnOpen, setBurnOpen] = useState(false)
  const [burning, setBurning] = useState(false)
  const [transferAddr, setTransferAddr] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [sending, setSending] = useState(false)
  const [ptName, setPtName] = useState('BNB')
  const [price, setPrice] = useState('')
  const [desc, setDesc] = useState('')
  const [listing, setListing] = useState(false)

  async function run(fn: () => Promise<unknown>, busy: (v: boolean) => void) {
    if (!ctx) return
    busy(true)
    try {
      const tx = await fn()
      if (tx && typeof tx === 'object' && 'hash' in tx && typeof tx.hash === 'string') {
        await ctx.provider.waitForTransaction(tx.hash)
      }
      busy(false)
      return true
    } catch (e) {
      busy(false)
      message.error((e as Error).message)
      return false
    }
  }

  async function burn() {
    const ok = await run(() => burnNFT(ctx!, id), setBurning)
    if (ok) {
      setBurnOpen(false)
      onDone()
    }
  }

  async function transfer() {
    const ok = await run(() => transferPBT(ctx!, transferAddr, id), setTransferring)
    if (ok) {
      setTransferAddr('')
      onDone()
    }
  }

  async function send() {
    await run(() => sendToMarket(ctx!, id), setSending)
  }

  async function list() {
    if (!isValidAmount(price)) {
      message.error(t('price-tips'))
      return
    }
    const ok = await run(() => setSellInfo(ctx!, id, ptName, price, desc), setListing)
    if (ok) onDone()
  }

  return (
    <div>
      <Button className="btn-cancel" onClick={onDone}>
        {t('cancel')}
      </Button>
      <Card className="panel-card">
        <p>
          {t('destroy')} :
          <Button type="primary" style={{ marginLeft: 12 }} onClick={() => setBurnOpen(true)}>
            {t('destroy')}
          </Button>
        </p>
      </Card>
      <Card className="panel-card">
        <p>
          {t('transfernft')}：
          <Button
            type="primary"
            style={{ marginLeft: 12 }}
            disabled={transferAddr === ''}
            loading={transferring}
            onClick={() => void transfer()}
          >
            {t('transfer')}
          </Button>
        </p>
        <Input
          value={transferAddr}
          onChange={(e) => setTransferAddr(e.target.value)}
          placeholder={t('input-waddr')}
          maxLength={50}
          showCount
          allowClear
        />
      </Card>
      <Card className="panel-card">
        <p>{t('sell')} :</p>
        <p>
          1、{t('send-tomk')}
          <Button type="primary" style={{ marginLeft: 12 }} loading={sending} onClick={() => void send()}>
            {t('send')}
          </Button>
        </p>
        <p>2、{t('set-sell-info')}</p>
        <label className="field-label">{t('price')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t('input-price')}
            maxLength={20}
            showCount
            style={{ width: 200 }}
          />
          <Select value={ptName} onChange={setPtName} style={{ width: 110 }}>
            <Select.Option value="BNB">BNB</Select.Option>
            <Select.Option value="USDT">USDT</Select.Option>
          </Select>
        </div>
        <label className="field-label">{t('desc')}</label>
        <Input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t('input-desc')}
          maxLength={50}
          showCount
        />
        <p style={{ marginTop: 12 }}>
          <Button type="primary" loading={listing} onClick={() => void list()}>
            {t('sell')}
          </Button>
        </p>
      </Card>
      <Modal
        title={t('destroy')}
        open={burnOpen}
        onCancel={() => setBurnOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setBurnOpen(false)}>
            {t('cancel')}
          </Button>,
          <Button key="burn" type="primary" loading={burning} onClick={() => void burn()}>
            {t('destroy')}
          </Button>,
        ]}
      >
        <p dangerouslySetInnerHTML={{ __html: t('destroy-tips') }} />
      </Modal>
    </div>
  )
}
