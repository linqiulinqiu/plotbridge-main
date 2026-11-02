import React,{useEffect,useState} from 'react';
import {ethers} from 'ethers';
import zhText from './shared/locales/zh.json';
import enText from './shared/locales/en.json';
import stageInfo from './tools/pbp-amount.json';
import recBurns from './tools/rec-burns.json';
import {contract} from './bridge';
import {ModuleProps} from './types';
import {Alert,Badge,Card,PageHead,Stat} from './ui';

const tokenABI=['function symbol() view returns(string)','function decimals() view returns(uint8)','function totalSupply() view returns(uint256)'];
const burnList=(recBurns as any).burns as any[],buyList=(recBurns as any).buys as any[];
const stages=(stageInfo as any).stageInfo as any[];

export default function Token({session:s,en,revision}:ModuleProps){
 const t=(a:string,b:string)=>en?b:a;
 const l=(en?enText:zhText) as unknown as Record<string,any>;
 const [tokens,setTokens]=useState<any[]>([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;setTokens([]);setError('');if(!s||!location.hash.toLowerCase().includes('token'))return;
  Promise.all(['pbp','wxch','whdd','wxcc','wxfx'].filter(n=>(s.config.ctr_addrs as Record<string,string|undefined>)[n]).map(async name=>{
   const ctr=contract(s,name,tokenABI);const [symbol,decimals,supply]=await Promise.all([ctr.symbol(),ctr.decimals(),ctr.totalSupply()]);
   return {symbol,address:ctr.address,supply:ethers.utils.formatUnits(supply,decimals)}}))
  .then(rows=>{if(active)setTokens(rows)}).catch(e=>{if(active)setError(e.reason||e.message)});
  return()=>{active=false}},[s,revision]);
 const burned=burnList.reduce((sum,b)=>sum.add(ethers.BigNumber.from(b.args[2].hex)),ethers.BigNumber.from(0));
 const bnbUsed=buyList.reduce((sum,b)=>sum.add(ethers.BigNumber.from(b.value.hex)),ethers.BigNumber.from(0));
 const pbp=tokens.find(x=>x.symbol==='PBP');

 return <>
  <PageHead eyebrow="TOKEN" title={t('代币信息','Token information')} desc={t('PBP 的作用、发行规则、价格支持与回购销毁记录。','The role of PBP, its issuance rules, price support and buyback records.')}/>

  <div className="stack stack-6">
   {!s&&<Alert tone="info">{t('连接钱包以读取实时链上数据','Connect to load on-chain data')}</Alert>}

   {tokens.length>0&&<div className="token-stats">{tokens.map(token=>
    <div className="stat" key={token.address}>
     <span className="stat__label">{token.symbol}</span>
     <span className="stat__value">{token.supply}</span>
     <a className="token-addr" target="_blank" rel="noreferrer" href={s!.config.chainExplorerUrl+'/token/'+token.address}>{token.address}</a>
    </div>)}</div>}

   <Card title="PBP" sub={l['token-role']}>
    <ul className="prose">{(l['pbp-info-msgs'] as string[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
    <h3 style={{marginTop:'var(--s-6)'}}>{l['issue-rule']}</h3>
    <ul className="prose">{(l['pbp-issue-rule-msgs'] as string[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
    <div className="table-wrap" style={{marginTop:'var(--s-5)'}}><table className="table">
     <thead><tr><th>{l['issue-date']}</th><th>{l['issue-time']}</th><th>{l['issue-amount']}</th><th>{l['issue-stage']}</th><th>{l['issue-sum']}</th></tr></thead>
     <tbody>{stages.map(row=><tr key={row.date}><td className="num">{row.date.slice(0,10)}</td><td className="num">{row.time}</td><td className="num">{row.stake}</td><td className="num">{row.stage}</td><td className="num">{row.sum}</td></tr>)}</tbody>
    </table></div>
   </Card>

   <Card title={l['price-support']}>
    <ul className="prose">{(l['pbp-price-support-msgs'] as string[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
    {pbp&&<div className="stat-grid" style={{marginTop:'var(--s-5)'}}>
     <Stat label={l['now-issue-sum']} value={pbp.supply}/>
     <Stat label={l['destroy-sum']} value={ethers.utils.formatUnits(burned,'gwei')}/>
     <Stat label={l['buyback-bnb']} value={ethers.utils.formatEther(bnbUsed)}/>
    </div>}
   </Card>

   <Card title={t('回购与销毁记录','Buy back and Burned')} sub={t('每一笔 PBP 回购销毁对应的链上交易。','Each buyback and burn, with its on-chain transaction.')}>
    <div className="table-wrap"><table className="table">
     <thead><tr><th>{l['burn-date']}</th><th>{t('金额','Amount')}(BNB)</th><th>{t('金额','Amount')}(PBP)</th><th>TX</th></tr></thead>
     <tbody>{burnList.map((burn,i)=><tr key={burn.transactionHash}>
      <td className="num">{new Date(burn.timestamp*1000).toLocaleDateString(en?'en':'zh-CN')}</td>
      <td className="num">{buyList[i]?ethers.utils.formatEther(ethers.BigNumber.from(buyList[i].value.hex)):'—'}</td>
      <td className="num">{ethers.utils.formatUnits(ethers.BigNumber.from(burn.args[2].hex),'gwei')}</td>
      <td><a target="_blank" rel="noreferrer" href={'https://bscscan.com/tx/'+burn.transactionHash}>{burn.transactionHash.slice(0,12)}…</a></td>
     </tr>)}</tbody>
    </table></div>
   </Card>

   {error&&<Alert tone="danger">{error}</Alert>}
  </div>
 </>;
}
