import React,{useEffect,useState} from 'react';
import {ethers,BigNumber as BN} from 'ethers';
import * as bridge from './bridge';
import {ModuleProps} from './types';
import {
 Alert,Amount,Badge,Button,Card,CopyField,EmptyState,Field,IconCheck,IconRefresh,IconSparkle,
 Modal,PageHead,Segmented,Skeleton,Stat,Steps
} from './ui';
import {Media} from './media';

type Setup={deposit:boolean;withdraw:boolean;state:'ready'|'partial'|'new'};

function PBTCard({session,id,selected,choose,en,disabled,asset,revision}:{session:bridge.Session;id:string;selected:boolean;choose:()=>void;en:boolean;disabled:boolean;asset:typeof bridge.assets[number];revision:number}){
 const t=(zh:string,eng:string)=>en?eng:zh;
 const [setup,setSetup]=useState<Setup>(),[statusError,setStatusError]=useState(false),[statusRetry,setStatusRetry]=useState(0);
 useEffect(()=>{let active=true;setSetup(undefined);setStatusError(false);bridge.pbtStatus(session,id,asset.id).then(value=>{if(active)setSetup(value)}).catch(()=>{if(active)setStatusError(true)});return()=>{active=false}},[session,id,statusRetry,asset.id,revision]);
 const [meta,setMeta]=useState<{name:string;images:string[]}>(),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setMeta(undefined);setFailed(false);bridge.metadata(session,id,controller.signal).then(m=>{if(!controller.signal.aborted)setMeta(m)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)});return()=>controller.abort()},[session,id,retry]);
 const tone=setup?(setup.state==='ready'?'ready':setup.state==='partial'?'partial':'new'):'unknown';
 return <article className="pbt-card">
  <button type="button" className="pbt-choice" disabled={disabled} aria-pressed={selected} onClick={choose}>
   {meta
    ?<Media uris={meta.images} alt={meta.name} className="pbt-choice__media" placeholder={en?'Image unavailable':'图片暂不可用'} loading={en?'Loading image…':'图片加载中…'} onExhausted={()=>setFailed(true)}/>
    :<span className="pbt-placeholder">{failed?(en?'Image unavailable':'图片暂不可用'):(en?'Loading image…':'图片加载中…')}</span>}
   <span className="pbt-choice__title"><span>PBT #{id}</span>{selected&&<IconCheck/>}</span>
   <span className="pbt-choice__meta">
    <Badge tone={tone}>{setup?(setup.state==='ready'?(en?'Ready':'已就绪'):setup.state==='partial'?(en?'Partial':'部分设置'):(en?'Not set up':'尚未设置')):statusError?(en?'Unavailable':'状态读取失败'):(en?'Checking…':'检查中…')}</Badge>
    {setup&&<span>{en?asset.symbol.slice(1)+' in: ':asset.symbol.slice(1)+' 充：'}{setup.deposit?(en?'yes':'已分配'):(en?'no':'未分配')}</span>}
    {setup&&<span>{en?asset.symbol.slice(1)+' out: ':asset.symbol.slice(1)+' 提：'}{setup.withdraw?(en?'yes':'已绑定'):(en?'no':'未绑定')}</span>}
   </span>
  </button>
  {statusError&&<Button size="sm" variant="ghost" icon={<IconRefresh/>} onClick={()=>setStatusRetry(n=>n+1)}>{en?'Retry status':'重试状态'}</Button>}
  {failed&&<Button size="sm" variant="ghost" icon={<IconRefresh/>} onClick={()=>setRetry(n=>n+1)}>{en?'Retry image':'重试图片'}</Button>}
 </article>;
}

