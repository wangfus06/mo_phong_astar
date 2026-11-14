/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PathfindingResult } from '../../types/graph';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Navigation,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface StatsComparisonProps {
  astarResult: PathfindingResult | null;
  bfsResult: PathfindingResult | null;
  mode: 'astar' | 'bfs' | 'compare';
  formatNodeId?: (nodeId: string) => string;
}

export const StatsComparison: React.FC<StatsComparisonProps> = ({
  astarResult,
  bfsResult,
  mode,
  formatNodeId = nodeId => nodeId,
}) => {
  if (!astarResult && !bfsResult) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600">
        Chưa có dữ liệu tìm đường. Nhấn "CHẠY TÌM ĐƯỜNG" để xem thống kê.
      </div>
    );
  }

  // Calculate efficiency comparison
  const visitedDiff = (bfsResult?.visitedNodeCount || 0) - (astarResult?.visitedNodeCount || 0);
  const percentSaved = bfsResult?.visitedNodeCount
    ? Math.max(0, Math.round((visitedDiff / bfsResult.visitedNodeCount) * 100))
    : 0;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Compass className="h-4 w-4 text-sky-600" />
          Bảng Kết Quả & So Sánh Thuật Toán
        </h3>

        {mode === 'compare' && percentSaved > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>A* duyệt ít hơn BFS {percentSaved}% nút giao!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* A* result card */}
        {(mode === 'astar' || mode === 'compare') && astarResult && (
          <div className="space-y-2.5 rounded-lg border border-sky-200 bg-sky-50/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-sky-800">Thuật toán A* (A-Star)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {astarResult.success ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-rose-700">
                    <XCircle className="w-3.5 h-3.5" /> Không có đường
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Tổng chi phí</div>
                <div className="font-mono text-sm font-bold text-emerald-700">
                  {astarResult.success ? `${astarResult.totalCost.toFixed(1)} m` : '--'}
                </div>
              </div>
              <div className="rounded border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Nút đã duyệt</div>
                <div className="font-mono text-sm font-bold text-sky-700">
                  {astarResult.visitedNodeCount}
                </div>
              </div>
              <div className="rounded border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Thời gian</div>
                <div className="font-mono text-sm font-bold text-slate-800">
                  {astarResult.executionTimeMs} ms
                </div>
              </div>
            </div>

            {/* Path breakdown */}
            {astarResult.success && astarResult.path.length > 0 && (
              <div className="border-t border-slate-200 pt-1.5">
                <div className="mb-1 text-[10px] text-slate-500">
                  Lộ trình tối ưu ({astarResult.path.length} nút, {astarResult.hopCount} đoạn đường):
                </div>
                <div className="flex flex-wrap items-center gap-1 rounded border border-slate-200 bg-white p-1.5 font-mono text-[11px] text-slate-700">
                  {astarResult.path.map((nodeId, idx) => (
                    <React.Fragment key={idx}>
                      <span className={idx === 0 ? 'text-emerald-700 font-bold' : idx === astarResult.path.length - 1 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {formatNodeId(nodeId)}
                      </span>
                      {idx < astarResult.path.length - 1 && (
                        <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BFS result card */}
        {(mode === 'bfs' || mode === 'compare') && bfsResult && (
          <div className="space-y-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-indigo-800">Thuật toán BFS (Tìm kiếm mù)</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {bfsResult.success ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-rose-700">
                    <XCircle className="w-3.5 h-3.5" /> Không có đường
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Tổng chi phí</div>
                <div className="font-mono text-sm font-bold text-indigo-700">
                  {bfsResult.success ? `${bfsResult.totalCost.toFixed(1)} m` : '--'}
                </div>
              </div>
              <div className="rounded border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Nút đã duyệt</div>
                <div className="font-mono text-sm font-bold text-indigo-700">
                  {bfsResult.visitedNodeCount}
                </div>
              </div>
              <div className="rounded border border-slate-200 bg-white p-2">
                <div className="text-[10px] text-slate-500">Thời gian</div>
                <div className="font-mono text-sm font-bold text-slate-800">
                  {bfsResult.executionTimeMs} ms
                </div>
              </div>
            </div>

            {/* Path breakdown */}
            {bfsResult.success && bfsResult.path.length > 0 && (
              <div className="border-t border-slate-200 pt-1.5">
                <div className="mb-1 text-[10px] text-slate-500">
                  Lộ trình ít bước nhất ({bfsResult.path.length} nút, {bfsResult.hopCount} đoạn đường):
                </div>
                <div className="flex flex-wrap items-center gap-1 rounded border border-slate-200 bg-white p-1.5 font-mono text-[11px] text-slate-700">
                  {bfsResult.path.map((nodeId, idx) => (
                    <React.Fragment key={idx}>
                      <span className={idx === 0 ? 'text-emerald-700 font-bold' : idx === bfsResult.path.length - 1 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {formatNodeId(nodeId)}
                      </span>
                      {idx < bfsResult.path.length - 1 && (
                        <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparative Insight Footnote */}
      {mode === 'compare' && astarResult && bfsResult && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <span>💡 Nhận xét so sánh theo lý thuyết giải thuật:</span>
          </div>
          <div className="leading-relaxed text-slate-600">
            Thuật toán A* sử dụng hàm ước lượng <span className="font-mono text-sky-700">f(n) = g(n) + h(n)</span> để định hướng duyệt trực tiếp về phía đích, giúp loại bỏ các nhánh mở rộng không cần thiết. Ngược lại, BFS duyệt theo tầng sóng tròn không định hướng (uninformed search), dẫn đến số nút phải duyệt cao hơn đáng kể trên đồ thị rộng.
          </div>
        </div>
      )}
    </div>
  );
};
