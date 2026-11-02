const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.React}}).outputText,file);
const ipfs=require('../ipfs.ts'),{Media}=require('../media.tsx');

/* URI normalisation ------------------------------------------------------- */
assert.equal(ipfs.ipfsPath('ipfs://bafycid/meta.json'),'bafycid/meta.json');
assert.equal(ipfs.ipfsPath('ipfs://ipfs/bafycid/meta.json'),'bafycid/meta.json');
assert.equal(ipfs.ipfsPath('https://cf-ipfs.com/ipfs/bafycid/meta.json'),'bafycid/meta.json');
assert.equal(ipfs.ipfsPath('https://nft.storage/ipfs/bafycid/meta.json'),'bafycid/meta.json');
assert.equal(ipfs.ipfsPath('bafycidlongenoughcidvalue/meta.json'),'bafycidlongenoughcidvalue/meta.json');
assert.throws(()=>ipfs.ipfsPath('javascript:alert(1)'));
assert.throws(()=>ipfs.ipfsPath('ipfs://../etc/passwd'));
assert.throws(()=>ipfs.ipfsPath('ipfs://ipfs//etc/passwd'));
assert.equal(ipfs.isDirectURL('https://cdn.example.com/a.png'),true);
assert.equal(ipfs.isDirectURL('https://ipfs.io/ipfs/a'),false);
console.log('IPFS URI normalisation and input rejection passed');

/* CAR parsing ------------------------------------------------------------- */
const varint=n=>{const b=[];do{let x=n&0x7f;n>>>=7;if(n)x|=0x80;b.push(x)}while(n);return Buffer.from(b)};
const cidRaw=()=>Buffer.concat([Buffer.from([0x01,0x55,0x12,0x20]),Buffer.alloc(32,9)]);
function buildCAR(payload){
 const header=Buffer.concat([Buffer.from([0xa2,0x65,0x72,0x6f,0x6f,0x74,0x73,0x81]),cidRaw(),Buffer.from([0x76,0x65,0x72,0x73,0x69,0x6f,0x6e,0x01])]);
 const block=Buffer.concat([cidRaw(),payload]);
 return Buffer.concat([varint(header.length),header,varint(block.length),block]);
}
const payload=Buffer.from('{"name":"PBT","image":"ipfs://x/y.png"}');
const car=buildCAR(payload);
const blocks=ipfs.parseCAR(car.buffer.slice(car.byteOffset,car.byteOffset+car.byteLength));
assert.equal(blocks.length,1);
assert.equal(blocks[0].codec,0x55,'raw block expected');
assert.deepEqual(Buffer.from(ipfs.rawFromCAR(car.buffer.slice(car.byteOffset,car.byteOffset+car.byteLength))),payload);
assert.equal(ipfs.guessType('a/b/photo.png'),'image/png');
assert.equal(ipfs.guessType('a/b/metadata.json'),'application/json');
console.log('CAR archive parsing and raw block extraction passed');

/* Media placeholder ------------------------------------------------------ */
const empty=renderToStaticMarkup(React.createElement(Media,{uris:[],alt:'PBT',placeholder:'Image unavailable'}));
assert.ok(empty.includes('media-placeholder'),'placeholder expected when no candidate is left');
assert.ok(empty.includes('Image unavailable'));
const pending=renderToStaticMarkup(React.createElement(Media,{uris:['ipfs://bafycid/a.png'],alt:'PBT',placeholder:'Image unavailable',loading:'Loading image…'}));
assert.ok(pending.includes('media-placeholder'),'placeholder shown until the bytes arrive');
assert.ok(!pending.includes('<img'),'no image before the bytes arrive');
console.log('Media placeholder rendering passed');

/* Gateway chain ----------------------------------------------------------- */
const chain=ipfs.gateways();
assert.ok(chain.length>=2,'gateway chain should hold several entries');
assert.ok(chain.some(g=>g.mode==='car'),'a CAR capable gateway is required');
assert.ok(chain.every(g=>g.base.startsWith('https://')),'gateways must be https');
const carURLs=ipfs.carURLs('bafycid/meta.json');
assert.ok(carURLs.every(u=>u.endsWith('/ipfs/bafycid/meta.json')));
console.log('Gateway chain configuration passed');

/* Bundled cache: complete assets, local-first, miss/failure fallback. */
(async()=>{
 const index=require('../shared/ipfs-cache.json');
 assert.equal(Object.keys(index).length,158);
 for(const [key,file] of Object.entries(index)){
  const bytes=fs.readFileSync(require('node:path').join(__dirname,'../public',file));
  assert.ok(bytes.length>0,key);
  if(key.endsWith('.json'))JSON.parse(bytes.toString());
  else assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 }
 const originalFetch=global.fetch,originalDocument=global.document;
 global.document={baseURI:'https://example.com/project/'};
 const key=Object.keys(index).find(k=>k.endsWith('.json'));
 const local='https://example.com/project/'+index[key];
 const bytes=fs.readFileSync(require('node:path').join(__dirname,'../public',index[key]));
 try{
  let calls=[];
  global.fetch=async url=>{calls.push(url);return new Response(bytes,{headers:{'content-type':'application/json'}})};
  const result=await ipfs.fetchIPFS('ipfs://'+key,new AbortController().signal);
  assert.deepEqual(calls,[local]);assert.deepEqual(Buffer.from(result.bytes),bytes);
  for(const mode of ['404','html','miss']){
   calls=[];
   global.fetch=async url=>{
    calls.push(url);
    if(url===local)return mode==='404'?new Response('',{status:404}):new Response('<html>',{headers:{'content-type':'text/html'}});
    return new Response(bytes,{headers:{'content-type':'application/json'}});
   };
   const uri=mode==='miss'?'ipfs://bafyunknowncachecidvalue/metadata.json':'ipfs://'+key;
   await ipfs.fetchIPFS(uri,new AbortController().signal);
   assert.ok(calls.some(u=>u.startsWith('https://gateway.pinata.cloud/')));
   if(mode==='miss')assert.ok(calls.every(u=>!u.startsWith('https://example.com/')));
   else assert.equal(calls[0],local);
  }
 }finally{global.fetch=originalFetch;global.document=originalDocument}
 console.log('Bundled IPFS cache assets, local-first reads, and network fallbacks passed');
})().catch(error=>{console.error(error);process.exitCode=1});
