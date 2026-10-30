// Chain & coin configuration, converged from the `pbwallet` package
// (wcoin_infolist + BSC contract address tables) so the new stack has no
// github dependency on it.
//
// 币种策略：
//   bridge       = 完整自动桥
//   withdrawOnly = 充值关闭、仅保留提现（burn 即申请，团队按 Burn 事件人工兑付）
// 未登记的币种一律不显示；恢复某币种自动桥时把 bridge 改回 true 即可。

export interface WCoinInfo {
  index: number
  name: string
  /** native chain symbol, e.g. XCH */
  symbol: string
  /** bech32m human readable prefix, e.g. xch */
  prefix: string
  /** wrapped BSC token symbol */
  bsymbol: string
  /** contract key, e.g. wxch */
  ctrname: string
}

export const WCOIN_INFOLIST: WCoinInfo[] = [
  { index: 1, name: 'Chia', symbol: 'XCH', prefix: 'xch', bsymbol: 'WXCH', ctrname: 'wxch' },
  { index: 2, name: 'HDDcoin', symbol: 'HDD', prefix: 'hdd', bsymbol: 'WHDD', ctrname: 'whdd' },
  { index: 3, name: 'Chives', symbol: 'XCC', prefix: 'xcc', bsymbol: 'WXCC', ctrname: 'wxcc' },
  { index: 5, name: 'Flax', symbol: 'XFX', prefix: 'xfx', bsymbol: 'WXFX', ctrname: 'wxfx' },
]

export interface WCoinPolicy {
  bridge?: boolean
  withdrawOnly?: boolean
}

export const WCOIN_POLICY: Record<string, WCoinPolicy> = {
  wxch: { bridge: true },
  whdd: { withdrawOnly: true },
  wxcc: { withdrawOnly: true },
  wxfx: { withdrawOnly: true },
}

export function wcoinPolicy(ctrname: string): WCoinPolicy {
  return WCOIN_POLICY[ctrname] ?? {}
}

export function isCoinEnabled(ctrname: string): boolean {
  return ctrname in WCOIN_POLICY
}

export function isWithdrawOnly(ctrname: string): boolean {
  return !!WCOIN_POLICY[ctrname]?.withdrawOnly
}

/** coin list actually usable on the given chain (policy enabled + contract deployed) */
export function enabledCoins(chain: ChainArg): (WCoinInfo & { policy: WCoinPolicy; address: string })[] {
  const out: (WCoinInfo & { policy: WCoinPolicy; address: string })[] = []
  for (const info of WCOIN_INFOLIST) {
    const addr = chain.contracts[info.ctrname]
    if (addr && isCoinEnabled(info.ctrname)) {
      out.push({ ...info, policy: wcoinPolicy(info.ctrname), address: addr })
    }
  }
  return out
}

export function coinByIndex(index: number): WCoinInfo | undefined {
  return WCOIN_INFOLIST.find((c) => c.index === index)
}

export interface ChainArg {
  /** decimal chain id, 56 / 97 */
  chainId: number
  hexChainId: string
  chainName: string
  netName: 'bnb' | 'bnbt'
  nativeSymbol: string
  rpcUrl: string
  explorerUrl: string
  /** PancakeSwap frontend base for add-LP / pair-info links */
  swapUrl: string
  /** contract keys used by the bridge; full pbwallet tables are folded in as-is */
  contracts: Record<string, string>
}

export const ZERO_PUZZLE_HASH = '0x' + '00'.repeat(32)

const BSC_MAINNET: ChainArg = {
  chainId: 56,
  hexChainId: '0x38',
  chainName: 'BSC Mainnet',
  netName: 'bnb',
  nativeSymbol: 'BNB',
  rpcUrl: 'https://bsc-dataseed.binance.org',
  explorerUrl: 'https://bscscan.com',
  swapUrl: 'https://pancakeswap.finance',
  contracts: {
    pbp: '0x217634d01809d7B9C6348D70A95AE7f5E5179de3',
    pbmarket: '0xD74AD4a7A6E4beE788aB6D94e7A9eE93Ab701348',
    tokenredeem: '0x36b2Aaaf0D362a774867794f9133a4C956D3B376',
    wxch: '0xEc02B1b904a4e925F67fA8Bc6c5d428266F5C1a5',
    whdd: '0xb558F597076babcC66250714F93A7b869Db26dB5',
    wxcc: '0x1aDCC92C322c21e387e6112bf162858AF208ff3a',
    wxfx: '0x006294e75C3CE65910Cf6fa0EA57Dcf058dc30b0',
    pbt: '0x0ceaD067be3670Dfa1f35Cc320C96842e70e7AF3',
    pbpuzzlehash: '0x421be00884414f9BfEF3ac89DBF955638e215235',
    staking: '0xA9904199717f573e3716F55D991a21C342e96F3B',
    busd: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    usdt: '0x55d398326f99059fF775485246999027B3197955',
    usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  },
}

const BSC_TESTNET: ChainArg = {
  chainId: 97,
  hexChainId: '0x61',
  chainName: 'BSC Testnet',
  netName: 'bnbt',
  nativeSymbol: 'TBNB',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  explorerUrl: 'https://testnet.bscscan.com',
  swapUrl: 'https://pancake.kiemtienonline360.com/#',
  contracts: {
    // no WHDD on testnet
    pbp: '0xB8175b05ECC42572dB9F92278fdbb2512208596B',
    pbmarket: '0x9C3E1f43C6438195E4c030B738a20Ff36FB58904',
    wxch: '0xC4839af7868b025207e364D051dA135aacAc3C2A',
    wxcc: '0x44137B6d5160F6344D835F04843AbA260303e7ab',
    wxfx: '0x27515B64cBE74440Ae5B708E1eb8De75cfbD916b',
    pbt: '0x760427cDE87aDDe133E1447B7aA9aea0659221C0',
    pbpuzzlehash: '0xE0E916f0B1C9698Fec9Db4C54A6b924eB2dee5A6',
    tokenredeem: '0xabD4D272E73110D6521081d03625db1d75c40A4D',
    staking: '0x3A54F062e4ea765741EF968aeD955E7103472C93',
    busd: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
    usdt: '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684',
    wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    factory: '0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc',
    router: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
  },
}

export const CHAINS = [BSC_MAINNET, BSC_TESTNET]

export function chainById(chainId: number | bigint | null | undefined): ChainArg | undefined {
  if (chainId === null || chainId === undefined) return undefined
  const id = Number(chainId)
  return CHAINS.find((c) => c.chainId === id)
}
