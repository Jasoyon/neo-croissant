import { Chess, castlingSide, normalizeMove } from 'chessops/chess';
import { parseFen, makeFen } from 'chessops/fen';
import { parseSquare, makeSquare } from 'chessops/util';
import { chessgroundDests } from 'chessops/compat';
import type { Key } from '@lichess-org/chessground/types';
import type { MoveEffect } from '../.build/upstream/src/chessground/effects';
export const scenarios={
 opening:{name:'正常走棋',fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',moves:['e2e4','d7d5','e4d5','d8d5']},
 capture:{name:'吃子',fen:'4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1',moves:['e4d5']},
 castle:{name:'王车易位',fen:'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',moves:['e1g1','e8c8']},
 ep:{name:'吃过路兵',fen:'4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',moves:['e5d6']},
 promote:{name:'升变',fen:'7k/P7/8/8/8/8/8/7K w - - 0 1',moves:['a7a8']},
 check:{name:'将军与解除',fen:'4k3/8/8/8/8/8/R7/4K3 w - - 0 1',moves:['a2e2','e8f8']}
};
export function position(fen:string){return Chess.fromSetup(parseFen(fen).unwrap()).unwrap()}
export function config(pos:Chess){return{fen:makeFen(pos.toSetup()),turnColor:pos.turn,movable:{free:false,color:pos.turn,dests:chessgroundDests(pos)},check:false}}
export function play(pos:Chess,from:Key,to:Key,userDrop:boolean,promotion:'queen'|'rook'|'bishop'|'knight'='queen'){
 const orig=parseSquare(from)!,dest=parseSquare(to)!,piece=pos.board.get(orig);if(!piece)return;
 let move={from:orig,to:dest,promotion:piece.role==='pawn'&&(dest<8||dest>=56)?promotion:undefined};
 move=normalizeMove(pos,move) as typeof move;if(!pos.isLegal(move))return;
 const side=castlingSide(pos,move),rank=pos.turn==='white'?'1':'8';
 const target=(side?(side==='h'?'g':'c')+rank:to) as Key;
 let capturedSquare=dest;
 if(piece.role==='pawn'&&pos.epSquare===dest&&!pos.board.get(dest))capturedSquare=dest+(pos.turn==='white'?-8:8);
 const captured=side?undefined:pos.board.get(capturedSquare);
 const effect:MoveEffect={from,to:target,color:piece.color,userDrop,captured:captured?{square:makeSquare(capturedSquare),piece:captured}:undefined,rook:side?{from:makeSquare(move.to),to:((side==='h'?'f':'d')+rank) as Key}:undefined,promotion:!!move.promotion};
 pos.play(move);
 if(pos.isCheck()){const king=pos.board.kingOf(pos.turn);if(king!==undefined)effect.check=makeSquare(king)}
 return effect;
}
