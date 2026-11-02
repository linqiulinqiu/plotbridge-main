import React,{useEffect,useState} from 'react';
import zhText from './shared/locales/zh.json';
import enText from './shared/locales/en.json';
import {totalValueLocked} from './tvl';
import {ModuleProps} from './types';
import {assets} from './bridge';
import {Alert,Badge,Button,EmptyState,IconChevron,IconSparkle,Skeleton} from './ui';

const channels=[
 {name:'discord',href:'https://discord.gg/xHC9fBfeVW'},
 {name:'telegram',href:'https://t.me/PlotBridge'},
 {name:'twitter',href:'https://twitter.com/plot_bridge'}];

export default function Home({session:s,en,revision}:ModuleProps){
 const t=(a:string,b:string)=>en?b:a;
 const l=(en?enText:zhText) as unknown as Record<string,any>;
 const [V,setV]=useState<number>(),[error,X]=useState('');
 useEffect(()=>{let active=true;setV(undefined);X('');if(!s)return;totalValueLocked(s).then(v=>{if(active)setV(v)}).catch(e=>{if(active)X(e.reason||e.message)});return()=>{active=false}},[s,revision]);
 const news=l['home-news'] as {ts:string;msg:string}[];
 const steps=[
  {title:t('连接 BSC 钱包','Connect a BSC wallet'),text:t('浏览器扩展钱包即可，移动端暂不支持。','Any browser extension wallet works; mobile wallets are not supported yet.')},
  {title:t('选择 PBT 并绑定提现地址','Select a PBT and bind a withdrawal address'),text:t('PBT 是你的桥接身份，地址与它一一对应。','A PBT is your bridge identity and owns its own addresses.')},
  {title:t('充值即转账，提现即烧币','Deposit by transfer, withdraw by burning'),text:t('WXCH 完整桥接，其余币种仅支持人工兑付提现。','WXCH is fully bridged; the other assets support manual redemption withdrawals only.')}];

 return <div className="stack stack-6">
  <section className="hero">
   <div className="hero__grid"/><div className="hero__glow"/>
   <div className="hero__content">
    <p className="eyebrow">BSC · CHIA ECOSYSTEM</p>
    <h1 className="hero__title">{l['home-title']}</h1>
    <p className="hero__desc">{l['home-note']}</p>
    <div className="hero__stats">
     <div className="hero__stat">
      <span className="hero__stat-label">{t('锁定总值','Total Value Locked')}</span>
      <span className="hero__stat-value">{V===undefined?(s?<Skeleton variant="text" style={{height:26,width:110}}/>:'—'):'$ '+V.toLocaleString('en-US')}</span>
     </div>
     <div className="hero__stat">
      <span className="hero__stat-label">{t('网络','Network')}</span>
      <span className="hero__stat-value" style={{fontSize:'var(--t-md)'}}>BNB Smart Chain</span>
     </div>
     <div className="hero__stat">
      <span className="hero__stat-label">{t('支持币种','Supported assets')}</span>
      <span className="hero__stat-value" style={{fontSize:'var(--t-md)'}}>{assets.length} {t('种','assets')}</span>
     </div>
    </div>
   </div>
  </section>

  {error&&<Alert tone="danger">{error}</Alert>}

  <div className="home-grid">
   <div className="stack stack-5">
    <div className="stack stack-4">
     <div className="home-feature">
      <div className="home-feature__title">{t('如何使用','How it works')}</div>
      <ol className="home-feature__steps">{steps.map((st,i)=><li key={st.title}><span>{i+1}</span><span><strong style={{color:'var(--text)'}}>{st.title}</strong><br/>{st.text}</span></li>)}</ol>
      <div className="row" style={{marginTop:'var(--s-4)'}}><Button variant="secondary" size="sm" onClick={()=>{location.hash='#/bridge'}}>{t('前往跨链桥','Open the bridge')} <IconChevron/></Button></div>
     </div>
    </div>

    <div className="disclosure">
     <summary>{t('历史活动与公告','Announcements and history')}</summary>
     <div className="disclosure__body">
      {Array.isArray(news)&&news.length>0
       ?<div className="timeline">{news.map((n,i)=><div className="timeline__item" key={i}><span className="timeline__date">{n.ts}</span><span className="timeline__text">{n.msg}</span></div>)}</div>
       :<EmptyState title={t('暂无公告','No announcements')}/>}
      <p style={{marginTop:'var(--s-4)'}}><a href="https://www.plotbridge.io/activities/crosspb/" target="_blank" rel="noreferrer">{l['dp-xcc']}</a></p>
     </div>
    </div>
   </div>

   <div className="stack stack-5">
    <div className="home-feature">
     <div className="home-feature__title">{t('支持的资产','Supported assets')}</div>
     <div className="stack stack-2">
      {assets.map(a=><div className="row row--between" key={a.id} style={{padding:'var(--s-2) 0'}}>
       <span className="row"><img src={'/image/'+a.symbol.toLowerCase()+'.png'} alt={a.symbol} width={22} height={22}/><strong>{a.symbol}</strong><span className="subtle">{a.name}</span></span>
       <Badge tone={a.bridge?'ready':'partial'}>{a.bridge?t('完整桥接','Full bridge'):t('仅提现','Withdraw only')}</Badge>
      </div>)}
     </div>
     <div style={{marginTop:'var(--s-4)'}}><Alert tone="warning" title={t('人工兑付说明','Manual redemption')}><span>{t('HDDcoin / Chives / Flax 的充值已关闭，提现由团队人工处理，一般 7 个工作日内到账。','Deposits for HDDcoin, Chives and Flax are closed. Withdrawals are handled by the team, usually within 7 business days.')}</span></Alert></div>
    </div>

    <div className="home-feature">
     <div className="home-feature__title">{t('联系我们','Contact')}</div>
     <div className="home-channels">{channels.map(c=><a className="home-channel" key={c.name} href={c.href} target="_blank" rel="noreferrer">{c.name}</a>)}</div>
    </div>
   </div>
  </div>
 </div>;
}
