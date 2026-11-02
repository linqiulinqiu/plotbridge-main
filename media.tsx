import React,{useEffect,useRef,useState} from 'react';
import {fetchIPFS} from './ipfs';

/* Media ------------------------------------------------------------------
 * IPFS assets cannot be handed to <img src> directly any more: the surviving public
 * gateways answer with a CAR archive, so the bytes are fetched and parsed first and
 * handed over as an object URL. The fetch is deferred until the card scrolls near
 * the viewport, which keeps long market lists cheap.
 */
export function Media({uris,alt,className='',placeholder,loading,onExhausted}:{
 uris:string[];alt:string;className?:string;placeholder?:React.ReactNode;loading?:React.ReactNode;onExhausted?:()=>void;
}){
 const [src,setSrc]=useState<string>(),[state,setState]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 const key=(uris||[]).join('|');
 const cb=useRef(onExhausted);cb.current=onExhausted;
 const box=useRef<HTMLSpanElement>(null);

 useEffect(()=>{
  let active=true,objectUrl='';
  const controller=new AbortController();
  setSrc(undefined);setState('idle');
  const list=uris||[];
  if(!list.length){setState('error');cb.current?.();return()=>{controller.abort()}}
  const load=async()=>{
   setState('loading');
   for(const uri of list){
    try{
     const {bytes,contentType}=await fetchIPFS(uri,controller.signal);
     if(!active)return;
     objectUrl=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:contentType}));
     setSrc(objectUrl);setState('ready');return;
    }catch(e){if(controller.signal.aborted)return}
   }
   if(active){setState('error');cb.current?.()}
  };
  const el=box.current;
  if(el&&typeof IntersectionObserver!=='undefined'){
   const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();load()}},{rootMargin:'250px'});
   io.observe(el);
   return()=>{io.disconnect();controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
  }
  load();
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[key]);

 if(state==='ready'&&src)return <img className={className} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer"/>;
 return <span ref={box} className="media-placeholder">{state==='error'?placeholder:(loading||placeholder)}</span>;
}
