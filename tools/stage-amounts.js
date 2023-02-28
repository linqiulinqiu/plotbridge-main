const ethers = require('ethers')
const pbw = require('pbwallet')
const fs = require('fs')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var info = {
    stake_stage: '',
    stageInfo:[]
}
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

async function load_start(bsc, ctr){
    const start = await ctr.stakeStart()
    const date = new Date(start.toNumber() * 1000)
    return date
}

async function main() {
    const amountPath = "pbp-amount.json"
    const wallet = ethers.Wallet.createRandom()
    const bsc = await pbw.connect_rpc(false, wallet.privateKey, 'https://rpc.ankr.com/bsc') 
    const pbp = bsc.ctrs['pbp']
    var date = await load_start(bsc, pbp)
    const mintCaps = 1000*1000*1000;
    var sum = 145 * 1000 * 1000
    
    if (fs.existsSync(amountPath)) {
        info=JSON.parse(fs.readFileSync(amountPath))
    }
    var infoP = []
    for (var i = 90; i <= 1440; i *= 2){
        var item = {}
        item['date'] = date
        const stake_amount = mintCaps*72/1000;
        const stage_amount = mintCaps*99/1000;
        sum += stake_amount+stage_amount; 
        date = date.addDays(i)
        item['time'] = i
        item['stake'] = stake_amount/i
        item['stage'] = stage_amount / i
        item['sum'] = sum
        infoP.push(item)
    }
    info.stake_stage = sum
    info.stageInfo = infoP
    const data = JSON.stringify(info)
    fs.writeFileSync(amountPath, data, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    })
    console.log("info=",info )
}

main()
