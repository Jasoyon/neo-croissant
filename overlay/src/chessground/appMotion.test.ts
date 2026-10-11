import { afterEach, expect, test, vi } from 'vitest';
import { Chessground } from '@lichess-org/chessground';
import { read } from '@lichess-org/chessground/fen';
import { installAppMotion, transition } from './appMotion';

function setup(fen='8/8/8/8/8/8/4P3/4K3'){
 vi.useFakeTimers();vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',vi.fn());vi.stubGlobal('matchMedia',()=>({matches:false}));
 const host=document.createElement('div');document.body.append(host);
 const moved=vi.fn();const api=Chessground(host,{fen,animation:{enabled:true,duration:180},events:{move:moved},movable:{free:false,color:'white',dests:new Map([['e2',['e4']]])}});
 const stop=installAppMotion(api,host);return{host,api,moved,stop};
}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();document.body.replaceChildren()});
test('capture and en passant identify the captured square independently of destination',()=>{
 expect(transition(read('8/8/8/3p4/4P3/8/8/8'),read('8/8/8/3P4/8/8/8/8'),undefined,false)?.captured?.square).toBe('d5');
 expect(transition(read('8/8/8/3pP3/8/8/8/8'),read('8/8/3P4/8/8/8/8/8'),undefined,true)).toMatchObject({from:'e5',to:'d6',captured:{square:'d5'},userDrop:true});
});
test('castling animates both pieces and promotion detects the new piece',()=>{
 expect(transition(read('8/8/8/8/8/8/8/4K2R'),read('8/8/8/8/8/8/8/5RK1'),undefined,false)).toMatchObject({from:'e1',to:'g1',rook:{from:'h1',to:'f1'}});
 expect(transition(read('8/P7/8/8/8/8/8/8'),read('N7/8/8/8/8/8/8/8'),undefined,true)?.promotion).toBe(true);
});
test('position replacement does not masquerade as a move',()=>{
 expect(transition(read('start'),read('8/8/8/8/8/8/4P3/4K3'),undefined,false)).toBeUndefined();
});
test('real API updates create effects once and teardown restores callbacks',()=>{
 const a=setup();const original=a.api.set;
 a.api.set({fen:'8/8/8/8/4P3/8/8/4K3',lastMove:['e2','e4']});
 expect(a.host.querySelectorAll('.vfx-piece-trail')).toHaveLength(1);
 const beam=a.host.querySelector('.vfx-piece-trail');a.api.set({fen:a.api.getFen()});expect(a.host.querySelector('.vfx-piece-trail')).toBe(beam);
 a.stop();expect(a.api.set).not.toBe(original);expect(a.api.state.events.move).toBe(a.moved);expect(a.host.querySelector('.motion-vfx')).toBeNull();a.api.destroy();
});
test('real native move preserves caller callback and a drag does not create a beam',()=>{
 const a=setup();a.api.getKeyAtDomPos=()=> 'e4';
 a.api.state.draggable.current={orig:'e2',started:true} as any;
 a.host.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));document.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));
 a.api.move('e2','e4');vi.advanceTimersByTime(2);
 expect(a.moved).toHaveBeenCalledOnce();expect(a.host.querySelector('.vfx-piece-trail')).toBeNull();expect(a.host.querySelectorAll('.vfx-growing-circle')).toHaveLength(1);a.stop();a.api.destroy();
});
test('clicking destination after selecting origin still creates automatic-move effects',()=>{
 const a=setup();a.api.getKeyAtDomPos=()=> 'e2';a.api.state.draggable.current={orig:'e2',started:true} as any;
 document.dispatchEvent(new MouseEvent('mouseup'));a.host.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));
 a.api.state.draggable.current=undefined;a.api.move('e2','e4');vi.advanceTimersByTime(2);
 expect(a.host.querySelectorAll('.vfx-piece-trail')).toHaveLength(1);a.stop();a.api.destroy();
});
test('check follows updated position and pending effect is cancelled when check ends',()=>{
 const a=setup('4k3/8/8/8/8/8/4R3/4K3');a.api.set({check:'black'});vi.advanceTimersByTime(181);expect(a.host.querySelector('.vfx-king-check-square')?.getAttribute('data-square')).toBe('e8');
 a.api.set({check:false});expect(a.host.querySelector('.vfx-king-check-square')).toBeNull();
 a.api.set({check:'black'});a.api.set({check:false});vi.advanceTimersByTime(200);expect(a.host.querySelector('.vfx-king-check-square')).toBeNull();a.stop();a.api.destroy();
});
test('promotion choice applied after a pawn move triggers only promotion effects',()=>{
 const a=setup('P3k3/8/8/8/8/8/8/4K3');a.api.set({fen:'N3k3/8/8/8/8/8/8/4K3'});expect(a.host.querySelectorAll('.vfx-promote-ripple')).toHaveLength(1);expect(a.host.querySelector('.vfx-piece-trail')).toBeNull();a.stop();a.api.destroy();
});
