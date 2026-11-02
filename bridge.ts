import {ethers, BigNumber as BN} from 'ethers';
import networks from './networks.json';
import gateways from './shared/ipfs.json';
import coins from './shared/coins.json';
// Coin policy has a single source: shared/coins.json (replaces the Vue WCOIN_POLICY table).
// symbol is the wrapped token (contract lookup key); native is the underlying coin symbol.
export const assets=coins.map(c=>({symbol:c.bsymbol,native:c.symbol,id:c.index,prefix:c.prefix,name:c.name,ctrname:c.ctrname,bridge:c.bridge,withdrawOnly:c.withdrawOnly}));
export const policy=(symbol:string)=>assets.find(a=>a.symbol===symbol)||assets[0];
export const tokenABI=['function balanceOf(address) view returns(uint256)','function decimals() view returns(uint8)','function burn(uint256)','function depositFee() view returns(uint16,uint256)','function withdrawFee() view returns(uint16,uint256)','function cWAmount() view returns(uint256,uint256)'];
const puzzleABI=['function pbtPuzzleHash(uint256,uint16) view returns(bytes32,bytes32)','function bindables(uint16) view returns(uint256)','function bindDepositPuzzleHash(uint256,uint16)','function bindWithdrawPuzzleHash(uint256,uint16,bytes32) payable','function withdrawPuzzleHashForUser(address,uint16) view returns(bytes32)','function rebindFee() view returns(address,uint256)'];
export type Session={provider:ethers.providers.Web3Provider;account:string;chain:number;config:typeof networks[number]};
export function contract(s:Session,name:string,abi:string[]){const address=(s.config.ctr_addrs as Record<string,string|undefined>)[name];if(!address)throw Error('Asset unavailable on this network / 此网络不支持该资产');return new ethers.Contract(address,abi,s.provider.getSigner())}
export async function assertSession(s:Session){const [chain,accounts]=await Promise.all([s.provider.send('eth_chainId',[]),s.provider.send('eth_accounts',[])]);if(parseInt(chain)!==s.chain||accounts[0]?.toLowerCase()!==s.account.toLowerCase())throw Error('Wallet changed; reconnect / 钱包已变化，请重新连接')}
type Wallet = {request(args:{method:string;params?:unknown[]}):Promise<any>};
export async function ensureBNBChain(wallet:Wallet){
 const target=networks.find(n=>n.chainId==='0x38')!;
 if(parseInt(await wallet.request({method:'eth_chainId'}))!==56){
  try{await wallet.request({method:'wallet_switchEthereumChain',params:[{chainId:target.chainId}]})}
  catch(e:any){
   if(e.code!==4902&&e.data?.originalError?.code!==4902)throw e;
   await wallet.request({method:'wallet_addEthereumChain',params:[{chainId:target.chainId,chainName:'BNB Smart Chain',nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},rpcUrls:[target.chainRpcUrl],blockExplorerUrls:[target.chainExplorerUrl]}]});
   await wallet.request({method:'wallet_switchEthereumChain',params:[{chainId:target.chainId}]});
  }
 }
 if(parseInt(await wallet.request({method:'eth_chainId'}))!==56)throw Error('Network switch incomplete; reconnect / 网络切换未完成，请重试连接');
 return target;
}
export async function connect():Promise<Session>{
 const wallet=window.ethereum;if(!wallet)throw Error('Install a browser wallet / 请安装浏览器钱包');
 await wallet.request({method:'eth_requestAccounts'});
 const config=await ensureBNBChain(wallet);
 // Create the ethers provider after switching so it never caches the previous network.
 const provider=new ethers.providers.Web3Provider(wallet);
 const session={provider,chain:56,config,account:await provider.getSigner().getAddress()};
 await assertSession(session);return session;
}
export async function owned(s:Session){const pbt=contract(s,'pbt',['function balanceOf(address) view returns(uint256)','function tokenOfOwnerByIndex(address,uint256) view returns(uint256)']);const count:BN=await pbt.balanceOf(s.account);const ids:string[]=[];for(let i=BN.from(0);i.lt(count);i=i.add(1))ids.push((await pbt.tokenOfOwnerByIndex(s.account,i)).toString());return ids}
export function puzzle(s:Session){return contract(s,'pbpuzzlehash',puzzleABI)}
export function address(hash:string,prefix:string){return hash===ethers.constants.HashZero?'':window.ChiaUtils.puzzle_hash_to_address(hash,prefix)}
export function decode(value:string,prefix:string){if(!value.startsWith(prefix+'1'))throw Error('Wrong address prefix / 地址前缀不匹配');const hash=window.ChiaUtils.address_to_puzzle_hash(value);if(!ethers.utils.isHexString(hash,32)||address(hash,prefix)!==value)throw Error('Invalid address / 地址无效');return hash}
export function quote(input:string,decimals:number,fee:[BN,BN],limits:[BN,BN]){if(!/^(0|[1-9]\d*)(\.\d+)?$/.test(input))throw Error('Invalid amount / 金额格式无效');const amount=ethers.utils.parseUnits(input,decimals);if(amount.lt(limits[0])||amount.gt(limits[1])||amount.isZero())throw Error('Outside bridge limits / 超出桥接额度');const proportional=amount.mul(fee[0]).div(10000);const cost=proportional.gt(fee[1])?proportional:fee[1];if(amount.lte(cost))throw Error('Amount does not cover fee / 金额不足以支付费用');return {amount,fee:cost,receive:amount.sub(cost)}}
export async function bindWithdrawal(s:Session,pbt:string,coin:number,hash:string,approve:(ctr:ethers.Contract,amount:BN)=>Promise<void>){
 const p=puzzle(s);const [,old]=await p.pbtPuzzleHash(pbt,coin);let value=BN.from(0);
 if(old!==ethers.constants.HashZero){const [currency,amount]=await p.rebindFee();if(currency===ethers.constants.AddressZero)value=amount;else if(!amount.isZero()){
 const feeToken=new ethers.Contract(currency,['function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)'],s.provider.getSigner());const allowance:BN=await feeToken.allowance(s.account,p.address);if(allowance.lt(amount)){if(!allowance.isZero())await approve(feeToken,BN.from(0));await approve(feeToken,amount)}
 }}await assertSession(s);return p.bindWithdrawPuzzleHash(pbt,coin,hash,{value});
}
export function mediaURLs(uri:string){
 let path:string|undefined;
 if(uri.startsWith('ipfs://'))path=uri.slice(7).replace(/^ipfs\//,'');
 else {const url=new URL(uri);if(url.protocol!=='https:')throw Error('Unsupported metadata URL');
 const legacy=['cf-ipfs.com','cloudflare-ipfs.com','dweb.link','ipfs.io','nftstorage.link','infura-ipfs.io'];
 if(legacy.includes(url.hostname)&&url.pathname.startsWith('/ipfs/'))path=url.pathname.slice(6)+url.search;
 else return [url.href];}
 if(!path||path.startsWith('/')||path.includes('..'))throw Error('Invalid IPFS path');
 return gateways.map(base=>base+path);
}
export async function metadata(s:Session,id:string,signal:AbortSignal){
 const ctr=contract(s,'pbt',['function tokenURI(uint256) view returns(string)']);const uri:string=await ctr.tokenURI(id);
 for(const url of mediaURLs(uri)){
  if(signal.aborted)throw Error('Aborted');
  try{const response=await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(8000)])});if(!response.ok)throw Error('Metadata HTTP '+response.status);const meta=await response.json();return {name:typeof meta.name==='string'?meta.name:'PBT #'+id,images:mediaURLs(String(meta.image))}}catch(e){if(signal.aborted)throw e}
 }
 throw Error('Metadata unavailable');
}
export function pbtSetup(depositHash:string,withdrawHash:string){
 const deposit=depositHash!==ethers.constants.HashZero,withdraw=withdrawHash!==ethers.constants.HashZero;
 return {deposit,withdraw,state:deposit&&withdraw?'ready':deposit||withdraw?'partial':'new'} as const;
}
export async function pbtStatus(s:Session,id:string,coinId=1){const hashes=await puzzle(s).pbtPuzzleHash(id,coinId);return pbtSetup(hashes[0],hashes[1])}
// Deposit service policy is independent of the token contract's cWAmount tuple.
export function depositLimits(decimals:number):[BN,BN]{return [BN.from(0),ethers.utils.parseUnits('50',decimals)]}
