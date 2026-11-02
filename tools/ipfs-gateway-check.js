// Probe the configured IPFS gateways against a live PBT metadata record.
//
// Public gateways rot: hosts die, pin services sunset, and gateways move to
// service-worker-only mode that a cross-origin fetch cannot read. Run this on a
// schedule so a broken chain is found before users report missing images.
//
// Usage:
//   node tools/ipfs-gateway-check.js            # read tokenURI(1) from BSC mainnet
//   node tools/ipfs-gateway-check.js <pbtId>    # check a specific PBT
//   node tools/ipfs-gateway-check.js <cid>      # check a raw CID (metadata.json assumed)
//
// Exit code 0 when at least one gateway serves the metadata, 1 otherwise.
// Honours HTTPS_PROXY / HTTP_PROXY for restricted networks.

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')
const networks = require('../networks.json')
const ipfs = require('../shared/ipfs.json')

const RPC = process.env.RPC_URL || networks[0].chainRpcUrl
const TIMEOUT = Number(process.env.GATEWAY_TIMEOUT || 15000)
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy || ''
const ARG = process.argv[2] || '1'
const PBT = networks[0].ctr_addrs.pbt
const GATEWAYS = (ipfs.gateways || []).map(g => typeof g === 'string' ? { base: g, mode: 'plain' } : { base: g.base, mode: g.mode || 'plain' })
if (ipfs.selfHosted) GATEWAYS.unshift({ base: ipfs.selfHosted, mode: 'plain' })

function request(url, options = {}) {
    const { method = 'GET', body = null, headers = {} } = options
    return new Promise((resolve, reject) => {
        const u = new URL(url)
        const timeout = setTimeout(() => finish(Error('timeout')), TIMEOUT)
        let done = false
        const finish = (err, value) => { if (done) return; done = true; clearTimeout(timeout); err ? reject(err) : resolve(value) }
        const collect = res => {
            const chunks = []
            res.on('data', c => chunks.push(c))
            res.on('end', () => finish(null, { status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
        }
        if (PROXY) {
            const p = new URL(PROXY)
            const connect = http.request({ host: p.hostname, port: p.port || 80, method: 'CONNECT', path: u.hostname + ':' + (u.port || 443), headers: { Host: u.hostname } })
            connect.once('connect', (res, socket) => {
                if (res.statusCode !== 200) { socket.destroy(); return finish(Error('proxy CONNECT ' + res.statusCode)) }
                const req = https.request({ host: u.hostname, port: u.port || 443, path: u.pathname + u.search, method, headers: Object.assign({ host: u.hostname, 'content-length': body ? Buffer.byteLength(body) : 0 }, headers), socket, agent: false }, collect)
                req.once('error', e => finish(e))
                if (body) req.write(body)
                req.end()
            })
            connect.once('error', e => finish(e))
            connect.end()
            return
        }
        const mod = u.protocol === 'https:' ? https : http
        const req = mod.request({ host: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search, method, headers: Object.assign({}, headers, body ? { 'content-length': Buffer.byteLength(body) } : {}) }, collect)
        req.once('error', e => finish(e))
        if (body) req.write(body)
        req.end()
    })
}

function varint(buf, i) {
    let x = 0, shift = 0
    for (;;) {
        const c = buf[i++]
        x += (c & 0x7f) * Math.pow(2, shift)
        if (!(c & 0x80)) return [x, i]
        shift += 7
    }
}

// CAR v1: varint header length + dag-cbor header, then varint length + CID + block.
function rawFromCAR(buf) {
    let i = 0, headerLen
    ;[headerLen, i] = varint(buf, i)
    i += headerLen
    const raw = []
    while (i < buf.length) {
        let len
        ;[len, i] = varint(buf, i)
        const end = i + len
        let codec = 0x55
        if (buf[i] === 0x01) { i++; ;[codec, i] = varint(buf, i) }
        let mhCode, mhLen
        ;[mhCode, i] = varint(buf, i)
        ;[mhLen, i] = varint(buf, i)
        i += mhLen
        if (codec === 0x55) raw.push(buf.subarray(i, end))
        i = end
    }
    if (!raw.length) throw new Error('CAR archive holds no raw block')
    return Buffer.concat(raw)
}

async function ethCall(data) {
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: PBT, data }, 'latest'] })
    const res = await request(RPC, { method: 'POST', body: payload, headers: { 'content-type': 'application/json' } })
    const json = JSON.parse(res.body.toString('utf8'))
    if (json.error) throw new Error(json.error.message || 'rpc error')
    return json.result
}
const decodeString = hex => {
    const body = hex.slice(2)
    const length = parseInt(body.slice(64, 128), 16)
    return Buffer.from(body.slice(128, 128 + length * 2), 'hex').toString('utf8')
}
const tokenURI = id => ethCall('0xc87b56dd' + id.toString(16).padStart(64, '0')).then(decodeString)

async function probe(gateway, pathname) {
    const url = gateway.base.replace(/\/$/, '') + '/ipfs/' + pathname
    const started = Date.now()
    try {
        const accept = gateway.mode === 'car' ? 'application/vnd.ipld.car' : '*/*'
        const res = await request(url, { headers: { Accept: accept } })
        const ms = Date.now() - started
        if (res.status !== 200) return { url, status: res.status, ms, note: res.body.toString('utf8').slice(0, 60).replace(/\s+/g, ' ') }
        const contentType = res.headers['content-type'] || ''
        const isCAR = contentType.includes('car') || (res.body[1] === 0xa2 && res.body[2] === 0x65)
        const payload = isCAR ? rawFromCAR(res.body) : res.body
        let note = payload.length + 'b ' + (isCAR ? 'CAR' : contentType.slice(0, 24))
        let json = null
        try { json = JSON.parse(payload.toString('utf8')); note += ' JSON name=' + (json.name || '-') } catch (e) { }
        return { url, status: res.status, ms, note, json }
    } catch (e) {
        return { url, status: 0, ms: Date.now() - started, note: e.message || String(e) }
    }
}

async function main() {
    let pathname
    if (/^(bafy|Qm)/i.test(ARG)) {
        pathname = `${ARG}/metadata.json`
    } else {
        const uri = await tokenURI(Number(ARG))
        pathname = uri.replace(/^ipfs:\/\//, '').replace(/^ipfs\//, '')
        console.log(`PBT #${ARG} tokenURI: ${uri}`)
    }
    console.log(`path: ${pathname}\n`)

    const results = []
    for (const gateway of GATEWAYS) {
        const r = await probe(gateway, pathname)
        results.push(r)
        const state = r.json ? 'OK   ' : r.status === 0 ? 'DOWN ' : r.status === 429 ? 'SW   ' : 'HTTP '
        console.log(`${state} ${String(r.status).padEnd(4)} ${String(r.ms).padStart(6)}ms  ${r.url}`)
        console.log(`       ${r.note}`)
    }

    const winner = results.find(r => r.json)
    console.log(`\nsummary: ${results.length} gateways, ${results.filter(r => r.json).length} serving the metadata`)
    if (!winner) {
        console.log('NO GATEWAY SERVES THIS METADATA — re-pin the PBT metadata and images, then update shared/ipfs.json')
        process.exitCode = 1
        return
    }
    console.log(`name: ${winner.json.name || '(none)'}`)
    console.log(`image: ${winner.json.image || '(none)'}`)
}

main().catch(e => { console.error(e); process.exitCode = 1 })
