import { useTranslation } from 'react-i18next'

export default function GuideWallet() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 30 }}>
      <h1>{t('guide-wallet')}</h1>
      <h2>{t('guide-wallet1')}</h2>
      <h3>{t('guide-wallet2')}</h3>
      <p dangerouslySetInnerHTML={{ __html: t('guide-wallet3') }} />
      <h3 dangerouslySetInnerHTML={{ __html: t('guide-wallet4') }} />
      <p dangerouslySetInnerHTML={{ __html: t('guide-wallet5') }} />
      <h3 dangerouslySetInnerHTML={{ __html: t('guide-wallet6') }} />
      <p dangerouslySetInnerHTML={{ __html: t('guide-wallet7') }} />
    </div>
  )
}
