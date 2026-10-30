import { useTranslation } from 'react-i18next'

export default function GuideBridge() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 30 }}>
      <h1>{t('guide-bridge')}</h1>
      <h2>
        <a href="https://www.plotbridge.io/guidesub/towxcc/">{t('guide-bridge1')} ?</a>
      </h2>
      <h2>
        <a href="https://www.plotbridge.io/guidesub/toxcc/">{t('guide-bridge3')} ?</a>
      </h2>
      <h2>
        <a href="https://www.plotbridge.io/guidesub/upgradecoin/">{t('guide-bridge5')} ?</a>
      </h2>
    </div>
  )
}
