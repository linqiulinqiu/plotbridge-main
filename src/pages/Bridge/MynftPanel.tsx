import { useState } from 'react'
import { Pagination, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import NftImage from '../../components/NftImage'

const PAGE_SIZE = 3

export default function MynftPanel() {
  const { t } = useTranslation()
  const myList = useAppStore((s) => s.myList)
  const listLoaded = useAppStore((s) => s.listLoaded)
  const currentPbtId = useAppStore((s) => s.currentPbtId)
  const setCurrentPbt = useAppStore((s) => s.setCurrentPbt)
  const [page, setPage] = useState(1)

  const items = Object.values(myList)
  const start = (page - 1) * PAGE_SIZE
  const pageItems = items.slice(start, start + PAGE_SIZE)

  return (
    <div className="bridge-nft-panel">
      <h3 style={{ textAlign: 'center', marginBottom: 8 }}>{t('my-nfts')}</h3>
      {items.length > 0 && (
        <>
          <div className="nft-grid">
            {pageItems.map((item) => (
              <div
                key={item.id}
                className={`nft-card${item.id === currentPbtId ? ' selected' : ''}`}
                onClick={() => setCurrentPbt(item.id)}
              >
                {item.loading ? (
                  <Spin style={{ display: 'block', margin: '40px auto' }} />
                ) : (
                  <NftImage uri={item.image} alt={`PBT #${item.id}`} />
                )}
                <div className="mono" style={{ marginTop: 4 }}>
                  #{item.id}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Pagination
              size="small"
              current={page}
              pageSize={PAGE_SIZE}
              total={items.length}
              onChange={(p) => setPage(p)}
              hideOnSinglePage
            />
          </div>
        </>
      )}
      {items.length === 0 &&
        (listLoaded ? (
          <div style={{ padding: '40px 20px', color: 'rgba(255,255,255,0.65)' }}>
            {t('no-nft')}
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <Spin />
            <div style={{ marginTop: 12 }}>{t('data')}</div>
          </div>
        ))}
    </div>
  )
}
