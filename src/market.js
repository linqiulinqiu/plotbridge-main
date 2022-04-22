import {
    ethers
} from 'ethers'

import pbwallet from 'pbwallet'
import store from "./store"
import tokens from './tokens'
// 全局变量设置
var bsc = {}
const ptAddrs = {
    'BNB': ethers.constants.AddressZero,
    // "USDT": bsc.ctrs.usdt.address
}
var coinlist = {}

function loadCoinlist() {
    const coinSb = pbwallet.wcoin_list("index")
    const clist = {}
    for (let i in coinSb) {
        clist[coinSb[i]] = pbwallet.wcoin_info(coinSb[i], "index")
    }
    console.log("coinlist", clist)
    coinlist = clist
    return coinlist
}

function coinContract(coin) {
    const wcoin = 'w' + coin.toLowerCase()
    return bsc.ctrs[wcoin]
}

async function ListenToWCoin(commit) {
    const coinlist = loadCoinlist()
    const wBalance = {}
    var ctr = {}
    async function updateBalnce() {
        for (let i in coinlist) {
            const ctrname = coinlist[i].ctrname
            ctr[ctrname] = bsc.ctrs[ctrname]
            const balance = await ctr[ctrname].balanceOf(bsc.addr)
            wBalance[i] = await tokens.format(ctr[ctrname].address, balance)
        }
        console.log("balance", wBalance)
        commit('setWBalance', wBalance)
    }
    await updateBalnce()
    for (let i in ctr) {
        ctr[i].on(ctr[i].filters.Transfer, updateBalnce)
    }
}


async function connect(commit) {
    bsc = await pbwallet.connect(false)
    if (bsc) {
        console.log(bsc)
        store.commit("setBsc", bsc)
        await ListenToWCoin(commit)
        return bsc
    }
    return false
}

