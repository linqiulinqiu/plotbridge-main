import { useEffect, useState } from 'react'
import { Table, Tabs } from 'antd'
import { useTranslation } from 'react-i18next'
import { formatEther, formatUnits } from 'ethers'
import { chainById } from '../config/chains'
import { useAppStore } from '../store'
import { pbpContracts } from '../pbp'
import { formatToken, tokenSupply } from '../lib/tokens'
import { currentLang, tList } from '../i18n'
import RichNumber from '../components/RichNumber'
import LineList from '../components/LineList'
import pbpAmount from '../data/pbp-amount.json'
import recBurns from '../data/rec-burns.json'

// token info page (old-site views/PBToken.vue + PbtInfo + PbpInfo + PBPInfoMain)
export default function PBTokenPage() {
  const { t } = useTranslation()
  const address = useAppStore((s) => s.address)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="token-info-panel">
        <PbtInfo />
      </div>
      <div className="token-info-panel">
        <PbpInfo />
      </div>
      {address ? (
        <div className="token-info-panel">
          <PbpIssueStatus />
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2>{t('look-info')}</h2>
        </div>
      )}
    </div>
  )
}

function PbtInfo() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 140 }}>
        <h1>PBT</h1>
        <h3>PlotBridge Transporter</h3>
      </div>
      <div style={{ flex: 1, minWidth: 320 }}>
        <Tabs
          items={[
            { key: 'role', label: t('token-role'), children: <LineList list={tList('pbt-info-msgs')} /> },
            { key: 'rule', label: t('issue-rule'), children: <LineList list={tList('pbt-issue-rule-msgs')} /> },
            { key: 'support', label: t('price-support'), children: <LineList list={tList('pbt-price-support-msgs')} /> },
          ]}
        />
      </div>
    </div>
  )
}

function PbpInfo() {
  const { t } = useTranslation()
  const stages = (pbpAmount as { stake_stage: number; stageInfo: { date: string; time: number; stake: number; stage: number; sum: number }[] }).stageInfo
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 140 }}>
        <h1>PBP</h1>
        <h3>PlotBridge Point</h3>
      </div>
      <div style={{ flex: 1, minWidth: 320 }}>
        <Tabs
          items={[
            { key: 'role', label: t('token-role'), children: <LineList list={tList('pbp-info-msgs')} /> },
            {
              key: 'rule',
              label: t('issue-rule'),
              children: (
                <div>
                  <LineList list={tList('pbp-issue-rule-msgs')} />
                  <Table
                    size="small"
                    style={{ marginTop: 12 }}
                    rowKey="date"
                    dataSource={stages}
                    pagination={false}
                    columns={[
                      {
                        title: t('issue-date'),
                        dataIndex: 'date',
                        render: (v: string) => new Date(v).toLocaleDateString(currentLang() === 'zh' ? 'zh-CN' : 'en-US'),
                      },
                      { title: t('issue-time'), dataIndex: 'time', width: 80 },
                      { title: t('issue-amount'), dataIndex: 'stake', render: (v: number) => <RichNumber data={String(v)} /> },
                      { title: t('issue-stage'), dataIndex: 'stage', render: (v: number) => <RichNumber data={String(v)} /> },
                      { title: t('issue-sum'), dataIndex: 'sum', render: (v: number) => <RichNumber data={String(v)} /> },
                    ]}
                  />
                </div>
              ),
            },
            { key: 'support', label: t('price-support'), children: <LineList list={tList('pbp-price-support-msgs')} /> },
          ]}
        />
      </div>
    </div>
  )
}

interface BurnRecord {
  amount: string
  time: string
  txid: string
  url: string
  bnb?: string
}

function PbpIssueStatus() {
  const { t } = useTranslation()
  const ctx = useAppStore((s) => s.ctx)
  const [pbpAddr, setPbpAddr] = useState('-')
  const [totalSupply, setTotalSupply] = useState('-')
  const locale = currentLang() === 'zh' ? 'zh-CN' : 'en-US'

  type BurnEvt = { args: [unknown, unknown, unknown]; timestamp: number; transactionHash: string }
  type BuyEvt = { value: unknown }
  const burnEvts = recBurns.burns as unknown as BurnEvt[]
  const buyEvts = recBurns.buys as unknown as BuyEvt[]

  // recorded amounts are ethers v5 BigNumber JSON: {type:'BigNumber', hex}
  function toBig(v: unknown): bigint {
    if (typeof v === 'string') return BigInt(v)
    return BigInt((v as { hex?: string }).hex ?? '0')
  }

  const burns: BurnRecord[] = burnEvts.map((burn, i) => {
    const rec: BurnRecord = {
      // PBP has 9 decimals — gwei formatting matches the recorded events
      amount: formatUnits(toBig(burn.args[2]), 'gwei'),
      time: new Date(burn.timestamp * 1000).toLocaleDateString(locale),
      txid: burn.transactionHash,
      url: `https://bscscan.com/tx/${burn.transactionHash}`,
    }
    if (buyEvts.length > i) rec.bnb = formatEther(toBig(buyEvts[i].value))
    return rec
  })
  const burntSum = burns.reduce((acc, b) => acc + parseFloat(b.amount), 0)
  const bnbUsed = buyEvts.reduce((acc, b) => acc + toBig(b.value), 0n)

  useEffect(() => {
    if (!ctx) return
    const { pbp } = pbpContracts(ctx)
    const addr = String(pbp.target)
    setPbpAddr(addr)
    void tokenSupply(ctx, addr).then(async (supply) => setTotalSupply(await formatToken(ctx, addr, supply)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])

  const chain = chainById(ctx?.chainId)
  const explorer = chain?.explorerUrl ?? 'https://bscscan.com'

  return (
    <div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <h2 style={{ minWidth: 180 }}>{t('pbp-issue-status')}</h2>
        <ul style={{ lineHeight: 2.2, flex: 1, minWidth: 300 }}>
          <li>
            {t('issue-ctr-addr')}：
            <a className="font-accent" target="_blank" rel="noreferrer" href={pbpAddr.length > 1 ? `${explorer}/token/${pbpAddr}` : '#'}>
              {pbpAddr}
            </a>
          </li>
          <li>
            {t('now-issue-sum')}：<RichNumber data={totalSupply} />
          </li>
          <li>
            {t('destroy-sum')}：<RichNumber data={String(burntSum)} />
          </li>
          <li>
            {t('buyback-bnb')}：<RichNumber data={formatEther(bnbUsed)} />
          </li>
        </ul>
      </div>
      <h2 style={{ textAlign: 'center', margin: '16px 0' }}>Buy back and Burned</h2>
      <Table
        size="small"
        rowKey="txid"
        dataSource={burns}
        pagination={false}
        columns={[
          { title: t('burn-date'), dataIndex: 'time', width: 130 },
          { title: `${t('amount')}(BNB)`, dataIndex: 'bnb', width: 140, render: (v?: string) => <RichNumber data={v ?? '-'} /> },
          { title: `${t('amount')}(PBP)`, dataIndex: 'amount', width: 170, render: (v: string) => <RichNumber data={v} /> },
          {
            title: 'TX',
            dataIndex: 'txid',
            render: (v: string, rec: BurnRecord) => (
              <a className="mono" href={rec.url} target="_blank" rel="noreferrer">
                {v}
              </a>
            ),
          },
        ]}
      />
    </div>
  )
}
