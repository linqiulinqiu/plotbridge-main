import React,{useState,useEffect,useRef,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {ethers,BigNumber as BN} from 'ethers';
import * as bridge from './bridge';
import ErrorBoundary from './ErrorBoundary';
import Bridge from './BridgePage';
import {ModuleProps} from './types';
import {
 Button,IconCheckCircle,IconClose,IconGlobe,IconMenu,IconMoon,IconSun,IconWallet
} from './ui';

const Swap=React.lazy(()=>import('./Swap'));
const Market=React.lazy(()=>import('./Market'));
const Stake=React.lazy(()=>import('./Stake'));
const Home=React.lazy(()=>import('./Home'));
const Docs=React.lazy(()=>import('./Docs'));
const Token=React.lazy(()=>import('./Token'));

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

declare global {interface Window {ethereum?:any;ChiaUtils:any}}

function App(){
 const [en,E]=useState(localStorage.language==='en');
 const [dark,D]=useState(localStorage.theme?localStorage.theme==='dark':true);
 const [s,S]=useState<bridge.Session>(),[ids]=useState<string[]>([]),[coin]=useState(bridge.assets[0]);
 const [data,F]=useState<any>(),[amount,A]=useState(''),[dest,W]=useState('');
 const [error,X]=useState(''),[busy,B]=useState(false),[status,T]=useState(''),[hash,H]=useState(''),[refresh,R]=useState(0);
 const [menuOpen,setMenuOpen]=useState(false);
 const generation=useRef(0),lock=useRef(false),connecting=useRef(false);
 const t=(zh:string,eng:string)=>en?eng:zh;

 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.lang=en?'en':'zh';localStorage.theme=dark?'dark':'light';localStorage.language=en?'en':'zh'},[dark,en]);
 useEffect(()=>{const p=window.ethereum;if(!p)return;const reset=()=>{if(!connecting.current)generation.current++;S(undefined);F(undefined);T('');H('');X('')};p.on('accountsChanged',reset);p.on('chainChanged',reset);p.on('disconnect',reset);return()=>{p.removeListener('accountsChanged',reset);p.removeListener('chainChanged',reset);p.removeListener('disconnect',reset)}},[]);

 async function connect(){if(lock.current)return;connecting.current=true;lock.current=true;B(true);X('');const g=generation.current;try{const session=await bridge.connect();if(g===generation.current)S(session)}catch(e:any){if(g===generation.current)X(e.message)}finally{connecting.current=false;lock.current=false;B(false)}}
 async function transact(action:()=>Promise<ethers.ContractTransaction>){if(!s||lock.current)return;lock.current=true;B(true);X('');H('');const g=generation.current;const update=(v:string)=>{if(g===generation.current)T(v)};try{await bridge.assertSession(s);update(t('等待钱包签名','Awaiting signature'));const tx=await action();if(g===generation.current)H(tx.hash);update(t('等待链上确认','Confirming'));let receipt;try{receipt=await tx.wait()}catch(e:any){if(e.code==='TRANSACTION_REPLACED'&&!e.cancelled){receipt=e.receipt;if(g===generation.current)H(e.replacement.hash)}else throw e}if(!receipt.status)throw Error('Transaction reverted / 交易回滚');update(t('交易已确认','Transaction confirmed'));if(g===generation.current)R(x=>x+1)}catch(e:any){if(g===generation.current){X(e.reason||e.message);T(t('交易未完成','Transaction incomplete'))}}finally{lock.current=false;B(false)}}

 const [route,setRoute]=useState(location.hash||'#/bridge');
 useEffect(()=>{const changed=()=>{setRoute(location.hash);setMenuOpen(false);window.scrollTo({top:0})};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed)},[]);
 const lower=route.toLowerCase();
 const Module:React.ComponentType<ModuleProps>=
  lower.startsWith('#/home')?Home:
  lower.startsWith('#/token')||lower.startsWith('#/pbtoken')?Token:
  lower.startsWith('#/doc')?Docs:
  lower.startsWith('#/market')?Market:
  lower.startsWith('#/stake')?Stake:
  lower.startsWith('#/swap')?Swap:Bridge;
 const closed=/presale|redeem/i.test(route+location.pathname);

 const NAV=[
  {id:'bridge',label:'Bridge',hash:'#/bridge',on:lower.startsWith('#/bridge')},
  {id:'swap',label:'Swap',hash:'#/swap',on:lower.startsWith('#/swap')},
  {id:'market',label:'Market',hash:'#/market',on:lower.startsWith('#/market')},
  {id:'stake',label:'Stake',hash:'#/stake',on:lower.startsWith('#/stake')},
  {id:'home',label:t('首页','Home'),hash:'#/home',on:lower.startsWith('#/home')},
  {id:'token',label:'Token',hash:'#/token',on:lower.startsWith('#/token')||lower.startsWith('#/pbtoken')},
  {id:'doc',label:t('文档','Docs'),hash:'#/doc',on:lower.startsWith('#/doc')}];

 const account=s?s.account.slice(0,6)+'…'+s.account.slice(-4):t('连接钱包','Connect wallet');
 const closeMenu=useCallback(()=>setMenuOpen(false),[]);

 return <>
  <header className="app-header">
   <div className="app-header__inner">
    <a className="brand" href="#/home"><img src="/image/logo.svg" alt=""/><strong>PlotBridge</strong></a>
    <nav className="site-nav">{NAV.map(n=><a key={n.id} className="site-nav__link" href={n.hash} aria-current={n.on?'page':undefined}>{n.label}</a>)}</nav>
    <div className="app-header__actions">
     <button type="button" className="icon-btn" onClick={()=>E(!en)} aria-label={en?'切换到中文':'Switch to English'} title={en?'中文':'English'}><IconGlobe/></button>
     <button type="button" className="icon-btn" onClick={()=>D(!dark)} aria-label={dark?'切换到浅色模式':'Switch to dark mode'} title={dark?'Light':'Dark'}>{dark?<IconSun/>:<IconMoon/>}</button>
     <Button variant="primary" icon={<IconWallet/>} disabled={busy} onClick={connect}>{account}</Button>
     <button type="button" className="icon-btn app-header__menu" onClick={()=>setMenuOpen(true)} aria-label={t('菜单','Menu')} aria-expanded={menuOpen}><IconMenu/></button>
    </div>
   </div>
  </header>

  {menuOpen&&<>
   <div className="drawer-backdrop" onClick={closeMenu}/>
   <div className="drawer" role="dialog" aria-modal="true" aria-label={t('菜单','Menu')}>
    <div className="drawer__head">
     <span className="brand"><img src="/image/logo.svg" alt=""/><strong>PlotBridge</strong></span>
     <button type="button" className="icon-btn" onClick={closeMenu} aria-label={t('关闭','Close')}><IconClose/></button>
    </div>
    <nav className="drawer__nav">{NAV.map(n=><a key={n.id} href={n.hash} aria-current={n.on?'page':undefined}>{n.label}</a>)}</nav>
    <div className="drawer__foot">
     <Button variant="primary" block icon={<IconWallet/>} disabled={busy} onClick={connect}>{account}</Button>
     <div className="row row--between">
      <span className="subtle">{t('语言','Language')}</span>
      <Button size="sm" variant="secondary" onClick={()=>E(!en)}>{en?'中文':'English'}</Button>
     </div>
     <div className="row row--between">
      <span className="subtle">{t('主题','Theme')}</span>
      <Button size="sm" variant="secondary" onClick={()=>D(!dark)}>{dark?'Light':'Dark'}</Button>
     </div>
    </div>
   </div>
  </>}

  <main className="page">
   {closed&&<div style={{marginBottom:'var(--s-6)'}}><div className="alert alert--warning"><div className="alert__body">{t('预售与旧币兑换已关闭，请使用 Bridge。','Presale and legacy redemption are closed. Use Bridge.')}</div></div></div>}
   <ErrorBoundary key={route} en={en}>
    <React.Suspense fallback={<div className="stack stack-3"><div className="skeleton skeleton--title"/><div className="skeleton skeleton--card"/></div>}>
     <Module session={s} en={en} run={transact} busy={busy} revision={refresh}/>
    </React.Suspense>
   </ErrorBoundary>
  </main>

  {(error||status||hash)&&<div className="toasts">
   {status&&<div className="toast toast--info"><span className="btn__spinner"/><span>{status}</span></div>}
   {error&&<div className="toast toast--danger" role="alert"><span>{error}</span></div>}
   {hash&&s&&<div className="toast toast--success"><IconCheckCircle/><span>{t('交易已提交','Transaction submitted')}</span><a target="_blank" rel="noreferrer" href={s.config.chainExplorerUrl+'/tx/'+hash}>{t('查看交易','View transaction')}</a></div>}
  </div>}
 </>;
}

createRoot(document.getElementById('root')!).render(<App/>);
