import ipfsConfig from './shared/ipfs.json';

/* IPFS access layer.
 *
 * Public gateways keep changing shape: hosts die, pin services sunset, and several
 * major gateways now answer only through a service worker (a top-level navigation
 * works, a cross-origin fetch does not). shared/ipfs.json is the single place where
 * the gateway chain lives; tools/ipfs-gateway-check.js probes it.
 *
 * Two gateway flavours are supported:
 *  - 'plain': the gateway returns the file bytes directly.
 *  - 'car'  : the gateway returns a CAR archive (application/vnd.ipld.car); the raw
 *              block is extracted locally. This is what the IPFS "public good"
 *              gateways serve today, and it works from a plain cross-origin fetch.
 */

export type GatewayMode = 'plain' | 'car';
export type Gateway = { base: string; mode: GatewayMode };
type GatewaySpec = { base: string; mode?: GatewayMode } | string;
type IpfsConfig = { selfHosted?: string; gateways?: GatewaySpec[]; subdomainHosts?: string[] };

const ipfs = ipfsConfig as IpfsConfig;

// Hosts that serve /ipfs/ paths; used to migrate legacy metadata URLs onto the chain.
export const legacyHosts = ['cf-ipfs.com', 'cloudflare-ipfs.com', 'dweb.link', 'ipfs.io', 'nftstorage.link', 'nft.storage', 'api.nft.storage', 'infura-ipfs.io', 'inbrowser.link', 'ipfs.inbrowser.link', '4everland.io', 'gateway.4everland.io', 'ipfs.4everland.io', 'ipfs.mypinata.cloud', 'gateway.storacha.io', 'ipfs.storacha.io', 'ipfs.lain.la'];

const withSlash = (u: string) => u.endsWith('/') ? u : u + '/';
const GATEWAY_TIMEOUT = 8000;
const CAR_CONTENT_TYPE = 'application/vnd.ipld.car';

export function gateways(): Gateway[] {
  const out: Gateway[] = [];
  const add = (base: string, mode: GatewayMode) => {
    if (base && !out.some(g => g.base === withSlash(base))) out.push({ base: withSlash(base), mode });
  };
  if (ipfs.selfHosted) add(ipfs.selfHosted, 'plain');
  for (const g of ipfs.gateways || []) {
    if (typeof g === 'string') add(g, 'plain');
    else add(g.base, g.mode || 'plain');
  }
  return out;
}

/* URI normalisation ------------------------------------------------------- */

// 'ipfs://<cid>/<path>' or 'https://<legacy gateway>/ipfs/<cid>/<path>' -> '<cid>/<path>'
export function ipfsPath(uri: string): string {
  if (!uri) throw Error('Empty IPFS URI');
  let path: string | undefined;
  if (uri.startsWith('ipfs://')) path = uri.slice(7).replace(/^ipfs\//, '');
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(uri) && /^[a-z0-9]{20,}$/i.test(uri.split('/')[0])) path = uri;
  else {
    const url = new URL(uri);
    if (url.protocol !== 'https:') throw Error('Unsupported metadata URL');
    if (legacyHosts.includes(url.hostname) && url.pathname.startsWith('/ipfs/')) path = url.pathname.slice(6) + url.search;
    else throw Error('Not an IPFS URI');
  }
  if (!path || path.startsWith('/') || path.includes('..')) throw Error('Invalid IPFS path');
  return path;
}

