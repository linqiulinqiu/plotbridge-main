import { useEffect, useState } from 'react'
import { Button, Modal, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { bridgeContracts } from '../../keeper'
import { getMintFee, getMintables, mintPBT, type MintFeeInfo } from '../../market'
import ApproveGate from '../../components/ApproveGate'

// mint dialog (old-site Mynft "mintPBT" button + MintPBT card)
export default function MintPbtModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [fee, setFee] = useState<MintFeeInfo | null>(null)
  const [mintables, setMintables] = useState<string>('--')
  const [minting, setMinting] = useState(false)

  useEffect(() => {
    if (!open || !ctx) return
    setFee(null)
    Promise.all([getMintFee(ctx), getMintables(ctx)])
      .then(([feeInfo, ables]) => {
        setFee(feeInfo)
        setMintables(ables.toString())
      })
      .catch((e) => message.error((e as Error).message))
  }, [open, ctx])

  async function mint() {
    if (!ctx) return
    setMinting(true)
    try {
      const tx = await mintPBT(ctx)
      await ctx.provider.waitForTransaction(tx.hash)
      message.success(t('mintPBT') + ' OK')
      setMinting(false)
      onClose()
    } catch (e) {
      setMinting(false)
      const msg = (e as Error).message ?? ''
      if (/insufficient/i.test(msg)) {
        message.error(
          t('insufficient-mint-balance', { price: fee?.price ?? '', token: fee?.token ?? '' }),
        )
      } else {
        message.error(msg)
      }
    }
  }

  return (
    <Modal title={t('mintPBT')} open={open} onCancel={onClose} footer={null} width={560}>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/image/logo_000.png" alt="PBT" style={{ width: 160, borderRadius: 12 }} />
        </div>
        <div style={{ flex: 1.4, lineHeight: 2.4 }}>
          <p>
            {t('price')} : <span className="font-accent">{fee?.price ?? '…'}</span>{' '}
            <span>{fee?.token ?? ''}</span>
          </p>
          <p>
            {t('mintable')}&nbsp;&nbsp;{mintables}
          </p>
          <p style={{ marginTop: 12 }}>
            {fee && ctx && (
              <ApproveGate
                token={fee.tokenAddr}
                spender={String(bridgeContracts(ctx).pbt.target)}
                minReq={fee.amount}
              >
                <Button
                  type="primary"
                  loading={minting}
                  disabled={mintables === '0'}
                  onClick={() => void mint()}
                >
                  {mintables === '0' ? t('none') : t('mintPBT')}
                </Button>
              </ApproveGate>
            )}
          </p>
        </div>
      </div>
    </Modal>
  )
}
