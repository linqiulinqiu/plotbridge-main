import React,{useEffect,useRef,useState} from 'react';

/* Icons ------------------------------------------------------------------ */
type IconProps={className?:string};
const svg=(path:React.ReactNode,extra?:string)=>(props:IconProps)=>(
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{path}{extra}</svg>
);
export const IconCopy=svg(<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></>);
export const IconCheck=svg(<path d="M20 6 9 17l-5-5"/>);
export const IconExternal=svg(<><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>);
export const IconSun=svg(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>);
export const IconMoon=svg(<path d="M21 13.2A8.6 8.6 0 1 1 10.8 3a6.8 6.8 0 0 0 10.2 10.2Z"/>);
export const IconGlobe=svg(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></>);
export const IconWallet=svg(<><path d="M20 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/><path d="M17 13h.01"/></>);
export const IconMenu=svg(<><path d="M3 6h18M3 12h18M3 18h18"/></>);
export const IconClose=svg(<><path d="M18 6 6 18M6 6l12 12"/></>);
export const IconAlert=svg(<><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></>);
export const IconInfo=svg(<><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></>);
export const IconCheckCircle=svg(<><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/></>);
export const IconBox=svg(<><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>);
export const IconRefresh=svg(<><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/></>);
export const IconChevron=svg(<path d="m9 6 6 6-6 6"/>);
export const IconSparkle=svg(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8.5 13.4 11 16 12l-2.6 1L12 15.5 10.6 13 8 12l2.6-1L12 8.5Z"/></>);

/* Button ----------------------------------------------------------------- */
export type ButtonVariant='primary'|'secondary'|'ghost'|'danger';
export function Button({variant='secondary',size,block,loading,icon,children,className='',disabled,...rest}:{
 variant?:ButtonVariant;size?:'sm'|'lg';block?:boolean;loading?:boolean;icon?:React.ReactNode;children?:React.ReactNode;
}&React.ButtonHTMLAttributes<HTMLButtonElement>){
 const cls=['btn',`btn--${variant}`,size?`btn--${size}`:'',block?'btn--block':'',className].filter(Boolean).join(' ');
 return <button type="button" className={cls} disabled={disabled||loading} {...rest}>{loading?<span className="btn__spinner"/>:icon}{children}</button>;
}

/* Card ------------------------------------------------------------------- */
export function Card({title,sub,actions,children,className='',flush,pad}:{title?:React.ReactNode;sub?:React.ReactNode;actions?:React.ReactNode;children?:React.ReactNode;className?:string;flush?:boolean;pad?:boolean}){
 const head=title||sub||actions;
 return <section className={'card '+(head?'card--flush':pad===false?'':'card--pad')+' '+className}>
  {head&&<header className="card__head"><div><div className="card__title">{title}</div>{sub&&<div className="card__sub">{sub}</div>}</div>{actions}</header>}
  {head?<div className="card__body">{children}</div>:children}
 </section>;
}

/* Page header ------------------------------------------------------------ */
export function PageHead({eyebrow,title,desc,actions}:{eyebrow?:React.ReactNode;title:React.ReactNode;desc?:React.ReactNode;actions?:React.ReactNode}){
 return <header className="page-head">
  {eyebrow&&<p className="eyebrow">{eyebrow}</p>}
  <h1 className="page-head__title">{title}</h1>
  {desc&&<p className="page-head__desc">{desc}</p>}
  {actions&&<div className="page-head__actions">{actions}</div>}
 </header>;
}

/* Steps ------------------------------------------------------------------ */
export function Steps({items,active}:{items:string[];active:number}){
 return <ol className="steps">{items.map((label,i)=>{
  const state=i<active?'step--done':i===active?'step--active':'';
  return <li key={label} className={'step '+state}><span className="step__index">{i<active?'✓':i+1}</span>{label}</li>;
 })}</ol>;
}

/* Segmented control ------------------------------------------------------ */
export function Segmented<T extends string>({value,options,onChange}:{value:T;options:{value:T;label:string}[];onChange:(v:T)=>void}){
 return <div className="seg" role="group">{options.map(o=>
  <button key={o.value} type="button" className="seg__item" aria-pressed={value===o.value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>;
}

/* Field ------------------------------------------------------------------ */
export function Field({label,hint,error,children,action}:{label?:React.ReactNode;hint?:React.ReactNode;error?:React.ReactNode;children:React.ReactNode;action?:React.ReactNode}){
 return <div className="field">
  {label&&<div className="field__label"><span>{label}</span>{action}</div>}
  {children}
  {error?<p className="field__error">{error}</p>:hint?<p className="field__hint">{hint}</p>:null}
 </div>;
}

/* Copy field ------------------------------------------------------------- */
export function CopyField({value,placeholder,label,onError}:{value?:string;placeholder?:string;label?:string;onError?:(m:string)=>void}){
 const [copied,setCopied]=useState(false);
 const shown=value||'';
 async function copy(){
  if(!shown)return;
  try{await navigator.clipboard.writeText(shown);setCopied(true);setTimeout(()=>setCopied(false),1600)}
  catch(e:any){onError?onError(e.message):void 0}
 }
 return <div className="copy-field">
  <span className={'copy-field__value'+(shown?'':' copy-field__value--empty')} title={shown||placeholder}>{shown||placeholder}</span>
  <Button size="sm" variant="secondary" icon={copied?<IconCheck/>:<IconCopy/>} onClick={copy} disabled={!shown} aria-label={label||'copy'}>{copied?(label?'Copied':'已复制'):(label?'Copy':'复制')}</Button>
 </div>;
}

/* Stats ------------------------------------------------------------------ */
export function Stat({label,value,hint,small}:{label:React.ReactNode;value:React.ReactNode;hint?:React.ReactNode;small?:boolean}){
 return <div className="stat"><span className="stat__label">{label}</span><span className={'stat__value'+(small?' stat__value--sm':'')}>{value}</span>{hint&&<span className="stat__hint">{hint}</span>}</div>;
}

/* Badge ------------------------------------------------------------------ */
export function Badge({tone='new',children}:{tone?:'ready'|'partial'|'new'|'unknown'|'brand'|'danger'|'info';children:React.ReactNode}){
 return <span className={'badge badge--'+tone}>{children}</span>;
}

/* Alert ------------------------------------------------------------------ */
export function Alert({tone='info',title,children}:{tone?:'info'|'warning'|'danger'|'success';title?:React.ReactNode;children?:React.ReactNode}){
 const Icon=tone==='danger'||tone==='warning'?IconAlert:tone==='success'?IconCheckCircle:IconInfo;
 return <div className={'alert alert--'+tone} role={tone==='danger'?'alert':undefined}>
  <Icon className="alert__icon"/><div className="alert__body">{title&&<div className="alert__title">{title}</div>}{children}</div>
 </div>;
}

/* Empty state ------------------------------------------------------------ */
export function EmptyState({icon,title,text,action}:{icon?:React.ReactNode;title:React.ReactNode;text?:React.ReactNode;action?:React.ReactNode}){
 return <div className="empty"><span className="empty__icon">{icon||<IconBox/>}</span><span className="empty__title">{title}</span>{text&&<p className="empty__text">{text}</p>}{action}</div>;
}

/* Skeleton --------------------------------------------------------------- */
export function Skeleton({variant='text',style}:{variant?:'text'|'title'|'card';style?:React.CSSProperties}){
 return <div className={'skeleton skeleton--'+variant} style={style}/>;
}

/* Modal ------------------------------------------------------------------ */
export function Modal({open,onClose,title,subtitle,children,footer,wide}:{open:boolean;onClose:()=>void;title:React.ReactNode;subtitle?:React.ReactNode;children?:React.ReactNode;footer?:React.ReactNode;wide?:boolean}){
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};
  document.addEventListener('keydown',onKey);
  const prev=document.body.style.overflow;
  document.body.style.overflow='hidden';
  panel.current?.focus();
  return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=prev};
 },[open,onClose]);
 if(!open)return null;
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className={'modal'+(wide?' modal--wide':'')} role="dialog" aria-modal="true" aria-label={typeof title==='string'?title:undefined} ref={panel} tabIndex={-1}>
   <header className="modal__head">
    <div><div className="modal__title">{title}</div>{subtitle&&<p className="modal__sub">{subtitle}</p>}</div>
    <button type="button" className="icon-btn" onClick={onClose} aria-label="close"><IconClose/></button>
   </header>
   <div className="modal__body">{children}</div>
   {footer&&<footer className="modal__foot">{footer}</footer>}
  </div>
 </div>;
}
