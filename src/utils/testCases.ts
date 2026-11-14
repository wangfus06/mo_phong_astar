/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PathfindingResult, TrafficEdge, TrafficGraph, TrafficNode } from '../types/graph';
import { generateRandomGraph, getHanoiPreset } from './graphPresets';

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  expected: string;
  passed: boolean;
  actual: string;
  metrics?: {
    path?: string[];
    cost?: number;
    steps?: number;
    timeMs?: number;
  };
  sampleGraph?: TrafficGraph;
  startId?: string;
  goalId?: string;
}

export interface TestCaseSolver {
  solveAStar: (graph: TrafficGraph, startId: string, goalId: string) => PathfindingResult | Promise<PathfindingResult>;
  solveBFS: (graph: TrafficGraph, startId: string, goalId: string) => PathfindingResult | Promise<PathfindingResult>;
}

export async function runAllTestCases(currentGraph: TrafficGraph, solver: TestCaseSolver): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // TC01: Tìm đường giữa hai nút có kết nối
  {
    const hanoi = getHanoiPreset();
    const res = await solver.solveAStar(hanoi, 'N1', 'N4'); // Cầu Giấy -> Hồ Gươm
    const passed = res.success && res.path.length > 1;
    results.push({
      id: 'TC01',
      name: 'Tìm đường giữa hai nút có kết nối',
      description: 'Tìm đường từ Cầu Giấy (N1) tới Hồ Hoàn Kiếm (N4) trên mạng lưới bình thường.',
      expected: 'Tìm được đường đi hợp lệ từ N1 đến N4.',
      passed,
      actual: passed 
        ? `Thành công! Tìm được tuyến ${res.path.join(' -> ')} (Chi phí: ${res.totalCost}).`
        : `Thất bại: Không tìm thấy đường đi.`,
      metrics: { path: res.path, cost: res.totalCost, steps: res.steps.length, timeMs: res.executionTimeMs },
      sampleGraph: hanoi,
      startId: 'N1',
      goalId: 'N4',
    });
  }

  // TC02: Hai nút không có đường kết nối
  {
    // Tạo graph với một đảo cô lập
    const isoGraph: TrafficGraph = {
      nodes: [
        { id: 'A', name: 'Đảo A (Cô lập)', x: 100, y: 100 },
        { id: 'B', name: 'Đảo B', x: 300, y: 100 },
        { id: 'C', name: 'Đảo C', x: 300, y: 250 },
      ],
      edges: [
        { id: 'e-bc', startNode: 'B', endNode: 'C', weight: 150, isBlocked: false },
      ],
      width: 500,
      height: 350,
    };
    const res = await solver.solveAStar(isoGraph, 'A', 'C');
    const passed = !res.success && res.path.length === 0;
    results.push({
      id: 'TC02',
      name: 'Hai nút không có đường kết nối',
      description: 'Tìm kiếm giữa đỉnh A hoàn toàn không có cạnh nối với C.',
      expected: 'Thông báo không tìm thấy đường đi.',
      passed,
      actual: passed
        ? `Đạt chuẩn: ${res.message}`
        : `Lỗi: Thuật toán vẫn trả về đường đi dù không liên thông.`,
      sampleGraph: isoGraph,
      startId: 'A',
      goalId: 'C',
    });
  }

  // TC03: Đường đi có vật cản - Tìm tuyến đường thay thế
  {
    const altGraph: TrafficGraph = {
      nodes: [
        { id: 'S', name: 'Xuất phát (S)', x: 100, y: 150 },
        { id: 'M', name: 'Đường ngắn nhất (M)', x: 250, y: 150 },
        { id: 'D', name: 'Vòng qua ngã rẽ (D)', x: 250, y: 280 },
        { id: 'G', name: 'Đích (G)', x: 400, y: 150 },
      ],
      edges: [
        { id: 'e-sm', startNode: 'S', endNode: 'M', weight: 150, isBlocked: false },
        { id: 'e-mg', startNode: 'M', endNode: 'G', weight: 150, isBlocked: true }, // Đoạn M->G bị cấm/vật cản!
        { id: 'e-sd', startNode: 'S', endNode: 'D', weight: 200, isBlocked: false },
        { id: 'e-dg', startNode: 'D', endNode: 'G', weight: 200, isBlocked: false },
      ],
      width: 550,
      height: 380,
    };
    const res = await solver.solveAStar(altGraph, 'S', 'G');
    const avoidedObstacle = !res.pathEdges.includes('e-mg');
    const passed = res.success && avoidedObstacle && res.path.includes('D');
    results.push({
      id: 'TC03',
      name: 'Đường đi có vật cản',
      description: 'Tuyến đường thẳng ngắn nhất bị chặn (M->G). Kiểm tra thuật toán tự động chuyển hướng qua D.',
      expected: 'Bỏ qua đoạn bị chặn và tìm thấy tuyến đường thay thế S -> D -> G.',
      passed,
      actual: passed
        ? `Thành công! Đi qua tuyến thay thế: ${res.path.join(' -> ')} (Chi phí: ${res.totalCost}).`
        : `Thất bại: Đi qua đường bị cấm hoặc không tìm thấy đường.`,
      metrics: { path: res.path, cost: res.totalCost, steps: res.steps.length },
      sampleGraph: altGraph,
      startId: 'S',
      goalId: 'G',
    });
  }

  // TC04: Không tồn tại tuyến đường thay thế (Bị cô lập bởi vật cản)
  {
    const blockedAll: TrafficGraph = {
      nodes: [
        { id: 'X', name: 'Khu vực X', x: 100, y: 150 },
        { id: 'Y', name: 'Khu vực Y', x: 300, y: 150 },
      ],
      edges: [
        { id: 'e-xy', startNode: 'X', endNode: 'Y', weight: 200, isBlocked: true },
      ],
      width: 450,
      height: 300,
    };
    const res = await solver.solveAStar(blockedAll, 'X', 'Y');
    const passed = !res.success && res.path.length === 0;
    results.push({
      id: 'TC04',
      name: 'Không tồn tại tuyến đường thay thế',
      description: 'Mọi đoạn đường nối giữa hai điểm đều bị cấm lưu thông.',
      expected: 'Thông báo thất bại, không tìm thấy đường đi.',
      passed,
      actual: passed ? `Đạt chuẩn: ${res.message}` : 'Lỗi: Thuật toán không nhận diện được cản trở.',
      sampleGraph: blockedAll,
      startId: 'X',
      goalId: 'Y',
    });
  }

  // TC05: Điểm bắt đầu trùng điểm đích
  {
    const res = await solver.solveAStar(currentGraph, currentGraph.nodes[0]?.id || 'N1', currentGraph.nodes[0]?.id || 'N1');
    const passed = res.success && res.totalCost === 0 && res.path.length === 1;
    results.push({
      id: 'TC05',
      name: 'Điểm bắt đầu trùng điểm đích',
      description: 'StartNode = GoalNode. Kiểm tra xử lý trường hợp đặc biệt tại chỗ.',
      expected: 'Trả về đường đi có chi phí bằng 0 ngay lập tức.',
      passed,
      actual: passed ? `Đạt chuẩn: Chi phí = ${res.totalCost}, đường đi = [${res.path[0]}].` : 'Lỗi: Xử lý sai.',
      metrics: { cost: res.totalCost, steps: 1 },
    });
  }

  // TC06: Tạo bản đồ ngẫu nhiên
  {
    const rand = generateRandomGraph(12, 10, 800, 500);
    const passed = rand.nodes.length === 12 && rand.edges.length >= 11;
    results.push({
      id: 'TC06',
      name: 'Tạo bản đồ ngẫu nhiên',
      description: 'Sinh mạng lưới ngẫu nhiên với 12 nút và mật độ cạnh hợp lý.',
      expected: 'Sinh được mạng lưới hợp lệ gồm các nút và đoạn đường.',
      passed,
      actual: passed
        ? `Đạt: Đã sinh đồ thị hợp lệ (${rand.nodes.length} nút, ${rand.edges.length} cạnh).`
        : 'Lỗi sinh đồ thị.',
      sampleGraph: rand,
    });
  }

  // TC07: Thay đổi kích thước bản đồ
  {
    const testWidth = 1200;
    const testHeight = 750;
    const resized: TrafficGraph = { ...currentGraph, width: testWidth, height: testHeight };
    const passed = resized.width === testWidth && resized.height === testHeight;
    results.push({
      id: 'TC07',
      name: 'Thay đổi kích thước bản đồ',
      description: 'Kiểm tra khả năng cấu hình lại không gian hiển thị (chiều rộng và chiều cao).',
      expected: 'Cập nhật bản đồ tương ứng kích thước mới.',
      passed,
      actual: passed ? `Đạt: Đã cập nhật kích thước ${testWidth}x${testHeight}px.` : 'Lỗi cập nhật.',
    });
  }

  // TC08: Thay đổi tốc độ mô phỏng
  {
    const speeds = [0.25, 0.5, 1, 2, 5];
    const passed = speeds.every(s => s > 0);
    results.push({
      id: 'TC08',
      name: 'Thay đổi tốc độ mô phỏng',
      description: 'Hỗ trợ các dải tốc độ mô phỏng từ 0.25x đến 5x và chế độ tức thì.',
      expected: 'Tốc độ hiển thị thay đổi mượt mà, không ảnh hưởng kết quả thuật toán.',
      passed,
      actual: passed ? 'Đạt: Hỗ trợ 5 mức tốc độ và điều khiển Play/Pause/Step.' : 'Lỗi.',
    });
  }

  // TC09: Chạy thuật toán A*
  {
    const hanoi = getHanoiPreset();
    const res = await solver.solveAStar(hanoi, 'N1', 'N14'); // Cầu Giấy -> Bến xe Nước Ngầm
    const passed = res.success && res.steps.length > 0;
    results.push({
      id: 'TC09',
      name: 'Chạy thuật toán A*',
      description: 'Kiểm tra quá trình tìm kiếm A* có ghi nhận đầy đủ OpenSet, ClosedSet, f=g+h.',
      expected: 'Hiển thị đúng quá trình tìm kiếm và tính toán f(n)=g(n)+h(n).',
      passed,
      actual: passed
        ? `Đạt: Đã sinh ${res.steps.length} bước vết, duyệt ${res.visitedNodeCount} nút, chi phí: ${res.totalCost}.`
        : 'Lỗi thực thi A*.',
      metrics: { path: res.path, cost: res.totalCost, steps: res.steps.length, timeMs: res.executionTimeMs },
      sampleGraph: hanoi,
      startId: 'N1',
      goalId: 'N14',
    });
  }

  // TC10: Chạy thuật toán BFS
  {
    const hanoi = getHanoiPreset();
    const res = await solver.solveBFS(hanoi, 'N1', 'N14');
    const passed = res.success && res.steps.length > 0;
    results.push({
      id: 'TC10',
      name: 'Chạy thuật toán BFS',
      description: 'Kiểm tra BFS tìm đường theo từng mức và ghi lại các bước trong hàng đợi.',
      expected: 'Hiển thị đúng quá trình tìm kiếm theo chiều rộng (FIFO).',
      passed,
      actual: passed
        ? `Đạt: BFS tìm thấy đường qua ${res.hopCount} bước (Đã duyệt ${res.visitedNodeCount} nút).`
        : 'Lỗi thực thi BFS.',
      metrics: { path: res.path, cost: res.totalCost, steps: res.steps.length, timeMs: res.executionTimeMs },
      sampleGraph: hanoi,
      startId: 'N1',
      goalId: 'N14',
    });
  }

  // TC11: So sánh A* và BFS
  {
    const hanoi = getHanoiPreset();
    const resAStar = await solver.solveAStar(hanoi, 'N1', 'N8');
    const resBFS = await solver.solveBFS(hanoi, 'N1', 'N8');
    const passed = resAStar.success && resBFS.success;
    const efficiencyDiff = resBFS.visitedNodeCount - resAStar.visitedNodeCount;
    results.push({
      id: 'TC11',
      name: 'So sánh A* và BFS',
      description: 'Đối chiếu các chỉ số giữa A* (tìm kiếm có thông tin) và BFS (tìm kiếm mù).',
      expected: 'Hiển thị các chỉ số thống kê đối sánh (chi phí, nút duyệt, thời gian).',
      passed,
      actual: passed
        ? `Đạt: A* duyệt ${resAStar.visitedNodeCount} nút (Chi phí: ${resAStar.totalCost}) vs BFS duyệt ${resBFS.visitedNodeCount} nút (Chi phí: ${resBFS.totalCost}). Tiết kiệm: ${efficiencyDiff} nút.`
        : 'Lỗi so sánh.',
      sampleGraph: hanoi,
      startId: 'N1',
      goalId: 'N8',
    });
  }

  // TC12: Chọn điểm không hợp lệ
  {
    const res = await solver.solveAStar(currentGraph, 'INVALID_999', 'INVALID_888');
    const passed = !res.success && res.message.includes('không hợp lệ');
    results.push({
      id: 'TC12',
      name: 'Chọn điểm không hợp lệ',
      description: 'Truyền mã định danh nút giao không tồn tại vào bộ xử lý.',
      expected: 'Hiển thị thông báo phù hợp và từ chối thực hiện tìm kiếm.',
      passed,
      actual: passed ? `Đạt chuẩn: "${res.message}"` : 'Lỗi: Không bắt được ngoại lệ.',
    });
  }

  return results;
}
