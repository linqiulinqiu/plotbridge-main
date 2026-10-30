import { Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import type { PbtItem } from '../../store'
import NftImage from '../../components/NftImage'

// market card (old-site SellingItem from pbweb-ui): image, #id, description,
// "My Sale" badge for own listings, price chip
export default function SellingCard({ item, onOpen }: { item: PbtItem; onOpen: (id: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="selling-card" onClick={() => onOpen(item.id)}>
      {item.loading ? (
        <div className="selling-img">
          <Spin style={{ display: 'block', margin: '110px auto' }} />
        </div>
      ) : (
        <div className="selling-img">
          <NftImage uri={item.image} alt={`PBT #${item.id}`} />
        </div>
      )}
      <div className="selling-info">
        <div className="selling-desc">
          <span className="mono">#{item.id}</span>
          <br />
          {item.market?.desc && <span className="selling-desc-text">{item.market.desc}</span>}
        </div>
        {item.market && (
          <div className="selling-owner">
            {item.market.seller === '-self' && <span className="selling-self">{t('my-sale')}</span>}
            <span className="price-chip">
              {item.market.price} {item.market.ptName}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
