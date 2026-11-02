import React,{useEffect,useState} from 'react';
import {ethers} from 'ethers';
import {contract} from './bridge';
import {approveExact,erc20,parseAmount} from './transactions';
import {ModuleProps} from './types';
import {Alert,Badge,Button,Card,EmptyState,Field,IconSparkle,PageHead,Skeleton,Stat} from './ui';

const abi=['function pools() view returns(address[],uint256[],uint256[],uint256[],uint256[])','function staked(uint256,address) view returns(uint256,uint256)','function earned(uint256,address) view returns(uint256)','function deposit(uint256,uint256)','function withdraw(uint256,uint256)','function forceWithdraw(uint256,uint256)'];

export default function Stake({session:s,en,run,busy,revision}:ModuleProps){
 const [pools,setPools]=useState<any[]>([]),[error,setError]=useState(''),[amount,setAmount]=useState<Record<string,string>>({}),[loading,setLoading]=useState(false);
 const t=(a:string,b:string)=>en?b:a;
 useEffect(()=>{let active=true;setPools([]);setError('');if(!s)return;setLoading(true);
  async function load(){
   const ctr=contract(s!,'staking',abi),raw=await ctr.pools(),reward=await contract(s!,'pbp',erc20).decimals();
   const rows=[];
   for(let i=0;i<raw[0].length;i++){
    const token=new ethers.Contract(raw[0][i],erc20,s!.provider);
    const [symbol,decimals,balance,staked,earned]=await Promise.all([token.symbol(),token.decimals(),token.balanceOf(s!.account),ctr.staked(i,s!.account),ctr.earned(i,s!.account)]);
    rows.push({i,address:raw[0][i],symbol,decimals,balance,staked,earned,reward})}
   if(active)setPools(rows)}
  load().catch(e=>active&&setError(e.reason||e.message)).finally(()=>active&&setLoading(false));
  return()=>{active=false}},[s,revision]);

 async function action(p:any,mode:string){if(!s)return;await run(async()=>{
  const ctr=contract(s,'staking',abi),n=mode==='claim'?ethers.constants.Zero:parseAmount(amount[p.i]||'',p.decimals);
  if(mode==='deposit'){if(n.gt(p.balance))throw Error(t('余额不足','Insufficient balance'));await approveExact(s,p.address,ctr.address,n);return ctr.deposit(p.i,n)}
  if(n.gt(p.staked[0]))throw Error(t('超过已质押数量','Exceeds staked amount'));
  if(mode==='force'&&!window.confirm(t('提前提取将放弃所有待领取奖励，确认继续？','Early withdrawal forfeits all pending rewards. Continue?')))throw Error(t('已取消','Cancelled'));
  return mode==='force'?ctr.forceWithdraw(p.i,n):ctr.withdraw(p.i,n)})}

 return <>
  <PageHead eyebrow="STAKING · PBP" title={t('质押','Stake')} desc={t('质押代币获取 PBP 奖励。追加质押、提取或领取会重置锁定时间。','Stake tokens to earn PBP. Deposits, withdrawals and claims reset the lock time.')} actions={<Badge tone="info">{t('奖励代币','Reward')}: PBP</Badge>}/>

  {!s&&<Card><EmptyState icon={<IconSparkle/>} title={t('请先连接钱包','Connect your wallet')} text={t('连接后可查看质押池、质押与领取奖励。','Connect a wallet to see pools, stake and claim rewards.')}/></Card>}

  {s&&<div className="stack stack-5">
   {loading&&<div className="stack stack-4"><Skeleton variant="card"/></div>}
   {!loading&&!pools.length&&<Card><EmptyState title={t('暂无质押池','No staking pools')} text={t('当前网络没有开放的质押池。','No pool is open on this network.')}/></Card>}
   {!loading&&pools.map(p=><Card key={p.i} className="pool"
    title={<span className="pool__title">#{p.i} {p.symbol}</span>}
    sub={t('追加质押、提取或领取后，合约会重新计算锁定时间。','Deposits, withdrawals and claims reset the contract lock time.')}
    actions={<Badge tone="info">{t('锁定时间','Unlock time')}: {new Date(p.staked[1].toNumber()*1000).toLocaleString(en?'en':'zh-CN')}</Badge>}>
    <div className="stat-grid">
     <Stat label={t('余额','Balance')} value={<>{ethers.utils.formatUnits(p.balance,p.decimals)} <span className="subtle">{p.symbol}</span></>}/>
     <Stat label={t('已质押','Staked')} value={<>{ethers.utils.formatUnits(p.staked[0],p.decimals)} <span className="subtle">{p.symbol}</span></>}/>
     <Stat label={t('待领取','Pending')} value={<>{ethers.utils.formatUnits(p.earned,p.reward)} <span className="subtle">PBP</span></>}/>
    </div>
    <Field label={t('数量','Amount')}>
     <input className="input" inputMode="decimal" disabled={busy} value={amount[p.i]||''} placeholder="0.0" onChange={e=>setAmount({...amount,[p.i]:e.target.value})}/>
    </Field>
    <div className="pool__actions">
     <Button variant="primary" disabled={busy||!amount[p.i]} onClick={()=>action(p,'deposit')}>{t('授权并质押','Approve and stake')}</Button>
     <Button variant="secondary" disabled={busy||!amount[p.i]} onClick={()=>action(p,'withdraw')}>{t('提取','Withdraw')}</Button>
     <Button variant="secondary" disabled={busy} onClick={()=>action(p,'claim')}>{t('领取奖励','Claim')}</Button>
     <Button variant="ghost" disabled={busy} onClick={()=>action(p,'force')}>{t('提前提取（放弃奖励）','Early withdrawal (forfeit rewards)')}</Button>
    </div>
   </Card>)}
   {error&&<Alert tone="danger">{error}</Alert>}
  </div>}
 </>;
}
