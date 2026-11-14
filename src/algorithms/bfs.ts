/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlgorithmStep,
  PathfindingResult,
  TrafficGraph,
  TrafficNode,
} from '../types/graph';

/**
 * Tìm đường đi bằng thuật toán BFS (Breadth-First Search)
 * Tìm kiếm theo chiều rộng (theo từng mức số cạnh) để đối chiếu với A*
 */
export function solveBFS(
  graph: TrafficGraph,
  startNodeId: string,
  goalNodeId: string
): PathfindingResult {
  const startTime = performance.now();
  const nodeMap = new Map<string, TrafficNode>(graph.nodes.map(n => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  const goalNode = nodeMap.get(goalNodeId);

  const steps: AlgorithmStep[] = [];

  if (!startNode || !goalNode) {
    return {
      algorithm: 'bfs',
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

  // TC05: Trùng điểm
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
      message: `Điểm bắt đầu "${startNode.name}" trùng với điểm đích. Chi phí bằng 0.`,
      actionType: 'already_at_goal',
    };
    return {
      algorithm: 'bfs',
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

  // Danh sách kề từ cạnh không bị chặn
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

  const queue: string[] = [startNodeId];
  const visited = new Set<string>([startNodeId]);
  const cameFrom: Record<string, string | null> = {};
  const cameFromEdge: Record<string, string | null> = {};
  const gScore: Record<string, number> = {};

  graph.nodes.forEach(n => {
    cameFrom[n.id] = null;
    cameFromEdge[n.id] = null;
    gScore[n.id] = Infinity;
  });

  gScore[startNodeId] = 0;

  let maxFrontierSize = 1;
  let expandedCount = 0;
  let stepCounter = 1;

  steps.push({
    stepNumber: stepCounter++,
    currentNodeId: null,
    openSetIds: [...queue],
    closedSetIds: [],
    fScore: {},
    gScore: { ...gScore },
    hScore: {},
    cameFrom: { ...cameFrom },
    message: `Khởi tạo thuật toán BFS. Đưa nút xuất phát [${startNode.name}] vào hàng đợi (FIFO).`,
    actionType: 'start',
  });

  let goalReached = false;

  while (queue.length > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, queue.length);
    const currentId = queue.shift()!;
    const currentNode = nodeMap.get(currentId)!;
    expandedCount++;

    if (currentId === goalNodeId) {
      goalReached = true;
      steps.push({
        stepNumber: stepCounter++,
        currentNodeId: currentId,
        openSetIds: [...queue],
        closedSetIds: Array.from(visited),
        fScore: {},
        gScore: { ...gScore },
        hScore: {},
        cameFrom: { ...cameFrom },
        message: `BFS đã chạm tới điểm đích [${goalNode.name}]! Tiến hành truy vết đường đi ít cạnh nhất.`,
        actionType: 'found_goal',
      });
      break;
    }

    steps.push({
      stepNumber: stepCounter++,
      currentNodeId: currentId,
      openSetIds: [...queue],
      closedSetIds: Array.from(visited),
      fScore: {},
      gScore: { ...gScore },
      hScore: {},
      cameFrom: { ...cameFrom },
      message: `BFS lấy nút [${currentNode.name}] ra khỏi hàng đợi. Khám phá các nút lân cận theo mức.`,
      actionType: 'expand',
    });

    const neighbors = adjacency.get(currentId) || [];

    for (const { neighborId, edgeId, weight } of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        cameFrom[neighborId] = currentId;
        cameFromEdge[neighborId] = edgeId;
        gScore[neighborId] = gScore[currentId] + weight;
        queue.push(neighborId);

        const neighborNode = nodeMap.get(neighborId)!;
        steps.push({
          stepNumber: stepCounter++,
          currentNodeId: currentId,
          activeEdgeId: edgeId,
          openSetIds: [...queue],
          closedSetIds: Array.from(visited),
          fScore: {},
          gScore: { ...gScore },
          hScore: {},
          cameFrom: { ...cameFrom },
          message: `BFS duyệt thấy [${neighborNode.name}] (mức mới), đưa vào cuối hàng đợi.`,
          actionType: 'evaluate_neighbor',
        });

        if (neighborId === goalNodeId) {
          // Khi tìm thấy đích trong BFS, có thể dừng ngay ở mức này
          goalReached = true;
          steps.push({
            stepNumber: stepCounter++,
            currentNodeId: neighborId,
            openSetIds: [...queue],
            closedSetIds: Array.from(visited),
            fScore: {},
            gScore: { ...gScore },
            hScore: {},
            cameFrom: { ...cameFrom },
            message: `BFS đã tìm thấy đích [${goalNode.name}] ở mức duyệt hiện tại.`,
            actionType: 'found_goal',
          });
          break;
        }
      }
    }

    if (goalReached) {
      break;
    }
  }

  const executionTime = Number((performance.now() - startTime).toFixed(2));

  if (!goalReached) {
    steps.push({
      stepNumber: stepCounter++,
      currentNodeId: null,
      openSetIds: [],
      closedSetIds: Array.from(visited),
      fScore: {},
      gScore: { ...gScore },
      hScore: {},
      cameFrom: { ...cameFrom },
      message: `Hàng đợi BFS trống. Không tìm thấy đường đi từ [${startNode.name}] đến [${goalNode.name}].`,
      actionType: 'no_path',
    });

    return {
      algorithm: 'bfs',
      success: false,
      path: [],
      pathEdges: [],
      totalCost: 0,
      hopCount: 0,
      visitedNodeCount: visited.size,
      expandedNodeCount: expandedCount,
      maxFrontierSize,
      executionTimeMs: executionTime,
      steps,
      message: `BFS không tìm thấy đường đi từ "${startNode.name}" đến "${goalNode.name}".`,
    };
  }

  // Truy vết đường đi
  const path: string[] = [];
  const pathEdges: string[] = [];
  let curr: string | null = goalNodeId;
  let totalCost = 0;

  while (curr !== null) {
    path.unshift(curr);
    const edgeId = cameFromEdge[curr];
    if (edgeId) {
      pathEdges.unshift(edgeId);
      const edge = graph.edges.find(e => e.id === edgeId);
      if (edge) {
        totalCost += edge.weight;
      }
    }
    curr = cameFrom[curr];
  }

  return {
    algorithm: 'bfs',
    success: true,
    path,
    pathEdges,
    totalCost: Number(totalCost.toFixed(2)),
    hopCount: pathEdges.length,
    visitedNodeCount: visited.size,
    expandedNodeCount: expandedCount,
    maxFrontierSize,
    executionTimeMs: executionTime,
    steps,
    message: `BFS tìm thấy đường đi với ${pathEdges.length} bước (Tổng trọng số: ${totalCost.toFixed(1)}).`,
  };
}
