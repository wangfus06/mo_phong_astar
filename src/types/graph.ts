/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeType = 'default' | 'start' | 'goal';

export interface TrafficNode {
  id: string;
  name: string;
  x: number;
  y: number;
  district?: string;
  isLandmark?: boolean;
}

export interface TrafficEdge {
  id: string;
  startNode: string;
  endNode: string;
  weight: number; // Khoảng cách hoặc chi phí di chuyển
  isBlocked: boolean; // Trạng thái vật cản / cấm đường
  roadName?: string; // Tên đường giao thông
  laneCount?: number;
}

export interface TrafficGraph {
  nodes: TrafficNode[];
  edges: TrafficEdge[];
  width: number;
  height: number;
  city?: 'haiphong';
}

export type HeuristicType = 'euclidean' | 'manhattan' | 'chebyshev' | 'dijkstra';

export type AlgorithmType = 'astar' | 'bfs' | 'compare';

export type InteractionMode = 
  | 'select_start' 
  | 'select_goal' 
  | 'toggle_block' 
  | 'add_node' 
  | 'add_edge' 
  | 'delete' 
  | 'move';

export interface AlgorithmStep {
  stepNumber: number;
  currentNodeId: string | null;
  openSetIds: string[]; // Nút đang chờ xét
  closedSetIds: string[]; // Nút đã xét
  fScore: Record<string, number>;
  gScore: Record<string, number>;
  hScore: Record<string, number>;
  cameFrom: Record<string, string | null>;
  activeEdgeId?: string | null;
  message: string;
  actionType: 'start' | 'expand' | 'evaluate_neighbor' | 'found_goal' | 'no_path' | 'already_at_goal';
}

export interface PathfindingResult {
  algorithm: 'astar' | 'bfs';
  success: boolean;
  path: string[]; // Node IDs in sequence
  pathEdges: string[]; // Edge IDs in sequence
  totalCost: number; // Tổng chi phí / khoảng cách
  hopCount: number; // Số cạnh đi qua
  visitedNodeCount: number; // Số nút trong ClosedSet
  expandedNodeCount: number; // Số nút được duyệt
  maxFrontierSize: number; // Đỉnh điểm hàng đợi / OpenSet
  executionTimeMs: number;
  steps: AlgorithmStep[];
  message: string;
}

export interface TestCaseDefinition {
  id: string; // TC01, TC02, ...
  title: string;
  description: string;
  expectedResult: string;
  run: (graph: TrafficGraph) => Promise<{
    passed: boolean;
    actualResult: string;
    details: string;
  }>;
}
