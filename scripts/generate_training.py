from pathlib import Path
import sys,sqlite3,json,hashlib,shutil,io,zipfile
import argparse
parser=argparse.ArgumentParser()
parser.add_argument("--source",type=Path,required=True,help="Read-only En Croissant Lichess puzzle database")
parser.add_argument("--output",type=Path,required=True)
args=parser.parse_args()
import chess,chess.pgn
out=args.output;out.mkdir(parents=True,exist_ok=True)
files=out/'练习文件';files.mkdir(exist_ok=True)
manifest=[]
def save(name,games,kind='repertoire'):
 p=files/(name+'.pgn');p.write_text('\n\n'.join(str(g) for g in games)+'\n',encoding='utf-8');p.with_suffix('.info').write_text(json.dumps({'type':kind,'tags':['800–1400','中文导读']},ensure_ascii=False));manifest.append({'file':p.name,'games':len(games),'type':kind})
def rep(name,color,desc,lines):
 g=chess.pgn.Game();g.headers['Event']=name;g.headers['Orientation']=color;g.comment=desc+' 这是浅层入门练习，不是完整理论库。遇到未收录走法，先检查威胁，再争中心、出子和保护王。'
 for moves,note in lines:
  node=g;board=g.board()
  for san in moves.split():
   m=board.parse_san(san);node=node.add_variation(m) if not node.has_variation(m) else node.variation(m);board.push(m)
  node.comment=note
 save(name,[g]);print(name,len(lines),'lines')
