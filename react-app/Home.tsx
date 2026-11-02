import React,{useEffect,useState} from 'react';
import zhText from '../shared/locales/zh.json';
import enText from '../shared/locales/en.json';
import {totalValueLocked} from './tvl';
import {ModuleProps} from './Swap';

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
 return <section className="home-module">
  <div className="home-hero">
   <h3 className="tvl">{t('锁定总值','Total Value Locked')}: {V===undefined?(s?t('读取中…','Loading…'):'—'):'$ '+V.toLocaleString('en-US')}</h3>
   <h2>{l['home-title']}</h2>
  </div>
  <p>{l['home-note']}</p>
  {error&&<p role="alert">{error}</p>}
  <div className="home-contact">{channels.map(c=><a key={c.name} href={c.href} target="_blank" rel="noreferrer">{c.name}</a>)}</div>
  <details><summary>{t('历史活动与公告','Historical activities and announcements')}</summary><a href="https://www.plotbridge.io/activities/crosspb/" target="_blank" rel="noreferrer">{l['dp-xcc']}</a>{Array.isArray(news)&&news.map((n,i)=><p key={i}><strong>{n.ts}</strong> · {n.msg}</p>)}</details>
 </section>;
}