async function getmintfee() {
    const options = {}
    const fee = await bsc.ctrs.pbt.mintFee();
    const symbol = await tokens.symbol(fee[0])
    options.price = await tokens.format(fee[0], fee[1])
    options.ptName = symbol
    options.tokenAddr = fee[0]
    console.log("options", options)
    return options
}
async function getMintAbles() {
    const mintAbles = await bsc.ctrs.pbt.mintables()
    console.log("mintAbles", mintAbles)
    return mintAbles
}
async function mintPBT() {
    try {
        const mintfee = await bsc.ctrs.pbt.mintFee()
        console.log("mint fee", mintfee)
        const options = {}
        if (mintfee[0] == ethers.constants.AddressZero) {
            options.value = mintfee[1]
        } else {
            const ctr = pbwallet.erc20_contract(mintfee[0])
            const allow = await ctr.allowance(bsc.addr, bsc.ctrs.pbt.address)
            if (mintfee[1].gt(allow)) {
                const reciept = await ctr.approve(bsc.ctrs.pbt.address, mintfee[1].mul(10000))
                console.log("mint approve", reciept)
            }
        }
        const res = await bsc.ctrs.pbt.mint(options)
        console.log("mint res", res)
        return res
    } catch (e) {
        let text = e.message
        if ('data' in e) {
            if ('message' in e.data) {
                text = e.data.message
            }
        }
        return text
    }
}
async function burnWcoin(amount, coinInfo) {
    const ctr = bsc.ctrs[coinInfo.ctrname]
    amount = await tokens.parse(ctr.address, amount)
    const wBalance = await tokens.parse(ctr.address, store.state.WBalance[coinInfo.index])
    if (amount.gt(wBalance)) {
        return false
    }
    const receipt = await ctr.burn(amount)
    console.log("burncoin receipt", receipt)
    return receipt
}
async function waitEventDone(tx, done) {
    bsc.provider.once(tx.hash, function (evt) {
        console.log("evt", evt, evt.transactionHash)
        done(tx, evt)
    })
}
async function reBindFee() {
    const rebindFee = await bsc.ctrs.pbpuzzlehash.rebindFee()
    const refee = {}
    refee.symbol = await tokens.symbol(rebindFee[0])
    refee.amount = await tokens.format(rebindFee[0], rebindFee[1])
    console.log("rebindfee", rebindFee, refee)
    return refee
}
async function bindAddr(waddr, pbtId, cointy, rebind) {
    const pbtid = ethers.BigNumber.from(pbtId)
    const prefix = pbwallet.wcoin_info(cointy).prefix
    try {
        if ('ChiaUtils' in window) {
            if (waddr.substr(0, 3) != prefix) return false
            const addr = window.ChiaUtils.address_to_puzzle_hash(waddr)
            let res = {}
            if (rebind) {
                const fee = await bsc.ctrs.pbpuzzlehash.rebindFee()
                if (fee[0] == ethers.constants.AddressZero) { // fee in BNB
                    res = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, addr, {
                        value: fee[1]
                    })
                } else { // erc20 token
                    const allow = await checkAllowance(fee[0], bsc.ctrs.pbpuzzlehash.address)
                    console.log("checkAllowance", allow, allow.lt(fee[1]))
                    if (allow.lt(fee[1])) {
                        const res = await approveAllow(fee[0], bsc.ctrs.pbpuzzlehash.address)
                        console.log("approveAllowance", res)
                        res.fn = 'approve'
                        await waitEventDone(res, async function (evt) {
                            console.log("approveAllowance evt done,evt=", evt)
                            const bind = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, addr)
                            console.log("rebind addr ", bind)
                            return bind
                        })
                        // return res
                    }
                    res = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, addr, {
                        value: fee[1]
                    })
                    return res
                }
            } else {
                console.log('withdraw-bind', pbtId, cointy, addr);
                res = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, addr)
                return res
            }
        }
    } catch (e) {
        console.log("bindaddr errrrr", e.message)
    }
}
async function getBindables(cointy) {
    const ables = await bsc.ctrs.pbpuzzlehash.bindables(cointy)
    return ables
}
async function getDepAddr(pbtId, cointy) {
    const ables = await getBindables(cointy)
    if (parseInt(ables) == 0) {
        console.log("ables", ables)
        return "nothing"
    } else {
        const id = ethers.BigNumber.from(pbtId)
        const res = await bsc.ctrs.pbpuzzlehash.bindDepositPuzzleHash(id, cointy)
        console.log("obtain  addr", res)
        return res
    }
}
async function clearAddr(pbtid, cointy) {
    const fee = await bsc.ctrs.pbpuzzlehash.rebindFee()
    let res = {}
    if (fee[0] == ethers.constants.AddressZero) { // fee in BNB
        res = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, fee[0], {
            value: fee[1]
        })
    } else { // erc20 token
        const allow = await checkAllowance(fee[0], bsc.ctrs.pbpuzzlehash.address)
        console.log("checkAllowance", allow, allow.lt(fee[1]))
        if (allow.lt(fee[1])) {
            const approveRes = await approveAllow(fee[0], bsc.ctrs.pbpuzzlehash.address)
            console.log("approveAllowance", approveRes)
            approveRes.fn = 'approve'
            await waitEventDone(approveRes, async function (evt) {
                console.log("approveAllowance evt done,evt=", evt)
                const bind = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, ethers.constants.AddressZero)
                console.log("rebind addr ", bind)
                return bind
            })
            // return approveRes
        }
        res = await bsc.ctrs.pbpuzzlehash.bindWithdrawPuzzleHash(pbtid, cointy, addrZero, {
            value: fee[1]
        })
    }
    return res
}
async function sendToMarket(id) {
    const pb = bsc.ctrs.pbt
    const res = await pb["safeTransferFrom(address,address,uint256)"](bsc.addr, bsc.ctrs.pbmarket.address, id)
    return res
}
async function setSellInfo(id, ptName, price, desc) {
    let ptAddr = ptAddrs[ptName]
    if (!ptAddr) {
        console.log("info", ptName, )
        ptAddr = bsc.ctrs[ptName.toLowerCase()].address
    }
    const nftPrice = await tokens.parse(ptAddr, price)
    console.log("ptaddr", ptName, ptAddr, nftPrice)
    const res = await bsc.ctrs.pbmarket.onSale(bsc.ctrs.pbt.address, id, ptAddr, nftPrice, desc)
    return res
}
async function checkAllowance(priceToken, spender) {
    const ctr = pbwallet.erc20_contract(priceToken)
    const amount = await ctr.totalSupply()
    const options = {}
    if (priceToken == ethers.constants.AddressZero) {
        options.value = amount
    } else {
        try {
            const allow = await ctr.allowance(bsc.addr, spender)
            console.log("checkAllowance", allow, allow.lt(amount))
            if (allow.gt(amount)) {
                return false
            }
            return allow
        } catch (e) {
            console.log("checkAllowance eee", e.message)
        }
    }
}
async function approveAllow(token, spender) {
    const ctr = pbwallet.erc20_contract(token)
    const amount = await ctr.totalSupply()
    const total = await tokens.format(token, amount)
    console.log("totalsupply", total)
    const res = await ctr.approve(spender, amount)
    res.fn = 'approve'
    return res
}
async function buyNFT(nft) {
    const priceToken = nft.market.priceToken
    const price = await tokens.parse(priceToken, nft.market.price)
    const id = ethers.BigNumber.from(nft.id)
    const options = {}
    if (priceToken == ethers.constants.AddressZero) {
        options.value = price
    } else {
        // check allowance
        const allow = await checkAllowance(priceToken, bsc.ctrs.pbpuzzlehash.address)
        if (allow.lt(price)) { // not enough allowance, approve first
            const res = await approveAllow(priceToken, bsc.ctrs.pbmarket.address) // TODO: approve can use MAX_UINT256 for infinity
            res.fn = 'approve'
            // we need to wait for approve confirmed by BSC network, so return and let user buy again
            // TODO: show "Approve" in button when allowance not enough, then show "Buy" when allowance enough
            // TODO: check ERC20 balance then buy
            return res
        }
    }
    const res = await bsc.ctrs.pbmarket.buy(bsc.ctrs.pbt.address, id, options) // TODO: approve can use MAX_UINT256 for infinity
    res.fn = 'buy'
    return res
}
async function retreatNFT(id) {
    const res = await bsc.ctrs.pbmarket.offSale(bsc.ctrs.pbt.address, id)
    return res
}
async function afterFee(coinInfo, mode, amount) {
    const ctr = bsc.ctrs[coinInfo.ctrname]
    const fees = await getfees(coinInfo.ctrname)
    const nowfee = {}
    amount = await tokens.parse(ctr.address, amount)
    if (mode == 'deposit') {
        nowfee.min = await tokens.parse(ctr.address, fees.depositFee)
        nowfee.rate = fees.depositFeeRate
    } else if (mode == 'withdraw') {
        nowfee.min = await tokens.parse(ctr.address, fees.withdrawFee)
        nowfee.rate = fees.withdrawFeeRate
        if (amount.gt(await tokens.parse(ctr.address, store.state.WBalance[coinInfo.index]))) {
            return "fund"
        }
    } else {
        return "mode"
    }
    var fee = amount.mul(nowfee.rate).div(10000)
    if (fee.lt(nowfee.min)) {
        fee = nowfee.min
    }
    if (amount.lte(fee)) {
        return false
    }
    const f = await tokens.format(ctr.address, amount.sub(fee))
    console.log("return in afterFee", f)
    return f
}
async function getfees(ctrname) {
    const ctr = bsc.ctrs[ctrname]
    let fee = {}
    const depfee = await ctr.depositFee()
    const wdfee = await ctr.withdrawFee()
    fee.depositFee = await tokens.format(ctr.address, depfee[1])
    fee.depositFeeRate = depfee[0]
    fee.withdrawFee = await tokens.format(ctr.address, wdfee[1])
    fee.withdrawFeeRate = wdfee[0]
    console.log("getfees", fee)
    return fee

}
async function getLimit(ctrname) {
    const ctr = bsc.ctrs[ctrname]
    let amount = await ctr.cWAmount()
    const amountMax = await tokens.format(ctr.address, amount[1])
    const amountMin = await tokens.format(ctr.address, amount[0])
    amount = [amountMin, amountMax]
    return amount
}

