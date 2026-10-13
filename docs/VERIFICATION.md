# 验证记录

## 发布前重新执行

固定上游 `6f2d2628f0fbe11cb62a7dd2f9c102bb52907d53`，在干净副本应用补丁与 overlay。12 枚 PNG、普通落子和吃子两份 MP3 均按官方 URL 重新下载，全部通过 SHA-256 校验。

可重复执行：

```sh
cd .build/upstream
pnpm install --frozen-lockfile
pnpm exec tsgo --noEmit
pnpm exec vitest run src/chessground/animation.test.ts src/chessground/appMotion.test.ts tests/dynamicMotion.test.ts
pnpm build-vite
cd ../..
node .build/upstream/node_modules/vitest/vitest.mjs run --config preview/test.config.mjs
node .build/upstream/node_modules/vite/bin/vite.js build --config preview/vite.config.mjs
python3 -m unittest discover -s tests -v
.venv/bin/python scripts/validate_training.py
```

- 应用动画与接入：22 项检查，涉及回调保留、重复配置、拖放和点击、吃子、吃过路兵、易位、升变、将军计时器与清理。
- 独立预览：8 项场景与特效检查。
- 数值参考：201 个抓取时间点、720 个摆动步、1897 个旋转方向/时间组合。
- 训练数据：15 个 PGN 游戏节点、195 个分支走法；900 题、3810 个解答半回合，合法性与 SQLite 完整性检查。
- macOS 安装器：使用临时测试应用实际完成备份、替换与恢复；拒绝不合法应用；旁边的模拟个人棋谱保持不变。

CI 工作流重复源码准备、前端检查、动画测试、预览构建、训练验证和 macOS 安装器测试。它不发布二进制应用，也不会接触个人资料。

依赖验证说明：本机首次重新安装依赖遇到 npm 元数据超时；离线安装又缺少一个其他架构包的元数据。因此这次干净源码的测试与前端构建复用了既有、已成功构建应用的依赖树。素材下载、补丁应用和测试均实际重跑；没有将它描述为全新网络环境依赖安装成功。GitHub CI 会另外检查从零安装。

## 已执行的交互观察

独立预览曾实际检查：白/黑朝向、400 px 与较大棋盘、长按后拖放、捕获淡出清理、吃过路兵的真实被吃格、升变为马、易位双棋子效果、将军提示解除、非法走法不改变局面。一次翻转棋盘测试中，87 次静止指针对齐采样的最大中心偏差为 0.000 px，复制棋子残影为 0。

这些是具体测试场景的观察结果，不能推出所有设备和帧率均无偏差。

## 实际应用验证边界

此前本地 macOS release 构建、签名、替换与启动成功。Neo 棋子、绿色棋盘和点击 e2-e4 后的 FEN/棋谱已核对。声音文件与官方下载字节一致，并可由系统音频工具解码。

尚未在打包应用中逐帧核验所有特效；用户开始操作自己的分析棋盘后停止了界面测试。也没有宣称已录音对比实际扬声器输出。普通落子与吃子以外的事件音效未适配。

尚未验证 Windows/Linux 打包流程、Chess960 的特殊易位布局、每一种棋子主题的捕获效果、所有多棋盘/快速回放交互及未来上游版本。

0.1.1 指针修正：新增抓取/释放/窗口失焦/卸载恢复测试，以及棋子悬停、空格恢复、只读棋盘和减少动态效果测试。修复前抓握指针检查实际失败，修复后通过。

0.1.2 红格对齐修正：原回归检查先失败，再修复通过。真实 Chromium 渲染检查覆盖 6 种宽度（含小数宽度）、3 种像素倍率、2 种朝向、4 个格子，共 144 组。修复前 96 组偏差超过 0.02 CSS px，最大 6.125 px；修复后全部通过，最大 0.013671875 px（布局量化误差）。583 px 外框、Retina 2 倍、h8 的偏差由 2.625 px 变为 0。预览截图已检查；这些量化结果属于 Chromium，不能据此声称已经逐帧验证 macOS WebKit 的所有尺寸。

已安装 0.1.2 对应本地构建，重新打开并载入原来的 Qe6+ 局面；实际 macOS 应用截图中 e8 红格与棋盘格对齐。应用签名验证、已安装文件与签名暂存文件逐字节比较、Move/Capture 音效哈希检查全部通过。

## 0.3.0 — 2026-10-13

38 frontend tests, 2 coach backend tests (including real Stockfish), and 5 computer-game backend regressions passed. Release build and strict ad-hoc signature verification passed. Installed bundle matches all 28 staged files; existing Move/Capture asset hashes are unchanged. Previous installation was backed up before replacement.

Native macOS interaction: on-demand e2-e4 hint arrow and SAN displayed; playing e4 cleared the hint, Stockfish answered c5. Native takeback returned to the start; a subsequent d4 received Nf6. Resignation followed by review returned to the opening and produced a live evaluation. Whole-game report completed. A 93-ply saved stalemate game showed the terminal navigation controls and successfully generated an analysis report. The analysis was saved as a separate local PGN, with the unannotated mainline and all clocks retained separately; no personal game is included in the kit.

The hint is an engine suggestion, not a natural-language coach or a full implementation of any online service. Automated tests cover castling/promotion hint conversion and stale-response rejection; native interaction covered the ordinary white-to-move sequence above.
