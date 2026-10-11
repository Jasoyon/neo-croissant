import type { Api } from '@lichess-org/chessground/api';
import type { PieceNode } from '@lichess-org/chessground/types';
import { createEffects } from './effects';
import './effects.css';
import { pickupScale, sway, zeroRotation, automaticAngle } from './motionMath';

// The board retains exclusive ownership of the piece's translation.
export function installDynamicMotion(api: Api, host: HTMLElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visuals = new Map<HTMLElement, {node: HTMLElement; backgroundSize: string}>();
  const effects = createEffects(api,host);
  host.dataset.dynamic='true';
  let frame=0, stopped=false, selected: string|undefined, pulseStart=-Infinity;
  let dragged: HTMLElement|undefined, previousX: number|undefined, previousTime=0;
  let rotation=zeroRotation();
  function reset(el: HTMLElement) {
    const v=visuals.get(el); if(!v) return;
    el.style.backgroundSize=v.backgroundSize; v.node.remove(); visuals.delete(el);
  }
  function visual(el: HTMLElement) {
    const old=visuals.get(el); if(old) {old.node.style.backgroundImage=getComputedStyle(el).backgroundImage;return old.node;}
    const node=document.createElement('div'); node.className='dynamic-piece-visual';
    node.setAttribute('aria-hidden','true'); node.style.backgroundImage=getComputedStyle(el).backgroundImage;
    visuals.set(el,{node,backgroundSize:el.style.backgroundSize});
    el.style.backgroundSize='0px 0px'; el.append(node); return node;
  }
  function tick(now: number) {
    if(stopped) return;
    const state=api.state, enabled=state.animation.enabled&&!reduced.matches&&!state.dom.destroyed;
    const current=state.draggable.current;
    const el=typeof current?.element==='function'?undefined:current?.element;
    const key=state.selected ?? (el as PieceNode|undefined)?.cgKey;
    if(key!==selected){selected=key;pulseStart=key?now:-Infinity;}
    if(el!==dragged){dragged=el;previousX=undefined;rotation=zeroRotation();}
    const keep=new Set<HTMLElement>();
    if(enabled) {
      for(const piece of state.dom.elements.board.querySelectorAll<PieceNode>('piece')) {
        const isDragged=piece===el;
        let motion=effects.pieceMotions.get(piece.cgKey);
        if(motion&&(now-motion.start>=motion.duration||isDragged)){effects.pieceMotions.delete(piece.cgKey);motion=undefined;}
        const pulsing=piece.cgKey===selected && now-pulseStart<200;
        if(piece.classList.contains('fading')||(!isDragged&&!pulsing&&!motion)) continue;
        keep.add(piece);
        if(isDragged){
          const x=new DOMMatrixReadOnly(piece.style.transform).m41;
          const width=state.dom.elements.board.getBoundingClientRect().width;
          const delta=previousX===undefined||!width?null:(x-previousX)*800/width;
          rotation=sway(rotation,delta,Math.max(0,(now-previousTime)/1000)); previousX=x;
        }
        const child=visual(piece);
        child.style.scale=String(pulsing?pickupScale(now-pulseStart):1);
        child.style.rotate=`${isDragged?rotation.newRotation:motion?.kind==='turn'?automaticAngle(motion.dx!,now-motion.start,motion.duration):0}deg`;
        child.classList.toggle('motion-check',motion?.kind==='check');
        child.classList.toggle('motion-promote',motion?.kind==='promote');
      }
    } else effects.clear();
    for(const piece of visuals.keys()) if(!keep.has(piece)) reset(piece);
    previousTime=now; frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  const stop=()=>{stopped=true;cancelAnimationFrame(frame);for(const el of visuals.keys())reset(el);effects.clear();delete host.dataset.dynamic;};
  return Object.assign(stop,{clear:effects.clear,move:effects.move,check:effects.check,promote:effects.promote,reject:effects.reject});
}
