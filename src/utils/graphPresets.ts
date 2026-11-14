/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrafficEdge, TrafficGraph, TrafficNode } from '../types/graph';
import { calculateDistance } from './heuristics';

/**
 * Bản đồ mẫu 1: Mạng lưới Giao thông Đô thị Thủ đô
 */
export function getHanoiPreset(): TrafficGraph {
  const nodes: TrafficNode[] = [
    { id: 'N1', name: 'Cầu Giấy', x: 160, y: 220, district: 'Cầu Giấy', isLandmark: true },
    { id: 'N2', name: 'Kim Mã', x: 320, y: 190, district: 'Ba Đình' },
    { id: 'N3', name: 'Ba Đình', x: 480, y: 160, district: 'Ba Đình', isLandmark: true },
    { id: 'N4', name: 'Hồ Hoàn Kiếm', x: 650, y: 180, district: 'Hoàn Kiếm', isLandmark: true },
    { id: 'N5', name: 'Nguyễn Trãi', x: 180, y: 380, district: 'Thanh Xuân' },
    { id: 'N6', name: 'Ngã Tư Sở', x: 360, y: 350, district: 'Đống Đa', isLandmark: true },
    { id: 'N7', name: 'Giải Phóng', x: 530, y: 380, district: 'Hai Bà Trưng' },
    { id: 'N8', name: 'Cầu Vĩnh Tuy', x: 740, y: 340, district: 'Hai Bà Trưng' },
    { id: 'N9', name: 'Phạm Văn Đồng', x: 130, y: 90, district: 'Bắc Từ Liêm' },
    { id: 'N10', name: 'Tây Hồ', x: 360, y: 80, district: 'Tây Hồ', isLandmark: true },
    { id: 'N11', name: 'Cầu Long Biên', x: 670, y: 90, district: 'Hoàn Kiếm' },
    { id: 'N12', name: 'Long Biên Plaza', x: 840, y: 160, district: 'Long Biên' },
    { id: 'N13', name: 'Linh Đàm', x: 380, y: 500, district: 'Hoàng Mai' },
    { id: 'N14', name: 'Bến xe Nước Ngầm', x: 580, y: 490, district: 'Hoàng Mai', isLandmark: true },
    { id: 'N15', name: 'Vành đai 3 Cầu Dậu', x: 220, y: 480, district: 'Thanh Trì' },
  ];

  const rawEdges: Array<[string, string, string, boolean]> = [
    // [from, to, roadName, isBlocked]
    ['N9', 'N1', 'Đường Vành đai 3', false],
    ['N9', 'N10', 'Đường Hoàng Quốc Việt', false],
    ['N10', 'N2', 'Đường Liễu Giai - Văn Cao', false],
    ['N10', 'N3', 'Đường Thụy Khuê', false],
    ['N10', 'N11', 'Đường Yên Phụ', false],
    ['N1', 'N2', 'Đường Cầu Giấy', false],
    ['N2', 'N3', 'Đường Kim Mã - Nguyễn Thái Học', false],
    ['N3', 'N4', 'Đường Tràng Thi - Hàng Bông', false],
    ['N4', 'N11', 'Đường Trần Nhật Duật', false],
    ['N11', 'N12', 'Cầu Long Biên qua sông Hồng', false],
    ['N1', 'N5', 'Đường Vũ Trọng Phụng', false],
    ['N1', 'N6', 'Đường Láng', false],
    ['N2', 'N6', 'Đường Huỳnh Thúc Kháng - Thái Hà', false],
    ['N3', 'N6', 'Đường Tôn Đức Thắng - Tây Sơn', false],
    ['N3', 'N7', 'Đường Lê Duẩn', false],
    ['N4', 'N7', 'Đường Bà Triệu - Phố Huế', false],
    ['N4', 'N8', 'Đường Trần Quang Khải - Nguyễn Khoái', false],
    ['N12', 'N8', 'Đường Đàm Quang Trung - Cầu Vĩnh Tuy', false],
    ['N5', 'N6', 'Đường Nguyễn Trãi', false],
    ['N5', 'N15', 'Đường Kim Giang', false],
    ['N6', 'N7', 'Đường Trường Chinh', false],
    ['N6', 'N13', 'Đường Định Công', false],
    ['N7', 'N8', 'Đường Minh Khai - Đại La', false],
    ['N7', 'N14', 'Đường Giải Phóng - Ngọc Hồi', false],
    ['N15', 'N13', 'Đường Vành đai 3 Nam', false],
    ['N13', 'N14', 'Đường Hoàng Liệt', false],
    ['N14', 'N8', 'Đường Vành đai 2.5', false],
  ];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const edges: TrafficEdge[] = rawEdges.map(([from, to, roadName, isBlocked], idx) => {
    const nodeA = nodeMap.get(from)!;
    const nodeB = nodeMap.get(to)!;
    const weight = calculateDistance(nodeA, nodeB);
    return {
      id: `e-${from}-${to}-${idx}`,
      startNode: from,
      endNode: to,
      weight,
      isBlocked,
      roadName,
      laneCount: 4,
    };
  });

  return {
    nodes,
    edges,
    width: 950,
    height: 580,
  };
}