rep('01 白棋 e4与意大利入门','white','主线采用意大利慢攻：Nf3、Bc4、d3、短易位。先理解每步目的，再做训练；不要为背谱忽略对手的直接威胁。',[
('e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 O-O d6 c3 O-O','意大利基本阵形。下一步常考虑 Re1、Nbd2，准备条件合适时 d4。'),
('e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5 O-O d6 c3 O-O','两马防御采用稳健 d3，保护 e4；不必一开始学习 Ng5 的尖锐变化。'),
('e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3','俄国防御：先退马，再用 d4 争中心。不要以为多吃一兵就能不顾发展。'),
('e4 e5 Nf3 d6 d4 exd4 Nxd4 Nf6 Nc3','菲利多：用 d4 争中心，继续出子。'),
('e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3','西西里用阿拉平 2.c3。目的是 d4 建中心；黑后出动时用发展争先。'),
('e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4','阿拉平对 2...Nf6：推进赶马，再支持中心。'),
('e4 e6 d4 d5 exd5 exd5 Nf3 Nf6 Bd3','法兰西交换变例：出子、易位；结构对称不代表自动和棋。'),
('e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3','对卡罗康采用交换结构，c3 支持 d4，继续 Nf3 和易位。'),
('e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3','斯堪的纳维亚：Nc3 在出子同时攻击后，然后占中心。'),
('e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2','对皮尔茨正常发展，准备易位，不急着攻击。'),
('e4 Nf6 e5 Nd5 d4 d6 Nf3','阿廖欣：建立中心，但不要用过多兵步追马。')])
rep('02 黑棋 卡罗康对e4','black','用 c6 支持 d5，挑战白棋中心。这里只练最常见的几种结构，白方偏离时仍要先看威胁。',[
('e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6','经典变例：先把浅色象发展到兵链外，再考虑 e6 和 Nf6。'),
('e4 c6 d4 d5 Nd2 dxe4 Nxe4 Bf5','3.Nd2 可以进入相似结构。'),
('e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5','推进变例：Bf5 后 e6 稳住，再用 c5 挑战 d4。'),
('e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6','交换变例：c兵回吃，发展马；注意白象对 h7 的方向。'),
('e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6','潘诺夫进攻：别机械走同一套，Nf6 与 e6 支持中心。'),
('e4 c6 Nf3 d5 Nc3 Bg4 h3 Bxf3 Qxf3 e6','两马体系：此线用 Bg4，再换掉 f3 马；后续正常出子。')])
rep('03 黑棋 d4稳健防御','black','对白棋 d4 采用 d5、e6、Nf6 的稳健框架；对白棋后翼弃兵和伦敦体系分别练习。',[
('d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6','后翼弃兵拒绝式：先完成王翼发展。h6 询问白象，之后再考虑中心和浅色象。'),
('d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 Be7','交换变例：e兵回吃，保持中心；别无目的地追求吃 c4 兵。'),
('d4 d5 c4 e6 Nf3 Nf6 g3 Be7 Bg2 O-O','加泰罗尼亚式摆法：先发展易位，注意 g2 象长斜线。'),
('d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6','伦敦：c5 及时挑战中心，不能只让白方舒服摆阵。'),
('d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 O-O Nc6','科勒式体系：c5 争中心，继续发展。')])
source=args.source.resolve()
c=sqlite3.connect(f'file:{source}?mode=ro',uri=True)
themes=dict(c.execute('select name,id from themes'))
chosen={};summary={}
for name,ts in [('04 战术精选 800-1600',['mateIn1','mateIn2','fork','pin','skewer','discoveredAttack']),('05 残局精选 800-1600',['pawnEndgame','rookEndgame','promotion'])]:
 ids=set();counts={}
 for theme in ts:
  rows=c.execute('select p.* from puzzle_themes pt join puzzles p on p.id=pt.puzzle_id where pt.theme_id=? and p.rating between 800 and 1600 and p.popularity>=80 and p.nb_plays>=100 and length(p.moves)-length(replace(p.moves," ",""))<=6 limit 1600',(themes[theme],)).fetchall()
  rows.sort(key=lambda r:(hashlib.sha256(str(r[0]).encode()).hexdigest()))
  picked=[]
  for row in rows:
   if row[0] in ids:continue
   board=chess.Board(row[1]);assert board.is_valid()
   for uci in row[2].split():
    move=chess.Move.from_uci(uci);assert move in board.legal_moves,(row[0],uci);board.push(move)
   ids.add(row[0]);chosen[row[0]]=row;picked.append(row[0])
   if len(picked)==100:break
  counts[theme]=len(picked)
 p=out/(name+'.db3');assert not p.exists(),p
 d=sqlite3.connect(p)
 for sql, in c.execute('select sql from sqlite_master where type="table"'):d.execute(sql)
 d.executemany('insert into themes values (?,?)',c.execute('select * from themes'))
 for ident in sorted(ids):
  d.execute('insert into puzzles values (?,?,?,?,?,?,?)',chosen[ident]);d.executemany('insert into puzzle_themes values (?,?)',c.execute('select * from puzzle_themes where puzzle_id=?',(ident,)))
 d.commit();assert d.execute('pragma integrity_check').fetchone()[0]=='ok';d.close();summary[name]={'count':len(ids),'themes':counts}
 if name.startswith('05'):
  games=[]
  for ident in sorted(ids)[:12]:
   row=chosen[ident];board=chess.Board(row[1]);moves=row[2].split();board.push_uci(moves[0]);g=chess.pgn.Game();g.setup(board);g.headers['Event']=f'残局计算 {len(games)+1:02d}';g.headers['Orientation']='white' if board.turn else 'black';g.headers['Source']='Local Lichess Puzzles 2026 / id '+str(ident)
   labels=[r[0] for r in c.execute('select t.name from themes t join puzzle_themes pt on t.id=pt.theme_id where pt.puzzle_id=?',(ident,))]
   g.comment='先独立计算再逐步看答案。标签：'+', '.join(labels)+'。残局先检查将军、吃子、升变威胁，再比较王的活动性。此为实战计算题，不是完整残局理论教材。';node=g
   for uci in moves[1:]:node=node.add_variation(chess.Move.from_uci(uci))
   node.comment='题库解答到此结束；没有宣称这是此局面唯一合理的后续计划。';games.append(g)
  save('06 残局摆棋练习与中文提示',games,'puzzle')
(out/'manifest.json').write_text(json.dumps({'files':manifest,'puzzles':summary},ensure_ascii=False,indent=2));print(summary)
