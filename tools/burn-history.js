const ethers = require('ethers')
const pbw = require('pbwallet')
const fs = require('fs')

const historyBeginBlock = 18134388

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function load_burns(bsc, ctr, recs){
    const teamAddr = '0xfeea9cd0da8279ce0f208fdeee2355062621254f'
    const lpAddr = '0xb8d7e1982d01a613708B3235A5781a734F63D082'
    var burnBegin = Math.max(recs.checkedBlockNumber, historyBeginBlock)  // first burn at this block height
    const burnEnd = recs.chainBlockHeight
    const burns = recs.burns
    const buys = recs.buys
    const filterBurn = ctr.filters.Transfer(teamAddr,ethers.constants.AddressZero)
    const checkStep = 1000
    const buyBlocks = 1000
    try {
        const stepEnd = Math.min(burnEnd, burnBegin+checkStep-1)
        console.log('burn-begin,end=', burnBegin, stepEnd, burnEnd)
        const events = await ctr.queryFilter(filterBurn, burnBegin, stepEnd)
        //TODO: make sure events are in older-first order
        for(var i in events){
            const evt = events[i]
            const blk = await bsc.provider.getBlock(evt.blockNumber)
            evt.timestamp = blk.timestamp
            const filterBuy = ctr.filters.Transfer(lpAddr, teamAddr)
            const bevents = await ctr.queryFilter(filterBuy, evt.blockNumber-buyBlocks, evt.blockNumber-1)
            for(var bi in bevents){
                const be = bevents[bi]
                if(be.args.value.eq(evt.args.value)){
                    console.log('try load swap tx', be.transactionHash)
                    while(true){
                        const tx = await bsc.provider.getTransaction(be.transactionHash)
                        if(tx){
                            console.log('\tfound')
                            recs.buys.push(tx)
                            recs.burns.push(evt)
                            break
                        }else{
                            console.log('\tnot found! keep checking')
                            await sleep(5000)
                        }
                    }
                }
            }
            console.log('event', events[i].blockNumber, events[i].transactionHash)
        }
        recs.checkedBlockNumber = stepEnd
        burnBegin = stepEnd+1
    }catch(e){
        console.log('check failed', e)
        return recs 
    }
    console.log(burns.length, 'burn records')
    return recs 
}

async function main(){
    const burnPath = 'rec-burns.json'
    const wallet = ethers.Wallet.createRandom()
    const bsc = await pbw.connect_rpc(false, wallet.privateKey, 'https://rpc.ankr.com/bsc') 
    const pbp = bsc.ctrs['pbp']
    var recs = {
        checkedBlockNumber: 18134303,
        burns: [],
        buys: []
    }
    if(fs.existsSync(burnPath)){
        recs = JSON.parse(fs.readFileSync(burnPath))
    }
    recs.chainBlockHeight = await bsc.provider.getBlockNumber()
    console.log('current chain height', recs.chainBlockHeight, recs.checkedBlockNumber)
    while(recs.chainBlockHeight>recs.checkedBlockNumber){
        await load_burns(bsc, pbp, recs)
        if(recs.chainBlockHeight>recs.checkedBlockNumber){
            await sleep(1000)
        }
        fs.writeFileSync(burnPath, JSON.stringify(recs, null, 2))
    }
}

main()