/** Schematic Hải Phòng road graph based on central districts and major crossings. */
export function getHaiPhongPreset(): TrafficGraph {
  const nodes: TrafficNode[] = [
    { id: 'HP_NUI_DEO', name: 'Núi Đèo', x: 150, y: 145, district: 'Thủy Nguyên' },
    { id: 'HP_THUY_NGUYEN', name: 'Bắc Sông Cấm', x: 400, y: 115, district: 'Thủy Nguyên', isLandmark: true },
    { id: 'HP_VSIP', name: 'Khu đô thị Bắc Sông Cấm', x: 675, y: 125, district: 'Thủy Nguyên', isLandmark: true },
    { id: 'HP_CAU_BINH', name: 'Cầu Bính', x: 350, y: 270, district: 'Hồng Bàng', isLandmark: true },
    { id: 'HP_CAU_HVT', name: 'Cầu Hoàng Văn Thụ', x: 690, y: 270, district: 'Hồng Bàng', isLandmark: true },
    { id: 'HP_THUONG_LY', name: 'Bến xe Thượng Lý', x: 235, y: 390, district: 'Hồng Bàng', isLandmark: true },
    { id: 'HP_TAM_BAC', name: 'Phố Tam Bạc', x: 420, y: 405, district: 'Hồng Bàng' },
    { id: 'HP_NHA_HAT', name: 'Nhà hát thành phố', x: 600, y: 430, district: 'Hồng Bàng', isLandmark: true },
    { id: 'HP_GA', name: 'Ga Hải Phòng', x: 485, y: 540, district: 'Lê Chân', isLandmark: true },
    { id: 'HP_LAC_VIEN', name: 'Ngã sáu Lạc Viên', x: 790, y: 395, district: 'Ngô Quyền', isLandmark: true },
    { id: 'HP_LE_HONG_PHONG', name: 'Đường Lê Hồng Phong', x: 930, y: 450, district: 'Ngô Quyền' },
    { id: 'HP_CAT_BI', name: 'Sân bay Cát Bi', x: 1030, y: 555, district: 'Hải An', isLandmark: true },
    { id: 'HP_CAU_RAO', name: 'Cầu Rào', x: 800, y: 625, district: 'Ngô Quyền', isLandmark: true },
    { id: 'HP_CAU_NIEM', name: 'Cầu Niệm', x: 390, y: 635, district: 'Lê Chân', isLandmark: true },
    { id: 'HP_KIEN_AN', name: 'Trung tâm Kiến An', x: 160, y: 670, district: 'Kiến An' },
    { id: 'HP_DO_SON', name: 'Đồ Sơn', x: 1050, y: 735, district: 'Đồ Sơn', isLandmark: true },
    { id: 'HP_DINH_VU', name: 'Cảng Đình Vũ', x: 1050, y: 290, district: 'Hải An', isLandmark: true },
    { id: 'HP_CAT_HAI', name: 'Cát Hải', x: 1190, y: 125, district: 'Cát Hải', isLandmark: true },
  ];

  const rawEdges: Array<[string, string, string]> = [
    ['HP_NUI_DEO', 'HP_THUY_NGUYEN', 'Quốc lộ 10'],
    ['HP_THUY_NGUYEN', 'HP_VSIP', 'Đường Bắc Sông Cấm'],
    ['HP_THUY_NGUYEN', 'HP_CAU_BINH', 'Đường dẫn Cầu Bính'],
    ['HP_VSIP', 'HP_CAU_HVT', 'Đường dẫn Cầu Hoàng Văn Thụ'],
    ['HP_CAU_BINH', 'HP_THUONG_LY', 'Cầu Bính · Bạch Đằng'],
    ['HP_CAU_HVT', 'HP_LAC_VIEN', 'Cầu Hoàng Văn Thụ'],
    ['HP_THUONG_LY', 'HP_TAM_BAC', 'Đường Hùng Vương'],
    ['HP_TAM_BAC', 'HP_NHA_HAT', 'Đường Điện Biên Phủ'],
    ['HP_TAM_BAC', 'HP_GA', 'Đường Trần Nguyên Hãn'],
    ['HP_NHA_HAT', 'HP_GA', 'Đường Trần Phú'],
    ['HP_NHA_HAT', 'HP_LAC_VIEN', 'Đường Lê Lợi'],
    ['HP_LAC_VIEN', 'HP_LE_HONG_PHONG', 'Đường Lê Hồng Phong'],
    ['HP_LE_HONG_PHONG', 'HP_CAT_BI', 'Đường Lê Hồng Phong · Cát Bi'],
    ['HP_NHA_HAT', 'HP_CAT_BI', 'Đường Nguyễn Bỉnh Khiêm'],
    ['HP_LE_HONG_PHONG', 'HP_CAU_RAO', 'Đường Lạch Tray'],
    ['HP_CAT_BI', 'HP_CAU_RAO', 'Cầu Rào · đường Ngô Gia Tự'],
    ['HP_CAU_RAO', 'HP_DO_SON', 'Đường Phạm Văn Đồng · Đồ Sơn'],
    ['HP_GA', 'HP_CAU_NIEM', 'Cầu Niệm · đường Trường Chinh'],
    ['HP_CAU_NIEM', 'HP_CAU_RAO', 'Đường Nguyễn Văn Linh'],
    ['HP_KIEN_AN', 'HP_CAU_NIEM', 'Đường Trường Chinh'],
    ['HP_KIEN_AN', 'HP_THUONG_LY', 'Đường Trần Nguyên Hãn'],
    ['HP_LAC_VIEN', 'HP_DINH_VU', 'Đường Nguyễn Bỉnh Khiêm · Đình Vũ'],
    ['HP_DINH_VU', 'HP_CAT_BI', 'Đường bao phía Đông Nam'],
    ['HP_DINH_VU', 'HP_CAT_HAI', 'Cầu Tân Vũ – Lạch Huyện'],
    ['HP_VSIP', 'HP_DINH_VU', 'Hành lang công nghiệp phía Bắc'],
  ];

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const edges: TrafficEdge[] = rawEdges.map(([startNode, endNode, roadName], index) => {
    const start = nodeMap.get(startNode)!;
    const end = nodeMap.get(endNode)!;
    return {
      id: `e-hp-${index + 1}`,
      startNode,
      endNode,
      weight: calculateDistance(start, end),
      isBlocked: false,
      roadName,
      laneCount: roadName.includes('Cầu') ? 4 : 3,
    };
  });

  return { nodes, edges, width: 1280, height: 820, city: 'haiphong' };
}

