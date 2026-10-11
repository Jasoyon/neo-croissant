import type { Api } from '@lichess-org/chessground/api';
import type { Key, Piece } from '@lichess-org/chessground/types';
export type MoveEffect={from:Key;to:Key;color:'white'|'black';userDrop:boolean;captured?:{square:Key;piece:Piece};rook?:{from:Key;to:Key};promotion?:boolean;check?:Key};
export function createEffects(api:Api,host:HTMLElement){
 const nodes=new Set<HTMLElement>(),timers=new Set<ReturnType<typeof setTimeout>>();
 const pieceMotions=new Map<string,{kind:'turn'|'check'|'promote';start:number;duration:number;dx?:number}>();
 const enabled=()=>api.state.animation.enabled&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function later(fn:()=>void,ms:number){const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id)}
 function remove(node:HTMLElement){node.remove();nodes.delete(node)}
 function square(key:Key,cls:string,life?:number){
  const flip=api.state.orientation==='black',x=key.charCodeAt(0)-97,y=8-Number(key[1]);
  const node=document.createElement('div');node.className=`motion-vfx ${cls}`;node.setAttribute('aria-hidden','true');node.dataset.square=key;
  Object.assign(node.style,{left:`${(flip?7-x:x)*12.5}%`,top:`${(flip?7-y:y)*12.5}%`});host.append(node);nodes.add(node);
  if(life)later(()=>remove(node),life+40);return node;
 }
 function ring(to:Key){const n=square(to,'vfx-growing-circle',400),circle=document.createElement('div');circle.className='growing-circle';const dark=(to.charCodeAt(0)-96+Number(to[1]))%2===0;circle.style.setProperty('--growing-circle-color',dark?'#fff':'#000000');circle.style.setProperty('--growing-circle-initial-opacity',dark?'.25':'.07');n.append(circle)}
 function beam(from:Key,to:Key,color:string){
  const n=square(from,'vfx-piece-trail',api.state.animation.duration+300),b=document.createElement('div');b.className='trail-segment animating';
  const dx=to.charCodeAt(0)-from.charCodeAt(0),dy=Number(from[1])-Number(to[1]);
  b.style.setProperty('--piece-move-duration',`${api.state.animation.duration}ms`);b.style.setProperty('--trail-width',`${Math.hypot(dx,dy)*100}%`);b.style.setProperty('--rotation',`${Math.atan2(dy,dx)+(api.state.orientation==='black'?Math.PI:0)}rad`);
  b.style.background=`linear-gradient(to right,${color}00 0%,${color}10 50%,${color}52 100%)`;n.append(b);
 }
 function clear(){for(const id of timers)clearTimeout(id);timers.clear();for(const n of nodes)n.remove();nodes.clear();pieceMotions.clear()}
 function check(key?:Key){
  for(const n of [...nodes])if(n.classList.contains('vfx-king-check-square'))remove(n);
  for(const [k,m] of pieceMotions)if(m.kind==='check')pieceMotions.delete(k);
  if(!key||!enabled())return;
  const n=square(key,'vfx-king-check-square'),sq=document.createElement('div'),overlay=document.createElement('div');sq.className='square';overlay.className='color-overlay';
  const dark=(key.charCodeAt(0)-96+Number(key[1]))%2===0;sq.style.backgroundColor=dark?'#769656':'#eeeed2';sq.style.backgroundImage='var(--board-image)';sq.style.backgroundSize='800%';sq.style.backgroundPosition=`${(key.charCodeAt(0)-97)/7*100}% ${(8-Number(key[1]))/7*100}%`;sq.append(overlay);n.append(sq);
  pieceMotions.set(key,{kind:'check',start:performance.now(),duration:1300});
 }
 function promote(key:Key){if(!enabled())return;pieceMotions.set(key,{kind:'promote',start:performance.now(),duration:200});const n=square(key,'vfx-promote-ripple',350);for(const name of ['circle-out-cubic','circle-in-out-back']){const c=document.createElement('div');c.className=`circle ${name}`;n.append(c)}}
 function reject(key:Key){if(!enabled())return;const n=square(key,'vfx-illegal-move-tap',700);for(const cls of ['illegal-move-tap-overlay','illegal-move-tap-circle']){const c=document.createElement('div');c.className=cls;n.append(c)}}
 function move(m:MoveEffect){clear();if(!enabled())return;
  const now=performance.now(),duration=api.state.animation.duration;
  if(m.captured){const n=square(m.captured.square,'vfx-piece-capture',400),piece=document.createElement('div');piece.className=`element ${m.captured.piece.color} ${m.captured.piece.role}`;n.append(piece)}
  for(const pair of [{from:m.from,to:m.to},...(m.rook?[m.rook]:[])]){
   ring(pair.to);
   if(!m.userDrop){beam(pair.from,pair.to,m.color==='white'?'#f0f0f0':'#404040');pieceMotions.set(pair.to,{kind:'turn',start:now,duration:duration*1.5,dx:pair.to.charCodeAt(0)-pair.from.charCodeAt(0)})}
  }
  if(m.promotion)promote(m.to);
  if(m.check)later(()=>check(m.check),duration);
 }
 return {move,clear,check,promote,reject,pieceMotions,enabled};
}
