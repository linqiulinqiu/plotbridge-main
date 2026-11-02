const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.React}}).outputText,file);
const Market=require('../react-app/Market.tsx').default,original=React.useState;
const session={config:{ctr_addrs:{}}},old={id:'9007199254740993'};
function render(snapshot,tab){let index=0;React.useState=initial=>{const i=index++;return [i===0?snapshot:i===3?tab:typeof initial==='function'?initial():initial,()=>{}]};try{return renderToStaticMarkup(React.createElement(Market,{session,en:true,run:async()=>{},busy:false,revision:1}))}finally{React.useState=original}}
const owned={session,tab:'owned',revision:1,items:[old]};
assert.ok(render(owned,'owned').includes('9007199254740993'));
for(const tab of ['market','mine']){const html=render(owned,tab);assert.ok(!html.includes('9007199254740993'));assert.ok(!html.includes('>Buy<'))}
assert.ok(render({session,tab:'market',revision:1,items:[old]},'market').includes('Listing unavailable'));
assert.ok(!render({...owned,session:{}},'owned').includes('9007199254740993'));
console.log('Market rendering regression passed: tab switch, missing sale, stale account snapshot');
