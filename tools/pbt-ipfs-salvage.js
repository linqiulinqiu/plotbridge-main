// Salvage PBT metadata and images back from the IPFS network.
//
// The original NFT files are no longer held locally and the service they were
// pinned to (NFT.Storage) has been shut down. The content is still reachable
// through the public-good IPFS gateways, which answer with CAR archives rather
// than raw bytes, so the archive is decoded here.
//
// Usage:
//   node tools/pbt-ipfs-salvage.js [outDir]      # outDir defaults to ./ipfs-salvage
//
// Writes <outDir>/<id>/metadata.json, <outDir>/<id>/<image file> and a manifest.json.
// The recovered files are the source of truth for re-pinning to a service of our own.
//
// Honours HTTPS_PROXY / HTTP_PROXY because the RPC and some gateways are only
// reachable through a proxy from restricted networks.

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')
const networks = require('../networks.json')
const ipfs = require('../shared/ipfs.json')

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'ipfs-salvage'))
const RPC = process.env.RPC_URL || networks[0].chainRpcUrl
const TIMEOUT = Number(process.env.GATEWAY_TIMEOUT || 20000)
const RPC_TIMEOUT = Number(process.env.RPC_TIMEOUT || 8000)
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy || ''
const CAR_GATEWAYS = (ipfs.gateways || []).filter(g => (g.mode || 'plain') === 'car').map(g => g.base)
const PBT = networks[0].ctr_addrs.pbt

if (!CAR_GATEWAYS.length) {
    console.error('No CAR capable gateway configured in shared/ipfs.json')
    process.exit(1)
}

/* HTTP with optional CONNECT proxy ---------------------------------------- */
function request(url, options = {}) {
    const { method = 'GET', body = null, headers = {}, timeout = TIMEOUT } = options
    return new Promise((resolve, reject) => {
        const u = new URL(url)
        const timer = setTimeout(() => finish(Error('timeout')), timeout)
        let done = false
        const finish = (err, value) => { if (done) return; done = true; clearTimeout(timer); err ? reject(err) : resolve(value) }
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

/* Minimal JSON-RPC + ABI decoding ----------------------------------------- */
async function ethCall(data) {
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: PBT, data }, 'latest'] })
    let last = 'rpc failed'
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const res = await request(RPC, { method: 'POST', body: payload, headers: { 'content-type': 'application/json' }, timeout: RPC_TIMEOUT })
            const json = JSON.parse(res.body.toString('utf8'))
            if (json.error) throw new Error(json.error.message || 'rpc error')
            return json.result
        } catch (e) {
            last = e.message || String(e)
            await new Promise(r => setTimeout(r, 400 * attempt))
        }
    }
    throw new Error(last)
}

const decodeString = hex => {
    const body = hex.slice(2)
    const length = parseInt(body.slice(64, 128), 16)
    return Buffer.from(body.slice(128, 128 + length * 2), 'hex').toString('utf8')
}
const tokenURI = id => ethCall('0xc87b56dd' + id.toString(16).padStart(64, '0')).then(decodeString)
const totalSupply = () => ethCall('0x18160ddd').then(v => parseInt(v, 16))
// ERC721Enumerable: token ids are handed out sequentially but burned ids leave holes,
// so the live set has to be enumerated instead of guessing 1..totalSupply.
const tokenByIndex = i => ethCall('0x4f6ccce7' + i.toString(16).padStart(64, '0')).then(v => parseInt(v, 16))

/* CAR ---------------------------------------------------------------------- */
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
    let i = 0
    let headerLen
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

async function fetchCar(pathname) {
    let last = 'no gateway'
    for (const base of CAR_GATEWAYS) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await request(base + pathname, { headers: { Accept: 'application/vnd.ipld.car' } })
                if (res.status !== 200) throw new Error('HTTP ' + res.status)
                return { bytes: rawFromCAR(res.body), via: base }
            } catch (e) {
                last = e.message || String(e)
                // The tunneled TLS handshake is flaky; a retry usually succeeds.
                await new Promise(r => setTimeout(r, 400 * attempt))
            }
        }
    }
    throw new Error('all CAR gateways failed: ' + last)
}

const ipfsPath = uri => uri.replace(/^ipfs:\/\//, '').replace(/^ipfs\//, '').replace(/^\//, '')

async function main() {
    const total = await totalSupply()
    console.log(`PBT total supply: ${total}`)
    const ids = new Array(total)
    let enumerated = 0
    await Promise.all(Array.from({ length: 8 }, async () => {
        for (;;) {
            const i = enumerated++
            if (i >= total) return
            ids[i] = await tokenByIndex(i)
            if ((i + 1) % 20 === 0) console.log(`  enumerated ${i + 1}/${total}`)
        }
    }))
    console.log(`live token ids: ${ids.length}`)

    const manifest = []
    const CONCURRENCY = 4
    let cursor = 0
    async function worker() {
        while (cursor < ids.length) {
            const id = ids[cursor++]
            await salvageOne(id)
        }
    }
    async function salvageOne(id) {
        try {
            const uri = await tokenURI(id)
            const meta = await fetchCar(ipfsPath(uri))
            const json = JSON.parse(meta.bytes.toString('utf8'))
            const dir = path.join(OUT, String(id))
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, 'metadata.json'), meta.bytes)

            let image = null
            if (json.image) {
                const img = await fetchCar(ipfsPath(json.image))
                const name = ipfsPath(json.image).split('/').pop() || 'image'
                fs.writeFileSync(path.join(dir, name), img.bytes)
                image = name
            }
            manifest.push({ id, tokenURI: uri, name: json.name || null, description: json.description || null, image, imageURI: json.image || null })
            console.log(`#${id} ok  ${json.name || ''}  image=${image || '-'}  ${meta.bytes.length}b`)
        } catch (e) {
            manifest.push({ id, error: e.message || String(e) })
            console.log(`#${id} FAIL ${e.message || e}`)
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
    manifest.sort((a, b) => a.id - b.id)
    fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
    const ok = manifest.filter(m => !m.error).length
    console.log(`\nsalvaged ${ok}/${ids.length} -> ${OUT}`)
    if (!ok) process.exitCode = 1
}

main().catch(e => { console.error(e); process.exitCode = 1 })
