import { useEffect } from 'react'
import { ConfigProvider, theme, Layout, Menu, Select } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { currentLang, setLang } from './i18n'
import { autoReconnect } from './wallet/session'
import { useAppStore } from './store'
import ConnectButton from './components/ConnectButton'
import BridgePage from './pages/Bridge'
import Home from './pages/Home'
import MarketPage from './pages/Market'
import SwapPage from './pages/Swap'
import StakePage from './pages/Stake'
import PBTokenPage from './pages/PBToken'
import DocLayout from './pages/Doc'
import Introduction from './pages/Doc/Introduction'
import Activities from './pages/Doc/Activities'
import GuideBridge from './pages/Doc/GuideBridge'
import GuideMarket from './pages/Doc/GuideMarket'
import GuideWallet from './pages/Doc/GuideWallet'
import ContactDoc from './pages/Doc/ContactDoc'
import RoadMap from './pages/Doc/RoadMap'

// routes kept identical to the old site (hash mode): /Home /Bridge /Market
// /Swap /Stake /PBToken /Doc/*; Presale is retired by plan and not migrated
export default function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    void autoReconnect()
  }, [])

  const lang = currentLang()
  const antdLocale = lang === 'zh' ? zhCN : enUS

  // keep the active menu stable for nested routes (/Doc/xxx highlights Doc)
  const menuKey =
    location.pathname === '/' || location.pathname === '/Home'
      ? '/Home'
      : `/${location.pathname.split('/')[1]}`

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
            onClick={() => navigate('/Home')}
          />
          <Menu
            mode="horizontal"
            selectedKeys={[menuKey]}
            items={[
              { key: '/Home', label: t('home') },
              { key: '/Bridge', label: t('bridge') },
              { key: '/Market', label: t('market') },
              { key: '/Swap', label: t('swap') },
              { key: '/Stake', label: t('stake') },
              { key: '/PBToken', label: 'Token' },
              { key: '/Doc', label: t('doc') },
            ]}
            onClick={({ key }) => {
              // old-site behavior: navigating resets the selected NFT/coin
              useAppStore.getState().setCurrentPbt(null)
              useAppStore.getState().setCurrentCoin(null)
              navigate(key)
            }}
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
            <Route path="/" element={<Navigate to="/Home" replace />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/Bridge" element={<BridgePage />} />
            <Route path="/Market" element={<MarketPage />} />
            <Route path="/Swap" element={<SwapPage />} />
            <Route path="/Stake" element={<StakePage />} />
            <Route path="/PBToken" element={<PBTokenPage />} />
            <Route path="/Doc" element={<DocLayout />}>
              <Route index element={<Navigate to="Introduction" replace />} />
              <Route path="Introduction" element={<Introduction />} />
              <Route path="Activities" element={<Activities />} />
              <Route path="GuideforBridge" element={<GuideBridge />} />
              <Route path="GuideforMarket" element={<GuideMarket />} />
              <Route path="GuideforWallet" element={<GuideWallet />} />
              <Route path="Contact" element={<ContactDoc />} />
              <Route path="RoadMap" element={<RoadMap />} />
            </Route>
            <Route path="*" element={<Navigate to="/Home" replace />} />
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
            <a href="https://discord.gg/xHC9fBfeVW" target="_blank" rel="noreferrer">
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
          <div style={{ marginTop: 8 }}>
            <a href="https://www.plotnetwork.ltd" target="_blank" rel="noreferrer">
              © 2021-2026 Plot Network Ltd
            </a>
          </div>
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  )
}
