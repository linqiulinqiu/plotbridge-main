import React,{useEffect,useState} from 'react';
import {ethers} from 'ethers';
import {contract,owned,metadata,assertSession} from './bridge';
import {approveExact,erc20,parseAmount,confirmed} from './transactions';
import {ModuleProps} from './types';
import {Alert,Badge,Button,Card,EmptyState,Field,IconBox,IconSparkle,Modal,PageHead,Segmented,Skeleton} from './ui';
import {Media} from './media';

const pbtABI=['function balanceOf(address) view returns(uint256)','function tokenOfOwnerByIndex(address,uint256) view returns(uint256)','function mintFee() view returns(address,uint256)','function mintables() view returns(uint256)','function mint() payable','function safeTransferFrom(address,address,uint256)','function burn(uint256)'];
const marketABI=['function getSaleInfo(address,uint256) view returns(address,uint256,string,string)','function buy(address,uint256) payable','function offSale(address,uint256)','function onSale(address,uint256,address,uint256,string)','function setSellerName(string)'];

export default function Market({session:s,en,run,busy,revision}:ModuleProps){
 const [snapshot,setSnapshot]=useState<{session:typeof s;tab:string;revision:number;items:any[]}>({session:s,tab:'owned',revision,items:[]});
 const [error,X]=useState(''),[loading,L]=useState(false),[tab,T]=useState('owned');
 const [price,P]=useState(''),[currency,C]=useState('BNB'),[desc,D]=useState(''),[target,W]=useState(''),[mint,M]=useState<any>(),[name,N]=useState('');
 const [listing,setListing]=useState<any>(),[transferring,setTransferring]=useState<any>(),[burning,setBurning]=useState<any>();
 const t=(a:string,b:string)=>en?b:a;
 const items=snapshot.session===s&&snapshot.tab===tab&&snapshot.revision===revision?snapshot.items:[];
 const I=(rows:any[])=>setSnapshot({session:s,tab,revision,items:rows});
 const a=s?.config.ctr_addrs as Record<string,string>|undefined;
 const money=currency==='BNB'?ethers.constants.AddressZero:a![currency.toLowerCase()];
 const currencies=['BNB','PBP','WXCH','WHDD','WXCC','WXFX','USDT','BUSD'].filter(c=>c==='BNB'||a?.[c.toLowerCase()]);

 useEffect(()=>{let active=true;const controller=new AbortController();I([]);X('');M(undefined);if(!s)return;L(true);
  async function load(){
   const pbt=contract(s!,'pbt',pbtABI),market=contract(s!,'pbmarket',marketABI);
   const fee=await pbt.mintFee(),stock=await pbt.mintables();
   const feeToken=fee[0]===ethers.constants.AddressZero?undefined:new ethers.Contract(fee[0],erc20,s!.provider);
   const [dec,symbol]=feeToken?await Promise.all([feeToken.decimals(),feeToken.symbol()]):[18,'BNB'];
   if(active)M({fee,stock,text:ethers.utils.formatUnits(fee[1],dec)+' '+symbol});
   let ids:string[]=[];
   if(tab==='owned')ids=await owned(s!);
   else{const count=await pbt.balanceOf(market.address);for(let i=ethers.constants.Zero;i.lt(count);i=i.add(1))ids.push((await pbt.tokenOfOwnerByIndex(market.address,i)).toString())}
   const rows=[];
   for(const id of ids){
    let sale,meta;
    try{meta=await metadata(s!,id,controller.signal)}catch{}
    if(tab!=='owned'){
     sale=await market.getSaleInfo(pbt.address,id);
     if(tab==='mine'&&sale[3]!=='-self')continue;
     if(tab==='market'&&sale[1].isZero())continue;
     const token=sale[0]===ethers.constants.AddressZero?undefined:new ethers.Contract(sale[0],erc20,s!.provider);
     const [d,sym]=token?await Promise.all([token.decimals(),token.symbol()]):[18,'BNB'];
     sale={currency:sale[0],amount:sale[1],desc:sale[2],self:sale[3]==='-self',text:ethers.utils.formatUnits(sale[1],d)+' '+sym}}
    rows.push({id,meta,sale})}
   if(active)I(rows)}
  load().catch(e=>active&&X(e.reason||e.message)).finally(()=>active&&L(false));
  return()=>{active=false;controller.abort()}},[s,tab,revision]);

 async function act(item:any,mode:string){if(!s)return;await run(async()=>{
  const pbt=contract(s,'pbt',pbtABI),market=contract(s,'pbmarket',marketABI);
  if(mode==='buy'){
   const now=await market.getSaleInfo(pbt.address,item.id);
   if(now[0]!==item.sale.currency||!now[1].eq(item.sale.amount))throw Error(t('价格已变化，请刷新','Price changed; refresh'));
   await approveExact(s,now[0],market.address,now[1]);
   const latest=await market.getSaleInfo(pbt.address,item.id);
   if(latest[0]!==now[0]||!latest[1].eq(now[1]))throw Error(t('价格已变化，请刷新','Price changed; refresh'));
   await assertSession(s);
   return market.buy(pbt.address,item.id,{value:now[0]===ethers.constants.AddressZero?now[1]:0})}
  if(mode==='cancel')return market.offSale(pbt.address,item.id);
  if(mode==='transfer'){if(!ethers.utils.isAddress(target)||target===ethers.constants.AddressZero)throw Error(t('接收地址无效','Invalid recipient'));return pbt['safeTransferFrom(address,address,uint256)'](s.account,target,item.id)}
  if(mode==='burn')return pbt.burn(item.id);
  const dec=money===ethers.constants.AddressZero?18:await new ethers.Contract(money,erc20,s.provider).decimals();
  const n=parseAmount(price,dec);
  if(tab==='owned'){await confirmed(await pbt['safeTransferFrom(address,address,uint256)'](s.account,market.address,item.id));await assertSession(s)}
  return market.onSale(pbt.address,item.id,money,n,desc)})}

 const tabs=[{value:'owned',label:t('我的 PBT','My PBTs')},{value:'market',label:t('市场','Market')},{value:'mine',label:t('我的出售','My listings')}];

 return <>
  <PageHead eyebrow="NFT MARKET" title={t('PBT 市场','PBT Market')} desc={t('铸造、转移、上架、购买或撤回 PBT。上架分两笔交易，可在“我的出售”继续未完成的价格设置。','Mint, transfer, list, buy or withdraw PBTs. Listing takes two transactions; finish an incomplete price under My listings.')}/>

  {!s&&<Card><EmptyState icon={<IconSparkle/>} title={t('请先连接钱包','Connect your wallet')} text={t('连接后可铸造、买卖和转移 PBT。','Connect a wallet to mint, trade and transfer PBTs.')}/></Card>}

  {s&&<div className="stack stack-6">
   <Card title={t('铸造 PBT','Mint PBT')} sub={t('铸造价格只增不减，剩余数量以链上为准。','The mint price only rises; availability is read from chain.')}
    actions={<Badge tone={mint&&!mint.stock.isZero()?'brand':'unknown'}>{t('铸造费用 / 剩余','Mint fee / available')}: {mint?.text||'—'} / {mint?mint.stock.toString():'—'}</Badge>}>
    <div className="row row--wrap">
     <Button variant="primary" disabled={busy||!mint||mint.stock.isZero()} onClick={()=>run(async()=>{const pbt=contract(s,'pbt',pbtABI),fee=await pbt.mintFee();if(fee[0]!==mint.fee[0]||!fee[1].eq(mint.fee[1]))throw Error(t('铸造费用已变化，请刷新','Mint fee changed; refresh'));await approveExact(s,fee[0],pbt.address,fee[1]);return pbt.mint({value:fee[0]===ethers.constants.AddressZero?fee[1]:0})})}>{t('铸造 PBT','Mint PBT')}</Button>
    </div>
    <div className="row row--wrap" style={{marginTop:'var(--s-5)',paddingTop:'var(--s-5)',borderTop:'1px solid var(--line)'}}>
     <div style={{flex:'1 1 220px'}}><Field label={t('卖家名称','Seller name')}><input className="input" value={name} onChange={e=>N(e.target.value)} placeholder={t('在市场展示的名称','Name shown on the market')}/></Field></div>
     <div style={{flex:'0 0 auto',alignSelf:'flex-end'}}><Button variant="secondary" disabled={busy||!name||name.startsWith('-')} onClick={()=>run(()=>contract(s,'pbmarket',marketABI).setSellerName(name))}>{t('保存名称','Save name')}</Button></div>
    </div>
   </Card>

   <div className="row row--wrap row--between">
    <Segmented value={tab} options={tabs} onChange={v=>{I([]);L(true);X('');T(v)}}/>
    {tab==='owned'&&<span className="subtle">{t('上架需要两笔交易：先转入市场，再设置售价。','Listing takes two transactions: custody transfer, then price.')}</span>}
   </div>

   {loading&&<div className="market-grid">{[0,1,2,3].map(i=><Skeleton key={i} variant="card"/>)}</div>}

   {!loading&&items.length===0&&<Card><EmptyState icon={<IconBox/>}
    title={tab==='owned'?t('你还没有 PBT','You own no PBT'):tab==='market'?t('市场暂无在售 PBT','Nothing listed in the market'):t('你没有在售的 PBT','You have no listings')}
    text={tab==='owned'?t('可以先铸造一个 PBT，或从市场购买。','Mint a PBT first, or buy one from the market.'):tab==='market'?t('稍后再来看看。','Check back later.'):t('上架后会显示在这里。','Your listings will appear here.')}/></Card>}

   {!loading&&items.length>0&&<div className="market-grid">{items.map(item=>
    <article className="market-card" key={item.id}>
     {item.meta&&<Media uris={item.meta.images} alt={item.meta.name} className="market-card__media" placeholder={t('图片暂不可用','Image unavailable')} loading={t('图片加载中…','Loading image…')}/>}
     <div className="market-card__title">PBT #{item.id}</div>
     {item.sale&&<div className="market-card__price">{item.sale.text}{item.sale.desc?' · '+item.sale.desc:''}</div>}
     <div className="market-card__actions">
      {tab==='owned'?<>
       <Button size="sm" variant="primary" disabled={busy} onClick={()=>{setListing(item);P('');D('')}}>{t('上架','List')}</Button>
       <Button size="sm" variant="secondary" disabled={busy} onClick={()=>{setTransferring(item);W('')}}>{t('转移','Transfer')}</Button>
       <Button size="sm" variant="danger" disabled={busy} onClick={()=>setBurning(item)}>{t('销毁','Burn')}</Button>
      </>:!item.sale
       ?<span className="subtle">{t('出售状态暂不可用，请刷新','Listing unavailable; refresh')}</span>
       :item.sale.self
        ?<><Button size="sm" variant="primary" disabled={busy} onClick={()=>{setListing(item);P('');D('')}}>{t('设置售价','Set price')}</Button><Button size="sm" variant="secondary" disabled={busy} onClick={()=>act(item,'cancel')}>{t('撤回','Withdraw listing')}</Button></>
        :<Button size="sm" variant="primary" disabled={busy} onClick={()=>act(item,'buy')}>{t('购买','Buy')}</Button>}
     </div>
    </article>)}</div>}

   {error&&<Alert tone="danger">{error}</Alert>}
  </div>}

  <Modal open={!!listing} onClose={()=>setListing(undefined)}
   title={t('设置价格与描述','Set price and description')}
   subtitle={listing?('PBT #'+listing.id):undefined}
   footer={<><Button variant="ghost" onClick={()=>setListing(undefined)}>{t('取消','Cancel')}</Button><Button variant="primary" disabled={busy||!price||price.startsWith('-')} onClick={()=>{const item=listing;setListing(undefined);act(item,'sell')}}>{t('确认上架','Confirm listing')}</Button></>}>
   <Field label={t('售价','Sale price')} hint={t('上架分为转入市场和设置售价两笔交易；若第二笔失败，可在“我的出售”继续设置或撤回。','Listing is two transactions; if the second fails, resume or withdraw under My listings.')}>
    <input className="input" inputMode="decimal" value={price} placeholder="0.0" onChange={e=>P(e.target.value)}/>
   </Field>
   <Field label={t('计价代币','Currency')}>
    <select className="select" value={currency} onChange={e=>C(e.target.value)}>{currencies.map(c=><option key={c} value={c}>{c}</option>)}</select>
   </Field>
   <Field label={t('出售说明','Description')}>
    <input className="input" value={desc} placeholder={t('可选','Optional')} onChange={e=>D(e.target.value)}/>
   </Field>
  </Modal>

  <Modal open={!!transferring} onClose={()=>setTransferring(undefined)}
   title={t('转移 PBT','Transfer PBT')} subtitle={transferring?('PBT #'+transferring.id):undefined}
   footer={<><Button variant="ghost" onClick={()=>setTransferring(undefined)}>{t('取消','Cancel')}</Button><Button variant="primary" disabled={busy||!target} onClick={()=>{const item=transferring;setTransferring(undefined);act(item,'transfer')}}>{t('确认转移','Transfer')}</Button></>}>
   <Field label={t('接收地址','Recipient')} hint={t('转移后 PBT 将从你的钱包中转出，不可撤销。','The PBT leaves your wallet once confirmed. This cannot be undone.')}>
    <input className="input mono" value={target} placeholder="0x…" onChange={e=>W(e.target.value)}/>
   </Field>
  </Modal>

  <Modal open={!!burning} onClose={()=>setBurning(undefined)}
   title={t('确认销毁 PBT','Confirm burn')} subtitle={burning?('PBT #'+burning.id):undefined}
   footer={<><Button variant="ghost" onClick={()=>setBurning(undefined)}>{t('取消','Cancel')}</Button><Button variant="danger" disabled={busy} onClick={()=>{const item=burning;setBurning(undefined);act(item,'burn')}}>{t('确认销毁','Burn permanently')}</Button></>}>
   <Alert tone="danger" title={t('此操作不可撤销','This cannot be undone')}>{t('销毁后，该 PBT 绑定的存取款地址都会失效。','After burning, the deposit and withdrawal addresses bound to this PBT stop working.')}</Alert>
  </Modal>
 </>;
}
