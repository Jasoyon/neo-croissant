import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import type { Key, Piece, Pieces } from '@lichess-org/chessground/types';
import { installDynamicMotion } from './dynamicMotion';
import type { MoveEffect } from './effects';
const same=(a?:Piece,b?:Piece)=>a?.role===b?.role&&a?.color===b?.color;

// Infer a single displayed move only. Large position jumps and editing never
// masquerade as captures. This also handles puzzles and history navigation.
export function transition(before:Pieces,after:Pieces,hint:Key[]|undefined,userDrop:boolean):MoveEffect|undefined{
 const removed=[...before].filter(([k,p])=>!same(p,after.get(k)));
 const added=[...after].filter(([k,p])=>!same(p,before.get(k)));
 if(!removed.length||!added.length||removed.length+added.length>4)return;
 let pair:{from:Key;to:Key;piece:Piece}|undefined;
 for(const [to,piece] of added){for(const [from,old] of removed){if(from===to||old.color!==piece.color||!(old.role===piece.role||(old.role==='pawn'&&['1','8'].includes(to[1]))))continue;
  const candidate={from,to,piece:old};
  if(!pair||old.role==='king'||(hint?.[0]===from&&hint?.[1]===to))pair=candidate;
 }}
 if(!pair)return;
 const {from,to,piece}=pair;
 let rook:MoveEffect['rook'];
 if(piece.role==='king'){
  const r0=removed.find(([,p])=>p.color===piece.color&&p.role==='rook');
  const r1=added.find(([,p])=>p.color===piece.color&&p.role==='rook');
  if(r0&&r1)rook={from:r0[0],to:r1[0]};
 }
 // Reject multi-piece edits; one mover plus one capture or castling is allowed.
 if(added.filter(([,p])=>p.color===piece.color).length>(rook?2:1))return;
 const captured=removed.find(([k,p])=>k!==from&&p.color!==piece.color&&!after.has(k));
 const onTarget=before.get(to);
 return {from,to,color:piece.color,userDrop,rook,
  captured:onTarget&&onTarget.color!==piece.color?{square:to,piece:onTarget}:captured?{square:captured[0],piece:captured[1]}:undefined,
  promotion:piece.role==='pawn'&&after.get(to)?.role!=='pawn'};
}
export function installAppMotion(api:Api,host:HTMLElement){
 const motion=installDynamicMotion(api,host),originalSet=api.set;
 let before=new Map(api.state.pieces),lastDrop=false,check=api.state.check,stopped=false,checkTimer:ReturnType<typeof setTimeout>|undefined;
 let upstreamMove=api.state.events.move;
 function sync(){
  const after=new Map(api.state.pieces),changed=before.size!==after.size||[...before].some(([k,p])=>!same(p,after.get(k)));
  if(changed){
   clearTimeout(checkTimer);
   const effect=transition(before,after,api.state.lastMove,lastDrop);
   if(effect)motion.move(effect);
   else{
    motion.clear();
    const promotions=[...after].filter(([k,p])=>before.get(k)?.role==='pawn'&&p.role!=='pawn'&&p.color===before.get(k)?.color);
    if(promotions.length===1)motion.promote(promotions[0][0]);
   }
   before=after;lastDrop=false;
  }
  if(changed||check!==api.state.check){check=api.state.check;clearTimeout(checkTimer);if(check){const key=check;checkTimer=setTimeout(()=>{if(!stopped)motion.check(key)},api.state.animation.duration)}else motion.check(undefined)}
 }
 const wrappedMove:NonNullable<typeof upstreamMove>=(...args)=>{if(!stopped)sync();upstreamMove?.(...args)};
 api.state.events.move=wrappedMove;
 api.set=(config:Config)=>{
  if(config.events?.move&&config.events.move!==wrappedMove)upstreamMove=config.events.move;
  if(config.orientation&&config.orientation!==api.state.orientation)motion.clear();
  originalSet({...config,events:{...config.events,move:wrappedMove}});sync();
 };
 const end=(e:MouseEvent|TouchEvent)=>{
  const current=api.state.draggable.current;
  if(!current)return;
  const point='changedTouches' in e?e.changedTouches[0]:e;
  const to=point?api.getKeyAtDomPos([point.clientX,point.clientY]):undefined;
  lastDrop=!!current.started&&!!to&&to!==current.orig;
  if(to&&to!==current.orig&&!api.state.movable.free&&!api.state.movable.dests?.get(current.orig)?.includes(to)&&api.state.turnColor===api.state.pieces.get(current.orig)?.color)motion.reject(to);
 };
 const start=()=>{lastDrop=false};
 host.addEventListener('mousedown',start,true);host.addEventListener('touchstart',start,true);
 document.addEventListener('mouseup',end,true);document.addEventListener('touchend',end,true);
 return()=>{stopped=true;host.removeEventListener('mousedown',start,true);host.removeEventListener('touchstart',start,true);clearTimeout(checkTimer);document.removeEventListener('mouseup',end,true);document.removeEventListener('touchend',end,true);api.set=originalSet;if(api.state.events.move===wrappedMove)api.state.events.move=upstreamMove;motion();};
}
