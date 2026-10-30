import { formatUnits } from 'ethers'
import type { Contract, ContractTransactionResponse } from 'ethers'
import { bridgeContracts } from './keeper'
import { addressToPuzzleHash } from './lib/chia'
import { formatToken, parseToken, tokenDecimals } from './lib/tokens'
import { isValidAmount } from './lib/utils'
import { ZERO_PUZZLE_HASH } from './config/chains'
import type { WalletCtx } from './lib/tokens'

// Bridge contract operations, ported from the old site's market.js with the
// same fee semantics: payout = amount - max(rate * amount, minFee), where the
// rate is in 1/10000 units read from the contract (never hardcoded).

export type FeeMode = 'deposit' | 'withdraw'

export interface FeeInfo {
  /** formatted minimal fee */
  min: string
  /** raw rate in 1/10000 units */
  rate: number
}

export type AfterFeeResult =
  | { kind: 'ok'; value: string }
  | { kind: 'small' } // amount <= fee, nothing left to receive
  | { kind: 'fund' } // withdraw amount above balance
  | { kind: 'invalid' }

export async function getFee(ctx: WalletCtx, ctr: Contract, mode: FeeMode): Promise<FeeInfo> {
  const fee: [bigint, bigint] = await (mode === 'deposit' ? ctr.depositFee() : ctr.withdrawFee())
  const [rate, min] = fee
  const decimals = await tokenDecimals(ctx, await ctr.getAddress())
  return { min: formatUnits(min, decimals), rate: Number(rate) }
}

export async function afterFee(
  ctx: WalletCtx,
  ctr: Contract,
  mode: FeeMode,
  amountStr: string,
  balanceFormatted?: string,
): Promise<AfterFeeResult> {
  if (!isValidAmount(amountStr)) return { kind: 'invalid' }
  const addr = await ctr.getAddress()
  const [rate, min] = (await (mode === 'deposit' ? ctr.depositFee() : ctr.withdrawFee())) as [
    bigint,
    bigint,
  ]
  const amount = await parseToken(ctx, addr, amountStr)
  if (mode === 'withdraw' && balanceFormatted !== undefined) {
    const balance = await parseToken(ctx, addr, balanceFormatted)
    if (amount > balance) return { kind: 'fund' }
  }
  let fee = (amount * rate) / 10000n
  if (fee < min) fee = min
  if (amount <= fee) return { kind: 'small' }
  return { kind: 'ok', value: await formatToken(ctx, addr, amount - fee) }
}

/** single-transfer suggested limits: deposit (max-min)/2, withdraw min */
export async function getLimits(ctx: WalletCtx, ctr: Contract): Promise<{ min: string; max: string }> {
  const addr = await ctr.getAddress()
  const [min, max]: [bigint, bigint] = await ctr.cWAmount()
  return {
    min: await formatToken(ctx, addr, min),
    max: await formatToken(ctx, addr, max),
  }
}

export async function burnWcoin(
  ctx: WalletCtx,
  ctr: Contract,
  amountStr: string,
  balanceFormatted: string | undefined,
): Promise<ContractTransactionResponse> {
  if (!isValidAmount(amountStr)) throw new Error('invalid amount')
  const addr = await ctr.getAddress()
  const amount = await parseToken(ctx, addr, amountStr)
  if (balanceFormatted !== undefined) {
    const balance = await parseToken(ctx, addr, balanceFormatted)
    if (amount > balance) throw new Error('insufficient balance')
  }
  return (await ctr.burn(amount)) as ContractTransactionResponse
}

/** bind (or rebind) the native-chain withdrawal address for a PBT + coin */
export async function bindWithdrawAddr(
  ctx: WalletCtx,
  pbtId: string,
  coinIndex: number,
  prefix: string,
  waddr: string,
): Promise<boolean> {
  const puzzleHash = addressToPuzzleHash(waddr.trim(), prefix)
  if (!puzzleHash) return false
  const bc = bridgeContracts(ctx)
  const tx = await bc.puzzlehash.bindWithdrawPuzzleHash(pbtId, coinIndex, puzzleHash)
  await tx.wait()
  return true
}

/** clear the withdrawal binding (bind the zero puzzle hash) */
export async function clearWithdrawAddr(ctx: WalletCtx, pbtId: string, coinIndex: number): Promise<void> {
  const bc = bridgeContracts(ctx)
  const tx = await bc.puzzlehash.bindWithdrawPuzzleHash(pbtId, coinIndex, ZERO_PUZZLE_HASH)
  await tx.wait()
}

/** assign a deposit address from the contract pool for a PBT + coin */
export async function bindDepositAddr(
  ctx: WalletCtx,
  pbtId: string,
  coinIndex: number,
): Promise<'ok' | 'none'> {
  const bc = bridgeContracts(ctx)
  const bindables: bigint = await bc.puzzlehash.bindables(coinIndex)
  if (Number(bindables) === 0) return 'none'
  const tx = await bc.puzzlehash.bindDepositPuzzleHash(pbtId, coinIndex)
  await tx.wait()
  return 'ok'
}
