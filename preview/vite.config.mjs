import {fileURLToPath} from 'node:url';
const path=(p)=>fileURLToPath(new URL(p,import.meta.url));
export default {root:path('./'),base:'./',resolve:{alias:{'chessops':path('../.build/upstream/node_modules/chessops/dist/esm'),'@lichess-org/chessground':path('../.build/upstream/node_modules/@lichess-org/chessground/dist/chessground.js')}},server:{host:'127.0.0.1',port:5193,strictPort:true,fs:{allow:[path('../')]}},build:{outDir:path('../.build/preview'),emptyOutDir:true,assetsInlineLimit:2000000}};
