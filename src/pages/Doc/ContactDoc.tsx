import { useTranslation } from 'react-i18next'

export default function ContactDoc() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: 30 }}>
      <h1>{t('contact')}</h1>
      <p dangerouslySetInnerHTML={{ __html: t('contact1') }} />
    </div>
  )
}
