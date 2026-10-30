import { useState } from 'react'
import { Pagination } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore, selectMarketNft, type PbtItem } from '../../store'
import SellingCard from './SellingCard'
import NftDetail from './NftDetail'
import InfoMy from './InfoMy'
import InfoMySale from './InfoMySale'
import InfoMarket from './InfoMarket'

// market body: On-sale + My-sale grids, or the detail view of the selected NFT
// (old-site MarketMain.vue + NFTinfo.vue)
const SALE_PAGE_SIZE = 4
const MYSALE_PAGE_SIZE = 10

function Grid({
  items,
  pageSize,
  emptyKey,
  loaded,
  onOpen,
}: {
  items: PbtItem[]
  pageSize: number
  emptyKey: string
  loaded: boolean
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  if (items.length === 0) {
    return <p>{loaded ? t(emptyKey) : t('data')}</p>
  }
  return (
    <>
      <div className="selling-grid">
        {pageItems.map((item) => (
          <SellingCard key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Pagination
          size="small"
          current={page}
          pageSize={pageSize}
          total={items.length}
          onChange={setPage}
          hideOnSinglePage
        />
      </div>
    </>
  )
}

export default function MarketMain() {
  const { t } = useTranslation()
  const marketList = useAppStore((s) => s.marketList)
  const mySaleList = useAppStore((s) => s.mySaleList)
  const marketLoaded = useAppStore((s) => s.marketLoaded)
  const currentNft = useAppStore(selectMarketNft)
  const setCurrentPbt = useAppStore((s) => s.setCurrentPbt)

  if (currentNft) {
    const seller = currentNft.market?.seller
    return (
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 40 }}>
        <NftDetail item={currentNft} />
        <div style={{ flex: '1 1 420px', minWidth: 320 }}>
          {currentNft.market ? (
            seller === '-self' ? (
              <InfoMySale
                id={currentNft.id}
                curPrice={currentNft.market.price}
                curDesc={currentNft.market.desc}
                curPtName={currentNft.market.ptName}
                onDone={() => setCurrentPbt(null)}
              />
            ) : (
              <InfoMarket
                id={currentNft.id}
                priceToken={currentNft.market.priceToken}
                price={currentNft.market.price}
                onDone={() => setCurrentPbt(null)}
              />
            )
          ) : (
            <InfoMy id={currentNft.id} onDone={() => setCurrentPbt(null)} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3>{t('market')}</h3>
      <div className="market-section">
        <h4>{t('onSale')}</h4>
        <div className="market-grid-box">
          <Grid
            items={Object.values(marketList)}
            pageSize={SALE_PAGE_SIZE}
            emptyKey="no-selling"
            loaded={marketLoaded}
            onOpen={(id) => useAppStore.getState().setCurrentPbt(id)}
          />
        </div>
      </div>
      <div className="market-section">
        <h4>{t('my-sale')}</h4>
        <div className="market-grid-box">
          <Grid
            items={Object.values(mySaleList)}
            pageSize={MYSALE_PAGE_SIZE}
            emptyKey="no-mysale"
            loaded={marketLoaded}
            onOpen={(id) => useAppStore.getState().setCurrentPbt(id)}
          />
        </div>
      </div>
    </div>
  )
}
