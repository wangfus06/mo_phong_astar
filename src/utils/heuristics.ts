/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TrafficNode } from '../types/graph';

/**
 * Tính khoảng cách hình học giữa 2 nút (Euclid chuẩn)
 */
export function calculateDistance(nodeA: TrafficNode, nodeB: TrafficNode): number {
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Number(Math.sqrt(dx * dx + dy * dy).toFixed(1));
}
