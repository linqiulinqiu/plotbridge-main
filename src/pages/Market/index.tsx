import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import MynftAside from './MynftAside'
import MarketMain from './MarketMain'

// market page: My-NFT aside + market body (old-site views/Market.vue)
export default function MarketPage() {
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
    <div className="market-layout">
      <MynftAside />
      <div className="market-main">
        <MarketMain />
      </div>
    </div>
  )
}
