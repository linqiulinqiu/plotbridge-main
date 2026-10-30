import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { tList } from '../i18n'

// Placeholder: the full Home page migrates in a later stage.
export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const news = tList<{ ts: string; msg: string }>('home-news')
  return (
    <div style={{ maxWidth: 860, margin: '40px auto' }}>
      <h1>PlotBridge</h1>
      <p style={{ margin: '16px 0 24px', color: 'rgba(255,255,255,0.65)' }}>
        Chia assets on BSC. Bring your XCH to BSC as WXCH — and back.
      </p>
      <Button type="primary" size="large" onClick={() => navigate('/Bridge')}>
        {t('bridge')}
      </Button>
      {news.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>{t('home-title')}</h3>
          {news.map((item, i) => (
            <div key={i} style={{ margin: '12px 0' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', marginRight: 12 }}>{item.ts}</span>
              <span>{item.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
