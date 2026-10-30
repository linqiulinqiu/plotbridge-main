import { Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// document center: fixed side menu + routed child pages (old-site Doc.vue)
export default function DocLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const items = [
    { key: '/Doc/Introduction', label: t('intruction') },
    { key: '/Doc/Activities', label: t('activities') },
    { key: '/Doc/GuideforBridge', label: t('guide-bridge') },
    { key: '/Doc/GuideforMarket', label: t('guide-market') },
    { key: '/Doc/GuideforWallet', label: t('guide-wallet') },
    { key: '/Doc/Contact', label: t('contact') },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, minHeight: 520 }}>
      <Menu
        mode="inline"
        style={{ width: 240, background: '#25272e', paddingTop: 40, minHeight: 520 }}
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}
