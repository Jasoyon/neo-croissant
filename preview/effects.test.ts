import {test,expect,vi,afterEach} from 'vitest';
import {createEffects} from '../.build/upstream/src/chessground/effects';
import {position,play,scenarios} from './position';
import type {Api} from '@lichess-org/chessground/api';
function setup(){vi.useFakeTimers();vi.stubGlobal('matchMedia',()=>({matches:false}));const host=document.createElement('div');const board=document.createElement('cg-board');host.append(board);document.body.append(host);const effects=createEffects({state:{dom:{elements:{board}},orientation:'white',animation:{enabled:true,duration:180}}} as Api,host);return{host,effects}}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();document.body.replaceChildren()});
test('all six scenarios use legal moves, including castling, en passant and check escape',()=>{
 for(const scene of Object.values(scenarios)){const pos=position(scene.fen);for(const move of scene.moves)expect(play(pos,move.slice(0,2) as any,move.slice(2,4) as any,false)).toBeTruthy()}
});
test('capture effect represents the removed piece; manual drops have ripple but no beam or turn',()=>{
 const {host,effects}=setup(),pos=position(scenarios.capture.fen);effects.move(play(pos,'e4','d5',true)!);
 expect(host.querySelector('.vfx-piece-capture')?.getAttribute('data-square')).toBe('d5');expect(host.querySelector('.vfx-piece-capture .element.black.pawn')).toBeTruthy();expect(host.querySelector('.vfx-growing-circle')).toBeTruthy();expect(host.querySelector('.vfx-piece-trail')).toBeNull();expect(effects.pieceMotions.size).toBe(0);
 vi.advanceTimersByTime(450);expect(host.querySelectorAll('.motion-vfx')).toHaveLength(0);effects.clear();
});
test('en passant fades the actual captured square, not the destination',()=>{
 const {host,effects}=setup(),pos=position(scenarios.ep.fen),move=play(pos,'e5','d6',true)!;effects.move(move);
 expect(host.querySelector('.vfx-piece-capture')?.getAttribute('data-square')).toBe('d5');expect(host.querySelector('.vfx-growing-circle')?.getAttribute('data-square')).toBe('d6');expect(pos.board.get(35)).toBeUndefined();effects.clear();
});
test('castling animates both king and rook without treating the rook as captured',()=>{
 const {host,effects}=setup(),pos=position(scenarios.castle.fen);effects.move(play(pos,'e1','g1',false)!);
 expect(host.querySelectorAll('.vfx-piece-trail')).toHaveLength(2);expect(host.querySelectorAll('.vfx-growing-circle')).toHaveLength(2);expect(host.querySelector('.vfx-piece-capture')).toBeNull();expect([...effects.pieceMotions.keys()]).toEqual(['g1','f1']);effects.clear();
});
test('all four promotion choices replace the pawn and trigger original promotion/ripple effects',()=>{
 const {host,effects}=setup();for(const role of ['queen','rook','bishop','knight'] as const){const pos=position(scenarios.promote.fen);effects.move(play(pos,'a7','a8',true,role)!);expect(pos.board.get(56)?.role).toBe(role);expect(effects.pieceMotions.get('a8')?.kind).toBe('promote');expect(host.querySelectorAll('.vfx-promote-ripple .circle')).toHaveLength(2)}effects.clear();
});
test('check is delayed until movement completes and is removed after escaping check',()=>{
 const {host,effects}=setup(),pos=position(scenarios.check.fen);effects.move(play(pos,'a2','e2',false)!);expect(host.querySelector('.vfx-king-check-square')).toBeNull();vi.advanceTimersByTime(180);expect(host.querySelector('.vfx-king-check-square')?.getAttribute('data-square')).toBe('e8');expect(effects.pieceMotions.get('e8')?.kind).toBe('check');effects.move(play(pos,'e8','f8',false)!);expect(host.querySelector('.vfx-king-check-square')).toBeNull();effects.clear();
});
test('reset cancels pending check, promotion, capture and rejection without late effects',()=>{
 const {host,effects}=setup(),pos=position(scenarios.check.fen);effects.move(play(pos,'a2','e2',false)!);effects.reject('h8');effects.promote('a8');effects.clear();vi.runAllTimers();expect(host.querySelectorAll('.motion-vfx')).toHaveLength(0);expect(effects.pieceMotions.size).toBe(0);
});
test('illegal moves do not change chess position',()=>{const pos=position(scenarios.opening.fen);expect(play(pos,'e2','e5',true)).toBeUndefined();expect(pos.board.get(12)?.role).toBe('pawn');expect(pos.turn).toBe('white')});
