# Neo Croissant

**给 En Croissant 加上 Chess.com 风格的棋子、棋盘、Dynamic 动画和音效，并附一套中文入门训练资料。**

An unofficial Chess.com-style restoration kit for En Croissant: Neo pieces, a green board, Dynamic-style motion, original default move/capture audio, and a Chinese beginner training pack.

基于 **En Croissant 0.15.0** 的固定源码版本。保留原来的棋谱、题库、引擎与分析功能；这不是独立棋类客户端，也不是 Chess.com 官方产品。

## 包含什么

| 部分 | 内容 |
| --- | --- |
| 棋子 | 完整 12 枚 Neo 棋子，300 × 300，保留官方图片原始内容 |
| 棋盘 | `#eeeed2` / `#769656` 绿色棋盘，设置中可选 |
| 抓取与拖动 | 悬停张手、按住抓握指针；短暂放大、回落、随横向移动摆动；视觉层不接管棋子的落点坐标 |
| Dynamic 动画 | 自动移动旋转、渐变轨迹、落点涟漪、吃子淡出、将军提醒、升变、非法落点反馈 |
| 特殊走法 | 王车易位同时处理王和车；吃过路兵在实际被吃格播放效果；四种升变 |
| 音效 | Chess.com 默认普通落子与吃子 MP3，替换 Standard 中这两种声音 |
| 独立预览 | 六个合法场景、播放、翻转、缩放、手动走棋和对齐检查 |
| 人机对弈 | 引擎原生 Elo / 等级、执子与用时、重赛、交换黑白及棋谱保存 |
| 提示与复盘 | 按需显示建议箭头；使用正常分析强度复盘；终局回看与整盘报告入口 |
| 中文训练 | 三份开局库，共 22 条分支；600 道战术、300 道残局；12 道带中文提示的摆棋练习 |
| 开发与恢复 | 固定版本补丁、完整新增源码、数值参考样本、测试、素材校验、构建和备份恢复脚本 |

## 安装（macOS）

当前发布的是**可复现源码还原包**。棋子与声音通过脚本从官方地址下载并校验，仓库不内嵌这些媒体，也不提供打包这些媒体的预编译应用。

需要：Git、Python 3、Node.js 22+、pnpm 11.25.0、Rust/Cargo、Xcode Command Line Tools，以及 En Croissant **0.15.0** 的 `.app`。构建依赖与上游一致。

```sh
git clone https://github.com/Jasoyon/neo-croissant.git
cd neo-croissant
python3 scripts/prepare.py
python3 scripts/build_macos.py --template '/Applications/En Croissant.app'
```

构建成功后，先退出 En Croissant，再安装：

```sh
python3 scripts/install_macos.py --app '.build/En Croissant.app'
```

安装器先生成 ZIP 备份，再替换应用；检测到程序运行会停止。它不读取或覆盖对局、题库、训练成绩和设置。安装失败会尝试还原原应用。

打开 En Croissant → 设置 → 外观：选择 **Chess.com Neo** 与 **Chess.com Green**。声音选择 **Standard**。原本其他主题与音效仍可选。macOS 的“减少动态效果”会停用这套附加动画。

这是本地临时签名构建，不是 Apple 公证发行版；是否允许打开由你的 macOS 安全设置决定。脚本不会修改系统安全设置。

## 先试动画

准备源码后：

```sh
cd .build/upstream
pnpm install --frozen-lockfile
cd ../..
node .build/upstream/node_modules/vite/bin/vite.js --config preview/vite.config.mjs
```

打开 `http://127.0.0.1:5193`。预览不连接账号、不改动实际应用；“基础动画”可作对照。停止终端中的服务即可结束。

## 训练资料

[中文训练指南](training/README.md) 包含导入方法、30 分钟练习安排、开局说明，以及《Chess Fundamentals》和卡帕布兰卡对局集的来源。训练包是另一个可选部分，不会随应用安装自动导入。

## 恢复

安装脚本会打印备份 ZIP 路径，默认放在 `~/Library/Application Support/NeoCroissant/Backups/`。退出应用后运行：

```sh
python3 scripts/install_macos.py --restore '/完整路径/备份.zip'
```

恢复只替换程序，也会备份被替换的版本，不回滚任何之后新增的对局或学习进度。官方更新可能覆盖定制部分；本补丁只验证了所列固定版本，不能直接套到任意新版。

## 验证与范围

[验证记录](docs/VERIFICATION.md) 区分自动测试、独立预览观察和真实 macOS 应用检查；[动画参数](docs/MOTION.md) 记录依据与行为；[工作清单](docs/WORKLOG.md) 说明整个还原过程、修正和未覆盖部分。

不承诺像素级、所有浏览器及所有尺寸下完全一致。尚未接入独立的对手落子、将军、易位、升变音效；也未包含 Chess.com 的娱乐彩蛋。训练页和谜题的判分、间隔复习系统属于 En Croissant 原有功能，没有将这些功能冒称为本项目开发。

## 来源与许可

应用与棋盘源码分别来自 [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) 和 [Chessground](https://github.com/lichess-org/chessground)，遵守 GPL-3.0。项目代码按 [GPL-3.0](LICENSE) 发布；第三方媒体、名称与商标不因此取得本项目许可。900 道题来自 [Lichess CC0 题库](https://database.lichess.org/#puzzles)。完整说明见 [第三方来源](THIRD_PARTY_NOTICES.md)。

### 0.3.0：人机对弈、提示与复盘

保留原有界面控件与配色，支持 Elo / 引擎等级、执子、用时、重赛、交换黑白及保存棋谱。轮到自己时点“提示”显示建议箭头，落子后自动清除。悔棋使用原生图标；结束后点“复盘”，或在“分析 → 报告”生成整盘报告。高级引擎对局设置仍可使用。

已完成本机安装与交互验证；38 项前端检查和 7 项后端检查通过。详见 [实现与验证范围](docs/COMPUTER-PLAY.md) 和 [验证记录](docs/VERIFICATION.md)。
