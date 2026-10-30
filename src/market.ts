import { getAddress, MaxUint256, ZeroAddress } from 'ethers'
import type { ContractTransactionResponse } from 'ethers'
import { chainById } from './config/chains'
import { bridgeContracts } from './keeper'
import { useAppStore } from './store'
import {
  formatToken,
  parseToken,
  tokenContract,
  tokenSymbol,
  type WalletCtx,
} from './lib/tokens'

// PBT market + mint operations (old-site market.js, ethers v6 port).
// Approve spender is always the contract that later transferFrom's the fee —
// the old site once approved the wrong spender for minting, don't repeat that.

export interface MintFeeInfo {
  price: string
  token: string
  tokenAddr: string
  /** raw fee amount for allowance checks */
  amount: bigint
}

function requireCtx(): WalletCtx {
  const ctx = useAppStore.getState().ctx
  if (!ctx) throw new Error('wallet not connected')
  return ctx
}

export async function getMintFee(ctx: WalletCtx): Promise<MintFeeInfo> {
  const bc = bridgeContracts(ctx)
  const fee = await bc.pbt.mintFee()
  const tokenAddr: string = fee[0]
  return {
    tokenAddr,
    price: await formatToken(ctx, tokenAddr, fee[1]),
    token: await tokenSymbol(ctx, tokenAddr),
    amount: fee[1],
  }
}

export async function getMintables(ctx: WalletCtx): Promise<bigint> {
  const bc = bridgeContracts(ctx)
  return bc.pbt.mintables()
}

/** approve the mint fee if needed, then mint one PBT */
export async function mintPBT(ctx: WalletCtx): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  const pbtAddr = await bc.pbt.getAddress()
  const fee = await bc.pbt.mintFee()
  const feeToken: string = fee[0]
  const feeAmount: bigint = fee[1]
  const options: { value?: bigint } = {}
  if (feeToken === ZeroAddress) {
    options.value = feeAmount
  } else {
    const erc20 = await tokenContract(ctx, feeToken)
    const allow = await erc20.contract.allowance(ctx.address, pbtAddr)
    if (feeAmount > allow) {
      await erc20.contract.approve(pbtAddr, feeAmount * 10000n)
    }
  }
  return bc.pbt.mint(options)
}

/** price token address for a display name (BNB -> native, else chain table) */
export function priceTokenFor(chainId: number, ptName: string): string | null {
  const name = ptName.toUpperCase()
  if (name === 'BNB') return ZeroAddress
  const chain = chainById(chainId)
  const key = name.toLowerCase()
  return chain?.contracts[key] ?? null
}

/** transfer the NFT into the market contract (step 1 of listing) */
export async function sendToMarket(ctx: WalletCtx, id: string): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  return bc.pbt['safeTransferFrom(address,address,uint256)'](
    ctx.address,
    await bc.market.getAddress(),
    id,
  )
}

export async function setSellInfo(
  ctx: WalletCtx,
  id: string,
  ptName: string,
  price: string,
  desc: string,
): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  const tokenAddr = priceTokenFor(ctx.chainId, ptName)
  if (tokenAddr === null) throw new Error(`unknown price token: ${ptName}`)
  const nftPrice = await parseToken(ctx, tokenAddr, price)
  return bc.market.onSale(await bc.pbt.getAddress(), id, tokenAddr, nftPrice, desc)
}

export async function retreatNFT(ctx: WalletCtx, id: string): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  return bc.market.offSale(await bc.pbt.getAddress(), id)
}

/**
 * approve the price token for the market when the allowance is short.
 * returns true when no approval is needed and the caller can buy right away;
 * when an approval was sent, it waits for the receipt and returns false so
 * the caller can proceed with a second user action (old-site flow).
 */
export async function ensureBuyAllowance(
  ctx: WalletCtx,
  priceToken: string,
  price: bigint,
): Promise<boolean> {
  if (priceToken === ZeroAddress) return true
  const bc = bridgeContracts(ctx)
  const marketAddr = await bc.market.getAddress()
  const allow = (await tokenContract(ctx, priceToken)).contract
  const current = await allow.allowance(ctx.address, marketAddr)
  if (current >= price) return true
  const tx = await allow.approve(marketAddr, MaxUint256)
  await ctx.provider.waitForTransaction(tx.hash)
  return false
}

export async function buyNFT(
  ctx: WalletCtx,
  priceToken: string,
  id: string,
  price: string,
): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  const amount = await parseToken(ctx, priceToken, price)
  const options: { value?: bigint } = {}
  if (priceToken === ZeroAddress) options.value = amount
  return bc.market.buy(await bc.pbt.getAddress(), id, options)
}

export async function burnNFT(ctx: WalletCtx, id: string): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  return bc.pbt.burn(id)
}

export async function transferPBT(
  ctx: WalletCtx,
  to: string,
  id: string,
): Promise<ContractTransactionResponse> {
  const bc = bridgeContracts(ctx)
  return bc.pbt.transferFrom(ctx.address, getAddress(to), id)
}

export { requireCtx }
