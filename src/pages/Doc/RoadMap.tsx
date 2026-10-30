import { useTranslation } from 'react-i18next'

// kept for old /Doc/RoadMap links; not shown in the side menu (parity with old site)
export default function RoadMap() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 30 }}>
      <h1>{t('road-map')}</h1>
    </div>
  )
}
