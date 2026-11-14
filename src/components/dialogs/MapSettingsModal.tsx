/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TrafficGraph } from '../../types/graph';
import { generateRandomGraph, getGridPreset } from '../../utils/graphPresets';
import { Sliders, Dices, Grid } from 'lucide-react';
import { PanelDialog } from './PanelDialog';

interface MapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: TrafficGraph;
  onUpdateGraphDimensions: (width: number, height: number) => void;
  onGenerateNewMap: (newGraph: TrafficGraph) => void;
}

export const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
  isOpen,
  onClose,
  graph,
  onUpdateGraphDimensions,
  onGenerateNewMap,
}) => {
  // Dimensions
  const [width, setWidth] = useState<number>(graph.width);
  const [height, setHeight] = useState<number>(graph.height);

  // Random generator configs
  const [nodeCount, setNodeCount] = useState<number>(18);
  const [obstacleRate, setObstacleRate] = useState<number>(15);

  // Grid generator configs
  const [gridRows, setGridRows] = useState<number>(4);
  const [gridCols, setGridCols] = useState<number>(6);

  useEffect(() => {
    if (!isOpen) return;
    setWidth(graph.width);
    setHeight(graph.height);
  }, [isOpen, graph.width, graph.height]);

  if (!isOpen) return null;

  const handleApplyDimensions = () => {
    onUpdateGraphDimensions(width, height);
    onClose();
  };

  const handleGenerateRandom = () => {
    const newGraph = generateRandomGraph(nodeCount, obstacleRate, width, height);
    onGenerateNewMap(newGraph);
    onClose();
  };

  const handleGenerateGrid = () => {
    const newGraph = getGridPreset(gridRows, gridCols);
    onGenerateNewMap(newGraph);
    onClose();
  };

  return (
    <PanelDialog
      title="Cài đặt bản đồ"
      description="Điều chỉnh kích thước và tạo nhanh bản đồ lưới hoặc bản đồ ngẫu nhiên."
      onClose={onClose}
      size="regular"
      placement="left"
      modal={false}
      icon={<Sliders className="h-5 w-5" />}
    >
      <div className="space-y-4">
          {/* Section 1: Kích thước vùng vẽ */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Điều chỉnh kích thước bản đồ (SRS 3.8)
            </h4>
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-slate-500">Chiều rộng (Width px):</label>
                <input
                  type="number"
                  min="600"
                  max="1600"
                  step="50"
                  value={width}
                  onChange={e => setWidth(parseInt(e.target.value) || 800)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-500">Chiều cao (Height px):</label>
                <input
                  type="number"
                  min="400"
                  max="1000"
                  step="50"
                  value={height}
                  onChange={e => setHeight(parseInt(e.target.value) || 600)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <button
              onClick={handleApplyDimensions}
              className="w-full rounded-lg border border-sky-200 bg-sky-50 py-2 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100"
            >
              Cập nhật kích thước khung nhìn hiện tại
            </button>
          </div>

          {/* Section 2: Sinh ngẫu nhiên */}
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Dices className="w-4 h-4 text-amber-400" />
              2. Tạo bản đồ ngẫu nhiên mới (SRS 3.7)
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="mb-1 flex justify-between text-slate-600">
                  <span>Số lượng nút giao thông:</span>
                  <span className="font-mono font-bold text-slate-800">{nodeCount} nút</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="36"
                  value={nodeCount}
                  onChange={e => setNodeCount(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between text-slate-600">
                  <span>Tỷ lệ đoạn đường bị cản trở / cấm (%):</span>
                  <span className="font-mono font-bold text-slate-800">{obstacleRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={obstacleRate}
                  onChange={e => setObstacleRate(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
            <button
              onClick={handleGenerateRandom}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-md"
            >
              Sinh bản đồ ngẫu nhiên mới
            </button>
          </div>

          {/* Section 3: Sinh lưới bàn cờ tùy chỉnh */}
          <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Grid className="w-4 h-4 text-indigo-400" />
              3. Sinh mạng lưới Bàn cờ tùy biến (Grid Network)
            </h4>
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-slate-500">Số hàng (Rows):</label>
                <input
                  type="number"
                  min="3"
                  max="8"
                  value={gridRows}
                  onChange={e => setGridRows(parseInt(e.target.value) || 4)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-500">Số cột (Columns):</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={gridCols}
                  onChange={e => setGridCols(parseInt(e.target.value) || 6)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <button
              onClick={handleGenerateGrid}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md"
            >
              Sinh lưới bàn cờ ({gridRows}x{gridCols} = {gridRows * gridCols} nút)
            </button>
          </div>
      </div>
    </PanelDialog>
  );
};
