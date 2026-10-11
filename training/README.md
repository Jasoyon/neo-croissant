# 中文入门训练包 · 800–1400 阶段

这是本次为训练用途整理的可选内容。等级范围只是选材方向，Lichess 题目分数不能直接换算为 Chess.com 实战分数。

## 内容与导入

- `files/01 白棋 e4与意大利入门.pgn`：11 条浅层分支，意大利慢攻为主，并包含常见其他防御的简明应对。
- `files/02 黑棋 卡罗康对e4.pgn`：6 条分支。
- `files/03 黑棋 d4稳健防御.pgn`：5 条分支，含后翼弃兵拒绝式与伦敦体系。
- `files/06 残局摆棋练习与中文提示.pgn`：12 道实战计算题，附答案与思考提示。
- `puzzles/04 战术精选 800-1600.db3`：600 题，一步杀、两步杀、双攻、牵制、串击、闪击各 100 题。
- `puzzles/05 残局精选 800-1600.db3`：300 题，兵残局、车残局、升变各 100 题。

在 En Croissant 左侧“文件”中导入 PGN；如果采用文件夹管理方式，把 `files/` 中的 PGN 和同名 `.info` 一起复制进应用使用的文件目录。不要覆盖自己的同名文件。`.info` 只含资料类型和标签，没有用户成绩。

三份开局库在“练习 → 训练”中使用。先看中文评注和计划，再做记忆练习。将 `.db3` 加入应用题库目录并在谜题页面选择；macOS 默认目录为 `~/Library/Application Support/org.encroissant.app/puzzles/`。0.15.0 有题目缓存，切换后若仍出旧库题目，重新打开应用再选目标库。

## 每天 30 分钟

1. 10 分钟战术：少量题，计算完整后再走。先检查将军、吃子和直接威胁。
2. 10 分钟开局：先学白棋，再加入卡罗康和对 d4。偏离库时依靠基本原则，不机械背谱。
3. 10 分钟残局：计算一道精选残局，或用带注释的 PGN 摆棋，想好后再揭晓答案。

每周至少下一盘 15+10 或更慢的棋，先自行复盘，再用引擎核对。三份开局库是入门材料，不是完整理论库，未逐局面认证引擎最优走法。

“再来 5m / 困难 10m / 良好 1d / 容易 2d”是下一次复习的间隔。训练界面与间隔复习功能属于上游 En Croissant；本项目提供练习内容。谜题判分逻辑没有在本项目中修改，显示叉也不能仅凭走法列表判断原因。

## 棋书与大师对局

本次也整理过下列阅读和摆棋资源，公开包保留官方来源，按需从原站获取：

- [José Raúl Capablanca, Chess Fundamentals](https://www.gutenberg.org/ebooks/33870)：[带图在线版](https://www.gutenberg.org/cache/epub/33870/pg33870-images.html)。本地曾验证完整英文文本；EPUB 下载不完整的文件未作为成品使用。En Croissant 不把 EPUB/PDF/TXT 直接当作训练课程，书在外部阅读，局面在应用内摆棋。
- [PGN Mentor 卡帕布兰卡对局集](https://www.pgnmentor.com/players/Capablanca.zip)：本次本地解析了 597 局。它不是上述棋书的逐章配套棋谱，也不是完整注解版。[原站列表](https://www.pgnmentor.com/files.html)。

## 题库依据与重建

题目来自 [Lichess CC0 数据库](https://database.lichess.org/#puzzles)。过滤条件为题目分数 800–1600、受欢迎度至少 80、至少 100 次尝试、整段解答至多 7 个半回合；每个分类选择 100 题，同库内不重复。原始完整库不打包。

如果已有兼容 En Croissant 格式的 Lichess SQLite 大库，可重新生成：

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-training.txt
.venv/bin/python scripts/generate_training.py --source '/完整路径/Lichess.db3' --output '.build/training-regenerated'
.venv/bin/python scripts/validate_training.py
```

生成器只读输入库，输出到新目录。样本取决于输入库版本与查询结果，未声称能从任意日期的大库重现同一组题；仓库已保存本次选题结果。
