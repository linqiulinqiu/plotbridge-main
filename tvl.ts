import {ethers} from 'ethers';
import {Session,contract} from './bridge';

const erc20ABI=['function balanceOf(address) view returns(uint256)','function decimals() view returns(uint8)','function symbol() view returns(string)'];
const factoryABI=['function getPair(address,address) view returns(address)'];
const stakingABI=['function pools() view returns(address[],uint256[],uint256[],uint256[],uint256[])'];

export type PairSide={t0:number;t1:number;pbp:boolean};

function erc20(s:Session,address:string){return new ethers.Contract(address,erc20ABI,s.provider)}

// Liquidity pairs the Vue app priced TVL from: BNB/PBP, WXCC/PBP, WXCH/PBP and BNB/USDT.
export async function poolSides(s:Session):Promise<PairSide[]>{
 const a=s.config.ctr_addrs as Record<string,string|undefined>;
 const need=(k:string)=>{const v=a[k];if(!v)throw Error('Contract unavailable: '+k+' / 缺少合约地址: '+k);return v};
 const factory=contract(s,'factory',factoryABI);
 const defs:{t0:string;t1:string;pbp:boolean}[]=[
  {t0:need('wbnb'),t1:need('pbp'),pbp:true},
  {t0:need('wxcc'),t1:need('pbp'),pbp:true},
  {t0:need('wxch'),t1:need('pbp'),pbp:true},
  {t0:need('wbnb'),t1:need('usdt'),pbp:false}];
 const rows:PairSide[]=[];
 for(const d of defs){
  const pair=await factory.getPair(d.t0,d.t1);
  if(pair===ethers.constants.AddressZero)throw Error('Liquidity pair missing / 交易对不存在');
  const c0=erc20(s,d.t0),c1=erc20(s,d.t1);
  const [n0,n1,d0,d1]=await Promise.all([c0.balanceOf(pair),c1.balanceOf(pair),c0.decimals(),c1.decimals()]);
  rows.push({t0:parseFloat(ethers.utils.formatUnits(n0,d0)),t1:parseFloat(ethers.utils.formatUnits(n1,d1)),pbp:d.pbp});
 }
 return rows;
}

// PBP staked in the staking pools, summed with each stake token's own decimals.
export async function stakedPBP(s:Session):Promise<number>{
 const staking=contract(s,'staking',stakingABI);
 const pools=await staking.pools();
 let total=0;
 for(let i=0;i<pools[0].length;i++){
  const token=erc20(s,pools[0][i]);
  const [symbol,decimals]=await Promise.all([token.symbol(),token.decimals()]);
  if(symbol!=='PBP')continue;
  total+=parseFloat(ethers.utils.formatUnits(pools[2][i],decimals));
 }
 return total;
}

// Total value locked in USD, matching the Vue home page figure.
// Pure pricing step, kept separate from the contract reads so it stays testable.
export function lockedValue(rows:PairSide[],staked:number):number{
 const usdt=rows.find(r=>!r.pbp),pbp=rows.find(r=>r.pbp);
 if(!usdt||!pbp)throw Error('Liquidity pair missing / 交易对不存在');
 if(!usdt.t0||!usdt.t1||!pbp.t0||!pbp.t1)throw Error('Insufficient liquidity / 流动性不足');
 const bnbPrice=usdt.t1/usdt.t0;
 const pbpPrice=(pbp.t0/pbp.t1)*bnbPrice;
 const pbpAmount=rows.filter(r=>r.pbp).reduce((sum,r)=>sum+r.t1,0);
 return Math.trunc(pbpPrice*pbpAmount*2+staked*pbpPrice);
}

export async function totalValueLocked(s:Session):Promise<number>{
 return lockedValue(await poolSides(s),await stakedPBP(s));
}