export default function Bridge({session:s,en,run,busy,revision}:ModuleProps){
 const t=(zh:string,eng:string)=>en?eng:zh;
 const [step,setStep]=useState(0);
 const [ids,setIds]=useState<string[]>([]),[id,setId]=useState(''),[coin,setCoin]=useState(bridge.assets[0]);
 const [mode,setMode]=useState<'deposit'|'withdraw'>('deposit'),[data,setData]=useState<any>(),[amount,setAmount]=useState('');
 const [dest,setDest]=useState(''),[error,setError]=useState(''),[listLoading,setListLoading]=useState(false);
 const [loading,setLoading]=useState(false),[editingAddress,setEditingAddress]=useState(false),[confirming,setConfirming]=useState(false),[tick,setTick]=useState(0);

 useEffect(()=>{let active=true;setIds([]);setId('');setStep(0);setError('');if(!s)return;setListLoading(true);
  bridge.owned(s).then(list=>{if(active)setIds(list)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setListLoading(false)});
  return()=>{active=false};
 },[s,revision,tick]);

 useEffect(()=>{let active=true;setData(undefined);setAmount('');setDest('');setEditingAddress(false);setError('');setLoading(!!s&&!!id);
  if(!s||!id)return;
  async function load(){
   const ctr=bridge.contract(s!,coin.symbol.toLowerCase(),bridge.tokenABI),p=bridge.puzzle(s!);
   const [balance,decimals,depFee,withFee,limits,hashes,available,destination]=await Promise.all([
    ctr.balanceOf(s!.account),ctr.decimals(),ctr.depositFee(),ctr.withdrawFee(),ctr.cWAmount(),
    p.pbtPuzzleHash(id,coin.id),p.bindables(coin.id),p.withdrawPuzzleHashForUser(s!.account,coin.id)]);
   if(active)setData({balance,decimals,depFee,withFee,limits,deposit:bridge.address(hashes[0],coin.prefix),withdraw:bridge.address(hashes[1],coin.prefix),destination:bridge.address(destination,coin.prefix),available});
  }
  load().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[s,id,coin,revision]);

 const fmt=(v:BN)=>ethers.utils.formatUnits(v,data.decimals);
 let q:ReturnType<typeof bridge.quote>|undefined,invalid='';
 if(data&&amount){try{
  q=bridge.quote(amount,data.decimals,mode==='deposit'?data.depFee:data.withFee,mode==='deposit'?bridge.depositLimits(data.decimals):data.limits,mode==='withdraw'?data.balance:undefined);
 }catch(e:any){q=undefined;invalid=e.message}}

 const pickCoin=(symbol:string)=>{const next=bridge.policy(symbol);setCoin(next);setMode(next.bridge?'deposit':'withdraw')};
 const chain=s?.config.chainName||t('请先连接钱包','Connect your wallet to begin');
 const native=coin.native;

 const burn=()=>{if(!s||!q||!data)return;
  run(async()=>{const current=await bridge.puzzle(s!).withdrawPuzzleHashForUser(s!.account,coin.id);
   if(bridge.address(current,coin.prefix)!==data.destination)throw Error(t('提现地址已变化，请刷新核对','Destination changed. Refresh and verify.'));
   return bridge.contract(s!,coin.symbol.toLowerCase(),bridge.tokenABI).burn(q!.amount)})};

 return <>
  <PageHead eyebrow="BRIDGE · BSC" title={t('跨链桥','Bridge')} desc={t('选择一个 PBT 绑定你的存取款地址，充值由链上转账完成，提现通过销毁包装币申请。','Pick a PBT to bind your deposit and withdrawal addresses. Deposits are made on chain; withdrawals are requested by burning the wrapped token.')} actions={<Badge tone="info">{chain}</Badge>}/>

  {!s&&<Card><EmptyState icon={<IconSparkle/>} title={t('请先连接钱包','Connect your wallet')} text={t('连接 BSC 钱包后可读取余额、绑定地址并提交交易。','Connect a BSC wallet to read balances, bind addresses and submit transactions.')}/></Card>}

  {s&&<>
  <div className="row row--wrap" style={{marginBottom:'var(--s-6)'}}>
   <Segmented value={mode} options={[{value:'deposit' as const,label:t('充值','Deposit')},{value:'withdraw' as const,label:t('提现','Withdraw')}]} onChange={v=>{if(v==='deposit'&&!coin.bridge)return;setMode(v)}}/>
   <span className="subtle">{t('充值为链上转账，网页不发起交易；提现需销毁包装币。','Deposits happen on chain; this page does not submit them. Withdrawals burn the wrapped token.')}</span>
  </div>

  {coin.withdrawOnly&&<div style={{marginBottom:'var(--s-5)'}}><Alert tone="warning" title={t('该币种充值已关闭，仅支持提现','Deposits are closed for this asset; withdrawals only')}>{t('销毁是兑付申请，需团队人工处理，链上确认不代表已到账。','Burning is a redemption request handled by the team. On-chain confirmation does not mean the funds have arrived.')}</Alert></div>}

  <div className="bridge-tabs" aria-label={t('桥接步骤','Bridge steps')}>
   {[t('1. 选择 PBT','1. Select PBT'),t('2. 桥接地址','2. Bridge address'),mode==='deposit'?t('3. 费用计算','3. Fee calculator'):t('3. 金额与提交','3. Amount and submit')].map((label,i)=><button key={i} type="button" aria-current={step===i?'step':undefined} disabled={busy||(i>0&&!id)||(i===2&&!data)} onClick={()=>setStep(i)}>{label}{i===0&&id?` (#${id})`:null}</button>)}
  </div>

  <div className="bridge-workspace">
   {step===0&&<Card title={t('1. 选择 PBT','1. Select a PBT')} sub={t('每个 PBT 拥有独立的充值与提现地址。','Each PBT carries its own deposit and withdrawal addresses.')} actions={<Button size="sm" variant="ghost" icon={<IconRefresh/>} disabled={busy} onClick={()=>setTick(n=>n+1)}>{t('刷新','Refresh')}</Button>}>
    {listLoading&&<div className="stack stack-3"><Skeleton variant="card"/><Skeleton variant="card"/></div>}
    {!listLoading&&ids.length>0&&<div className="pbt-grid">{ids.map(pbt=><PBTCard key={pbt} asset={coin} revision={revision+tick} session={s} id={pbt} selected={id===pbt} disabled={busy} en={en} choose={()=>{setId(pbt);setStep(1)}}/>)}</div>}
    {!listLoading&&!ids.length&&<EmptyState title={t('尚无可用 PBT','No PBT available')} text={t('当前钱包没有 PBT。可稍后刷新，或前往市场铸造。','This wallet holds no PBT. Refresh later, or mint one in the market.')} action={<Button variant="secondary" icon={<IconRefresh/>} onClick={()=>setTick(n=>n+1)}>{t('刷新','Refresh')}</Button>}/>}
   </Card>}

   {id&&step===1&&<div className="bridge-address-panel"><Card title={t('2. 桥接地址','2. Bridge address')} sub={t('已选择 PBT #','Selected PBT #')+id+' · '+t('复制地址后到对应钱包发起转账。','Copy the address and transfer from the matching wallet.')}>
    <Field label={t('资产','Asset')}>
     <div className="row">
      <select className="select" disabled={busy} value={coin.symbol} onChange={e=>pickCoin(e.target.value)}>{bridge.assets.map(a=><option key={a.id} value={a.symbol}>{a.symbol} · {a.name} · {a.bridge?t('完整桥接','Full bridge'):t('仅提现 · 人工兑付','Withdraw only · Manual redemption')}</option>)}</select>
      <img src={'/image/'+coin.symbol.toLowerCase()+'.png'} alt={coin.symbol} width={28} height={28}/>
     </div>
    </Field>

    {loading&&<Skeleton variant="title"/>}
    <div className="bridge-addresses">
    {!loading&&data&&coin.bridge&&<section>
     <Field label={t('充值地址','Deposit address')} hint={t('向该地址转账即可充值，无需在网页提交交易。','Send funds to this address to deposit; no web transaction is required.')}>
      <CopyField value={data.deposit} placeholder={t('尚未分配','Not assigned yet')} label={t('复制地址','Copy address')} onError={()=>setError(t('复制失败，请手动复制','Copy failed; copy manually'))}/>
     </Field>
     {!data.deposit&&<Button variant="primary" disabled={busy||data.available.isZero()} onClick={()=>run(()=>bridge.puzzle(s!).bindDepositPuzzleHash(id,coin.id))}>{t('申请充值地址','Request deposit address')}</Button>}
     <div style={{marginTop:'var(--s-4)'}}><Alert tone="info" title={t('单次充值上限 50 XCH','Maximum 50 XCH per deposit')}>{t('超出额度后处理时间会明显增加，请耐心等待。','Larger deposits take much longer to process.')}</Alert></div>
    </section>}

    {!loading&&data&&<section>
     <Field label={t('提现地址','Withdrawal address')} hint={t('当前 PBT 绑定的提现地址。','Withdrawal address bound to this PBT.')}>
      <CopyField value={data.withdraw} placeholder={t('尚未绑定','Not bound yet')} label={t('复制地址','Copy address')} onError={()=>setError(t('复制失败，请手动复制','Copy failed; copy manually'))}/>
     </Field>
     {data.withdraw&&!editingAddress&&<Button size="sm" variant="secondary" onClick={()=>{setDest('');setEditingAddress(true)}}>{t('更换提现地址','Change withdrawal address')}</Button>}
     {(!data.withdraw||editingAddress)&&<>
      <Field label={data.withdraw?t('输入新的提现地址','Enter new withdrawal address'):t('首次绑定提现地址（免费）','Bind withdrawal address (free)')}>
       <input className="input mono" value={dest} disabled={busy} placeholder={coin.prefix+'1…'} onChange={e=>setDest(e.target.value)}/>
      </Field>
      <div className="row">
       <Button variant="primary" disabled={busy||!dest||dest===data.withdraw} onClick={()=>{try{const h=bridge.decode(dest,coin.prefix);
        run(()=>bridge.bindWithdrawal(s!,id,coin.id,h,async(ctr,n)=>{await bridge.assertSession(s!);const tx=await ctr.approve(bridge.puzzle(s!).address,n);await tx.wait();await bridge.assertSession(s!)}))}catch(e:any){setError(e.message)}}}>{data.withdraw?t('确认更换地址','Confirm address change'):t('绑定提现地址','Bind withdrawal address')}</Button>
       {data.withdraw&&<Button variant="ghost" disabled={busy} onClick={()=>{setEditingAddress(false);setDest('')}}>{t('取消','Cancel')}</Button>}
      </div>
     </>}
     {data.withdraw&&<p className="subtle" style={{marginTop:'var(--s-3)'}}>{t('改绑会按合约收取动态费用；代币费用仅授权本次所需额度。','Rebinding charges the current contract fee; token approvals cover only the required amount.')}</p>}
     {data.destination&&data.destination===data.withdraw
      ?<p className="subtle" style={{marginTop:'var(--s-3)'}}>{t('实际提现目标与上方绑定地址一致。','The actual withdrawal destination matches the bound address above.')}</p>
      :<div style={{marginTop:'var(--s-4)'}}><Alert tone="warning" title={t('实际提现目标与当前 PBT 绑定地址不同','Actual destination differs from this PBT')}>
       <p>{t('合约使用当前账户的首个绑定地址，可能属于其他 PBT。请核对实际收款地址后再提交提现。','The contract uses the first bound address for this account, which may belong to another PBT. Verify the actual recipient before withdrawing.')}</p>
       <CopyField value={data.destination} placeholder={t('暂无实际提现目标，无法提交提现','No destination available; withdrawal unavailable')} label={t('复制实际提现目标','Copy actual destination')} onError={()=>setError(t('复制失败，请手动复制','Copy failed; copy manually'))}/>
      </Alert></div>}

    </section>}
    </div>
   <Button variant="primary" disabled={busy||!data} onClick={()=>setStep(2)}>{mode==='deposit'?t('下一步：费用计算','Next: fee calculator'):t('下一步：金额与提交','Next: amount and submit')}</Button>
   </Card></div>}

   {id&&data&&step===2&&<Card title={mode==='deposit'?t('3. 费用计算','3. Fee calculator'):t('3. 金额与提交','3. Amount and submit')} sub={mode==='deposit'?t('输入金额估算充值费用，无需在网页提交交易。','Enter an amount to estimate deposit fees; no web transaction is required.'):t('先绑定提现地址，再销毁包装币申请提现。','Bind a withdrawal address first, then burn the wrapped token to request a withdrawal.')}>
    <div className="stat-grid" style={{marginBottom:'var(--s-5)'}}>
     <Stat label={t('余额','Balance')} value={<><Amount value={fmt(data.balance)}/> <span className="subtle">{coin.symbol}</span></>}/>
     {mode==='deposit'
      ?<Stat label={t('单次充值上限','Max deposit')} value={<><Amount value={fmt(bridge.depositLimits(data.decimals)[1])}/> <span className="subtle">XCH</span></>}/>
      :<Stat label={t('单次提现额度','Withdrawal range')} value={<><Amount value={fmt(data.limits[0])}/> – <Amount value={fmt(data.limits[1])}/></>}/>}
     <Stat label={t('费率','Rate')} value={<>{data[mode==='deposit'?'depFee':'withFee'][0].toString()}<span className="subtle"> / 10000</span></>} small/>
    </div>

    <Field label={mode==='deposit'?t('充值金额（可选，仅估算）','Deposit amount (optional estimate)'):t('销毁金额','Amount to burn')} error={invalid}
      action={mode==='withdraw'?<button type="button" className="subtle" style={{cursor:'pointer'}} onClick={()=>setAmount(ethers.utils.formatUnits(data.balance,data.decimals))}>{t('全部','Max')}</button>:undefined}>
     <input className="input input--amount" inputMode="decimal" disabled={busy} value={amount} placeholder="0.0" onChange={e=>setAmount(e.target.value)}/>
    </Field>

    {q&&<div className="stat-grid" style={{marginBottom:'var(--s-5)'}}>
     <Stat label={t('手续费','Fee')} value={<><Amount value={fmt(q.fee)}/> <span className="subtle">{coin.symbol}</span></>}/>
     <Stat label={t('预计到账','Estimated receipt')} value={<><Amount value={fmt(q.receive)}/> <span className="subtle">{native}</span></>}/>
    </div>}

    {mode==='withdraw'
     ?<Button variant="danger" size="lg" block disabled={busy||!q||!data.destination} onClick={()=>setConfirming(true)}>{t('销毁并申请提现','Burn and request withdrawal')}</Button>
     :<Alert tone="info" title={t('充值无需网页交易','No web transaction for deposits')}>{t('自行从 XCH 钱包向此 PBT 的充值地址转账即可充值。金额输入仅用于估算。','Send XCH from your wallet to this PBT deposit address. The amount field is an estimate only.')}</Alert>}
   </Card>}
  </div>
  </>}

  {error&&<div style={{marginTop:'var(--s-5)'}}><Alert tone="danger">{error}</Alert></div>}

  <Modal open={confirming} onClose={()=>setConfirming(false)}
   title={t('确认销毁并申请提现','Confirm burn and withdrawal request')}
   subtitle={t('销毁不可撤销，请核对以下信息。','Burning cannot be reversed. Check the details below.')}
   footer={<><Button variant="ghost" onClick={()=>setConfirming(false)}>{t('取消','Cancel')}</Button><Button variant="danger" disabled={busy||!q} onClick={()=>{setConfirming(false);burn()}}>{t('确认销毁','Confirm burn')}</Button></>}>
   {q&&data&&<div className="stack stack-3">
    <div className="stat"><span className="stat__label">{t('销毁数量','Amount to burn')}</span><span className="stat__value"><Amount value={fmt(q.amount)}/> {coin.symbol}</span></div>
    <div className="stat"><span className="stat__label">{t('手续费','Fee')}</span><span className="stat__value stat__value--sm"><Amount value={fmt(q.fee)}/> {coin.symbol}</span></div>
    <div className="stat"><span className="stat__label">{t('预计收到','Estimated receipt')}</span><span className="stat__value stat__value--sm"><Amount value={fmt(q.receive)}/> {native}</span></div>
    <div className="stat"><span className="stat__label">{t('提现目标','Destination')}</span><span className="mono" style={{overflowWrap:'anywhere'}}>{data.destination||'—'}</span></div>
    <Alert tone="warning">{t('人工兑付资产需要团队处理，一般 7 个工作日内到账；链上确认不代表已到账。','Manual redemption assets are processed by the team, usually within 7 business days. On-chain confirmation does not mean the funds have arrived.')}</Alert>
   </div>}
  </Modal>
 </>;
}
