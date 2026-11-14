/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlgorithmStep } from '../../types/graph';
import {
  ListFilter,
  Search,
  ChevronDown,
  ChevronUp,
  Table,
  Check,
  ExternalLink,
} from 'lucide-react';

interface StepTraceTableProps {
  steps: AlgorithmStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  algorithmName: string;
  formatNodeId?: (nodeId: string) => string;
  formatMessage?: (message: string) => string;
}

export const StepTraceTable: React.FC<StepTraceTableProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  algorithmName,
  formatNodeId = nodeId => nodeId,
  formatMessage = message => message,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredSteps = steps.filter(step => {
    const visibleMessage = formatMessage(step.message);
    const visibleNodeId = step.currentNodeId ? formatNodeId(step.currentNodeId) : '';
    const matchesSearch =
      visibleMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visibleNodeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      filterAction === 'all' || step.actionType === filterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-3 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Table className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <h3 className="text-xs font-bold leading-relaxed text-slate-800">
            Bảng Vết Từng Bước Thuật Toán ({steps.length} bước ghi nhận)
          </h3>
          <span className="text-[11px] text-slate-500">
            - {algorithmName}
          </span>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
            {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </div>

      {/* Expanded Table Content */}
      {isOpen && (
        <div className="p-3 space-y-3">
          {/* Controls: Search and Action Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nút hoặc nội dung..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <ListFilter className="w-3.5 h-3.5" /> Lọc hành động:
              </span>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Tất cả hành động</option>
                <option value="start">Khởi tạo</option>
                <option value="expand">Mở rộng nút</option>
                <option value="evaluate_neighbor">Xét nút lân cận</option>
                <option value="found_goal">Tìm thấy đích</option>
                <option value="no_path">Không có đường</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="max-h-[55dvh] overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-3 w-14">Bước</th>
                  <th className="py-2 px-2 w-16">Nút</th>
                  <th className="py-2 px-2 w-14 text-right">g(n)</th>
                  <th className="py-2 px-2 w-14 text-right">h(n)</th>
                  <th className="py-2 px-2 w-14 text-right">f(n)</th>
                  <th className="py-2 px-2 w-16">Nút cha</th>
                  <th className="py-2 px-2 w-28">Tập hợp</th>
                  <th className="py-2 px-3">Chi tiết diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredSteps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                      Không tìm thấy bước nào khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSteps.map(step => {
                    const originalIdx = steps.findIndex(s => s.stepNumber === step.stepNumber);
                    const isSelected = originalIdx === currentStepIndex;
                    const node = step.currentNodeId;
                    const g = node && step.gScore[node] !== undefined && step.gScore[node] < Infinity
                      ? step.gScore[node].toFixed(1)
                      : '--';
                    const h = node && step.hScore[node] !== undefined
                      ? step.hScore[node].toFixed(1)
                      : '--';
                    const f = node && step.fScore[node] !== undefined && step.fScore[node] < Infinity
                      ? step.fScore[node].toFixed(1)
                      : '--';
                    const parent = node && step.cameFrom[node] ? formatNodeId(step.cameFrom[node]!) : node ? 'None' : '--';
                    const visibleMessage = formatMessage(step.message);

                    return (
                      <tr
                        key={step.stepNumber}
                        onClick={() => onSelectStep(originalIdx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50 text-sky-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-500 font-sans">
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                          #{step.stepNumber}
                        </td>
                        <td className="py-2 px-2 font-bold text-sky-700">
                          {step.currentNodeId ? formatNodeId(step.currentNodeId) : '--'}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-700">{g}</td>
                        <td className="py-2 px-2 text-right text-amber-700">{h}</td>
                        <td className="py-2 px-2 text-right font-bold text-indigo-700">{f}</td>
                        <td className="py-2 px-2 text-slate-500">{parent}</td>
                        <td className="py-2 px-2 text-[10px] font-sans text-slate-500">
                          Open: {step.openSetIds.length} · Closed: {step.closedSetIds.length}
                        </td>
                        <td className="max-w-md truncate py-2 px-3 font-sans text-xs text-slate-700" title={visibleMessage}>
                          {visibleMessage}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>💡 Nhấp vào bất kỳ hàng nào để nhảy thẳng trực quan trên bản đồ đến bước đó.</span>
            <span>Hiển thị {filteredSteps.length} / {steps.length} bước</span>
          </div>
        </div>
      )}
    </div>
  );
};
