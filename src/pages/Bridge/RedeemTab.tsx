import { useTranslation } from 'react-i18next'
import ContactLinks from '../../components/ContactLinks'

// The legacy token upgrade campaign ended (old site shipped the same static
// state: BridgeMain.vue renders "redeem-done" instead of the Redeem form).
export default function RedeemTab() {
  const { t } = useTranslation()
  return (
    <div style={{ padding: '12px 0', lineHeight: 2 }}>
      <h3>
        {t('redeem-done')}
      </h3>
      <ContactLinks />
    </div>
  )
}
