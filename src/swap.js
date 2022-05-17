const ethers = require('ethers')
const pbw = require('pbwallet')
const tokens = require('./tokens')

// Assume: 
//  WCoin: all pair with PBP
//  BNB: pair with PBP
//  Others: pair with WBNB
async function path_for_pair(bsc, from, to) {
    const paths = []
    from = ethers.utils.getAddress(from)
    to = ethers.utils.getAddress(to)
    if (from == to) return false
    if (from == ethers.constants.AddressZero) { // BNB
        paths.push(bsc.ctrs.wbnb.address)
    } else {
        paths.push(from)
        if (pbw.wcoin_info(from, 'address')) { // from is WCoin, need PBP
            paths.push(bsc.ctrs.pbp.address)
        } else if (from != bsc.ctrs.pbp.address) { // all other from should use WBNB
            paths.push(bsc.ctrs.wbnb.address)
        }
    }
    if (to == ethers.constants.AddressZero) {
        if (paths[paths.length - 1] != bsc.ctrs.wbnb.address) {
            paths.push(bsc.ctrs.wbnb.address)
        }
    } else {
        if (pbw.wcoin_info(to, 'address')) {
            if (paths[paths.length - 1] != bsc.ctrs.pbp.address) { // to is WCoin, and no PBP at tail of path
                paths.push(bsc.ctrs.pbp.address)
            }
        } else if (to != bsc.ctrs.pbp.address && paths[paths.length - 1] != bsc.ctrs.wbnb.address) { // all other from should use WBNB
            paths.push(bsc.ctrs.wbnb.address)
        }
        if (paths[paths.length - 1] != to) {
            paths.push(to)
        }
    }
    return paths
}

async function estimate(bsc, from, to, amount_in, amount_out) {
    const paths = await path_for_pair(bsc, from, to)
    if(amount_in){
        const aouts = await bsc.ctrs.router.getAmountsOut(amount_in, paths)
        return aouts[aouts.length - 1]
    }else if(amount_out){
        const ains = await bsc.ctrs.router.getAmountsIn(amount_out, paths)
        console.log('ains', ains)
        return ains[0]
    }
}

async function price(bsc, token){   // price in PBP
    if(token==bsc.ctrs.pbp.address) return 1
    const ctr = pbw.erc20_contract(token)
    const name = await ctr.name()
    if(name=='Pancake LPs'){
        const pbpamount = await tokens.balance(bsc.ctrs.pbp.address, token)
        const pbpval = await tokens.format(bsc.ctrs.pbp.address, pbpamount)
        const supply = await tokens.format(token, await tokens.supply(token))
        return parseFloat(pbpval)*2/parseFloat(supply)
    }else{
        const paths = await path_for_pair(bsc, token, bsc.ctrs.pbp.address)
        const aouts = await bsc.ctrs.router.getAmountsOut(await tokens.parse(token,'1'), paths)
        return ethers.utils.formatUnits(aouts[aouts.length - 1],'gwei')
    }
}

async function swap(bsc, from, to, amount_in, min_out, lasting) {
    const deadline = parseInt((new Date()).getTime() / 1000) + lasting
    const paths = await path_for_pair(bsc, from, to)
    let receipt = false
    if (paths[0] == bsc.ctrs.wbnb.address) {
        receipt = await bsc.ctrs.router.swapExactETHForTokens(min_out, paths, bsc.addr, deadline, {
            value: amount_in
        })
    } else if (paths[paths.length - 1] == bsc.ctrs.wbnb.address) {
        receipt = await bsc.ctrs.router.swapExactTokensForETH(amount_in, min_out, paths, bsc.addr, deadline)
    } else {
        receipt = await bsc.ctrs.router.swapExactTokensForTokens(amount_in, min_out, paths, bsc.addr, deadline)
    }
    return receipt
}

async function swapfo(bsc, from, to, amount_out, max_in, lasting) {
    const deadline = parseInt((new Date()).getTime() / 1000) + lasting
    const paths = await path_for_pair(bsc, from, to)
    let receipt = false
    if (paths[0] == bsc.ctrs.wbnb.address) {
        receipt = await bsc.ctrs.router.swapETHForExactTokens(amount_out, paths, bsc.addr, deadline, {
            value: max_in 
        })
    } else if (paths[paths.length - 1] == bsc.ctrs.wbnb.address) {
        receipt = await bsc.ctrs.router.swapTokensForExactETH(amount_out, max_in, paths, bsc.addr, deadline)
    } else {
        receipt = await bsc.ctrs.router.swapTokensForExactTokens(amount_out, max_in, paths, bsc.addr, deadline)
    }
    return receipt
}


exports.estimate = estimate
exports.swap = swap
exports.swapfo =swapfo
exports.price = price
