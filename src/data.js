import market from "./market";
import {
    ethers
} from "ethers";
import pbwallet from "pbwallet"
import keeper from "pbweb-nftkeeper";
let bsc = {}

async function connect(commit) {
    bsc = await pbwallet.connect(true)
    if (typeof (bsc) == 'string') {
        return bsc
    } else {
        if (bsc) {
            commit("setBsc", bsc)
            return bsc
        }
    }
    return false
}

async function getCoinTypes(pid) {
    const id = ethers.BigNumber.from(pid)
    const cointype = await bsc.ctrs.pbpuzzlehash.pbtCoinTypes(id)
    return cointype
}

async function loadMarketinfo(id) {
    const pbt = bsc.ctrs.pbt
    const sinfo = await bsc.ctrs.pbmarket.getSaleInfo(pbt.address, Number(id))
    const info = {}
    info.priceToken = sinfo[0]
    info.ptName = await keeper.tokenSymbol(sinfo[0])
    info.price = await keeper.formatToken(sinfo[0], sinfo[1])
    info.desc = sinfo[2]
    info.seller = sinfo[3]
    info.owner = 'market'
    return info
}
async function loadPbxs(pbtid) {
    const cointy = await getCoinTypes(pbtid)
    const pbxs = {}
    const cointyArr = cointy[0].concat(cointy[1])
    const atArr = Array.from(new Set(cointyArr))
    for (let i = 0; i < atArr.length; i++) {
        const ct = parseInt(atArr[i])
        const winfo = pbwallet.wcoin_info(ct)
        const xAddress = await bsc.ctrs.pbpuzzlehash.pbtPuzzleHash(pbtid, ct)
        const depAddr = window.ChiaUtils.puzzle_hash_to_address(String(xAddress[0]), winfo.prefix)
        const withAddr = window.ChiaUtils.puzzle_hash_to_address(String(xAddress[1]), winfo.prefix)
        const addrInfo = {
            depositAddr: String(depAddr),
            withdrawAddr: String(withAddr)
        }
        for (let k in addrInfo) {
            if (addrInfo[k].substr(3, 6) == "1qqqqq") {
                addrInfo[k] = false
            }
        }
        pbxs[String(ct)] = addrInfo
    }
    return pbxs
}
async function loadlist_brief(addr) {
    const cnt = await bsc.ctrs.pbt.balanceOf(addr)
    const briefList = {}
    for (let i = 0; i < cnt; i++) {
        console.log('load user PBT', i)
        const idx = await bsc.ctrs.pbt.tokenOfOwnerByIndex(addr, i)
        console.log('index', idx)
        const info = false;// await nftBriefInfo(idx)
        console.log('nft info', info)
        const key = String(idx)
        briefList[key] = info
    }
    return briefList
}
async function loadMyList_brief(store) {
    myList = await loadlist_brief(bsc.addr)
    store.commit("setMylist", myList)
    return myList
}
async function loadMarketList_brief(store) {
    marketList = await loadlist_brief(bsc.ctrs.pbmarket.address)
    store.commit("setMarketlist", marketList)
    return marketList
}
async function loadUserlist_detail(store, myList) { //只读一个
    const current = store.state.current
    if (current.pbtId in myList) {
        const id = String(current.pbtId)
        if (!('pbxs' in myList[id])) {
            myList[id]['pbxs'] = await loadPbxs(id)
            return myList
        }
    }
    for (let i in myList) {
        if ('pbxs' in myList[i]) continue
        myList[i]['pbxs'] = await loadPbxs(i)
        return myList
    }
    return false
}
async function loadMarketlistDetail(store, marketList) {
    const current = store.state.current
    if (current.pbtId in marketList) {
        const id = String(current.pbtId)
        if (!('market' in marketList[id])) {
            marketList[id]['market'] = await loadMarketinfo(id)
            return marketList
        }
    }
    for (let i in marketList) {
        if ('market' in marketList[i]) continue
        marketList[i]['market'] = await loadMarketinfo(i)
        return marketList
    }
    return false
}
async function loadmylist_detail(myList, store) {
    while (true) {
        myList = await loadUserlist_detail(store, myList)
        if (!myList) {
            break
        }
        store.commit("setMylist", myList)
    }
}
async function loadmarketlist_detail(marketList, store) {
    while (true) {
        marketList = await loadMarketlistDetail(store, marketList)
        if (!marketList) {
            break
        }
        let mklist_useful = {}
        let mySaleList = {}
        for (let i in marketList) {
            if ('market' in marketList[i]) {
                if (marketList[i].market['price'] != '0.0') {
                    mklist_useful[i] = marketList[i]
                }
            }
        }
        for (let i in marketList) {
            if ('market' in marketList[i]) {
                if (marketList[i].market['seller'] == '-self') {
                    mySaleList[i] = marketList[i]
                }
            }
        }
        store.commit("setMarketlist", mklist_useful)
        store.commit("setMySalelist", mySaleList)
    }
}
async function loadAlllists_brief(store) {
    await loadMyList_brief(store)
    await loadMarketList_brief(store)
    return "down"
}
async function loadAlllists_detail(store) {
    await loadmarketlist_detail(marketList, store)
    await loadmylist_detail(myList, store)
    const commit = store.commit
    keeper.startKeeper(bsc, commit, marketList, myList)

}
export default {
    loadAlllists_brief: loadAlllists_brief,
    loadAlllists_detail: loadAlllists_detail,
    connect: connect
}
