/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeuristicType, TrafficNode } from '../types/graph';

/**
 * Tính toán chi phí ước lượng Heuristic h(n) từ nút hiện tại tới đích
 */
export function calculateHeuristic(
  node: TrafficNode,
  goalNode: TrafficNode,
  type: HeuristicType = 'euclidean',
  weightMultiplier: number = 1.0
): number {
  if (type === 'dijkstra') {
    return 0;
  }

  const dx = Math.abs(node.x - goalNode.x);
  const dy = Math.abs(node.y - goalNode.y);

  let h = 0;
  switch (type) {
    case 'euclidean':
      // Khoảng cách Euclid (đường chim bay)
      h = Math.sqrt(dx * dx + dy * dy);
      break;

    case 'manhattan':
      // Khoảng cách Manhattan (lưới ô vuông bàn cờ)
      h = dx + dy;
      break;

    case 'chebyshev':
      // Khoảng cách Chebyshev / Diagonal
      h = Math.max(dx, dy);
      break;

    default:
      h = Math.sqrt(dx * dx + dy * dy);
      break;
  }

  return Number((h * weightMultiplier).toFixed(2));
}

/**
 * Tính khoảng cách hình học giữa 2 nút (Euclid chuẩn)
 */
export function calculateDistance(nodeA: TrafficNode, nodeB: TrafficNode): number {
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Number(Math.sqrt(dx * dx + dy * dy).toFixed(1));
}
