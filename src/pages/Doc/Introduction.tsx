import { useTranslation } from 'react-i18next'
import { chainById } from '../../config/chains'
import { useAppStore } from '../../store'
import { useCoinlist } from '../Bridge/hooks'
import { tList } from '../../i18n'

// intro text + wrapped-coin list + FAQ links (old-site Introduction.vue)
export default function Introduction() {
  const { t } = useTranslation()
  const chainId = useAppStore((s) => s.chainId)
  const coins = useCoinlist()
  const chain = chainById(chainId)

  return (
    <div style={{ padding: 30 }}>
      <h1>
        <a href="https://www.plotbridge.io/about/" target="_blank" rel="noreferrer">
          {t('intruction')}
        </a>
      </h1>
      <p dangerouslySetInnerHTML={{ __html: t('intruction1') }} />
      <ul>
        {coins.map((c) => (
          <li key={c.symbol}>
            {c.name} ({c.symbol}){' '}
            {chain && (
              <a href={`${chain.explorerUrl}/token/${c.address}`} target="_blank" rel="noreferrer">
                {c.bsymbol}
              </a>
            )}
          </li>
        ))}
      </ul>
      <h2>
        <a href="https://www.plotbridge.io/faq/">FAQ：</a>
      </h2>
      {tList('into-all').map((q, i) => (
        <h3 key={i}>{q}</h3>
      ))}
    </div>
  )
}
