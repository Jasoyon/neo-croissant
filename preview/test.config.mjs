import {fileURLToPath} from 'node:url';
export default {resolve:{alias:{'chessops':fileURLToPath(new URL('../.build/upstream/node_modules/chessops/dist/esm',import.meta.url))}},test:{environment:'jsdom',include:['preview/*.test.ts']}};
