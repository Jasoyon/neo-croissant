import { afterEach, expect, test, vi } from 'vitest';
import reference from './fixtures/dynamic-reference.json';
import type { Api } from '@lichess-org/chessground/api';
import { installDynamicMotion } from '../src/chessground/dynamicMotion';
import { sway, pickupScale, zeroRotation, automaticAngle } from '../src/chessground/motionMath';

// Numerical reference samples retained without redistributing the site's bundle.
test('pickup and sway match captured reference samples',()=>{
 for(let ms=0;ms<=200;ms++)expect(pickupScale(ms)).toBeCloseTo(reference.pickup[ms],12);
 let state=zeroRotation();for(const sample of reference.sway){state=sway(state,sample.movement,sample.dt);expect(state.overshootApplied).toBe(sample.rotation.overshootApplied);for(const key of ['newRotation','targetRotation','lastSpeed'] as const)expect(state[key]).toBeCloseTo(sample.rotation[key],12)}
});
function setup(width=560){
 let callback:FrameRequestCallback=()=>{};
 const media={matches:false};
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callback=cb;return 1});
 vi.stubGlobal('cancelAnimationFrame',vi.fn());vi.stubGlobal('matchMedia',()=>media);
 vi.stubGlobal('DOMMatrixReadOnly',class{m41:number;constructor(value:string){this.m41=Number(value.match(/-?[\d.]+/g)?.[0]??0)}});
 const host=document.createElement('div'), board=document.createElement('cg-board'), piece=document.createElement('piece');
 Object.assign(piece,{cgKey:'e2'});board.getBoundingClientRect=()=>({width} as DOMRect);
 board.append(piece);host.append(board);document.body.append(host);
 const state:any={orientation:'white',pieces:new Map([['e4',{color:'white'}]]),selected:'e2',animation:{enabled:true,duration:180,current:undefined},draggable:{current:{element:piece}},dom:{destroyed:false,elements:{board}}};
 const api={state,getKeyAtDomPos:vi.fn(()=> 'e4')} as unknown as Api;
 const stop=installDynamicMotion(api,host);
 return{api,state,host,piece,media,stop,tick:(t:number)=>callback(t)};
}
afterEach(()=>{vi.unstubAllGlobals();document.body.replaceChildren()});
test('holding returns to original size after 200ms without altering translation or adding shadow',()=>{
 const a=setup();a.piece.style.transform='translate(100px,200px)';a.tick(0);
 expect((a.piece.firstElementChild as HTMLElement).style.scale).toBe('1.25');a.tick(210);
 expect((a.piece.firstElementChild as HTMLElement).style.scale).toBe('1');expect(a.piece.style.transform).toBe('translate(100px,200px)');expect((a.piece.firstElementChild as HTMLElement).style.filter).toBe('');a.stop();
});
test('sway uses square-relative coordinates at both board sizes',()=>{
 const angles=[];for(const width of [400,560]){const a=setup(width);a.tick(0);a.piece.style.transform=`translate(${width/80}px,0px)`;a.tick(16);angles.push((a.piece.firstElementChild as HTMLElement).style.rotate);a.stop()}
 expect(angles[0]).toBe(angles[1]);expect(parseFloat(angles[0])).toBeGreaterThan(0);
});
test('drag and release never leave cloned pieces or landing squash',()=>{
 const a=setup();a.tick(0);for(let i=1;i<20;i++){a.piece.style.transform=`translate(${i*10}px,0px)`;a.tick(i*16)}
 expect(a.host.querySelectorAll('.motion-beam,.dynamic-trail')).toHaveLength(0);
 a.state.draggable.current=undefined;a.state.selected=undefined;a.tick(340);
 expect(a.piece.children).toHaveLength(0);expect(a.piece.style.backgroundSize).toBe('');a.stop();
});
test('automatic move gets one gradient beam, with correct geometry after flipping, and cleanup removes it',()=>{
 for(const orientation of ['white','black']){const a=setup();a.state.orientation=orientation;a.state.draggable.current=undefined;a.state.selected=undefined;
 a.stop.move({from:'e2',to:'e4',color:'white',userDrop:false});a.tick(0);a.tick(16);
 const beams=a.host.querySelectorAll<HTMLElement>('.vfx-piece-trail');expect(beams).toHaveLength(1);expect(beams[0].style.top).toBe(orientation==='white'?'75%':'12.5%');
 expect((beams[0].firstChild as HTMLElement).style.getPropertyValue('--trail-width')).toBe('200%');
 a.stop();expect(a.host.querySelector('.motion-vfx')).toBeNull();}
});
test('reduced motion and teardown restore the piece background',()=>{
 const a=setup();a.tick(0);a.media.matches=true;a.tick(16);expect(a.piece.children).toHaveLength(0);expect(a.piece.style.backgroundSize).toBe('');a.stop();
});

test('automatic rotation matches reference keyframe interpolation',()=>{
 for(const sample of reference.turn)expect(automaticAngle(sample.dx,sample.ms)).toBeCloseTo(sample.angle,12);
});

test('check and move overlays use the rendered board, not its larger wrapper',()=>{
 const a=setup(580);a.host.style.width='583px';a.state.dom.elements.board.style.width='580px';
 for(const orientation of ['white','black']){
  a.state.orientation=orientation;a.stop.check('h8');
  const overlay=a.host.querySelector<HTMLElement>('.vfx-king-check-square')!;
  expect(overlay.parentElement).toBe(a.state.dom.elements.board);
  expect(overlay.style.left).toBe(orientation==='white'?'87.5%':'0%');
  a.stop.move({from:'e2',to:'e4',color:'white',userDrop:false});
  for(const node of a.host.querySelectorAll('.motion-vfx'))expect(node.parentElement).toBe(a.state.dom.elements.board);
 }
 a.stop();expect(a.host.querySelector('.motion-vfx')).toBeNull();
});

test('mouse cursor changes on pickup and restores on release, blur and teardown',()=>{
 const a=setup();a.state.draggable.enabled=true;
 a.host.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}));a.tick(0);
 expect(document.documentElement.classList.contains('neo-piece-grab')).toBe(true);
 document.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));a.tick(16);
 expect(document.documentElement.classList.contains('neo-piece-grab')).toBe(false);
 a.host.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}));a.tick(32);
 window.dispatchEvent(new Event('blur'));a.tick(48);
 expect(document.documentElement.classList.contains('neo-piece-grab')).toBe(false);
 a.host.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}));a.tick(64);a.stop();
 expect(document.documentElement.classList.contains('neo-piece-grab')).toBe(false);
});

test('hover cursor belongs to the board and remains available with reduced motion',()=>{
 const a=setup();a.state.draggable.enabled=true;a.state.draggable.current=undefined;a.media.matches=true;
 a.host.dispatchEvent(new MouseEvent('mousemove',{bubbles:true}));a.tick(0);
 expect(a.host.dataset.pieceCursor).toBe('grab');
 vi.mocked(a.api.getKeyAtDomPos).mockReturnValue('a1');a.host.dispatchEvent(new MouseEvent('mousemove',{bubbles:true}));
 expect(a.host.hasAttribute('data-piece-cursor')).toBe(false);
 vi.mocked(a.api.getKeyAtDomPos).mockReturnValue('e4');a.state.viewOnly=true;a.tick(16);
 expect(a.host.hasAttribute('data-piece-cursor')).toBe(false);a.stop();
});