async function watchToken(coin) {
    if (!bsc.provider) return false
    const cinfo = pbwallet.wcoin_info(coin, 'symbol')
    let wcoin = ''
    let ctr = {}
    const img_prefix = "https://pancakeswap.finance/images/tokens/"
    let img_url = ''
    console.log("cinfo", cinfo)
    if (cinfo) {
        ctr = bsc.ctrs[cinfo.ctrname]
        img_url = "https://app.plotbridge.io/img/" + cinfo.ctrname + '.png'
        wcoin = cinfo.bsymbol
    } else {
        const lowCoin = coin.toLowerCase()
        if (lowCoin in bsc.ctrs) {
            ctr = bsc.ctrs[lowCoin]
            img_url = "https://app.plotbridge.io/img/" + lowCoin + '.png'
            console.log("ctr", ctr, img_url)
            wcoin = coin
        }
    }
    const options = {
        address: ctr.address,
        symbol: wcoin,
        decimals: await ctr.decimals(),
        image: img_url
    }
    const added = await bsc.provider.send(
        'wallet_watchAsset', {
            type: 'ERC20',
            options: options
        }
    )
    return added
}
async function burnNFT(id) {
    const pbtId = ethers.BigNumber.from(id)
    const res = await bsc.ctrs.pbt.burn(pbtId)
    return res
}
export default {
    connect: connect,
    checkAllowance: checkAllowance,
    approveAllow: approveAllow,
    afterFee: afterFee,
    burnNFT: burnNFT,
    watchToken: watchToken,
    burnWcoin: burnWcoin,
    mintPBT: mintPBT,
    getMintAbles: getMintAbles,
    bindAddr: bindAddr,
    getDepAddr: getDepAddr,
    getBindables: getBindables,
    clearAddr: clearAddr,
    reBindFee: reBindFee,
    waitEventDone: waitEventDone,
    retreatNFT: retreatNFT,
    buyNFT: buyNFT,
    setSellInfo: setSellInfo,
    sendToMarket: sendToMarket,
    getLimit: getLimit,
    getfees: getfees,
    getmintfee: getmintfee,
    loadCoinlist: loadCoinlist
}