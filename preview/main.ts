import { Chessground } from '@lichess-org/chessground';
import type { Key } from '@lichess-org/chessground/types';
import { installDynamicMotion as candidate } from '../.build/upstream/src/chessground/dynamicMotion';
import { scenarios, position, config, play } from './position';
import './board.css';import './page.css';import './neo.css';
const host=document.querySelector<HTMLElement>('#board')!, mode=document.querySelector<HTMLSelectElement>('#mode')!, scene=document.querySelector<HTMLSelectElement>('#scene')!,status=document.querySelector<HTMLElement>('#status')!;
const choose=()=>scenarios[scene.value as keyof typeof scenarios];
let pos=position(choose().fen),replayTimer:ReturnType<typeof setTimeout>|undefined,wasDrop=false;
const api=Chessground(host,{...config(pos),animation:{enabled:true,duration:180},draggable:{distance:0,autoDistance:false},premovable:{enabled:false},movable:{...config(pos).movable,events:{after:(from,to)=>move(from,to,wasDrop)}}});
let stop:ReturnType<typeof candidate>|undefined=candidate(api,host);
function clearReplay(){clearTimeout(replayTimer);replayTimer=undefined}
function synchronize(animate:boolean){api.set({animation:{enabled:animate,duration:180},...config(pos)});api.set({animation:{enabled:true,duration:180}})}
function fresh(){clearReplay();stop?.();stop=undefined;api.cancelMove();pos=position(choose().fen);synchronize(false);api.redrawAll();if(mode.value==='candidate')stop=candidate(api,host);status.textContent=`${choose().name}：${pos.turn==='white'?'白':'黑'}方走棋`;resetMetrics()}
function move(from:Key,to:Key,userDrop:boolean){const effect=play(pos,from,to,userDrop,document.querySelector<HTMLSelectElement>('#promotion')!.value as 'queen');if(!effect){synchronize(false);stop?.reject(to);return false}stop?.move(effect);synchronize(!userDrop);api.set({lastMove:[effect.from,effect.to]});status.textContent=`${from} → ${effect.to}${effect.captured?' · 吃子':''}${effect.promotion?' · 升变':''}${effect.check?' · 将军':''}；${pos.turn==='white'?'白':'黑'}方走棋`;return true}
let inputFrom:Key|undefined;
host.addEventListener('mousedown',e=>{inputFrom=api.state.selected??api.getKeyAtDomPos([e.clientX,e.clientY])},true);
document.addEventListener('mouseup',e=>{wasDrop=!!api.state.draggable.current?.started&&api.getKeyAtDomPos([e.clientX,e.clientY])!==api.state.draggable.current?.orig;const from=inputFrom,to=api.getKeyAtDomPos([e.clientX,e.clientY]);if(from&&to&&from!==to&&pos.board.get(from.charCodeAt(0)-97+(Number(from[1])-1)*8)?.color===pos.turn&&!api.state.movable.dests?.get(from)?.includes(to)){stop?.reject(to);status.textContent='这步不合法，请换一个落点。'}inputFrom=undefined},true);
mode.onchange=fresh;scene.onchange=fresh;
document.querySelector<HTMLButtonElement>('#reset')!.onclick=fresh;
document.querySelector<HTMLButtonElement>('#flip')!.onclick=()=>{clearReplay();stop?.();api.cancelMove();api.toggleOrientation();stop=mode.value==='candidate'?candidate(api,host):undefined;if(pos.isCheck()){const king=[...api.state.pieces].find(([,p])=>p.role==='king'&&p.color===pos.turn)?.[0];stop?.check(king)}};
document.querySelector<HTMLButtonElement>('#size')!.onclick=()=>{host.classList.toggle('small');window.dispatchEvent(new Event('resize'));api.redrawAll()};
document.querySelector<HTMLButtonElement>('#replay')!.onclick=()=>{fresh();let i=0;const next=()=>{const code=choose().moves[i++];if(!code)return;move(code.slice(0,2) as Key,code.slice(2,4) as Key,false);if(i<choose().moves.length)replayTimer=setTimeout(next,1600)};replayTimer=setTimeout(next,250)};
window.addEventListener('pagehide',()=>{clearReplay();stop?.();api.destroy()},{once:true});
const check=document.querySelector<HTMLElement>('#position-check')!;
let pointer={x:0,y:0},last={x:-1,y:-1},samples=0,maxError=0,maxTrails=0,inspectFrame=0;
function resetMetrics(){samples=0;maxError=0;maxTrails=0}
document.addEventListener('mousemove',e=>pointer={x:e.clientX,y:e.clientY});document.addEventListener('mousedown',e=>pointer={x:e.clientX,y:e.clientY});
function inspect(){const visual=host.querySelector<HTMLElement>('piece.dragging .dynamic-piece-visual');maxTrails=Math.max(maxTrails,host.querySelectorAll('.dynamic-trail').length);if(visual&&pointer.x===last.x&&pointer.y===last.y){const r=visual.getBoundingClientRect();maxError=Math.max(maxError,Math.hypot(r.x+r.width/2-pointer.x,r.y+r.height/2-pointer.y));samples++}last={...pointer};check.textContent=`对齐采样 ${samples} 次 · 最大偏差 ${maxError.toFixed(3)} px · 拖动残影 ${maxTrails}`;inspectFrame=requestAnimationFrame(inspect)}inspect();
window.addEventListener('pagehide',()=>cancelAnimationFrame(inspectFrame),{once:true});
