import { Contract, formatUnits, getAddress, parseUnits, ZeroAddress } from 'ethers'
import type { BrowserProvider, JsonRpcSigner } from 'ethers'
import { erc20Abi } from '../config/abis'

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
  const meta: TokenMeta = {
    symbol: await contract.symbol(),
    decimals: Number(await contract.decimals()),
    contract,
  }
  if (cacheMeta) metaCache.set(key, meta)
  return meta
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

export { zeroAddress }
