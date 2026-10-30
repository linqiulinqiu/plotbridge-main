import { Contract, formatUnits, getAddress, parseUnits, ZeroAddress } from 'ethers'
import type { BrowserProvider, InterfaceAbi, JsonRpcSigner } from 'ethers'
import { erc20Abi, lpAbi } from '../config/abis'

export interface WalletCtx {
  provider: BrowserProvider
  signer: JsonRpcSigner
  address: string
  chainId: number
}

interface TokenMeta {
  symbol: string
  decimals: number
  contract: Contract
  /** set for PancakeSwap LP pairs, with the two underlying tokens */
  lpTokens?: [string, string]
}

// token metadata cache: "chainId:address" -> meta (session level)
const metaCache = new Map<string, TokenMeta>()

function zeroAddress(): string {
  return ZeroAddress
}

export function isNative(tokenAddr: string): boolean {
  return getAddress(tokenAddr) === ZeroAddress
}

export async function tokenContract(
  ctx: WalletCtx,
  tokenAddr: string,
  cacheMeta = true,
): Promise<TokenMeta> {
  const key = `${ctx.chainId}:${getAddress(tokenAddr)}`
  const cached = metaCache.get(key)
  if (cached && cacheMeta) return cached
  const contract = new Contract(getAddress(tokenAddr), erc20Abi, ctx.signer)
  let symbol: string = await contract.symbol()
  let lpTokens: [string, string] | undefined
  if (symbol === 'Cake-LP') {
    // PancakeSwap pair: show as Cake-LP(token0 - token1), remember the pair
    const pair = new Contract(getAddress(tokenAddr), lpAbi as unknown as InterfaceAbi, ctx.signer)
    lpTokens = [await pair.token0(), await pair.token1()]
    const s0 = await tokenSymbol(ctx, lpTokens[0])
    const s1 = await tokenSymbol(ctx, lpTokens[1])
    symbol = `Cake-LP(${s0}-${s1})`
  }
  const meta: TokenMeta = {
    symbol,
    decimals: Number(await contract.decimals()),
    contract,
    lpTokens,
  }
  if (cacheMeta) metaCache.set(key, meta)
  return meta
}

/** arbitrary-abi contract (cached per chain+address+abi name) */
const contractCache = new Map<string, Contract>()
export function abiContract(
  ctx: WalletCtx,
  abiName: string,
  abi: InterfaceAbi,
  address: string,
): Contract {
  const key = `${ctx.chainId}:${abiName}:${getAddress(address)}`
  let ctr = contractCache.get(key)
  if (!ctr) {
    ctr = new Contract(getAddress(address), abi, ctx.signer)
    contractCache.set(key, ctr)
  }
  return ctr
}

export async function formatToken(ctx: WalletCtx, tokenAddr: string, value: bigint): Promise<string> {
  if (isNative(tokenAddr)) return formatUnits(value, 18)
  const meta = await tokenContract(ctx, tokenAddr)
  return formatUnits(value, meta.decimals)
}

export async function parseToken(ctx: WalletCtx, tokenAddr: string, value: string): Promise<bigint> {
  if (isNative(tokenAddr)) return parseUnits(value || '0', 18)
  const meta = await tokenContract(ctx, tokenAddr)
  return parseUnits(value || '0', meta.decimals)
}

export async function tokenSymbol(ctx: WalletCtx, tokenAddr: string): Promise<string> {
  if (isNative(tokenAddr)) return 'BNB'
  return (await tokenContract(ctx, tokenAddr)).symbol
}

export async function tokenDecimals(ctx: WalletCtx, tokenAddr: string): Promise<number> {
  if (isNative(tokenAddr)) return 18
  return (await tokenContract(ctx, tokenAddr)).decimals
}

export async function tokenBalance(
  ctx: WalletCtx,
  tokenAddr: string,
  owner?: string,
): Promise<bigint> {
  const who = owner ?? ctx.address
  if (isNative(tokenAddr)) return ctx.provider.getBalance(who)
  const meta = await tokenContract(ctx, tokenAddr)
  return meta.contract.balanceOf(who)
}

export async function tokenAllowance(
  ctx: WalletCtx,
  tokenAddr: string,
  spender: string,
): Promise<bigint> {
  if (isNative(tokenAddr)) return 2n ** 256n - 1n
  const meta = await tokenContract(ctx, tokenAddr)
  return meta.contract.allowance(ctx.address, spender)
}

export async function tokenSupply(ctx: WalletCtx, tokenAddr: string): Promise<bigint> {
  if (isNative(tokenAddr)) return 2n ** 256n - 1n
  const meta = await tokenContract(ctx, tokenAddr)
  return meta.contract.totalSupply()
}

/** approve `spender` to spend the token's whole supply (old-site convention) */
export async function tokenApprove(
  ctx: WalletCtx,
  tokenAddr: string,
  spender: string,
): Promise<boolean> {
  if (isNative(tokenAddr)) return true
  const meta = await tokenContract(ctx, tokenAddr)
  const receipt = await meta.contract.approve(spender, await meta.contract.totalSupply())
  if (typeof receipt.hash === 'string') {
    await ctx.provider.waitForTransaction(receipt.hash)
    return true
  }
  return false
}

export async function isLpToken(ctx: WalletCtx, tokenAddr: string): Promise<boolean> {
  const meta = await tokenContract(ctx, tokenAddr)
  return !!meta.lpTokens
}

/** the two underlying tokens of a LP pair, or null when not a pair */
export async function lpTokensOf(ctx: WalletCtx, tokenAddr: string): Promise<[string, string] | null> {
  const meta = await tokenContract(ctx, tokenAddr)
  return meta.lpTokens ?? null
}

export { zeroAddress }
