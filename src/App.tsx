import { useEffect } from 'react'
import { ConfigProvider, theme, Layout, Menu, Select } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { currentLang, setLang } from './i18n'
import { autoReconnect } from './wallet/session'
import ConnectButton from './components/ConnectButton'
import BridgePage from './pages/Bridge'
import Home from './pages/Home'

export default function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    void autoReconnect()
  }, [])

  const lang = currentLang()
  const antdLocale = lang === 'zh' ? zhCN : enUS

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#38f2af',
          colorBgBase: '#2b2c33',
          colorBgContainer: '#25272e',
          colorBgElevated: '#373943',
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#2b2c33' }}>
        <Layout.Header
          style={{
            background: '#25272e',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <img
            src="/image/logo_000.png"
            alt="PlotBridge"
            style={{ height: 44, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={[
              { key: '/', label: t('home') },
              { key: '/Bridge', label: t('bridge') },
            ]}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, minWidth: 0, background: 'transparent', borderBottom: 'none' }}
          />
          <div style={{ width: 170, flexShrink: 0 }}>
            <ConnectButton />
          </div>
          <Select
            value={lang}
            onChange={(v) => setLang(v)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'zh', label: '中文' },
            ]}
            style={{ width: 100, flexShrink: 0 }}
          />
        </Layout.Header>
        <Layout.Content style={{ padding: '16px 24px', minHeight: 'calc(100vh - 190px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Bridge" element={<BridgePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout.Content>
        <Layout.Footer
          style={{
            background: '#25272e',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <a href="https://discord.com/invite/xHC9fBfeVW" target="_blank" rel="noreferrer">
              Discord
            </a>
            <span style={{ margin: '0 12px' }}>·</span>
            <a href="https://t.me/PlotBridge" target="_blank" rel="noreferrer">
              Telegram
            </a>
            <span style={{ margin: '0 12px' }}>·</span>
            <a href="https://twitter.com/plot_bridge" target="_blank" rel="noreferrer">
              Twitter
            </a>
          </div>
          <div style={{ marginTop: 8 }}>PlotBridge © 2026</div>
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  )
}
