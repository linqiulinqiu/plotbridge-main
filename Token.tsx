import React,{useEffect,useState} from 'react';
import {ethers} from 'ethers';
import zhText from './shared/locales/zh.json';
import enText from './shared/locales/en.json';
import stageInfo from './tools/pbp-amount.json';
import recBurns from './tools/rec-burns.json';
import {contract} from './bridge';
import {ModuleProps} from './Swap';

const tokenABI=['function symbol() view returns(string)','function decimals() view returns(uint8)','function totalSupply() view returns(uint256)'];
const burnList=(recBurns as any).burns as any[],buyList=(recBurns as any).buys as any[];
const stages=(stageInfo as any).stageInfo as any[];

export default function Token({session:s,en,revision}:ModuleProps){
 const t=(a:string,b:string)=>en?b:a;
 const l=(en?enText:zhText) as unknown as Record<string,any>;
 const [tokens,T]=useState<any[]>([]),[error,X]=useState('');
 useEffect(()=>{let active=true;T([]);X('');if(!s||!location.hash.toLowerCase().includes('token'))return;
  Promise.all(['pbp','wxch','whdd','wxcc','wxfx'].filter(n=>(s.config.ctr_addrs as Record<string,string|undefined>)[n]).map(async name=>{const ctr=contract(s,name,tokenABI);const [symbol,decimals,supply]=await Promise.all([ctr.symbol(),ctr.decimals(),ctr.totalSupply()]);return {symbol,address:ctr.address,supply:ethers.utils.formatUnits(supply,decimals)}}))
  .then(rows=>{if(active)T(rows)}).catch(e=>{if(active)X(e.reason||e.message)});return()=>{active=false}},[s,revision]);
 const burned=burnList.reduce((sum,b)=>sum.add(ethers.BigNumber.from(b.args[2].hex)),ethers.BigNumber.from(0));
 const bnbUsed=buyList.reduce((sum,b)=>sum.add(ethers.BigNumber.from(b.value.hex)),ethers.BigNumber.from(0));
 const pbp=tokens.find(x=>x.symbol==='PBP');
 return <section className="token-module">
  <h2>{t('Token 信息','Token information')}</h2>
  {!s&&<p>{t('连接钱包以读取实时链上数据','Connect to load on-chain data')}</p>}
  {tokens.map(token=><article key={token.address}><h3>{token.symbol}</h3><a target="_blank" rel="noreferrer" href={s!.config.chainExplorerUrl+'/token/'+token.address}>{token.address}</a><p>{t('总供应量','Total supply')}: {token.supply}</p></article>)}
  <h2>PBP</h2>
  <h3>{l['token-role']}</h3>
  <ul>{(l['pbp-info-msgs'] as string[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
  <h3>{l['issue-rule']}</h3>
  <ul>{(l['pbp-issue-rule-msgs'] as string[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
  <table className="doc-table"><thead><tr><th>{l['issue-date']}</th><th>{l['issue-time']}</th><th>{l['issue-amount']}</th><th>{l['issue-stage']}</th><th>{l['issue-sum']}</th></tr></thead><tbody>{stages.map(row=><tr key={row.date}><td>{row.date.slice(0,10)}</td><td>{row.time}</td><td>{row.stake}</td><td>{row.stage}</td><td>{row.sum}</td></tr>)}</tbody></table>
  <h3>{l['price-support']}</h3>
  <ul>{(l['pbp-price-support-msgs'] as string[]).map((m,i)=><li key={i}>{m}</li>)}</ul>
  {pbp&&<article className="pbp-stats"><h3>{l['pbp-issue-status']}</h3><ul>
   <li>{l['issue-ctr-addr']}: <a target="_blank" rel="noreferrer" href={s!.config.chainExplorerUrl+'/token/'+pbp.address}>{pbp.address}</a></li>
   <li>{l['now-issue-sum']}: {pbp.supply}</li>
   <li>{l['destroy-sum']}: {ethers.utils.formatUnits(burned,'gwei')}</li>
   <li>{l['buyback-bnb']}: {ethers.utils.formatEther(bnbUsed)}</li>
  </ul></article>}
  <h3>Buy back and Burned</h3>
  <table className="doc-table"><thead><tr><th>{l['burn-date']}</th><th>{t('金额','Amount')}(BNB)</th><th>{t('金额','Amount')}(PBP)</th><th>TX</th></tr></thead><tbody>
   {burnList.map((burn,i)=><tr key={burn.transactionHash}><td>{new Date(burn.timestamp*1000).toLocaleDateString(en?'en':'zh-CN')}</td><td>{buyList[i]?ethers.utils.formatEther(ethers.BigNumber.from(buyList[i].value.hex)):'—'}</td><td>{ethers.utils.formatUnits(ethers.BigNumber.from(burn.args[2].hex),'gwei')}</td><td><a target="_blank" rel="noreferrer" href={'https://bscscan.com/tx/'+burn.transactionHash}>{burn.transactionHash.slice(0,12)}…</a></td></tr>)}
  </tbody></table>
  {error&&<p role="alert">{error}</p>}
 </section>;
}