/**
 * Bản đồ mẫu 2: Mạng lưới Lưới Bàn Cờ (Grid City)
 */
export function getGridPreset(rows: number = 4, cols: number = 6): TrafficGraph {
  const nodes: TrafficNode[] = [];
  const edges: TrafficEdge[] = [];
  const xOffset = 120;
  const yOffset = 90;
  const xSpacing = 130;
  const ySpacing = 110;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `G_${r}_${c}`;
      nodes.push({
        id,
        name: `Nút [${r + 1},${c + 1}]`,
        x: xOffset + c * xSpacing,
        y: yOffset + r * ySpacing,
        district: `Khu phố ${String.fromCharCode(65 + r)}`,
      });
    }
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let edgeCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const currentId = `G_${r}_${c}`;
      const current = nodeMap.get(currentId)!;

      // Cạnh ngang (East)
      if (c + 1 < cols) {
        const eastId = `G_${r}_${c + 1}`;
        const east = nodeMap.get(eastId)!;
        edges.push({
          id: `e-h-${edgeCount++}`,
          startNode: currentId,
          endNode: eastId,
          weight: calculateDistance(current, east),
          isBlocked: (r === 1 && c === 2) || (r === 2 && c === 1), // Một vài vật cản mẫu
          roadName: `Đại lộ ${r + 1} Đông - Tây`,
          laneCount: 3,
        });
      }

      // Cạnh dọc (South)
      if (r + 1 < rows) {
        const southId = `G_${r + 1}_${c}`;
        const south = nodeMap.get(southId)!;
        edges.push({
          id: `e-v-${edgeCount++}`,
          startNode: currentId,
          endNode: southId,
          weight: calculateDistance(current, south),
          isBlocked: (r === 1 && c === 3),
          roadName: `Phố ${c + 1} Bắc - Nam`,
          laneCount: 2,
        });
      }
    }
  }

  // Thêm một số đường chéo cao tốc
  if (rows >= 3 && cols >= 4) {
    const diag1Start = `G_0_0`;
    const diag1End = `G_1_1`;
    edges.push({
      id: `e-diag-${edgeCount++}`,
      startNode: diag1Start,
      endNode: diag1End,
      weight: calculateDistance(nodeMap.get(diag1Start)!, nodeMap.get(diag1End)!),
      isBlocked: false,
      roadName: 'Đường chéo kết nối nhanh',
      laneCount: 4,
    });
  }

  return {
    nodes,
    edges,
    width: xOffset * 2 + (cols - 1) * xSpacing,
    height: yOffset * 2 + (rows - 1) * ySpacing,
  };
}

