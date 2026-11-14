/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  TrafficGraph,
  TrafficNode,
  TrafficEdge,
  InteractionMode,
  AlgorithmStep,
} from '../../types/graph';
import {
  Car,
  MapPin,
  Info,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { displayNodeId } from '../../utils/displayLabels';

interface TrafficCanvasProps {
  graph: TrafficGraph;
  startNodeId: string | null;
  goalNodeId: string | null;
  activeStep: AlgorithmStep | null;
  optimalPath: string[];
  optimalPathEdges: string[];
  interactionMode: InteractionMode;
  onSelectNode: (nodeId: string) => void;
  onToggleEdgeBlocked: (edgeId: string) => void;
  onAddNode: (x: number, y: number) => void;
  onConnectNodes: (nodeAId: string, nodeBId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  algorithmLabel: string;
}

export const TrafficCanvas: React.FC<TrafficCanvasProps> = ({
  graph,
  startNodeId,
  goalNodeId,
  activeStep,
  optimalPath,
  optimalPathEdges,
  interactionMode,
  onSelectNode,
  onToggleEdgeBlocked,
  onAddNode,
  onConnectNodes,
  onDeleteNode,
  onDeleteEdge,
  onMoveNode,
  algorithmLabel,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const movedPointerRef = useRef(false);
  const suppressClickRef = useRef(false);
  const touchPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; zoom: number; graphX: number; graphY: number } | null>(null);

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connect tool temporary node selection
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(null);

  // Vehicle animation state along optimal path
  const [carProgress, setCarProgress] = useState<number>(0);
  const [isDrivingCar, setIsDrivingCar] = useState<boolean>(false);

  // Tooltip state
  const [hoveredNode, setHoveredNode] = useState<{ node: TrafficNode; clientX: number; clientY: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: TrafficEdge; clientX: number; clientY: number } | null>(null);

  // Quick lookup for nodes
  const nodeMap = useMemo(() => new Map(graph.nodes.map(n => [n.id, n])), [graph.nodes]);

  // Sets for quick membership checks in the current step
  const openSet = useMemo(() => new Set(activeStep?.openSetIds || []), [activeStep]);
  const closedSet = useMemo(() => new Set(activeStep?.closedSetIds || []), [activeStep]);
  const optimalPathNodeSet = useMemo(() => new Set(optimalPath), [optimalPath]);
  const optimalPathEdgeSet = useMemo(() => new Set(optimalPathEdges), [optimalPathEdges]);

  // Car Animation Effect
  useEffect(() => {
    let animId: number;
    if (isDrivingCar && optimalPath.length >= 2) {
      const startTime = performance.now();
      const duration = Math.max(3000, optimalPath.length * 1000); // 1s per segment

      const frame = (time: number) => {
        const elapsed = time - startTime;
        const progress = (elapsed % duration) / duration;
        setCarProgress(progress);
        animId = requestAnimationFrame(frame);
      };

      animId = requestAnimationFrame(frame);
    } else {
      setCarProgress(0);
    }
    return () => cancelAnimationFrame(animId);
  }, [isDrivingCar, optimalPath]);

  // Compute animated car position and rotation along the path
  const carState = useMemo(() => {
    if (!isDrivingCar || optimalPath.length < 2) return null;

    const segments: Array<{ from: TrafficNode; to: TrafficNode; dist: number }> = [];
    let totalLength = 0;

    for (let i = 0; i < optimalPath.length - 1; i++) {
      const u = nodeMap.get(optimalPath[i]);
      const v = nodeMap.get(optimalPath[i + 1]);
      if (u && v) {
        const dist = Math.sqrt((u.x - v.x) ** 2 + (u.y - v.y) ** 2);
        segments.push({ from: u, to: v, dist });
        totalLength += dist;
      }
    }

    if (totalLength === 0 || segments.length === 0) return null;

    const targetDistance = carProgress * totalLength;
    let accumulated = 0;

    for (const seg of segments) {
      if (accumulated + seg.dist >= targetDistance || seg === segments[segments.length - 1]) {
        const segProgress = seg.dist > 0 ? (targetDistance - accumulated) / seg.dist : 0;
        const clampedProg = Math.max(0, Math.min(1, segProgress));
        const x = seg.from.x + (seg.to.x - seg.from.x) * clampedProg;
        const y = seg.from.y + (seg.to.y - seg.from.y) * clampedProg;
        const angle = Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x) * (180 / Math.PI);
        return { x, y, angle };
      }
      accumulated += seg.dist;
    }

    return null;
  }, [isDrivingCar, optimalPath, carProgress, nodeMap]);

  const getSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  };

  const getGraphPoint = (clientX: number, clientY: number) => {
    const point = getSvgPoint(clientX, clientY);
    return point ? { x: (point.x - pan.x) / zoom, y: (point.y - pan.y) / zoom } : null;
  };

  // Drag the map to pan; endpoint nodes and edit-mode nodes remain draggable.
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const canPan = e.button === 1 || e.button === 2 || (e.button === 0 && (interactionMode !== 'add_node' || e.pointerType === 'touch'));
    if (!canPan) return;

    const point = getSvgPoint(e.clientX, e.clientY);
    if (!point) return;
    e.preventDefault();
    (target as SVGElement).setPointerCapture(e.pointerId);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    movedPointerRef.current = false;
    setIsPanning(true);
    setPanStart({ x: point.x - pan.x, y: point.y - pan.y });

    if (e.pointerType === 'touch') {
      touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const touches = [...touchPointersRef.current.values()];
      if (touches.length >= 2) {
        const [first, second] = touches;
        const centerX = (first.x + second.x) / 2;
        const centerY = (first.y + second.y) / 2;
        const anchor = getSvgPoint(centerX, centerY);
        if (anchor) {
          pinchStartRef.current = {
            distance: Math.hypot(second.x - first.x, second.y - first.y),
            zoom,
            graphX: (anchor.x - pan.x) / zoom,
            graphY: (anchor.y - pan.y) / zoom,
          };
          movedPointerRef.current = true;
          setIsPanning(false);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch' && touchPointersRef.current.has(e.pointerId)) {
      touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const touches = [...touchPointersRef.current.values()];
      const pinchStart = pinchStartRef.current;
      if (touches.length >= 2 && pinchStart) {
        const [first, second] = touches;
        const centerX = (first.x + second.x) / 2;
        const centerY = (first.y + second.y) / 2;
        const anchor = getSvgPoint(centerX, centerY);
        if (anchor) {
          const distance = Math.hypot(second.x - first.x, second.y - first.y);
          const nextZoom = Math.max(0.35, Math.min(5, pinchStart.zoom * distance / pinchStart.distance));
          setZoom(nextZoom);
          setPan({ x: anchor.x - pinchStart.graphX * nextZoom, y: anchor.y - pinchStart.graphY * nextZoom });
        }
        movedPointerRef.current = true;
        return;
      }
    }

    const point = getSvgPoint(e.clientX, e.clientY);
    if (!point) return;
    const start = pointerStartRef.current;
    if (draggingNodeId && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 3) movedPointerRef.current = true;

    if (isPanning) {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 3) movedPointerRef.current = true;
      setPan({ x: point.x - panStart.x, y: point.y - panStart.y });
      return;
    }

    if (draggingNodeId) {
      const graphX = (point.x - pan.x) / zoom - dragOffset.x;
      const graphY = (point.y - pan.y) / zoom - dragOffset.y;
      const clampedX = Math.round(Math.max(40, Math.min(graph.width - 40, graphX)));
      const clampedY = Math.round(Math.max(40, Math.min(graph.height - 40, graphY)));
      onMoveNode(draggingNodeId, clampedX, clampedY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch') touchPointersRef.current.delete(e.pointerId);
    const remainingTouches = [...touchPointersRef.current.values()];
    if (movedPointerRef.current && remainingTouches.length === 0) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    const target = e.target as Element & { hasPointerCapture?: (pointerId: number) => boolean; releasePointerCapture?: (pointerId: number) => void };
    if (target.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture?.(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);

    if (remainingTouches.length > 0) {
      pinchStartRef.current = null;
      const remaining = remainingTouches[0];
      pointerStartRef.current = remaining;
      const point = getSvgPoint(remaining.x, remaining.y);
      if (point) setPanStart({ x: point.x - pan.x, y: point.y - pan.y });
      setIsPanning(true);
      setDraggingNodeId(null);
      return;
    }

    pointerStartRef.current = null;
    pinchStartRef.current = null;
    movedPointerRef.current = false;
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (interactionMode === 'add_node') {
      const point = getGraphPoint(e.clientX, e.clientY);
      if (point) onAddNode(Math.round(point.x), Math.round(point.y));
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const anchor = getSvgPoint(e.clientX, e.clientY);
    if (!anchor) return;
    const nextZoom = Math.max(0.35, Math.min(5, zoom * Math.exp(-e.deltaY * 0.0012)));
    const graphX = (anchor.x - pan.x) / zoom;
    const graphY = (anchor.y - pan.y) / zoom;
    setPan({ x: anchor.x - graphX * nextZoom, y: anchor.y - graphY * nextZoom });
    setZoom(nextZoom);
  };

  const zoomAtCenter = (factor: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const anchor = getSvgPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!anchor) return;
    const nextZoom = Math.max(0.35, Math.min(5, zoom * factor));
    const graphX = (anchor.x - pan.x) / zoom;
    const graphY = (anchor.y - pan.y) / zoom;
    setPan({ x: anchor.x - graphX * nextZoom, y: anchor.y - graphY * nextZoom });
    setZoom(nextZoom);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    if (interactionMode === 'select_start' || interactionMode === 'select_goal') {
      onSelectNode(nodeId);
      return;
    }

    if (interactionMode === 'delete') {
      onDeleteNode(nodeId);
      return;
    }

    if (interactionMode === 'add_edge') {
      if (!connectSourceNodeId) {
        setConnectSourceNodeId(nodeId);
      } else if (connectSourceNodeId === nodeId) {
        setConnectSourceNodeId(null);
      } else {
        onConnectNodes(connectSourceNodeId, nodeId);
        setConnectSourceNodeId(null);
      }
      return;
    }

    // Default node click selects as Start or Goal if none set
    onSelectNode(nodeId);
  };

  const handleNodePointerDown = (e: React.PointerEvent<SVGGElement>, node: TrafficNode) => {
    e.stopPropagation();
    if (node.id === startNodeId || node.id === goalNodeId || interactionMode === 'move' || e.shiftKey) {
      const svg = svgRef.current;
      if (!svg) return;
      const point = getGraphPoint(e.clientX, e.clientY);
      if (!point) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      movedPointerRef.current = false;
      setDraggingNodeId(node.id);
      setDragOffset({ x: point.x - node.x, y: point.y - node.y });
    }
  };

  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    if (interactionMode === 'delete') {
      onDeleteEdge(edgeId);
    } else {
      // Toggle blocked state
      onToggleEdgeBlocked(edgeId);
    }
  };

  return (
    <div 
      className="relative w-full h-full min-h-[420px] bg-slate-50 overflow-hidden select-none border-0 rounded-none shadow-none flex flex-col"
    >
      {/* Top Banner Toolbar inside Canvas */}
      <div className="absolute top-[76px] left-3 right-3 z-20 flex flex-wrap items-center justify-between pointer-events-none gap-2 sm:top-[84px]">
        {/* Left: Interaction status badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-200 shadow-lg">
          <div className="w-2 h-2 rounded-full animate-ping bg-emerald-500" />
          <span className="font-semibold text-slate-100">
            {interactionMode === 'select_start' && 'Nhấp nút trên bản đồ để chọn điểm bắt đầu'}
            {interactionMode === 'select_goal' && 'Nhấp nút trên bản đồ để chọn điểm đích'}
            {interactionMode === 'toggle_block' && 'Nhấp vào đoạn đường để chặn hoặc mở lưu thông'}
            {interactionMode === 'add_node' && 'Nhấp vào khoảng trống để tạo nút giao thông mới'}
            {interactionMode === 'add_edge' && (connectSourceNodeId ? `Chọn nút thứ hai để nối với [${nodeMap.get(connectSourceNodeId)?.name || displayNodeId(connectSourceNodeId, graph)}]` : 'Nhấp nút đầu tiên để bắt đầu nối đường')}
            {interactionMode === 'move' && 'Nhấp giữ và kéo nút giao thông để di chuyển tọa độ'}
            {interactionMode === 'delete' && 'Nhấp vào nút giao hoặc đoạn đường để xóa'}
          </span>
          <span className="border-l border-slate-200 pl-2 text-[10px] text-slate-500">Kéo nền để rê · kéo A/B để đổi vị trí</span>
        </div>

        {/* Right: Zoom & Reset Canvas Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg shadow-lg">
          <div className="flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1 text-[10px] text-sky-900" title={`Đang sử dụng thuật toán ${algorithmLabel}`}>
            <span className="font-semibold text-sky-700">Thuật toán</span>
            <span className="font-bold">{algorithmLabel}</span>
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          {optimalPath.length >= 2 && (
            <button
              onClick={() => setIsDrivingCar(!isDrivingCar)}
              title="Chạy mô phỏng xe lăn bánh trên lộ trình tối ưu"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                isDrivingCar
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/30'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{isDrivingCar ? 'Dừng xe' : 'Chạy xe thử'}</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => zoomAtCenter(1.25)}
            title="Phóng to"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomAtCenter(0.8)}
            title="Thu nhỏ"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="min-w-12 px-1 text-center text-[11px] font-medium tabular-nums text-slate-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Đặt lại góc nhìn (Reset view)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-[132px] z-30 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setIsLegendOpen(open => !open)}
          aria-expanded={isLegendOpen}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur transition hover:bg-white"
        >
          <Info className="h-3.5 w-3.5 text-sky-700" />
          Chú giải
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`} />
        </button>
        {isLegendOpen && (
          <div className="w-[min(15rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white/95 p-3 text-[11px] text-slate-700 shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">Ký hiệu trên bản đồ</span>
              <span className="text-[10px] text-slate-500">{graph.nodes.length} nút · {graph.edges.length} tuyến</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Xuất phát A</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />Đích B</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Đang xét</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-700" />Đã xét</div>
              <div className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-emerald-500" />Đường tối ưu</div>
              <div className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed border-red-500" />Đường bị chặn</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive SVG */}
      <svg
        ref={svgRef}
        className={`w-full h-full flex-1 ${interactionMode === 'add_node' ? 'cursor-crosshair' : isPanning || draggingNodeId ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none' }}
        viewBox={`0 0 ${graph.width} ${graph.height}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleSvgClick}
        onWheel={handleWheel}
        onContextMenu={event => event.preventDefault()}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dbe5f0" strokeWidth="0.8" opacity="0.8" />
          </pattern>
          <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#cbd5e1" opacity="0.7" />
          </pattern>

          {/* Blocked Road Hazard Stripe Pattern */}
          <pattern id="hazardStripe" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="6" />
            <line x1="6" y1="0" x2="6" y2="12" stroke="#1e1e1e" strokeWidth="6" />
          </pattern>

          {/* Glow filter for optimal path */}
          <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowActive" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background Grid */}
          <rect data-map-background="true" width={graph.width} height={graph.height} fill="#eff6ff" />
          <rect data-map-background="true" width={graph.width} height={graph.height} fill="url(#roadGrid)" />
          <rect data-map-background="true" width={graph.width} height={graph.height} fill="url(#dotGrid)" />

          {graph.city === 'haiphong' && (
            <g pointerEvents="none">
              <path
                d="M 0 220 C 150 198 220 232 350 275 C 470 315 565 257 690 270 C 850 286 990 330 1280 270 L 1280 335 C 1000 390 850 333 690 320 C 560 307 480 365 350 330 C 220 295 145 260 0 285 Z"
                fill="#bfdbfe"
                opacity="0.58"
              />
              <path
                d="M 170 575 C 310 548 405 570 520 596 C 650 626 770 560 930 575 L 930 632 C 770 620 665 676 510 630 C 390 595 305 590 170 620 Z"
                fill="#bfdbfe"
                opacity="0.58"
              />
              <text x="105" y="270" fill="#2563a6" fontSize="13" fontWeight="700" letterSpacing="2">SÔNG CẤM</text>
              <text x="180" y="612" fill="#2563a6" fontSize="12" fontWeight="700" letterSpacing="1.5">SÔNG LẠCH TRAY</text>
              <text x="785" y="180" fill="#64748b" fontSize="12" fontWeight="700" letterSpacing="1.5">KHU VỰC CẢNG ĐÌNH VŨ</text>
              <text x="470" y="485" fill="#64748b" fontSize="12" fontWeight="700" letterSpacing="1.5">TRUNG TÂM THÀNH PHỐ</text>
            </g>
          )}

          {/* Outer Border of simulated territory */}
          <rect
            x="2"
            y="2"
            width={graph.width - 4}
            height={graph.height - 4}
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            rx="8"
          />

          {/* ======================================================== */}
          {/* LAYER 1: EDGES (ROADS) */}
          {/* ======================================================== */}
          {graph.edges.map(edge => {
            const startNode = nodeMap.get(edge.startNode);
            const endNode = nodeMap.get(edge.endNode);
            if (!startNode || !endNode) return null;

            const isBlocked = edge.isBlocked;
            const isOptimal = optimalPathEdgeSet.has(edge.id);
            const isActive = activeStep?.activeEdgeId === edge.id;

            // Midpoint for weight & barrier labels
            const midX = (startNode.x + endNode.x) / 2;
            const midY = (startNode.y + endNode.y) / 2;
            const dx = endNode.x - startNode.x;
            const dy = endNode.y - startNode.y;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            // Keep label readable from left to right
            if (angle > 90 || angle < -90) {
              angle += 180;
            }

            return (
              <g
                key={edge.id}
                className="cursor-pointer group"
                onClick={e => handleEdgeClick(e, edge.id)}
                onMouseEnter={e => setHoveredEdge({ edge, clientX: e.clientX, clientY: e.clientY })}
                onMouseLeave={() => setHoveredEdge(null)}
              >
                {/* Invisible wide stroke for easy clicking & hovering */}
                <line
                  x1={startNode.x}
                  y1={startNode.y}
                  x2={endNode.x}
                  y2={endNode.y}
                  stroke="transparent"
                  strokeWidth="24"
                />

                {/* Base Road Asphalt Stroke */}
                <line
                  x1={startNode.x}
                  y1={startNode.y}
                  x2={endNode.x}
                  y2={endNode.y}
                  stroke={isBlocked ? '#fecaca' : isOptimal ? '#a7f3d0' : '#dbeafe'}
                  strokeWidth={isOptimal ? 9 : 6}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />

                {/* Road Surface Details */}
                {isBlocked ? (
                  // Blocked road hazard line
                  <line
                    x1={startNode.x}
                    y1={startNode.y}
                    x2={endNode.x}
                    y2={endNode.y}
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                ) : isOptimal ? (
                  // Optimal path highlight (Emerald Neon)
                  <line
                    x1={startNode.x}
                    y1={startNode.y}
                    x2={endNode.x}
                    y2={endNode.y}
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#glowGreen)"
                  />
                ) : isActive ? (
                  // Active edge evaluation pulse
                  <line
                    x1={startNode.x}
                    y1={startNode.y}
                    x2={endNode.x}
                    y2={endNode.y}
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    strokeLinecap="round"
                    filter="url(#glowActive)"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="0;-24"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  </line>
                ) : (
                  // Standard road center line
                  <line
                    x1={startNode.x}
                    y1={startNode.y}
                    x2={endNode.x}
                    y2={endNode.y}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                  />
                )}

                {/* Road Midpoint Badge: Distance or Blocked icon */}
                <g transform={`translate(${midX}, ${midY})`}>
                  {isBlocked ? (
                    // 🚧 Barrier Sign
                    <g className="filter drop-shadow-md">
                      <rect
                        x="-14"
                        y="-10"
                        width="28"
                        height="20"
                        rx="4"
                        fill="#7f1d1d"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fontSize="11"
                        fill="#ffffff"
                        fontWeight="bold"
                      >
                        🚧
                      </text>
                    </g>
                  ) : (
                    // Weight badge (Distance in meters / km)
                    <g transform={`rotate(${angle})`} className="opacity-90 group-hover:opacity-100 transition-opacity">
                      <rect
                        x="-18"
                        y="-8"
                        width="36"
                        height="16"
                        rx="3"
                        fill={isOptimal ? '#dcfce7' : isActive ? '#dbeafe' : '#eff6ff'}
                        stroke={isOptimal ? '#10b981' : isActive ? '#38bdf8' : '#93c5fd'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="600"
                        fill={isOptimal ? '#047857' : isActive ? '#075985' : '#1e3a8a'}
                      >
                        {Math.round(edge.weight)}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* ======================================================== */}
          {/* LAYER 2: NODES (JUNCTIONS) */}
          {/* ======================================================== */}
          {graph.nodes.map(node => {
            const isStart = node.id === startNodeId;
            const isGoal = node.id === goalNodeId;
            const isCurrent = activeStep?.currentNodeId === node.id;
            const isInOpen = openSet.has(node.id);
            const isInClosed = closedSet.has(node.id);
            const isOptimal = optimalPathNodeSet.has(node.id);
            const isConnectSource = connectSourceNodeId === node.id;

            // Determine Node Color & Rings
            let fillColor = '#ffffff';
            let strokeColor = '#60a5fa';
            let radius = 12;

            if (isStart) {
              fillColor = '#059669';
              strokeColor = '#34d399';
              radius = 16;
            } else if (isGoal) {
              fillColor = '#dc2626';
              strokeColor = '#f87171';
              radius = 16;
            } else if (isCurrent) {
              fillColor = '#0284c7';
              strokeColor = '#38bdf8';
              radius = 15;
            } else if (isOptimal) {
              fillColor = '#047857';
              strokeColor = '#10b981';
              radius = 14;
            } else if (isInClosed) {
              fillColor = '#312e81';
              strokeColor = '#6366f1';
              radius = 12;
            } else if (isInOpen) {
              fillColor = '#d97706';
              strokeColor = '#fbbf24';
              radius = 13;
            }

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                transform={`translate(${node.x}, ${node.y})`}
                onClick={e => handleNodeClick(e, node.id)}
                onPointerDown={e => handleNodePointerDown(e, node)}
                onMouseEnter={e => setHoveredNode({ node, clientX: e.clientX, clientY: e.clientY })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Connect tool highlight aura */}
                {isConnectSource && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="animate-spin"
                  />
                )}

                {/* Animated Pulsing Ring for Start or Active Goal */}
                {isStart && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {isGoal && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {isCurrent && (
                  <circle
                    r={radius + 7}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    opacity="0.9"
                    filter="url(#glowActive)"
                  />
                )}

                {/* Node Circle Body */}
                <circle
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isStart || isGoal || isCurrent ? 2.5 : 1.8}
                  className="transition-all duration-150 group-hover:scale-110"
                />

                {/* Node Center Icon / ID */}
                {isStart ? (
                  <text
                    textAnchor="middle"
                    y="4"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    A
                  </text>
                ) : isGoal ? (
                  <text
                    textAnchor="middle"
                    y="4"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    B
                  </text>
                ) : (
                  <text
                    textAnchor="middle"
                    y="3.5"
                    fill="#1e3a8a"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {displayNodeId(node.id, graph)}
                  </text>
                )}

                {/* Junction Name Label (Below Node) */}
                <g transform={`translate(0, ${radius + 12})`} className="pointer-events-none">
                  <rect
                    x={-((node.name.length * 6) / 2 + 5)}
                    y="-8"
                    width={node.name.length * 6 + 10}
                    height="14"
                    rx="3"
                    fill="#ffffff"
                    fillOpacity="0.95"
                    stroke="#dbeafe"
                    strokeWidth="0.7"
                  />
                  <text
                    textAnchor="middle"
                    y="2.5"
                    fontSize="9"
                    fill={isStart ? '#047857' : isGoal ? '#b91c1c' : isOptimal ? '#047857' : '#334155'}
                    fontWeight={node.isLandmark ? 'bold' : 'normal'}
                  >
                    {node.name}
                  </text>
                </g>

                {/* Dynamic f(n) badge above node during A* search */}
                {activeStep && activeStep.fScore && activeStep.fScore[node.id] !== undefined && activeStep.fScore[node.id] < Infinity && (
                  <g transform={`translate(0, -${radius + 8})`} className="pointer-events-none">
                    <rect
                      x="-18"
                      y="-7"
                      width="36"
                      height="13"
                      rx="3"
                      fill="#1e1b4b"
                      stroke="#818cf8"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#e0e7ff"
                    >
                      f:{Math.round(activeStep.fScore[node.id])}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ======================================================== */}
          {/* LAYER 3: ANIMATED VEHICLE (CAR) ON OPTIMAL PATH */}
          {/* ======================================================== */}
          {carState && (
            <g
              transform={`translate(${carState.x}, ${carState.y}) rotate(${carState.angle})`}
              className="pointer-events-none filter drop-shadow-xl"
            >
              {/* Car Body */}
              <rect
                x="-14"
                y="-8"
                width="28"
                height="16"
                rx="4"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Windshield */}
              <rect x="2" y="-6" width="6" height="12" rx="1.5" fill="#1e293b" />
              {/* Headlights */}
              <circle cx="13" cy="-5" r="1.5" fill="#fef08a" />
              <circle cx="13" cy="5" r="1.5" fill="#fef08a" />
              {/* Taillights */}
              <circle cx="-13" cy="-5" r="1.2" fill="#ef4444" />
              <circle cx="-13" cy="5" r="1.2" fill="#ef4444" />
            </g>
          )}
        </g>
      </svg>

      {/* Floating Hover Tooltip for Node */}
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl text-xs text-slate-200 w-56 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoveredNode.clientX, top: hoveredNode.clientY - 12 }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-bold text-slate-100 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              {hoveredNode.node.name}
            </span>
            <span className="font-mono text-[10px] text-slate-400">ID: {displayNodeId(hoveredNode.node.id, graph)}</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Tọa độ (X, Y):</span>
              <span className="font-mono text-slate-300">({hoveredNode.node.x}, {hoveredNode.node.y})</span>
            </div>
            {hoveredNode.node.district && (
              <div className="flex justify-between text-slate-400">
                <span>Khu vực / Quận:</span>
                <span className="text-slate-300">{hoveredNode.node.district}</span>
              </div>
            )}
            {activeStep && (
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-400 font-mono">g(n) thực tế:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {activeStep.gScore[hoveredNode.node.id] !== undefined && activeStep.gScore[hoveredNode.node.id] < Infinity
                      ? activeStep.gScore[hoveredNode.node.id].toFixed(1)
                      : '∞'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400 font-mono">h(n) ước lượng:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {activeStep.hScore[hoveredNode.node.id] !== undefined
                      ? activeStep.hScore[hoveredNode.node.id].toFixed(1)
                      : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-400 font-mono">f(n) = g + h:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {activeStep.fScore[hoveredNode.node.id] !== undefined && activeStep.fScore[hoveredNode.node.id] < Infinity
                      ? activeStep.fScore[hoveredNode.node.id].toFixed(1)
                      : '∞'}
                  </span>
                </div>
                {activeStep.cameFrom[hoveredNode.node.id] && (
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Nút cha (Parent):</span>
                    <span className="font-mono text-slate-200">{displayNodeId(activeStep.cameFrom[hoveredNode.node.id]!, graph)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip for Edge */}
      {hoveredEdge && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-lg shadow-2xl text-xs text-slate-200 w-52 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoveredEdge.clientX, top: hoveredEdge.clientY - 10 }}
        >
          <div className="font-semibold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
            <span>{hoveredEdge.edge.roadName || 'Tuyến đường'}</span>
            <span className="text-[10px] text-slate-400 font-mono">{hoveredEdge.edge.id}</span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Độ dài / Chi phí:</span>
              <span className="font-mono font-semibold text-emerald-400">{Math.round(hoveredEdge.edge.weight)} m</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Trạng thái:</span>
              <span className={`font-semibold ${hoveredEdge.edge.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                {hoveredEdge.edge.isBlocked ? 'Đang bị chặn' : 'Lưu thông tốt'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              Nhấp chuột để {hoveredEdge.edge.isBlocked ? 'mở lại tuyến' : 'chặn tuyến này'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
