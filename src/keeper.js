const pbw = require('pbwallet')
const ethers = require('ethers')
const tokens = require('./tokens')
var bsc = {}
var myList = {}
var mySaleList = {}
var marketList = {}
const ptInfos = {}

async function getCoinTypes(pbtid) {
    const cointype = await bsc.ctrs.pbpuzzlehash.pbtCoinTypes(pbtid)
    return cointype
}

function copyObj(src, dest) {
    if (!dest) {
        dest = {}
    }
    for (var k in src) {
        dest[k] = src[k]
    }
    return dest
}

// gid -- gateway id
function fix_uri(uri, gid) {
    const gateways = [
        'https://cf-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/',
        'https://nftstorage.link/ipfs/',
        'https://infura-ipfs.io/ipfs/'
    ]
    if (uri.startsWith('ipfs:')) {
        while (gid >= gateways.length) gid -= gateways.length
        // console.log("fix_uri",gid,gateways[gid], uri)
        return uri.replace('ipfs://', gateways[gid])
    } else {
        return uri
    }
}

function n2str(n) {
    if (ethers.BigNumber.isBigNumber(n)) {
        return n.toString()
    }
    return parseInt(n).toString()
}

async function nftBriefInfo(id) {
    const uri = await bsc.ctrs.pbt.tokenURI(parseInt(id))
    let meta = {}
    let gid = 0
    try {
        const metaData = await fetch(fix_uri(uri, gid))
        const img = await metaData.json()
        meta = metaData
        meta.image = await fix_uri(String(img.image),gid)
        meta.loading = false
    } catch (e) {
        gid++
        meta.loading = true
        meta.image = false

        console.log("brief-info err", e, meta)
    }

    const info = {
        id: Number(id),
        uri: uri,
        meta: meta,
    }
    return info
}

async function loadPbxs(pbtid) {
    const cointy = await getCoinTypes(pbtid)
    const pbxs = {}
    const cointyArr = cointy[0].concat(cointy[1])
    const atArr = Array.from(new Set(cointyArr))
    for (let i = 0; i < atArr.length; i++) {
        const ct = parseInt(atArr[i])
        const winfo = pbw.wcoin_info(ct)
        const xAddress = await bsc.ctrs.pbpuzzlehash.pbtPuzzleHash(pbtid, ct)
        const depAddr = window.ChiaUtils.puzzle_hash_to_address(String(xAddress[0]), winfo.prefix)
        const withAddr = window.ChiaUtils.puzzle_hash_to_address(String(xAddress[1]), winfo.prefix)
        const addrInfo = {
            depositAddr: String(depAddr),
            withdrawAddr: String(withAddr)
        }
        for (let k in addrInfo) {
            const pre_length = winfo.prefix.length
            if (addrInfo[k].substr(pre_length, 6) == '1qqqqq') {
                addrInfo[k] = false
            }
        }
        pbxs[String(ct)] = addrInfo
    }
    return pbxs
}

async function loadMarketInfo(id) {
    const sinfo = await bsc.ctrs.pbmarket.getSaleInfo(bsc.ctrs.pbt.address, Number(id))
    const info = {}
    info.priceToken = sinfo[0]
    info.ptName = await tokens.symbol(sinfo[0])
    info.price = await tokens.format(sinfo[0], sinfo[1])
    info.desc = sinfo[2]
    info.seller = sinfo[3]
    info.owner = 'market'
    return info
}

function setMarketItem(key, info, commit) {
    const item = copyObj(info)
    if ('market' in item) {
        if (item.market.seller == '-self') {
            mySaleList[key] = item
            commit('setMySalelist', copyObj(mySaleList))
        }
        if (item.market.price != '0.0') {
            marketList[key] = item
            commit('setMarketlist', copyObj(marketList))
        }
    }
}

async function addToMyList(id, commit) {
    const key = n2str(id)
    if (!(key in myList)) {
        const info = await nftBriefInfo(id)
        info.pbxs = await loadPbxs(id)
        myList[key] = info
        commit("setMylist", copyObj(myList))
    } else {
        return false
    }
}

async function addToMarketList(id, commit) {
    const key = n2str(id)
    if (!(key in marketList) && !(key in mySaleList)) {
        const info = await nftBriefInfo(id)
        info.market = await loadMarketInfo(id)
        setMarketItem(key, info, commit)
    } else {
        return false
    }
}

function deleteFromMarketList(id, commit) {
    const key = n2str(id)
    if (key in marketList) {
        delete marketList[key]
    } else if (key in mySaleList) {
        delete mySaleList[key]
        commit('setMySalelist', copyObj(mySaleList))
    } else {
        return false
    }
}

