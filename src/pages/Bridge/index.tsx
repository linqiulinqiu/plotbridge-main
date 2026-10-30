import { Empty } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import MynftPanel from './MynftPanel'
import BridgeMain from './BridgeMain'
import SelectCoinPanel from './SelectCoin'

export default function BridgePage() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)
  if (!address) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center' }}>
        <Empty description={t('look-info')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }
  return (
    <div className="bridge-layout">
      <MynftPanel />
      <div className="bridge-main-panel">
        <BridgeMain />
      </div>
      <SelectCoinPanel />
    </div>
  )
}