/**
 * Bản đồ mẫu 3: Vành đai & Xuyên tâm (Radial & Ring)
 */
export function getRadialPreset(): TrafficGraph {
  const nodes: TrafficNode[] = [];
  const edges: TrafficEdge[] = [];
  const centerX = 450;
  const centerY = 280;

  // Nút trung tâm CBD
  nodes.push({
    id: 'CBD',
    name: 'Trung tâm Đô thị (CBD)',
    x: centerX,
    y: centerY,
    district: 'Quận Trung Tâm',
    isLandmark: true,
  });

  const innerRadius = 140;
  const outerRadius = 240;
  const sectors = 6;

  // Vành đai 1 và Vành đai 2
  for (let i = 0; i < sectors; i++) {
    const angle = (i * 2 * Math.PI) / sectors - Math.PI / 2;
    const ix = Math.round(centerX + innerRadius * Math.cos(angle));
    const iy = Math.round(centerY + innerRadius * Math.sin(angle));
    const ox = Math.round(centerX + outerRadius * Math.cos(angle));
    const oy = Math.round(centerY + outerRadius * Math.sin(angle));

    nodes.push({
      id: `R1_${i}`,
      name: `Vành đai 1 - Cửa ô ${i + 1}`,
      x: ix,
      y: iy,
      district: 'Vành Đai Trong',
    });

    nodes.push({
      id: `R2_${i}`,
      name: `Vành đai 2 - Nút giao ${i + 1}`,
      x: ox,
      y: oy,
      district: 'Vành Đai Ngoài',
      isLandmark: i % 2 === 0,
    });
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let eIdx = 0;

  // Cạnh nối từ tâm ra Vành đai 1 và Vành đai 2 (trục xuyên tâm)
  for (let i = 0; i < sectors; i++) {
    const r1 = `R1_${i}`;
    const r2 = `R2_${i}`;

    edges.push({
      id: `e-rad1-${eIdx++}`,
      startNode: 'CBD',
      endNode: r1,
      weight: calculateDistance(nodeMap.get('CBD')!, nodeMap.get(r1)!),
      isBlocked: false,
      roadName: `Đại lộ Xuyên tâm ${i + 1}`,
      laneCount: 4,
    });

    edges.push({
      id: `e-rad2-${eIdx++}`,
      startNode: r1,
      endNode: r2,
      weight: calculateDistance(nodeMap.get(r1)!, nodeMap.get(r2)!),
      isBlocked: i === 2, // 1 đoạn trục bị chặn để buộc rẽ vành đai
      roadName: `Đường nối Cửa ô ${i + 1}`,
      laneCount: 3,
    });

    // Vành đai 1 khép kín
    const nextI = (i + 1) % sectors;
    const nextR1 = `R1_${nextI}`;
    edges.push({
      id: `e-ring1-${eIdx++}`,
      startNode: r1,
      endNode: nextR1,
      weight: calculateDistance(nodeMap.get(r1)!, nodeMap.get(nextR1)!),
      isBlocked: false,
      roadName: 'Đường Vành đai 1',
      laneCount: 3,
    });

    // Vành đai 2 khép kín
    const nextR2 = `R2_${nextI}`;
    edges.push({
      id: `e-ring2-${eIdx++}`,
      startNode: r2,
      endNode: nextR2,
      weight: calculateDistance(nodeMap.get(r2)!, nodeMap.get(nextR2)!),
      isBlocked: false,
      roadName: 'Cao tốc Vành đai 2',
      laneCount: 6,
    });
  }

  return {
    nodes,
    edges,
    width: 900,
    height: 560,
  };
}

/**
 * Bản đồ mẫu 4: Điểm nghẽn Cầu qua sông (River Chokepoint Challenge)
 * Thích hợp để xem A* tìm đường tránh cầu bị chặn
 */
export function getRiverChokepointPreset(): TrafficGraph {
  const nodes: TrafficNode[] = [
    // Bờ Tây (Left Bank)
    { id: 'W1', name: 'Khu Đô thị Tây 1', x: 120, y: 150, district: 'Bờ Tây' },
    { id: 'W2', name: 'Ngã tư Tây 2', x: 250, y: 180, district: 'Bờ Tây' },
    { id: 'W3', name: 'Khu Công nghệ Tây', x: 140, y: 320, district: 'Bờ Tây' },
    { id: 'W4', name: 'Trạm Đầu cầu Tây Nam', x: 260, y: 380, district: 'Bờ Tây' },
    { id: 'W5', name: 'Trạm Đầu cầu Tây Bắc', x: 260, y: 80, district: 'Bờ Tây' },

    // Các mố cầu trên sông
    { id: 'BR_N', name: 'Cầu Bắc (Đang tắc/chặn)', x: 450, y: 80, district: 'Qua Sông' },
    { id: 'BR_C', name: 'Cầu Trung Tâm (Cầu chính)', x: 450, y: 230, district: 'Qua Sông', isLandmark: true },
    { id: 'BR_S', name: 'Cầu Nam (Cầu phao/vòng)', x: 450, y: 420, district: 'Qua Sông' },

    // Bờ Đông (Right Bank)
    { id: 'E1', name: 'Trạm Đầu cầu Đông Bắc', x: 640, y: 80, district: 'Bờ Đông' },
    { id: 'E2', name: 'Khu Đô thị Đông 1', x: 780, y: 140, district: 'Bờ Đông' },
    { id: 'E3', name: 'Ngã tư Trung tâm Đông', x: 650, y: 230, district: 'Bờ Đông' },
    { id: 'E4', name: 'Cảng Đông', x: 800, y: 320, district: 'Bờ Đông', isLandmark: true },
    { id: 'E5', name: 'Trạm Đầu cầu Đông Nam', x: 640, y: 420, district: 'Bờ Đông' },
  ];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const rawEdges: Array<[string, string, string, boolean]> = [
    // Bờ Tây
    ['W1', 'W2', 'Đường Vành Đai Tây', false],
    ['W1', 'W5', 'Đường Bắc Ngạn', false],
    ['W2', 'W3', 'Trục nối Trung Tâm Tây', false],
    ['W3', 'W4', 'Đường Nam Ngạn', false],
    ['W2', 'BR_C', 'Đường dẫn Cầu Trung Tâm', false],
    ['W5', 'BR_N', 'Đường dẫn Cầu Bắc', false],
    ['W4', 'BR_S', 'Đường dẫn Cầu Nam', false],

    // Cầu qua sông (Cầu Bắc bị chặn thi công)
    ['BR_N', 'E1', 'Cầu Bắc (🚧 Thi công sửa chữa)', true],
    ['BR_C', 'E3', 'Cầu Trung Tâm 8 làn xe', false],
    ['BR_S', 'E5', 'Cầu Nam 4 làn xe', false],

    // Bờ Đông
    ['E1', 'E2', 'Đại lộ Bờ Đông Bắc', false],
    ['E1', 'E3', 'Đường bao Đông', false],
    ['E3', 'E2', 'Phố Thương Mại Đông', false],
    ['E3', 'E4', 'Trục chính Cảng Đông', false],
    ['E3', 'E5', 'Đường bao Đông Nam', false],
    ['E5', 'E4', 'Đường ven sông Đông', false],
  ];

  const edges: TrafficEdge[] = rawEdges.map(([from, to, roadName, isBlocked], idx) => {
    const nodeA = nodeMap.get(from)!;
    const nodeB = nodeMap.get(to)!;
    return {
      id: `e-river-${idx}`,
      startNode: from,
      endNode: to,
      weight: calculateDistance(nodeA, nodeB),
      isBlocked,
      roadName,
      laneCount: roadName.includes('Cầu') ? 6 : 3,
    };
  });

  return {
    nodes,
    edges,
    width: 920,
    height: 520,
  };
}

/**
 * Sinh bản đồ ngẫu nhiên hợp lệ (SRS 3.7)
 */
export function generateRandomGraph(
  nodeCount: number = 16,
  blockedPercent: number = 15,
  width: number = 950,
  height: number = 550
): TrafficGraph {
  const nodes: TrafficNode[] = [];
  const edges: TrafficEdge[] = [];
  const padding = 70;

  // Tạo các nút với khoảng cách tối thiểu
  const minDistance = 75;
  const attemptsMax = 150;

  for (let i = 0; i < nodeCount; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < attemptsMax) {
      attempts++;
      const x = Math.round(padding + Math.random() * (width - 2 * padding));
      const y = Math.round(padding + Math.random() * (height - 2 * padding));

      // Kiểm tra khoảng cách với các nút đã tạo
      const tooClose = nodes.some(n => {
        const d = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
        return d < minDistance;
      });

      if (!tooClose || attempts === attemptsMax - 1) {
        nodes.push({
          id: `N${i + 1}`,
          name: `Nút ${i + 1}`,
          x,
          y,
          district: `Khu ${Math.floor(i / 4) + 1}`,
          isLandmark: i === 0 || i === nodeCount - 1 || i % 5 === 0,
        });
        placed = true;
      }
    }
  }

  // Kết nối các nút lân cận (k-nearest neighbors) để đảm bảo tính liên thông
  const edgeSet = new Set<string>();
  let edgeIdCounter = 1;

  nodes.forEach(nodeA => {
    // Sắp xếp các nút khác theo khoảng cách
    const sorted = [...nodes]
      .filter(n => n.id !== nodeA.id)
      .map(n => ({
        node: n,
        dist: calculateDistance(nodeA, n),
      }))
      .sort((a, b) => a.dist - b.dist);

    // Nối với 2 đến 3 nút gần nhất
    const connectionsToMake = Math.min(sorted.length, Math.floor(Math.random() * 2) + 2);

    for (let k = 0; k < connectionsToMake; k++) {
      const neighbor = sorted[k].node;
      const key = [nodeA.id, neighbor.id].sort().join('--');

      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        const isBlocked = Math.random() * 100 < blockedPercent;
        edges.push({
          id: `e-rand-${edgeIdCounter++}`,
          startNode: nodeA.id,
          endNode: neighbor.id,
          weight: sorted[k].dist,
          isBlocked,
          roadName: `Đoạn đường ${nodeA.id}-${neighbor.id}`,
          laneCount: 2 + Math.floor(Math.random() * 3),
        });
      }
    }
  });

  return {
    nodes,
    edges,
    width,
    height,
  };
}
