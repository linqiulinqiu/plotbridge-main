import { useTranslation } from 'react-i18next'

export default function Activities() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 30 }}>
      <h1>{t('pb-events')}</h1>
      <h2>
        <a href="https://www.plotbridge.io/activities/crosspb/" target="_blank" rel="noreferrer">
          {t('dp-xcc')}
        </a>
      </h2>
    </div>
  )
}
