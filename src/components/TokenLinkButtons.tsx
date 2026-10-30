import { useEffect, useState } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { ZeroAddress } from 'ethers'
import { chainById } from '../config/chains'
import { factoryAbi } from '../config/abis'
import { useAppStore } from '../store'
import { abiContract, tokenSymbol } from '../lib/tokens'

// PancakeSwap/explorer quick links for a token (old-site LinkButton):
// add LP, token info, pair info. btoken defaults to PBP.
export default function TokenLinkButtons({
  token,
  btoken,
  onlyLp = false,
}: {
  token?: string | null
  btoken?: string | null
  onlyLp?: boolean
}) {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [links, setLinks] = useState<{ addLp: { url: string; txt: string } | null; tokenInfo: { url: string; txt: string } | null; poolInfo: { url: string; txt: string } | null }>({
    addLp: null,
    tokenInfo: null,
    poolInfo: null,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!ctx || !token || token === ZeroAddress) {
        setLinks({ addLp: null, tokenInfo: null, poolInfo: null })
        return
      }
      const chain = chainById(ctx.chainId)
      if (!chain) return
      const factory = abiContract(ctx, 'factory', factoryAbi, chain.contracts.factory)
      const symbol = await tokenSymbol(ctx, token)
      let base = btoken ?? chain.contracts.pbp
      let baseSymbol: string
      let baseAdd: string
      if (base === token || base === ZeroAddress || base === chain.contracts.wbnb) {
        base = chain.contracts.wbnb
        baseSymbol = 'BNB'
        baseAdd = 'BNB'
      } else {
        baseSymbol = await tokenSymbol(ctx, base)
        baseAdd = base
      }
      const pair = await factory.getPair(token, base)
      if (cancelled) return
      const txt = `${symbol}-${baseSymbol}`
      setLinks({
        addLp: { url: `${chain.swapUrl}/add/${baseAdd}/${token}`, txt },
        tokenInfo: { url: `${chain.explorerUrl}/token/${token}`, txt: symbol },
        poolInfo: pair !== ZeroAddress ? { url: `${chain.swapUrl}/info/pairs/${pair}`, txt } : null,
      })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [ctx, token, btoken])

  if (onlyLp) {
    return links.addLp ? (
      <Button className="btn-link">
        <a href={links.addLp.url} target="_blank" rel="noreferrer">
          {t('add')} LP
        </a>
      </Button>
    ) : null
  }
  return (
    <span style={{ marginLeft: 10 }}>
      {links.addLp && (
        <Button className="btn-link">
          <a href={links.addLp.url} target="_blank" rel="noreferrer">
            {t('add-lp', { 0: links.addLp.txt, pair: links.addLp.txt })}
          </a>
        </Button>
      )}
      {links.tokenInfo && (
        <Button className="btn-link">
          <a href={links.tokenInfo.url} target="_blank" rel="noreferrer">
            {t('token-info', { 0: links.tokenInfo.txt, token: links.tokenInfo.txt })}
          </a>
        </Button>
      )}
      {links.poolInfo && (
        <Button className="btn-link">
          <a href={links.poolInfo.url} target="_blank" rel="noreferrer">
            {t('pair-info', { 0: links.poolInfo.txt, pair: links.poolInfo.txt })}
          </a>
        </Button>
      )}
    </span>
  )
}