function deleteFromMyList(id, commit) {
    const key = n2str(id)
    if (key in myList) {
        delete myList[key]
        commit("setMylist", copyObj(myList))
    } else {
        return false
    }
}
async function updateMyListItem(id, commit) {
    const key = n2str(id)
    if (key in myList) {
        const info = await nftBriefInfo(id)
        info.pbxs = await loadPbxs(id)
        myList[key] = info
        commit("setMylist", copyObj(myList))
    }
}
async function updateMarketListItem(id, commit) {
    const key = n2str(id)
    if ((key in marketList) || (key in mySaleList)) {
        const info = await nftBriefInfo(id)
        info.market = await loadMarketInfo(id)
        setMarketItem(key, info, commit)
        console.log("market list")
    }
}

async function initMyList(bsc, commit) {
    const cnt = (await bsc.ctrs.pbt.balanceOf(bsc.addr)).toNumber()
    const ids = []
    for (let i = 0; i < cnt; i++) {
        const idx = (await bsc.ctrs.pbt.tokenOfOwnerByIndex(bsc.addr, i)).toString()
        myList[idx] = {
            loading: true,
            id: idx
        }
        myList = copyObj(myList)
        commit('setMylist', myList)
        ids[i] = idx
    }
    for (let i in ids) {
        const idx = ids[i]
        const info = await nftBriefInfo(idx)
        myList[idx] = info
        myList = copyObj(myList)
        commit('setMylist', myList)
    }
    for (let i in ids) {
        const idx = ids[i]
        const pbxs = await loadPbxs(idx)
        const item = copyObj(myList[idx])
        item.pbxs = pbxs
        item.loading = false
        myList[idx] = item
        myList = copyObj(myList)
        commit('setMylist', myList)
    }
    commit('setLoadDone', 'p')
}

async function initMarketList(bsc, commit) {
    const cnt = await bsc.ctrs.pbt.balanceOf(bsc.ctrs.pbmarket.address)
    const ids = []
    const infos = []
    for (let i = 0; i < cnt; i++) {
        const idx = (await bsc.ctrs.pbt.tokenOfOwnerByIndex(bsc.ctrs.pbmarket.address, i)).toString()
        ids[i] = idx
        setMarketItem(idx, {
            loading: true,
            id: idx
        }, commit)
    }
    for (let i in ids) {
        const idx = ids[i]
        const info = await nftBriefInfo(idx)
        setMarketItem(idx, info, commit)
        infos[idx] = info
    }
    for (let i in ids) {
        const idx = ids[i]
        infos[idx].market = await loadMarketInfo(idx)
        infos[idx].loading = false
        setMarketItem(idx, infos[idx], commit)
    }
    commit('setLoadDone', 'm')
}


function startKeeper(_bsc, commit) {
    copyObj(_bsc, bsc)
    initMyList(bsc, commit)
    initMarketList(bsc, commit)
    if (bsc.ctrs.pbt.filters.Transfer) {
        bsc.ctrs.pbt.on(bsc.ctrs.pbt.filters.Transfer, async function (evt) {
            if (evt.event == "Transfer") {
                if (evt.args.to == bsc.addr) {
                    await addToMyList(evt.args.tokenId, commit)
                }
                if (evt.args.to == bsc.ctrs.pbmarket.address) {
                    await addToMarketList(evt.args.tokenId, commit)
                }
                if (evt.args.from == bsc.addr) {
                    deleteFromMyList(evt.args.tokenId, commit)
                }
                if (evt.args.from == bsc.ctrs.pbmarket.address) {
                    deleteFromMarketList(evt.args.tokenId, commit)
                }
            }
        })
    }
    if (bsc.ctrs.pbpuzzlehash.filters.WithdrawPuzzleHashChanged) {
        bsc.ctrs.pbpuzzlehash.on(bsc.ctrs.pbpuzzlehash.filters.WithdrawPuzzleHashChanged, async function (evt) {
            if (evt.event == 'WithdrawPuzzleHashChanged') {
                await updateMyListItem(evt.args.pbtId, commit)
            }
        })
    }
    if (bsc.ctrs.pbpuzzlehash.filters.DepositPuzzleHashChanged) {
        bsc.ctrs.pbpuzzlehash.on(bsc.ctrs.pbpuzzlehash.filters.DepositPuzzleHashChanged, async function (evt) {
            if (evt.event == 'DepositPuzzleHashChanged') {
                await updateMyListItem(evt.args.pbtId, commit)
            }
        })
    }
    if (bsc.ctrs.pbmarket.filters.OnSale) {
        bsc.ctrs.pbmarket.on(bsc.ctrs.pbmarket.filters.OnSale, async function (evt) {
            if (evt.event == "OnSale") {
                await updateMarketListItem(evt.args.tokenId, commit)
            }
        })
    }
}

exports.startKeeper = startKeeper