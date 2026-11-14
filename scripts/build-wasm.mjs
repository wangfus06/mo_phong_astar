import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'src/algorithms/wasm/pathfinding.cpp');
const output = resolve(root, 'src/algorithms/wasm/generated/pathfinding.mjs');
mkdirSync(dirname(output), { recursive: true });

const result = spawnSync('emcc', [
  source,
  '-o', output,
  '-lembind',
  '-std=c++17',
  '-O2',
  '-sMODULARIZE=1',
  '-sEXPORT_ES6=1',
  '-sEXPORT_NAME=createPathfindingModule',
  '-sENVIRONMENT=web',
  '-sALLOW_MEMORY_GROWTH=1',
  '-sSINGLE_FILE=1',
  '-sFILESYSTEM=0',
], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
