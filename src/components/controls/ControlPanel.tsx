/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlgorithmType,
  HeuristicType,
  InteractionMode,
  TrafficGraph,
} from '../../types/graph';
import { displayNodeId } from '../../utils/displayLabels';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Flag,
  MapPin,
  Ban,
  PlusCircle,
  Link,
  Move,
  Trash2,
  ArrowRightLeft,
  Settings,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface ControlPanelProps {
  graph: TrafficGraph;
  startNodeId: string | null;
  goalNodeId: string | null;
  setStartNodeId: (id: string) => void;
  setGoalNodeId: (id: string) => void;
  algorithm: AlgorithmType;
  setAlgorithm: (algo: AlgorithmType) => void;
  heuristic: HeuristicType;
  setHeuristic: (h: HeuristicType) => void;
  heuristicMultiplier: number;
  setHeuristicMultiplier: (m: number) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  // Playback
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onResetSimulation: () => void;
  onJumpToEnd: () => void;
  speed: number;
  setSpeed: (s: number) => void;
  currentStepIndex: number;
  totalSteps: number;
  onSeekStep: (stepIdx: number) => void;
  // Presets & Tools
  currentPreset: string;
  onSelectPreset: (presetKey: string) => void;
  onClearObstacles: () => void;
  onRandomObstacles: () => void;
  onOpenMapSettings: () => void;
  onOpenTestCases: () => void;
  showPlayback?: boolean;
  embedded?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  graph,
  startNodeId,
  goalNodeId,
  setStartNodeId,
  setGoalNodeId,
  algorithm,
  setAlgorithm,
  heuristic,
  setHeuristic,
  heuristicMultiplier,
  setHeuristicMultiplier,
  interactionMode,
  setInteractionMode,
  isPlaying,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onResetSimulation,
  onJumpToEnd,
  speed,
  setSpeed,
  currentStepIndex,
  totalSteps,
  onSeekStep,
  currentPreset,
  onSelectPreset,
  onClearObstacles,
  onRandomObstacles,
  onOpenMapSettings,
  onOpenTestCases,
  showPlayback = true,
  embedded = false,
}) => {
  const swapStartAndGoal = () => {
    if (startNodeId && goalNodeId) {
      const temp = startNodeId;
      setStartNodeId(goalNodeId);
      setGoalNodeId(temp);
    }
  };

  const tools: Array<{ mode: InteractionMode; label: string; icon: React.ReactNode; tooltip: string }> = [
    { mode: 'select_start', label: 'Chọn Xuất Phát', icon: <MapPin className="w-3.5 h-3.5 text-emerald-400" />, tooltip: 'Chọn điểm bắt đầu' },
    { mode: 'select_goal', label: 'Chọn Điểm Đích', icon: <Flag className="w-3.5 h-3.5 text-red-400" />, tooltip: 'Chọn điểm đến' },
    { mode: 'toggle_block', label: 'Chặn / Mở Đường', icon: <Ban className="w-3.5 h-3.5 text-amber-400" />, tooltip: 'Đặt hoặc xóa vật cản trên đường' },
    { mode: 'move', label: 'Di Chuyển Nút', icon: <Move className="w-3.5 h-3.5 text-sky-400" />, tooltip: 'Kéo thả nút trên bản đồ' },
    { mode: 'add_node', label: 'Thêm Nút', icon: <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />, tooltip: 'Nhấp trên bản đồ để thêm nút mới' },
    { mode: 'add_edge', label: 'Nối Tuyến Đường', icon: <Link className="w-3.5 h-3.5 text-cyan-400" />, tooltip: 'Chọn 2 nút liên tiếp để tạo đường' },
    { mode: 'delete', label: 'Xóa Phần Tử', icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />, tooltip: 'Nhấp nút hoặc cạnh để xóa' },
  ];

  const speeds = [
    { label: '0.25x', value: 0.25 },
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1.0 },
    { label: '2x', value: 2.0 },
    { label: '5x', value: 5.0 },
    { label: 'Tức thì', value: 0 },
  ];

  return (
    <div className={embedded ? 'min-w-0 space-y-4 text-slate-700' : 'bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4'}>
      <div className="border-b border-slate-200 pb-3">
        <h2 className={`text-sm font-bold ${embedded ? 'text-slate-900' : 'text-white'}`}>Thiết lập hành trình</h2>
        <p className={`mt-1 text-xs ${embedded ? 'text-slate-500' : 'text-slate-400'}`}>
          Chọn bản đồ, điểm xuất phát và điểm đến, sau đó chạy mô phỏng.
        </p>
      </div>
      {/* ROW 1: Map Presets & Global Actions */}
      <div className={`border-b border-slate-200 pb-3 ${embedded ? 'flex min-w-0 flex-col items-stretch gap-3' : 'flex flex-wrap items-center justify-between gap-3'}`}>
        {/* Preset Selector */}
        <div className={`flex items-center gap-2 ${embedded ? 'min-w-0 justify-between' : ''}`}>
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            Bản đồ:
          </label>
          <select
            value={currentPreset}
            onChange={e => onSelectPreset(e.target.value)}
            className={`min-w-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 ${embedded ? 'flex-1 border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-800 text-slate-100'}`}
          >
            <option value="haiphong">Hải Phòng · mạng đường chính</option>
            <option value="hanoi">Đô thị Hà Nội (15 nút)</option>
            <option value="grid">Lưới Bàn Cờ (Grid 4x6)</option>
            <option value="radial">Vành Đai & Xuyên Tâm (Radial CBD)</option>
            <option value="river">Điểm Nghẽn Cầu Qua Sông</option>
            <option value="random">Sinh Ngẫu Nhiên Mới</option>
          </select>
        </div>

        {/* Action Shortcuts */}
        <div className={embedded ? 'grid grid-cols-2 gap-2' : 'flex items-center gap-2'}>
          <button
            onClick={onRandomObstacles}
            title="Ngẫu nhiên chặn một số tuyến đường để mô phỏng sự cố"
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${embedded ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-amber-500/30 bg-slate-800 text-amber-300 hover:bg-slate-700'}`}
          >
            <Ban className="w-3.5 h-3.5 text-amber-400" />
            <span>Chặn ngẫu nhiên</span>
          </button>

          <button
            onClick={onClearObstacles}
            title="Mở lưu thông toàn bộ các đoạn đường"
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${embedded ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <span>Xóa vật cản</span>
          </button>

          <button
            onClick={onOpenMapSettings}
            title="Tùy chỉnh kích thước bản đồ & thông số sinh ngẫu nhiên"
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${embedded ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Kích thước</span>
          </button>

          <button
            onClick={onOpenTestCases}
            title="Chạy bộ kiểm thử 12 kịch bản theo Mục 7 SRS (TC01 - TC12)"
            className={`col-span-2 flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors shadow-sm ${embedded ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kiểm thử TC01-TC12</span>
          </button>
        </div>
      </div>

      {/* ROW 2: Start & Goal Pickers + Algorithm Mode */}
      <div className={`grid items-center gap-2 ${embedded ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'grid-cols-1 md:grid-cols-12 gap-3'}`}>
        {/* Start Node Dropdown */}
        <div className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 ${embedded ? 'border-slate-200 bg-white' : 'md:col-span-3 border-slate-800 bg-slate-950/60'}`}>
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">ĐIỂM XUẤT PHÁT (A)</div>
            <select
              value={startNodeId || ''}
              onChange={e => setStartNodeId(e.target.value)}
              className={`w-full bg-transparent text-xs font-semibold focus:outline-none truncate ${embedded ? 'text-slate-800' : 'text-slate-200'}`}
            >
              {graph.nodes.map(n => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">
                  {n.name} ({displayNodeId(n.id, graph)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className={`flex justify-center ${embedded ? '' : 'md:col-span-1'}`}>
          <button
            onClick={swapStartAndGoal}
            title="Hoán đổi điểm xuất phát và đích"
            className={`rounded-lg border p-2 transition-colors ${embedded ? 'border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Goal Node Dropdown */}
        <div className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 ${embedded ? 'border-slate-200 bg-white' : 'md:col-span-3 border-slate-800 bg-slate-950/60'}`}>
          <Flag className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">ĐIỂM ĐÍCH (B)</div>
            <select
              value={goalNodeId || ''}
              onChange={e => setGoalNodeId(e.target.value)}
              className={`w-full bg-transparent text-xs font-semibold focus:outline-none truncate ${embedded ? 'text-slate-800' : 'text-slate-200'}`}
            >
              {graph.nodes.map(n => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">
                  {n.name} ({displayNodeId(n.id, graph)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Algorithm Segmented Selector */}
        <div className={`flex min-w-0 items-center rounded-lg border p-1 ${embedded ? 'col-span-3 border-slate-200 bg-slate-100' : 'md:col-span-5 border-slate-800 bg-slate-950'}`}>
          <button
            onClick={() => setAlgorithm('astar')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
              algorithm === 'astar'
                ? 'bg-sky-600 text-white shadow-md'
                : embedded ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thuật toán A*
          </button>
          <button
            onClick={() => setAlgorithm('bfs')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
              algorithm === 'bfs'
                ? 'bg-indigo-600 text-white shadow-md'
                : embedded ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thuật toán BFS
          </button>
          <button
            onClick={() => setAlgorithm('compare')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
              algorithm === 'compare'
                ? 'bg-amber-600 text-white shadow-md'
                : embedded ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            So sánh A* & BFS
          </button>
        </div>
      </div>

      {/* ROW 3: Heuristic Config (for A* or Compare mode) & Interactive Tools */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-2.5 ${embedded ? 'border-slate-200 bg-slate-50' : 'border-slate-800/80 bg-slate-950/40'}`}>
        {/* Left: Heuristic Selection (Visible if A* or Compare) */}
        {algorithm !== 'bfs' ? (
          <div className={`flex flex-wrap gap-3 ${embedded ? 'w-full flex-col items-stretch' : 'items-center'}`}>
            <span className={`text-xs font-medium ${embedded ? 'text-slate-600' : 'text-slate-400'}`}>Hàm Heuristic h(n):</span>
            <div className={`grid grid-cols-2 gap-1 rounded-lg border p-1 ${embedded ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}>
              <button
                onClick={() => setHeuristic('euclidean')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  heuristic === 'euclidean' ? 'bg-sky-700 text-white' : embedded ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Khoảng cách đường chim bay Euclid"
              >
                Euclid (Chuẩn)
              </button>
              <button
                onClick={() => setHeuristic('manhattan')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  heuristic === 'manhattan' ? 'bg-sky-700 text-white' : embedded ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Khoảng cách dạng lưới Manhattan |dx| + |dy|"
              >
                Manhattan
              </button>
              <button
                onClick={() => setHeuristic('chebyshev')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  heuristic === 'chebyshev' ? 'bg-sky-700 text-white' : embedded ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Khoảng cách đường chéo Chebyshev max(|dx|, |dy|)"
              >
                Chebyshev
              </button>
              <button
                onClick={() => setHeuristic('dijkstra')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  heuristic === 'dijkstra' ? 'bg-sky-700 text-white' : embedded ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Dijkstra (Khi h(n) = 0)"
              >
                Dijkstra (h=0)
              </button>
            </div>

            <div className={`flex items-center gap-2 text-xs ${embedded ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>Hệ số ε:</span>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={heuristicMultiplier}
                onChange={e => setHeuristicMultiplier(parseFloat(e.target.value))}
                className="w-20 accent-sky-500 cursor-pointer"
              />
              <span className={`w-7 font-mono text-xs ${embedded ? 'text-slate-800' : 'text-slate-200'}`}>{heuristicMultiplier.toFixed(1)}</span>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${embedded ? 'text-indigo-700' : 'text-indigo-300'}`}>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            BFS duyệt theo hàng đợi FIFO (tìm đường ít bước cạnh nhất).
          </div>
        )}

        {/* Right: Interactive Canvas Toolset */}
        <div className={embedded ? 'grid w-full grid-cols-2 gap-1.5' : 'flex flex-wrap items-center gap-1'}>
          {tools.map(tool => (
            <button
              key={tool.mode}
              onClick={() => setInteractionMode(tool.mode)}
              title={tool.tooltip}
              className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                interactionMode === tool.mode
                  ? embedded ? 'bg-sky-100 text-sky-800 border-sky-300 shadow-sm' : 'bg-slate-800 text-white border-sky-500 shadow-sm'
                  : embedded ? 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ROW 4: Playback Controls & Timeline Scrubber */}
      {showPlayback && (
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetSimulation}
            title="Đặt lại mô phỏng về bước ban đầu"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStepIndex <= 0}
            title="Lùi 1 bước"
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? 'Tạm dừng mô phỏng' : 'Chạy mô phỏng từng bước'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>TẠM DỪNG</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>CHẠY TÌM ĐƯỜNG</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStepIndex >= totalSteps - 1}
            title="Tới 1 bước"
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onJumpToEnd}
            title="Nhảy thẳng đến kết quả cuối cùng"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 min-w-[200px] flex items-center gap-3 px-2">
          <span className="text-xs font-mono text-slate-400 shrink-0">
            Bước {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps || 1}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={e => onSeekStep(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 px-1 font-medium">Tốc độ:</span>
          {speeds.map(sp => (
            <button
              key={sp.label}
              onClick={() => setSpeed(sp.value)}
              className={`px-1.5 py-1 text-[11px] font-mono rounded transition-colors ${
                speed === sp.value
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
