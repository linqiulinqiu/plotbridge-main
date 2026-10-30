import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import SwapMain from './SwapMain'

// swap page shell (old-site views/Swap.vue)
export default function SwapPage() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)

  if (!address) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2>{t('look-info')}</h2>
      </div>
    )
  }
  return (
    <div className="swap-shell">
      <SwapMain />
    </div>
  )
}
