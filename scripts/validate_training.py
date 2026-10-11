#!/usr/bin/env python3
"""Validate every bundled game variation and every puzzle solution."""
import json,sqlite3
from pathlib import Path
import chess,chess.pgn
ROOT=Path(__file__).resolve().parents[1]
result={'pgn_games':0,'pgn_moves':0,'puzzles':0,'puzzle_moves':0}
def visit(node):
    board=node.board()
    for child in node.variations:
        assert child.move in board.legal_moves,child.move
        result['pgn_moves']+=1
        visit(child)
for p in (ROOT/'training/files').glob('*.pgn'):
    with p.open() as f:
        while (g:=chess.pgn.read_game(f)) is not None:
            assert not g.errors,(p,g.errors)
            assert g.board().is_valid(),p
            result['pgn_games']+=1
            visit(g)
for p in (ROOT/'training/puzzles').glob('*.db3'):
    c=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True)
    assert c.execute('pragma integrity_check').fetchone()[0]=='ok'
    assert {row[0] for row in c.execute('select name from sqlite_master where type="table"')}=={'puzzles','themes','puzzle_themes'}
    for ident,fen,moves in c.execute('select id,fen,moves from puzzles'):
        board=chess.Board(fen);assert board.is_valid(),ident
        for uci in moves.split():
            m=chess.Move.from_uci(uci);assert m in board.legal_moves,(ident,uci);board.push(m);result['puzzle_moves']+=1
        result['puzzles']+=1
assert result['puzzles']==900
assert result['pgn_games']==15
print(json.dumps(result,indent=2))
