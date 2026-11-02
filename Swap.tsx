import React,{useEffect,useRef,useState} from 'react';
import {ethers} from 'ethers';
import {erc20,parseAmount} from './transactions';
import {router,swapPath,executeSwap,unitPrice} from './swap-service';
import {ModuleProps} from './types';
import {Alert,Badge,Button,Card,EmptyState,Field,IconSparkle,PageHead,Skeleton,Stat} from './ui';

export type {ModuleProps} from './types';

export default function Swap({session:s,en,run,busy,revision}:ModuleProps){
 const [from,F]=useState('BNB'),[to,T]=useState('PBP'),[amount,A]=useState(''),[exact,E]=useState(false),[slip,S]=useState('0.5');
 const [q,Q]=useState<any>(),[error,X]=useState(''),[loading,L]=useState(false);
 const seq=useRef(0);
 const t=(a:string,b:string)=>en?b:a;
 const addresses=s?.config.ctr_addrs as Record<string,string>|undefined;
 const names=['BNB',...['PBP','WBNB','WXCH','WHDD','WXCC','WXFX','USDT','USDC','BUSD','ETH'].filter(k=>addresses?.[k.toLowerCase()])];
 const addr=(name:string)=>name==='BNB'?ethers.constants.AddressZero:addresses![name.toLowerCase()];

 useEffect(()=>{const request=++seq.current;Q(undefined);X('');L(false);if(!s||!amount)return;L(true);
  const timer=setTimeout(async()=>{try{const f=addr(from),t2=addr(to),decimal=async(a:string)=>a===ethers.constants.AddressZero?18:await new ethers.Contract(a,erc20,s.provider).decimals();
   const [di,do_]=await Promise.all([decimal(f),decimal(t2)]);const n=parseAmount(amount,exact?do_:di);const path=swapPath(s,f,t2),r=router(s);
   const result=exact?await r.getAmountsIn(n,path):await r.getAmountsOut(n,path);
   if(request===seq.current)Q({from:f,to:t2,input:result[0],output:result[result.length-1],exactOut:exact,time:Date.now(),di,do_})}
  catch(e:any){if(request===seq.current)X(e.reason||e.message)}finally{if(request===seq.current)L(false)}},350);
  return()=>{clearTimeout(timer);seq.current++}},[s,from,to,amount,exact,revision]);

 useEffect(()=>{if(!q)return;const timer=setTimeout(()=>{Q(undefined);X(t('报价已过期，请重新输入金额','Quote expired; enter amount again'))},60000);return()=>clearTimeout(timer)},[q,en]);

 const slipOk=/^\d+(\.\d{1,2})?$/.test(slip)&&Number(slip)>0&&Number(slip)<=5;

 return <>
  <PageHead eyebrow="SWAP · PANCAKESWAP" title={t('兑换','Swap')} desc={t('在常用代币之间快速兑换，由 PancakeSwap 撮合，报价仅供参考。','Swap between common tokens through PancakeSwap. Quotes are indicative.')} actions={<Badge tone="info">PancakeSwap</Badge>}/>

  {!s&&<Card><EmptyState icon={<IconSparkle/>} title={t('请先连接钱包','Connect your wallet')} text={t('连接后可查看余额并发起兑换。','Connect a wallet to see balances and swap.')}/></Card>}

  {s&&<div className="split">
   <Card title={t('交易参数','Trade parameters')}>
    <Field label={t('支付资产','Pay asset')}>
     <select className="select" disabled={busy} value={from} onChange={e=>F(e.target.value)}>{names.map(n=><option key={n} value={n}>{n}</option>)}</select>
    </Field>
    <Field label={t('接收资产','Receive asset')}>
     <select className="select" disabled={busy} value={to} onChange={e=>T(e.target.value)}>{names.map(n=><option key={n} value={n}>{n}</option>)}</select>
    </Field>
    <Field label={t('金额类型','Amount type')}>
     <select className="select" disabled={busy} value={exact?'out':'in'} onChange={e=>E(e.target.value==='out')}>
      <option value="in">{t('固定支付金额','Exact input')}</option>
      <option value="out">{t('固定接收金额','Exact output')}</option>
     </select>
    </Field>
    <Field label={t('金额','Amount')}>
     <input className="input input--amount" disabled={busy} inputMode="decimal" value={amount} placeholder="0.0" onChange={e=>A(e.target.value)}/>
    </Field>
    <Field label={t('滑点 (%)','Slippage (%)')} hint={t('报价有效期 60 秒；授权仅限本次所需额度。','Quotes expire after 60 seconds. Approval covers only the required amount.')}>
     <input className="input" disabled={busy} inputMode="decimal" value={slip} onChange={e=>S(e.target.value)}/>
    </Field>
    <Button variant="primary" size="lg" block disabled={busy||!q||loading||!slipOk} onClick={()=>run(()=>executeSwap(s!,q,Math.round(Number(slip)*100)))}>{t('授权并兑换','Approve and swap')}</Button>
   </Card>

   <aside className="split__aside">
    <Card title={t('报价明细','Quote details')} sub={t('单价为本次报价的平均兑换比例，不含网络手续费。','Average rate for this quote, network fees excluded.')}>
     {loading&&<div className="stack stack-3"><Skeleton variant="title"/><Skeleton variant="text"/><Skeleton variant="text"/></div>}
     {!loading&&q&&<div className="stack stack-3">
      <Stat label={t('兑换单价（约）','Unit price (approx.)')} value={<>{unitPrice(q.input,q.output,q.di,q.do_)} <span className="subtle">{to}/{from}</span></>}/>
      <Stat label={t('反向单价（约）','Inverse price (approx.)')} value={<>{unitPrice(q.output,q.input,q.do_,q.di)} <span className="subtle">{from}/{to}</span></>}/>
      <Stat label={t('本次支付总量','Total payment')} value={<>{ethers.utils.formatUnits(q.input,q.di)} <span className="subtle">{from}</span></>}/>
      <Stat label={t('本次接收总量','Total received')} value={<>{ethers.utils.formatUnits(q.output,q.do_)} <span className="subtle">{to}</span></>}/>
      {slipOk&&<Stat label={exact?t('最多支付（含滑点）','Maximum payment (with slippage)'):t('最少接收（含滑点）','Minimum received (with slippage)')} value={<>{exact?ethers.utils.formatUnits(q.input.mul(10000+Math.round(Number(slip)*100)).add(9999).div(10000),q.di)+' '+from:ethers.utils.formatUnits(q.output.mul(10000-Math.round(Number(slip)*100)).div(10000),q.do_)+' '+to}</>}/>}
     </div>}
     {!loading&&!q&&<p className="subtle">{t('选择资产并输入金额后，显示单价与总量。','Choose assets and enter an amount to compare unit price and totals.')}</p>}
     {error&&<div style={{marginTop:'var(--s-4)'}}><Alert tone="danger">{error}</Alert></div>}
    </Card>
   </aside>
  </div>}
 </>;
}
