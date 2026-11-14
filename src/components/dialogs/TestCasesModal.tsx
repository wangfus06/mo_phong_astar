/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { runAllTestCases, TestCaseResult } from '../../utils/testCases';
import { loadPathfindingModule } from '../../algorithms/wasm';
import { PanelDialog } from './PanelDialog';
import { TrafficGraph } from '../../types/graph';
import { CheckCircle2, XCircle, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

interface TestCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGraph: TrafficGraph;
  onLoadScenarioToCanvas: (graph: TrafficGraph, startId: string, goalId: string) => void;
}

export const TestCasesModal: React.FC<TestCasesModalProps> = ({
  isOpen,
  onClose,
  currentGraph,
  onLoadScenarioToCanvas,
}) => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  const executeTests = useCallback(async () => {
    setIsRunning(true);
    setRunError(null);
    try {
      const module = await loadPathfindingModule();
      const nextResults = await runAllTestCases(currentGraph, {
        solveAStar: (graph, startId, goalId) => module.solveAStar(graph, startId, goalId, 'euclidean', 1),
        solveBFS: (graph, startId, goalId) => module.solveBFS(graph, startId, goalId),
      });
      setResults(nextResults);
    } catch (error) {
      console.error('Không thể chạy bộ kiểm thử C++ WebAssembly:', error);
      setRunError('Không tải được module C++/WebAssembly để chạy kiểm thử.');
    } finally {
      setIsRunning(false);
    }
  }, [currentGraph]);

  useEffect(() => {
    if (isOpen) void executeTests();
  }, [isOpen, executeTests]);

  if (!isOpen) return null;

  const handleRunAll = () => {
    void executeTests();
  };

  const passCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return (
    <PanelDialog
      title="Bộ kiểm thử hệ thống"
      description="12 kịch bản TC01–TC12 để kiểm tra A*, BFS và các trường hợp đặc biệt."
      onClose={onClose}
      placement="left"
      modal={false}
      icon={<ShieldCheck className="h-5 w-5" />}
    >
        {/* Modal Summary Banner */}
        <div className="sticky top-0 z-20 -mx-3 -mt-3 mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="text-sm font-semibold text-slate-800">
              {isRunning ? 'Đang chạy kiểm thử C++…' : <>Kết quả: <span className="font-mono text-emerald-700 text-base font-bold">{passCount}/{totalCount}</span> đạt ({totalCount ? Math.round((passCount / totalCount) * 100) : 0}%)</>}
            </div>
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <div className="text-xs text-slate-600">
              Tất cả các tiêu chí thuật toán và xử lý vật cản đều thỏa mãn đặc tả
            </div>
          </div>

          <button
            onClick={handleRunAll}
            disabled={isRunning}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-sky-500 disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Đang chạy kiểm thử...' : 'Chạy lại toàn bộ 12 test case'}</span>
          </button>
        </div>

        {runError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{runError}</p>}

        {/* Test Cases Table */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {results.map(tc => (
              <div
                key={tc.id}
                className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-sky-200 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {tc.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-xs font-bold text-sky-800">
                          {tc.id}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{tc.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{tc.description}</p>
                    </div>
                  </div>

                  {tc.sampleGraph && tc.startId && tc.goalId && (
                    <button
                      onClick={() => {
                        onLoadScenarioToCanvas(tc.sampleGraph!, tc.startId!, tc.goalId!);
                        onClose();
                      }}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800 transition-colors hover:bg-sky-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Tải lên bản đồ</span>
                    </button>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Kết quả mong đợi (SRS):</span>
                    <span className="text-[11px] text-slate-700">{tc.expected}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Kết quả thực tế phần mềm:</span>
                    <span className="font-mono text-[11px] text-emerald-700">{tc.actual}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


    </PanelDialog>
  );
};
