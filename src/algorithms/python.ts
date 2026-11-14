import pythonSource from './python/pathfinding.py?raw';
import type { HeuristicType, PathfindingResult, TrafficGraph } from '../types/graph';

const PYODIDE_VERSION = '314.0.8';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PythonProxy {
  toJs(options: { dict_converter: (entries: Iterable<readonly [string, unknown]>) => unknown; create_pyproxies: false }): unknown;
  destroy(): void;
}

interface PythonCallable extends PythonProxy {
  (payload: string): PythonProxy;
}

interface PyodideRuntime {
  runPythonAsync(source: string): Promise<unknown>;
  globals: { get(name: string): PythonCallable };
}

interface PythonModule {
  solveAStar(graph: TrafficGraph, startNodeId: string, goalNodeId: string, heuristic: HeuristicType, multiplier: number): PathfindingResult;
  solveBFS(graph: TrafficGraph, startNodeId: string, goalNodeId: string): PathfindingResult;
}

type PyodideLoader = (options: { indexURL: string }) => Promise<PyodideRuntime>;
type PyodideWindow = typeof globalThis & { loadPyodide?: PyodideLoader };

let scriptPromise: Promise<PyodideLoader> | null = null;
let modulePromise: Promise<PythonModule> | null = null;

function loadPyodideLoader(): Promise<PyodideLoader> {
  const pyodideWindow = globalThis as PyodideWindow;
  if (pyodideWindow.loadPyodide) return Promise.resolve(pyodideWindow.loadPyodide);
  if (!scriptPromise) {
    scriptPromise = new Promise<PyodideLoader>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${PYODIDE_BASE_URL}pyodide.js`;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (pyodideWindow.loadPyodide) resolve(pyodideWindow.loadPyodide);
        else reject(new Error('Pyodide loader was not exposed by the runtime script.'));
      };
      script.onerror = () => reject(new Error('Could not download the Pyodide runtime from jsDelivr.'));
      document.head.appendChild(script);
    }).catch(error => {
      scriptPromise = null;
      throw error;
    });
  }
  return scriptPromise!;
}

function callPython<T>(runtime: PyodideRuntime, functionName: string, payload: object): T {
  const callable = runtime.globals.get(functionName);
  const result = callable(JSON.stringify(payload));
  try {
    return result.toJs({ dict_converter: Object.fromEntries, create_pyproxies: false }) as T;
  } finally {
    result.destroy();
    callable.destroy();
  }
}

export function loadPythonModule(): Promise<PythonModule> {
  if (!modulePromise) {
    modulePromise = loadPyodideLoader()
      .then(loadPyodide => loadPyodide({ indexURL: PYODIDE_BASE_URL }))
      .then(async runtime => {
        await runtime.runPythonAsync(pythonSource);
        const module: PythonModule = {
          solveAStar: (graph, startNodeId, goalNodeId, heuristic, multiplier) =>
            callPython<PathfindingResult>(runtime, 'solve_astar_json', {
              graph, startNodeId, goalNodeId, heuristic, multiplier,
            }),
          solveBFS: (graph, startNodeId, goalNodeId) =>
            callPython<PathfindingResult>(runtime, 'solve_bfs_json', { graph, startNodeId, goalNodeId }),
        };
        return module;
      })
      .catch(error => {
        modulePromise = null;
        throw error;
      });
  }
  return modulePromise!;
}

export async function solveAStarPython(
  graph: TrafficGraph,
  startNodeId: string,
  goalNodeId: string,
  heuristic: HeuristicType,
  multiplier: number,
): Promise<PathfindingResult> {
  const module = await loadPythonModule();
  return module.solveAStar(graph, startNodeId, goalNodeId, heuristic, multiplier);
}

export async function solveBFSPython(
  graph: TrafficGraph,
  startNodeId: string,
  goalNodeId: string,
): Promise<PathfindingResult> {
  const module = await loadPythonModule();
  return module.solveBFS(graph, startNodeId, goalNodeId);
}
