/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlgorithmStep,
  HeuristicType,
  PathfindingResult,
  TrafficGraph,
  TrafficNode,
} from '../types/graph';
import { calculateHeuristic } from '../utils/heuristics';

/**
 * Tìm đường đi tối ưu bằng thuật toán A* (A-Star)
 * Công thức: f(n) = g(n) + h(n)
 */
export function solveAStar(
  graph: TrafficGraph,
  startNodeId: string,
  goalNodeId: string,
  heuristicType: HeuristicType = 'euclidean',
  heuristicMultiplier: number = 1.0
): PathfindingResult {
  const startTime = performance.now();
  const nodeMap = new Map<string, TrafficNode>(graph.nodes.map(n => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  const goalNode = nodeMap.get(goalNodeId);

  // Khởi tạo các tập hợp
  const steps: AlgorithmStep[] = [];

  if (!startNode || !goalNode) {
    return {
      algorithm: 'astar',
      success: false,
      path: [],
      pathEdges: [],
      totalCost: 0,
      hopCount: 0,
      visitedNodeCount: 0,
      expandedNodeCount: 0,
      maxFrontierSize: 0,
      executionTimeMs: 0,
      steps: [],
      message: 'Điểm bắt đầu hoặc điểm đích không hợp lệ.',
    };
  }

  // Trường hợp kiểm thử TC05: Điểm bắt đầu trùng điểm đích
  if (startNodeId === goalNodeId) {
    const step: AlgorithmStep = {
      stepNumber: 1,
      currentNodeId: startNodeId,
      openSetIds: [startNodeId],
      closedSetIds: [],
      fScore: { [startNodeId]: 0 },
      gScore: { [startNodeId]: 0 },
      hScore: { [startNodeId]: 0 },
      cameFrom: { [startNodeId]: null },
      message: `Điểm bắt đầu "${startNode.name}" trùng với điểm đích. Chi phí di chuyển bằng 0.`,
      actionType: 'already_at_goal',
    };
    return {
      algorithm: 'astar',
      success: true,
      path: [startNodeId],
      pathEdges: [],
      totalCost: 0,
      hopCount: 0,
      visitedNodeCount: 1,
      expandedNodeCount: 1,
      maxFrontierSize: 1,
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
      steps: [step],
      message: 'Điểm bắt đầu trùng điểm đích (Chi phí = 0).',
    };
  }

  // Xây dựng danh sách kề từ các cạnh không bị chặn
  // Đồ thị vô hướng cho mạng lưới giao thông hai chiều
  const adjacency = new Map<string, Array<{ neighborId: string; edgeId: string; weight: number }>>();
  graph.nodes.forEach(n => adjacency.set(n.id, []));

  graph.edges.forEach(edge => {
    if (!edge.isBlocked) {
      adjacency.get(edge.startNode)?.push({
        neighborId: edge.endNode,
        edgeId: edge.id,
        weight: edge.weight,
      });
      adjacency.get(edge.endNode)?.push({
        neighborId: edge.startNode,
        edgeId: edge.id,
        weight: edge.weight,
      });
    }
  });

  const openSet = new Set<string>([startNodeId]);
  const closedSet = new Set<string>();

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const hScore: Record<string, number> = {};
  const cameFrom: Record<string, string | null> = {};
  const cameFromEdge: Record<string, string | null> = {};

  graph.nodes.forEach(n => {
    gScore[n.id] = Infinity;
    fScore[n.id] = Infinity;
    hScore[n.id] = calculateHeuristic(n, goalNode, heuristicType, heuristicMultiplier);
    cameFrom[n.id] = null;
    cameFromEdge[n.id] = null;
  });

  gScore[startNodeId] = 0;
  fScore[startNodeId] = hScore[startNodeId];

  let maxFrontierSize = 1;
  let expandedCount = 0;
  let stepCounter = 1;

  // Bước mở đầu
  steps.push({
    stepNumber: stepCounter++,
    currentNodeId: null,
    openSetIds: Array.from(openSet),
    closedSetIds: [],
    fScore: { ...fScore },
    gScore: { ...gScore },
    hScore: { ...hScore },
    cameFrom: { ...cameFrom },
    message: `Khởi tạo thuật toán A*. Đưa nút xuất phát [${startNode.name}] vào OpenSet với g=0, h=${hScore[startNodeId]}, f=${fScore[startNodeId]}.`,
    actionType: 'start',
  });

  let goalReached = false;

  while (openSet.size > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, openSet.size);

    // Tìm nút có f(n) nhỏ nhất trong openSet, tie-break bằng h(n) nhỏ hơn
    let currentId = '';
    let minF = Infinity;
    let minH = Infinity;

    for (const id of openSet) {
      const f = fScore[id];
      const h = hScore[id];
      if (f < minF || (f === minF && h < minH)) {
        minF = f;
        minH = h;
        currentId = id;
      }
    }

    const currentNode = nodeMap.get(currentId)!;
    expandedCount++;

    // Kiểm tra nếu đã đến đích
    if (currentId === goalNodeId) {
      goalReached = true;
      openSet.delete(currentId);
      closedSet.add(currentId);

      steps.push({
        stepNumber: stepCounter++,
        currentNodeId: currentId,
        openSetIds: Array.from(openSet),
        closedSetIds: Array.from(closedSet),
        fScore: { ...fScore },
        gScore: { ...gScore },
        hScore: { ...hScore },
        cameFrom: { ...cameFrom },
        message: `Đã tìm thấy điểm đích [${goalNode.name}]! Tổng chi phí g(n) = ${gScore[goalNodeId].toFixed(1)}. Tiến hành truy vết đường đi.`,
        actionType: 'found_goal',
      });
      break;
    }

    // Chuyển nút hiện tại từ openSet sang closedSet
    openSet.delete(currentId);
    closedSet.add(currentId);

    steps.push({
      stepNumber: stepCounter++,
      currentNodeId: currentId,
      openSetIds: Array.from(openSet),
      closedSetIds: Array.from(closedSet),
      fScore: { ...fScore },
      gScore: { ...gScore },
      hScore: { ...hScore },
      cameFrom: { ...cameFrom },
      message: `Mở rộng nút [${currentNode.name}] (f=${fScore[currentId].toFixed(1)}, g=${gScore[currentId].toFixed(1)}, h=${hScore[currentId].toFixed(1)}). Duyệt các nút lân cận.`,
      actionType: 'expand',
    });

    // Duyệt qua các nút lân cận
    const neighbors = adjacency.get(currentId) || [];

    for (const { neighborId, edgeId, weight } of neighbors) {
      if (closedSet.has(neighborId)) {
        continue; // Đã đóng, bỏ qua
      }

      const tentativeG = gScore[currentId] + weight;
      const neighborNode = nodeMap.get(neighborId)!;

      if (tentativeG < gScore[neighborId]) {
        // Tìm thấy đường đi tốt hơn đến neighbor
        cameFrom[neighborId] = currentId;
        cameFromEdge[neighborId] = edgeId;
        gScore[neighborId] = Number(tentativeG.toFixed(2));
        fScore[neighborId] = Number((tentativeG + hScore[neighborId]).toFixed(2));

        const isNewInOpen = !openSet.has(neighborId);
        openSet.add(neighborId);

        steps.push({
          stepNumber: stepCounter++,
          currentNodeId: currentId,
          activeEdgeId: edgeId,
          openSetIds: Array.from(openSet),
          closedSetIds: Array.from(closedSet),
          fScore: { ...fScore },
          gScore: { ...gScore },
          hScore: { ...hScore },
          cameFrom: { ...cameFrom },
          message: `${isNewInOpen ? 'Thêm' : 'Cập nhật'} nút lân cận [${neighborNode.name}] qua cạnh trọng số ${weight}: g=${gScore[neighborId].toFixed(1)}, f=${fScore[neighborId].toFixed(1)}.`,
          actionType: 'evaluate_neighbor',
        });
      }
    }
  }

  const executionTime = Number((performance.now() - startTime).toFixed(2));

  if (!goalReached) {
    steps.push({
      stepNumber: stepCounter++,
      currentNodeId: null,
      openSetIds: [],
      closedSetIds: Array.from(closedSet),
      fScore: { ...fScore },
      gScore: { ...gScore },
      hScore: { ...hScore },
      cameFrom: { ...cameFrom },
      message: `OpenSet trống. Không tìm thấy đường đi từ [${startNode.name}] tới [${goalNode.name}] (Các tuyến khả dụng đều bị chặn hoặc không có kết nối).`,
      actionType: 'no_path',
    });

    return {
      algorithm: 'astar',
      success: false,
      path: [],
      pathEdges: [],
      totalCost: 0,
      hopCount: 0,
      visitedNodeCount: closedSet.size,
      expandedNodeCount: expandedCount,
      maxFrontierSize,
      executionTimeMs: executionTime,
      steps,
      message: `Không tìm thấy đường đi từ "${startNode.name}" đến "${goalNode.name}".`,
    };
  }

  // Truy vết đường đi từ Goal về Start
  const path: string[] = [];
  const pathEdges: string[] = [];
  let curr: string | null = goalNodeId;

  while (curr !== null) {
    path.unshift(curr);
    const edgeId = cameFromEdge[curr];
    if (edgeId) {
      pathEdges.unshift(edgeId);
    }
    curr = cameFrom[curr];
  }

  return {
    algorithm: 'astar',
    success: true,
    path,
    pathEdges,
    totalCost: Number(gScore[goalNodeId].toFixed(2)),
    hopCount: pathEdges.length,
    visitedNodeCount: closedSet.size,
    expandedNodeCount: expandedCount,
    maxFrontierSize,
    executionTimeMs: executionTime,
    steps,
    message: `Tìm thấy đường đi tối ưu với chi phí ${gScore[goalNodeId].toFixed(1)} qua ${path.length} nút giao.`,
  };
}