// True when the URI points at a plain HTTPS asset that is not behind an IPFS gateway.
export function isDirectURL(uri: string): boolean {
  if (!/^https:\/\//i.test(uri)) return false;
  try { const url = new URL(uri); return !legacyHosts.includes(url.hostname) && !url.pathname.startsWith('/ipfs/'); }
  catch { return false; }
}

export function plainURLs(path: string): string[] {
  const out: string[] = [];
  for (const g of gateways()) {
    if (g.mode !== 'plain') continue;
    const u = g.base + path;
    if (!out.includes(u)) out.push(u);
  }
  const [cid, ...rest] = path.split('/');
  for (const host of ipfs.subdomainHosts || []) {
    const u = 'https://' + cid + '.ipfs.' + host + '/' + rest.join('/');
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

export function carURLs(path: string): string[] {
  const out: string[] = [];
  for (const g of gateways()) {
    if (g.mode !== 'car') continue;
    const u = g.base + path;
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

/* CAR parsing -------------------------------------------------------------- */

export type CarBlock = { codec: number; data: Uint8Array };

// CAR v1: varint header length + dag-cbor header, then repeated varint length + CID + block.
export function parseCAR(buffer: ArrayBuffer): CarBlock[] {
  const dv = new DataView(buffer);
  const varintAt = (pos: number): [number, number] => {
    let x = 0, shift = 0, p = pos;
    for (;;) {
      const c = dv.getUint8(p++);
      x += (c & 0x7f) * Math.pow(2, shift);
      if (!(c & 0x80)) return [x, p];
      shift += 7;
    }
  };
  let i = 0, headerLen: number;
  [headerLen, i] = varintAt(i);
  i += headerLen;
  const blocks: CarBlock[] = [];
  while (i < buffer.byteLength) {
    let len: number;
    [len, i] = varintAt(i);
    const end = i + len;
    let codec = 0x55;
    if (i < end && dv.getUint8(i) === 0x01) { i++; [codec, i] = varintAt(i); }
    let mhCode: number, mhLen: number;
    [mhCode, i] = varintAt(i);
    [mhLen, i] = varintAt(i);
    i += mhLen;
    blocks.push({ codec, data: new Uint8Array(buffer.slice(i, end)) });
    i = end;
  }
  return blocks;
}

// The file payload lives in the raw (0x55) block; dag-pb/dag-cbor blocks are structure.
export function rawFromCAR(buffer: ArrayBuffer): Uint8Array {
  const blocks = parseCAR(buffer);
  const raw = blocks.filter(b => b.codec === 0x55);
  if (!raw.length) throw Error('CAR archive holds no raw block');
  if (raw.length === 1) return raw[0].data;
  const total = raw.reduce((n, b) => n + b.data.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const b of raw) { out.set(b.data, at); at += b.data.length; }
  return out;
}

/* Fetching ----------------------------------------------------------------- */

export type IpfsBytes = { bytes: Uint8Array; contentType: string; via: string };

const MIME: Record<string, string> = {
  json: 'application/json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', avif: 'image/avif',
  mp4: 'video/mp4', mp3: 'audio/mpeg', txt: 'text/plain', html: 'text/html'
};

export function guessType(path: string): string {
  const ext = path.split('?')[0].split('.').pop()?.toLowerCase() || '';
  return MIME[ext] || 'application/octet-stream';
}

function isCAR(contentType: string, bytes: Uint8Array): boolean {
  if (contentType.includes('car')) return true;
  // A CAR starts with a varint header length followed by a dag-cbor map ("er" of "roots").
  return bytes.length > 4 && bytes[1] === 0xa2 && bytes[2] === 0x65;
}

async function readBytes(response: Response): Promise<Uint8Array> {
  return new Uint8Array(await response.arrayBuffer());
}

/* Downloads an IPFS path. Every gateway is tried in parallel and the first healthy
 * one wins, so a single dead provider never blocks the page. */
export async function fetchIPFS(uri: string, signal: AbortSignal): Promise<IpfsBytes> {
  if (isDirectURL(uri)) {
    const response = await fetch(uri, { signal: AbortSignal.any([signal, AbortSignal.timeout(GATEWAY_TIMEOUT)]) });
    if (!response.ok) throw Error('HTTP ' + response.status);
    return { bytes: await readBytes(response), contentType: response.headers.get('content-type') || guessType(uri), via: uri };
  }
  const path = ipfsPath(uri);
  const targets: { url: string; mode: GatewayMode }[] = [];
  for (const g of gateways()) targets.push({ url: g.base + path, mode: g.mode });
  for (const u of plainURLs(path)) if (!targets.some(t => t.url === u)) targets.push({ url: u, mode: 'plain' });
  for (const u of carURLs(path)) if (!targets.some(t => t.url === u)) targets.push({ url: u, mode: 'car' });
  if (!targets.length) throw Error('Metadata unavailable (no gateway candidate)');

  const inner = new AbortController();
  const onAbort = () => inner.abort();
  if (signal.aborted) inner.abort(); else signal.addEventListener('abort', onAbort, { once: true });
  let pending = targets.length, last = 'no candidate';

  return new Promise<IpfsBytes>((resolve, reject) => {
    const fail = (msg: string) => { last = msg; if (--pending === 0) reject(Error('IPFS fetch failed (' + last + ')')); };
    for (const target of targets) {
      (async () => {
        try {
          // CAR gateways refuse the request unless the archive format is asked for.
          const accept = target.mode === 'car' ? 'application/vnd.ipld.car' : '*/*';
          const response = await fetch(target.url, { headers: { Accept: accept }, signal: AbortSignal.any([signal, inner.signal, AbortSignal.timeout(GATEWAY_TIMEOUT)]) });
          if (!response.ok) throw Error('HTTP ' + response.status);
          const contentType = response.headers.get('content-type') || '';
          const bytes = await readBytes(response);
          if (target.mode === 'car' || isCAR(contentType, bytes)) {
            if (!isCAR(contentType, bytes)) throw Error('not a CAR archive');
            resolve({ bytes: rawFromCAR(bytes.buffer as ArrayBuffer), contentType: guessType(path), via: target.url });
          } else {
            if (/text\/html/i.test(contentType)) throw Error('HTML bootstrap instead of content');
            resolve({ bytes, contentType: contentType || guessType(path), via: target.url });
          }
          inner.abort();
        } catch (e: any) {
          if (signal.aborted) { fail('aborted'); return; }
          fail(e.message || String(e));
        }
      })();
    }
  });
}
