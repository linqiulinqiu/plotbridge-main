import { formatUnits, getAddress, ZeroAddress } from 'ethers'
import type { Contract, ContractTransactionResponse } from 'ethers'
import { factoryAbi, routerAbi, pbpAbi, stakingAbi } from './config/abis'
import { chainById, enabledCoins, type ChainArg } from './config/chains'
import {
  abiContract,
  formatToken,
  isLpToken,
  parseToken,
  tokenBalance,
  tokenContract,
  tokenSupply,
  type WalletCtx,
} from './lib/tokens'
import { useAppStore } from './store'

// PBP ecosystem helpers shared by Home (TVL), Stake (pools) and Swap
// (PancakeSwap routing). Path rule carried over from the old site:
// WCoin <-> PBP direct pair; everything else routes through WBNB.

export function pbpContracts(ctx: WalletCtx): { pbp: Contract; staking: Contract; factory: Contract; router: Contract; wbnb: string } {
  const chain = chainById(ctx.chainId)
  if (!chain) throw new Error(`unsupported chain: ${ctx.chainId}`)
  return {
    pbp: abiContract(ctx, 'pbp', pbpAbi, chain.contracts.pbp),
    staking: abiContract(ctx, 'staking', stakingAbi, chain.contracts.staking),
    factory: abiContract(ctx, 'factory', factoryAbi, chain.contracts.factory),
    router: abiContract(ctx, 'router', routerAbi, chain.contracts.router),
    wbnb: chain.contracts.wbnb,
  }
}

export interface StakePoolRow {
  stakeAddr: string
  pid: number
  alloc: number
  /** formatted total staked amount */
  lpamount: string
  /** pool lock time in seconds */
  locktime: number
  /** pool reward speed expressed in stake tokens per second */
  rewardSpeed: number
}

export async function loadStakedPools(ctx: WalletCtx): Promise<StakePoolRow[]> {
  const { pbp, staking } = pbpContracts(ctx)
  const pools = await staking.pools()
  const tokens: string[] = pools[0]
  const allocs: bigint[] = pools[1]
  const amounts: bigint[] = pools[2]
  const locktimes: bigint[] = pools[4]
  const now = Math.floor(Date.now() / 1000)
  const rewardSpeedRaw = await pbp.stakeRewardIn(now, now + 1)
  const rewardSpeed = parseFloat(await formatToken(ctx, await pbp.getAddress(), rewardSpeedRaw))
  const rows: StakePoolRow[] = []
  let totalAlloc = 0
  for (let i = 0; i < tokens.length; i++) {
    const alloc = Number(allocs[i])
    totalAlloc += alloc
    rows.push({
      stakeAddr: tokens[i],
      pid: i,
      alloc,
      lpamount: await formatToken(ctx, tokens[i], amounts[i]),
      locktime: Number(locktimes[i]),
      rewardSpeed: 0,
    })
  }
  await Promise.all(
    rows.map(async (row) => {
      const price = await pbpPrice(ctx, row.stakeAddr) // PBP per stake token
      row.rewardSpeed = (row.alloc * rewardSpeed) / price / totalAlloc
    }),
  )
  return rows
}

/** price of `token` denominated in PBP (LP pairs valued via their PBP side) */
export async function pbpPrice(ctx: WalletCtx, token: string): Promise<number> {
  const { pbp } = pbpContracts(ctx)
  const pbpAddr = await pbp.getAddress()
  if (getAddress(token) === getAddress(pbpAddr)) return 1
  if (await isLpToken(ctx, token)) {
    const meta = await tokenContract(ctx, token)
    const pairAddr = await meta.contract.getAddress()
    const pbpAmount = parseFloat(await formatToken(ctx, pbpAddr, await tokenBalance(ctx, pbpAddr, pairAddr)))
    const supply = parseFloat(await formatToken(ctx, pairAddr, await tokenSupply(ctx, pairAddr)))
    return (pbpAmount * 2) / supply
  }
  const amountIn = await parseToken(ctx, token, '1')
  const outs = await estimateSwap(ctx, token, pbpAddr, amountIn)
  return parseFloat(formatUnits(outs, 'gwei')) // PBP has 9 decimals
}

export function swapPaths(chain: ChainArg, from: string, to: string): string[] | null {
  const ctrs = chain.contracts
  from = getAddress(from)
  to = getAddress(to)
  if (from === to) return null
  const wcoins = new Set(enabledCoins(chain).map((c) => getAddress(c.address)))
  const wbnb = getAddress(ctrs.wbnb)
  const pbp = getAddress(ctrs.pbp)
  const paths: string[] = []
  if (from === ZeroAddress) {
    paths.push(wbnb)
  } else {
    paths.push(from)
    if (wcoins.has(from)) {
      paths.push(pbp)
    } else if (from !== pbp) {
      paths.push(wbnb)
    }
  }
  if (to === ZeroAddress) {
    if (paths[paths.length - 1] !== wbnb) paths.push(wbnb)
  } else {
    if (wcoins.has(to)) {
      if (paths[paths.length - 1] !== pbp) paths.push(pbp)
    } else if (to !== pbp && paths[paths.length - 1] !== wbnb) {
      paths.push(wbnb)
    }
    if (paths[paths.length - 1] !== to) paths.push(to)
  }
  return paths
}

