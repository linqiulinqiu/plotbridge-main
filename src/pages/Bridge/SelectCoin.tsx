import { Tag, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { bridgeContracts } from '../../keeper'
import { formatToken, tokenBalance } from '../../lib/tokens'
import { useCoinlist } from './hooks'

export default function SelectCoinPanel() {
  const { t } = useTranslation()
  const coins = useCoinlist()
  const currentCoin = useAppStore((s) => s.currentCoin)
  const setCurrentCoin = useAppStore((s) => s.setCurrentCoin)
  const setWBalance = useAppStore((s) => s.setWBalance)

  async function changeCoin(index: number) {
    setCurrentCoin(index)
    try {
      const ctx = useAppStore.getState().ctx!
      const bc = bridgeContracts(ctx)
      const coin = bc.coins[index]
      if (!coin) return
      const balance = await tokenBalance(ctx, coin.info.address)
      setWBalance(index, await formatToken(ctx, coin.info.address, balance))
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  return (
    <div className="bridge-coin-panel">
      <p>{t('select-coin')}</p>
      <ul className="coin-list">
        {coins.map((coin) => (
          <li
            key={coin.index}
            className={`coin-item${coin.index === currentCoin ? ' selected' : ''}${
              coin.policy.withdrawOnly ? ' withdraw-only' : ''
            }`}
            onClick={() => void changeCoin(coin.index)}
          >
            <span>{coin.name}</span>
            {coin.policy.withdrawOnly && (
              <div>
                <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                  {t('withdraw-only')}
                </Tag>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
