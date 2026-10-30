import { useTranslation } from 'react-i18next'

export default function GuideMarket() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 30 }}>
      <h1>
        <a href="https://www.plotbridge.io/guidesub/marketguide/" target="_blank" rel="noreferrer">
          {t('guide-market')}
        </a>
      </h1>
      <p>{t('guide-market1')}</p>
    </div>
  )
}
