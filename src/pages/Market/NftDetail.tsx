import { Skeleton } from 'antd'
import { useTranslation } from 'react-i18next'
import type { PbtItem } from '../../store'
import NftImage from '../../components/NftImage'

// left half of the market detail view: image + id + price/description
export default function NftDetail({ item }: { item: PbtItem }) {
  const { t } = useTranslation()
  return (
    <div style={{ flex: '0 1 40%', minWidth: 300 }}>
      {item.loading ? (
        <Skeleton.Image active style={{ width: '95%', height: 300 }} />
      ) : (
        <div className="nft-detail-img">
          <NftImage uri={item.image} alt={`PBT #${item.id}`} />
        </div>
      )}
      <p className="mono" style={{ marginTop: 8 }}>
        {t('id')}:#{item.id}
      </p>
      {item.market && (
        <>
          <p>
            {t('price')}: <span className="font-accent">{item.market.price}</span>
            <span style={{ marginLeft: 8 }}>{item.market.ptName}</span>
          </p>
          <p>{item.market.desc !== '' ? `${t('desc')}:${item.market.desc}` : t('no-desc')}</p>
        </>
      )}
    </div>
  )
}
