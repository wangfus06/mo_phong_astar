import type { HeuristicType, PathfindingResult, TrafficGraph } from '../types/graph';

interface PathfindingModule {
  solveAStar(graph: TrafficGraph, startNodeId: string, goalNodeId: string, heuristic: HeuristicType, multiplier: number): PathfindingResult;
  solveBFS(graph: TrafficGraph, startNodeId: string, goalNodeId: string): PathfindingResult;
}

let modulePromise: Promise<PathfindingModule> | null = null;

export function loadPathfindingModule(): Promise<PathfindingModule> {
  if (!modulePromise) {
    modulePromise = import('./wasm/generated/pathfinding.mjs')
      .then(({ default: createModule }) => createModule())
      .then(module => module as unknown as PathfindingModule)
      .catch(error => {
        modulePromise = null;
        throw error;
      });
  }
  return modulePromise;
}

export async function solveAStarCpp(
  graph: TrafficGraph,
  startNodeId: string,
  goalNodeId: string,
  heuristic: HeuristicType,
  multiplier: number,
): Promise<PathfindingResult> {
  const module = await loadPathfindingModule();
  return module.solveAStar(graph, startNodeId, goalNodeId, heuristic, multiplier);
}

export async function solveBFSCpp(
  graph: TrafficGraph,
  startNodeId: string,
  goalNodeId: string,
): Promise<PathfindingResult> {
  const module = await loadPathfindingModule();
  return module.solveBFS(graph, startNodeId, goalNodeId);
}
