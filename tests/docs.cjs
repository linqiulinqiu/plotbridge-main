const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.React}}).outputText,file);
const {assets,policy}=require('../bridge.ts'),{lockedValue}=require('../tvl.ts'),{docPage}=require('../Docs.tsx');
const coins=require('../shared/coins.json');
const zhText=require('../shared/locales/zh.json'),enText=require('../shared/locales/en.json');

// User visible text must stay in sync between zh and en.
assert.deepEqual(Object.keys(zhText).sort(),Object.keys(enText).sort(),'zh and en locale keys must match');
for(const key of Object.keys(zhText))assert.ok(String(enText[key]).length>0,'empty en text for '+key);
console.log('Locale sync passed: zh and en share the same '+Object.keys(zhText).length+' keys');

// Coin policy has one source: shared/coins.json.
assert.deepEqual(assets.map(a=>a.symbol),['WXCH','WHDD','WXCC','WXFX']);
assert.deepEqual(assets.map(a=>a.id),[1,2,3,5]);
assert.equal(policy('WXCH').bridge,true);
for(const symbol of ['WHDD','WXCC','WXFX']){assert.equal(policy(symbol).bridge,false);assert.equal(policy(symbol).withdrawOnly,true)}
assert.equal(policy('WXVM'),assets[0],'unknown symbols fall back to the first asset');
assert.equal(assets.every(a=>coins.some(c=>c.bsymbol===a.symbol)),true);
console.log('Coin policy checks passed: single source, deposit only for WXCH, withdraw-only for the rest');

// TVL pricing: BNB price from the BNB/USDT pair, PBP price from BNB/PBP, doubled liquidity plus staked PBP.
const rows=[{t0:10,t1:100000,pbp:true},{t0:5,t1:50000,pbp:true},{t0:1,t1:10000,pbp:true},{t0:20,t1:600,t1b:0,pbp:false}];
rows[3]={t0:20,t1:600,pbp:false};
const bnbPrice=600/20,pbpPrice=(10/100000)*bnbPrice,pbpAmount=100000+50000+10000;
assert.equal(Math.trunc(pbpPrice*pbpAmount*2+1000*pbpPrice),lockedValue(rows,1000));
assert.equal(lockedValue(rows,1000),Math.trunc(pbpPrice*pbpAmount*2+1000*pbpPrice));
assert.throws(()=>lockedValue([{t0:0,t1:0,pbp:true},{t0:0,t1:0,pbp:false}],0));
console.log('TVL pricing matches the Vue formula and rejects empty liquidity');

// Documentation routes: new paths and the legacy Vue hash paths.
assert.equal(docPage('#/doc'),'overview');
assert.equal(docPage('#/doc/introduction'),'introduction');
assert.equal(docPage('#/doc/activities'),'activities');
assert.equal(docPage('#/doc/bridge'),'bridge');
assert.equal(docPage('#/doc/market'),'market');
assert.equal(docPage('#/doc/wallet'),'wallet');
assert.equal(docPage('#/doc/contact'),'contact');
assert.equal(docPage('#/doc/roadmap'),'roadmap');
assert.equal(docPage('#/Doc/Introduction'),'introduction');
assert.equal(docPage('#/Doc/Activities'),'activities');
assert.equal(docPage('#/Doc/GuideforBridge'),'bridge');
assert.equal(docPage('#/Doc/GuideforMarket'),'market');
assert.equal(docPage('#/Doc/GuideforWallet'),'wallet');
assert.equal(docPage('#/Doc/contact'),'contact');
assert.equal(docPage('#/Doc/RoadMap'),'roadmap');
console.log('Documentation routes passed: current and legacy Vue hash paths resolve');

// Documentation pages render the locale content of the Vue site.
const Docs=require('../Docs.tsx').default;
const session={config:{ctr_addrs:{wxch:'0x'+'11'.repeat(20)}}};
global.location={hash:'#/doc/overview',pathname:'/'};
function render(hash){location.hash=hash;return renderToStaticMarkup(React.createElement(Docs,{session,en:true,run:async()=>{},busy:false,revision:1})).replace(/<!-- -->/g,'')}
const intro=render('#/doc/introduction');
assert.ok(intro.includes('PlotBridge is a gateway/bridge'),'introduction body missing');
assert.ok(intro.includes('Chia (XCH)'),'coin list missing');
assert.ok(intro.includes('bscscan.com/token/0x1111111111111111111111111111111111111111'),'coin link missing');
const contact=render('#/doc/contact');
assert.ok(contact.includes('discord.com'),'contact link missing');
const bridge=render('#/doc/bridge');
assert.ok(bridge.includes('guidesub/towxcc'),'bridge guide link missing');
const wallet=render('#/doc/wallet');
assert.ok(wallet.includes('MetaMask'),'wallet guide missing');
console.log('Documentation rendering passed: introduction, coin list, contact and guide links');

// Token page keeps the issuance schedule and the buyback/burn table from the Vue site.
const Token=require('../Token.tsx').default;
location.hash='#/token';
const tokenHtml=renderToStaticMarkup(React.createElement(Token,{en:true,run:async()=>{},busy:false,revision:1})).replace(/<!-- -->/g,'');
assert.ok(tokenHtml.includes('2022-05-06'),'issuance schedule missing');
assert.ok(tokenHtml.includes('Buy back and Burned'),'burn table missing');
console.log('Token page passed: issuance schedule and buyback/burn table');
