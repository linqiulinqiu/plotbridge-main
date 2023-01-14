const fs = require('fs')
const ethers = require('ethers')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readJson(jsonPath){
    if(fs.existsSync(jsonPath)){
        return JSON.parse(fs.readFileSync(jsonPath))
    }
    return false
}

function show(data){
    for(var i in data){
        const rec = data[i]
        console.log('rec', i)
        console.log("\t",rec.args[0], rec.args[1], ethers.utils.formatUnits(rec.args[2],'gwei'))
    }
}

function main(){
    const data = readJson('rec-burns.json')
    show(data.burns)
}

main()