/** exact-input estimate, or exact-output when amountIn is omitted */
export async function estimateSwap(
  ctx: WalletCtx,
  from: string,
  to: string,
  amountIn?: bigint,
  amountOut?: bigint,
): Promise<bigint> {
  const chain = chainById(ctx.chainId)
  if (!chain) throw new Error(`unsupported chain: ${ctx.chainId}`)
  const paths = swapPaths(chain, from, to)
  if (!paths) throw new Error('same token')
  const { router } = pbpContracts(ctx)
  if (amountIn) {
    const outs = await router.getAmountsOut(amountIn, paths)
    return outs[outs.length - 1]
  }
  if (amountOut) {
    const ins = await router.getAmountsIn(amountOut, paths)
    return ins[0]
  }
  throw new Error('nothing to estimate')
}

async function sendSwapTx(
  ctx: WalletCtx,
  from: string,
  to: string,
  amount: bigint,
  limit: bigint,
  lastingSec: number,
  exactOut: boolean,
): Promise<ContractTransactionResponse> {
  const chain = chainById(ctx.chainId)
  if (!chain) throw new Error(`unsupported chain: ${ctx.chainId}`)
  const paths = swapPaths(chain, from, to)
  if (!paths) throw new Error('same token')
  const { router, wbnb } = pbpContracts(ctx)
  const deadline = Math.floor(Date.now() / 1000) + lastingSec
  const user = ctx.address
  if (paths[0] === getAddress(wbnb)) {
    // native BNB side: exact-in sends value; exact-out sends the cap as value
    return exactOut
      ? router.swapETHForExactTokens(amount, paths, user, deadline, { value: limit })
      : router.swapExactETHForTokens(limit, paths, user, deadline, { value: amount })
  }
  if (paths[paths.length - 1] === getAddress(wbnb)) {
    return exactOut
      ? router.swapTokensForExactETH(amount, limit, paths, user, deadline)
      : router.swapExactTokensForETH(amount, limit, paths, user, deadline)
  }
  return exactOut
    ? router.swapTokensForExactTokens(amount, limit, paths, user, deadline)
    : router.swapExactTokensForTokens(amount, limit, paths, user, deadline)
}

export function sendSwap(
  ctx: WalletCtx,
  from: string,
  to: string,
  amountIn: bigint,
  minOut: bigint,
  lastingSec = 120,
): Promise<ContractTransactionResponse> {
  return sendSwapTx(ctx, from, to, amountIn, minOut, lastingSec, false)
}

export function sendSwapForExact(
  ctx: WalletCtx,
  from: string,
  to: string,
  amountOut: bigint,
  maxIn: bigint,
  lastingSec = 120,
): Promise<ContractTransactionResponse> {
  return sendSwapTx(ctx, from, to, amountOut, maxIn, lastingSec, true)
}

// TVL: PancakeSwap pair reserves for the PBP pairs plus staked PBP, valued in
// USDT via the BNB price (same口径 as the old site header statistic)
export async function loadTvl(ctx: WalletCtx): Promise<number> {
  const chain = chainById(ctx.chainId)
  const ctrs = chain?.contracts
  if (!chain || !ctrs) return 0
  const pairs: [string, string][] = [
    [ctrs.wbnb, ctrs.pbp],
    [ctrs.wxcc, ctrs.pbp],
    [ctrs.wxch, ctrs.pbp],
    [ctrs.wbnb, ctrs.usdt],
  ]
  const { factory } = pbpContracts(ctx)
  const balances: { a: string; b: string; balA: number; balB: number }[] = []
  for (const [a, b] of pairs) {
    const pair = await factory.getPair(a, b)
    if (pair === ZeroAddress) continue
    const balA = parseFloat(await formatToken(ctx, a, await tokenBalance(ctx, a, pair)))
    const balB = parseFloat(await formatToken(ctx, b, await tokenBalance(ctx, b, pair)))
    balances.push({ a, b, balA, balB })
  }
  let pbpAmount = 0
  let bnbPrice = 0
  let pbpPriceUsd = 0
  for (const p of balances) {
    if (p.b === getAddress(ctrs.pbp)) pbpAmount += p.balB
    if (p.a === getAddress(ctrs.wbnb) && p.b === getAddress(ctrs.usdt)) {
      bnbPrice = p.balB / p.balA
    }
  }
  const wbnbPbp = balances.find((p) => p.a === getAddress(ctrs.wbnb) && p.b === getAddress(ctrs.pbp))
  if (wbnbPbp && wbnbPbp.balB > 0) pbpPriceUsd = (wbnbPbp.balA / wbnbPbp.balB) * bnbPrice
  // staked PBP (single-sided PBP pools) counts toward TVL
  let pbpLp = 0
  try {
    const pools = await loadStakedPools(ctx)
    for (const pool of pools) {
      if (await isLpToken(ctx, pool.stakeAddr)) continue
      const sym = (await tokenContract(ctx, pool.stakeAddr)).symbol
      if (sym === 'PBP') pbpLp += parseFloat(pool.lpamount)
    }
  } catch {
    // TVL stays pair-only when pools are unavailable
  }
  return Math.trunc(pbpPriceUsd * pbpAmount * 2 + pbpLp * pbpPriceUsd)
}

/** loads TVL in the background and stores the rounded value */
export async function refreshTvl(ctx: WalletCtx): Promise<void> {
  try {
    const tvl = await loadTvl(ctx)
    useAppStore.getState().setTvl(tvl)
  } catch {
    // keep previous value on failure
  }
}
