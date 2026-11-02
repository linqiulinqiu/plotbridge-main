import React from 'react';
import zhText from './shared/locales/zh.json';
import enText from './shared/locales/en.json';
import {assets} from './bridge';
import {ModuleProps} from './types';
import {Alert,Badge,PageHead} from './ui';

// Locale files are static, reviewed repository content, so their markup is rendered as-is.
const raw=(v:unknown)=>({__html:String(v||'')});

const menu=[
 {id:'overview',key:'doc'},
 {id:'introduction',key:'intruction'},
 {id:'activities',key:'activities'},
 {id:'bridge',key:'guide-bridge'},
 {id:'market',key:'guide-market'},
 {id:'wallet',key:'guide-wallet'},
 {id:'contact',key:'contact'},
 {id:'roadmap',key:'road-map'}];

// Legacy Vue hash paths (#/Doc/GuideforBridge and friends) still resolve.
const legacy:{id:string;match:string[]}[]=[
 {id:'introduction',match:['introduction','intruction']},
 {id:'activities',match:['activities']},
 {id:'bridge',match:['bridge','guideforbridge']},
 {id:'market',match:['market','guideformarket']},
 {id:'wallet',match:['wallet','guideforwallet']},
 {id:'contact',match:['contact']},
 {id:'roadmap',match:['roadmap']}];

export function docPage(hash:string){const seg=hash.toLowerCase().split('/').slice(2).join('/').split('?')[0];for(const l of legacy)if(l.match.includes(seg))return l.id;return menu.some(m=>m.id===seg)?seg:'overview'}

export default function Docs({session:s,en}:ModuleProps){
 const t=(a:string,b:string)=>en?b:a;
 const l=(en?enText:zhText) as unknown as Record<string,any>;
 const page=docPage(location.hash);

 const render=()=>{
  if(page==='introduction')return <>
   <h1><a href="https://www.plotbridge.io/about/" target="_blank" rel="noreferrer">{l.intruction}</a></h1>
   <p dangerouslySetInnerHTML={raw(l.intruction1)}/>
   <ul>{(assets as any[]).map(c=>{const address=(s?.config.ctr_addrs as Record<string,string|undefined>|undefined)?.[c.ctrname];return <li key={c.symbol}>{c.name} ({c.native}){address&&<a href={'https://bscscan.com/token/'+address} target="_blank" rel="noreferrer">{c.symbol}</a>}</li>})}</ul>
   <h2><a href="https://www.plotbridge.io/faq/" target="_blank" rel="noreferrer">FAQ：</a></h2>
   {(l['into-all'] as string[]).map((item,i)=><h3 key={i}>{item}</h3>)}
  </>;
  if(page==='activities')return <>
   <h1>{l['pb-events']}</h1>
   <h2><a href="https://www.plotbridge.io/activities/crosspb/" target="_blank" rel="noreferrer">{l['dp-xcc']}</a></h2>
  </>;
  if(page==='bridge')return <>
   <h1>{l['guide-bridge']}</h1>
   <h2><a href="https://www.plotbridge.io/guidesub/towxcc/" target="_blank" rel="noreferrer">{l['guide-bridge1']} ?</a></h2>
   <h2><a href="https://www.plotbridge.io/guidesub/toxcc/" target="_blank" rel="noreferrer">{l['guide-bridge3']} ?</a></h2>
   <h2><a href="https://www.plotbridge.io/guidesub/upgradecoin/" target="_blank" rel="noreferrer">{l['guide-bridge5']} ?</a></h2>
  </>;
  if(page==='market')return <>
   <h1><a href="https://www.plotbridge.io/guidesub/marketguide/" target="_blank" rel="noreferrer">{l['guide-market']}</a></h1>
   <p>{l['guide-market1']}</p>
  </>;
  if(page==='wallet')return <>
   <h1>{l['guide-wallet']}</h1>
   <h2>{l['guide-wallet1']}</h2>
   <h3>{l['guide-wallet2']}</h3>
   <p dangerouslySetInnerHTML={raw(l['guide-wallet3'])}/>
   <h3 dangerouslySetInnerHTML={raw(l['guide-wallet4'])}/>
   <p dangerouslySetInnerHTML={raw(l['guide-wallet5'])}/>
   <h3 dangerouslySetInnerHTML={raw(l['guide-wallet6'])}/>
   <p dangerouslySetInnerHTML={raw(l['guide-wallet7'])}/>
  </>;
  if(page==='contact')return <>
   <h1>{l.contact}</h1>
   <p dangerouslySetInnerHTML={raw(l.contact1)}/>
  </>;
  if(page==='roadmap')return <h1>{l['road-map']}</h1>;
  return <>
   <h1>{t('使用指南','User guide')}</h1>
   <p style={{whiteSpace:'pre-line'}} dangerouslySetInnerHTML={raw(l.intruction1)}/>
   <h3>Bridge</h3>
   <p>{t('连接浏览器钱包，选择 PBT。XCH 充值直接向该 PBT 的充值地址转账，单次不超过 50 XCH。绑定提现地址后，销毁对应包装币即可申请提现；WHDD、WXCC、WXFX 仅支持人工处理的提现。','Connect your browser wallet and select a PBT. Deposit XCH to its deposit address, up to 50 XCH per transfer. Bind a withdrawal address and burn the corresponding wrapped token to request withdrawal. WHDD, WXCC and WXFX support manually processed withdrawals only.')}</p>
   <h3>Swap</h3>
   <p>{t('选择支付和接收资产，设置金额及滑点。报价 60 秒内有效，授权完成后若报价过期需重新获取。','Select pay and receive assets, amount and slippage. Quotes expire in 60 seconds; refresh if approval takes longer.')}</p>
   <h3>Market</h3>
   <p>{t('铸造、转移、上架、购买或撤回 PBT。上架分为转入市场和设置售价两笔交易，可在“我的出售”恢复未完成的设置。','Mint, transfer, list, buy or withdraw PBTs. Listing transfers custody then sets a price; incomplete listings can be resumed under My listings.')}</p>
   <h3>Stake</h3>
   <p>{t('按池质押或提取；领取奖励受锁定期限制。提前提取会放弃全部待领取奖励，追加质押和领取等操作会重置锁定时间。','Stake or withdraw per pool. Claims require unlocking. Early withdrawal forfeits pending rewards. Deposits and claims reset lock time.')}</p>
  </>;
 };

 return <>
  <PageHead eyebrow="DOCS" title={l.doc} desc={t('使用指南、功能说明与历史活动记录。','Guides, feature notes and past activity.')}/>
  <div className="docs-layout">
   <nav className="docs-nav" aria-label={t('文档目录','Documentation')}>
    {menu.map(m=><a key={m.id} href={'#/doc/'+m.id} className={page===m.id?'active':''} aria-current={page===m.id?'page':undefined}>{l[m.key]}</a>)}
   </nav>
   <article className="docs-body">{render()}</article>
  </div>
 </>;
}
