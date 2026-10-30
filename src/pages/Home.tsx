import { Card, Timeline } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { tList } from '../i18n'
import RichNumber from '../components/RichNumber'

// banner + TVL statistic + news timeline + contact card (old-site Home)
export default function Home() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)
  const tvl = useAppStore((s) => s.tvl)
  const news = tList<{ ts: string; msg: string }>('home-news')

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 220px)',
        backgroundImage: 'url(/image/banner.jpg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        padding: 30,
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 640px', maxWidth: 980 }}>
        {address && (
          <h3 style={{ textAlign: 'center' }}>
            {t('total-lock')}:{' '}
            {tvl !== 0 ? (
              <span className="font-accent">
                $ <RichNumber data={String(tvl)} />
              </span>
            ) : (
              <span className="font-accent">…</span>
            )}
          </h3>
        )}
        <h2 style={{ textAlign: 'center', margin: '24px 0' }}>{t('home-title')}</h2>
        <div className="scrollbar" style={{ maxHeight: 520, overflow: 'auto', padding: 10 }}>
          <Timeline
            items={news.map((item) => ({
              timestamp: item.ts,
              children: (
                <Card size="small" style={{ background: 'rgba(255,255,255,0.3)', color: '#000' }}>
                  <span style={{ color: '#000' }}>{item.msg}</span>
                </Card>
              ),
            }))}
          />
        </div>
        <p style={{ marginTop: 24 }}>{t('home-note')}</p>
      </div>
      <Card
        style={{
          flex: '0 1 300px',
          alignSelf: 'flex-start',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          paddingBottom: 20,
        }}
      >
        <h3 style={{ marginBottom: 16 }}>{t('contact')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href="https://discord.gg/xHC9fBfeVW" target="_blank" rel="noreferrer">
            discord
          </a>
          <a href="https://t.me/PlotBridge" target="_blank" rel="noreferrer">
            telegram
          </a>
          <a href="https://twitter.com/plot_bridge" target="_blank" rel="noreferrer">
            twitter
          </a>
        </div>
      </Card>
    </div>
  )
}
