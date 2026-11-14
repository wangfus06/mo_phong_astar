/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrafficGraph,
  AlgorithmType,
  HeuristicType,
  InteractionMode,
  PathfindingResult,
  TrafficNode,
  TrafficEdge,
} from './types/graph';
import {
  getHaiPhongPreset,
  getHanoiPreset,
  getGridPreset,
  getRadialPreset,
  getRiverChokepointPreset,
  generateRandomGraph,
} from './utils/graphPresets';
import { solveAStar } from './algorithms/astar';
import { solveBFS } from './algorithms/bfs';
import { calculateDistance } from './utils/heuristics';
import { TrafficCanvas } from './components/map/TrafficCanvas';
import { ControlPanel } from './components/controls/ControlPanel';
import { PlaybackBar } from './components/controls/PlaybackBar';
import { StatsComparison } from './components/results/StatsComparison';
import { StepTraceTable } from './components/results/StepTraceTable';
import { TestCasesModal } from './components/dialogs/TestCasesModal';
import { MapSettingsModal } from './components/dialogs/MapSettingsModal';
import { PanelDialog } from './components/dialogs/PanelDialog';
import { displayGraphText, displayNodeId } from './utils/displayLabels';
import {
  Route,
  CheckCircle2,
  Settings,
  Play,
  BarChart3,
  ListTree,
} from 'lucide-react';

export default function App() {
  // Graph state
  const [currentPreset, setCurrentPreset] = useState<string>('haiphong');
  const [graph, setGraph] = useState<TrafficGraph>(() => getHaiPhongPreset());

  // Start & Goal Node
  const [startNodeId, setStartNodeId] = useState<string | null>('HP_NHA_HAT');
  const [goalNodeId, setGoalNodeId] = useState<string | null>('HP_CAT_BI');

  // Algorithm configuration
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('astar');
  const [activeCompareView, setActiveCompareView] = useState<'astar' | 'bfs'>('astar');
  const [heuristic, setHeuristic] = useState<HeuristicType>('euclidean');
  const [heuristicMultiplier, setHeuristicMultiplier] = useState<number>(1.0);

  // Interaction tool
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select_start');

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0); // 1x default

  // Modals
  const [isSimulationSettingsOpen, setIsSimulationSettingsOpen] = useState<boolean>(false);
  const [isPlaybackOpen, setIsPlaybackOpen] = useState<boolean>(false);
  const [isResultsOpen, setIsResultsOpen] = useState<boolean>(false);
  const [isTraceOpen, setIsTraceOpen] = useState<boolean>(false);
  const [isTestCasesModalOpen, setIsTestCasesModalOpen] = useState<boolean>(false);
  const [isMapSettingsModalOpen, setIsMapSettingsModalOpen] = useState<boolean>(false);

  // Status message
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Re-run algorithms when graph, start, goal, or heuristic change
  const astarResult: PathfindingResult | null = useMemo(() => {
    if (!startNodeId || !goalNodeId) return null;
    return solveAStar(graph, startNodeId, goalNodeId, heuristic, heuristicMultiplier);
  }, [graph, startNodeId, goalNodeId, heuristic, heuristicMultiplier]);

  const bfsResult: PathfindingResult | null = useMemo(() => {
    if (!startNodeId || !goalNodeId) return null;
    return solveBFS(graph, startNodeId, goalNodeId);
  }, [graph, startNodeId, goalNodeId]);

  // Determine active result based on algorithm selection
  const activeResult: PathfindingResult | null = useMemo(() => {
    if (algorithm === 'astar') return astarResult;
    if (algorithm === 'bfs') return bfsResult;
    // Compare mode: switchable view between A* and BFS
    return activeCompareView === 'astar' ? astarResult : bfsResult;
  }, [algorithm, activeCompareView, astarResult, bfsResult]);

  const activeSteps = useMemo(() => activeResult?.steps || [], [activeResult]);
  const totalSteps = activeSteps.length;

  // Active step object
  const activeStep = useMemo(() => {
    if (activeSteps.length === 0) return null;
    const clampedIdx = Math.max(0, Math.min(currentStepIndex, activeSteps.length - 1));
    return activeSteps[clampedIdx];
  }, [activeSteps, currentStepIndex]);

  // Optimal path to display: only show full path if playback has reached the end or simulation was jumped
  const isAtEnd = currentStepIndex >= totalSteps - 1 && totalSteps > 0;
  const optimalPath = isAtEnd && activeResult?.success ? activeResult.path : [];
  const optimalPathEdges = isAtEnd && activeResult?.success ? activeResult.pathEdges : [];

  // Reset step index when algorithm or search endpoints change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [startNodeId, goalNodeId, algorithm, activeCompareView, heuristic, heuristicMultiplier]);

  // Simulation Playback Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isPlaying) {
      if (speed === 0) {
        // Instant jump to end
        setCurrentStepIndex(Math.max(0, totalSteps - 1));
        setIsPlaying(false);
      } else {
        const intervalMs = Math.round(500 / speed);
        timer = setInterval(() => {
          setCurrentStepIndex(prev => {
            if (prev >= totalSteps - 1) {
              setIsPlaying(false);
              return prev;
            }
            return prev + 1;
          });
        }, intervalMs);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speed, totalSteps]);

  // Playback handlers
  const handlePlay = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, totalSteps]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handleStepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleResetSimulation = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const handleJumpToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, totalSteps - 1));
  }, [totalSteps]);

  const handleSeekStep = useCallback((stepIdx: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(stepIdx, totalSteps - 1)));
  }, [totalSteps]);

  // Presets
  const handleSelectPreset = (presetKey: string) => {
    setCurrentPreset(presetKey);
    setIsPlaying(false);
    setCurrentStepIndex(0);

    let newG: TrafficGraph;
    switch (presetKey) {
      case 'haiphong':
        newG = getHaiPhongPreset();
        setStartNodeId('HP_NHA_HAT');
        setGoalNodeId('HP_CAT_BI');
        break;
      case 'hanoi':
        newG = getHanoiPreset();
        setStartNodeId('N1');
        setGoalNodeId('N4');
        break;
      case 'grid':
        newG = getGridPreset(4, 6);
        setStartNodeId('G_0_0');
        setGoalNodeId('G_3_5');
        break;
      case 'radial':
        newG = getRadialPreset();
        setStartNodeId('R2_0');
        setGoalNodeId('R2_3');
        break;
      case 'river':
        newG = getRiverChokepointPreset();
        setStartNodeId('W1');
        setGoalNodeId('E4');
        break;
      case 'random':
        newG = generateRandomGraph(18, 15);
        setStartNodeId(newG.nodes[0]?.id || null);
        setGoalNodeId(newG.nodes[newG.nodes.length - 1]?.id || null);
        break;
      default:
        newG = getHaiPhongPreset();
        break;
    }
    setGraph(newG);
    showToast(`Đã tải bản đồ "${presetKey.toUpperCase()}".`);
  };

  // Obstacle management
  const handleToggleEdgeBlocked = (edgeId: string) => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.map(e => (e.id === edgeId ? { ...e, isBlocked: !e.isBlocked } : e)),
    }));
    setCurrentStepIndex(0);
  };

  const handleClearObstacles = () => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.map(e => ({ ...e, isBlocked: false })),
    }));
    showToast('Đã mở lưu thông toàn bộ các đoạn đường.');
    setCurrentStepIndex(0);
  };

  const handleRandomObstacles = () => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.map(e => ({
        ...e,
        isBlocked: Math.random() < 0.25,
      })),
    }));
    showToast('Đã ngẫu nhiên chặn 25% các tuyến đường.');
    setCurrentStepIndex(0);
  };

  // Graph Editor Actions
  const handleSelectNode = (nodeId: string) => {
    if (interactionMode === 'select_start') {
      setStartNodeId(nodeId);
      setInteractionMode('select_goal');
      showToast(`Đã chọn điểm xuất phát: [${nodeId}]. Hãy chọn điểm đích tiếp theo.`);
    } else if (interactionMode === 'select_goal') {
      setGoalNodeId(nodeId);
      setInteractionMode('toggle_block');
      showToast(`Đã chọn điểm đích: [${nodeId}].`);
    } else {
      if (!startNodeId) {
        setStartNodeId(nodeId);
      } else if (!goalNodeId || goalNodeId === nodeId) {
        setGoalNodeId(nodeId);
      } else {
        setStartNodeId(nodeId);
      }
    }
  };

  const handleAddNode = (x: number, y: number) => {
    const nextIdx = graph.nodes.length + 1;
    const newId = `N${nextIdx}`;
    const newNode: TrafficNode = {
      id: newId,
      name: `Nút giao ${nextIdx}`,
      x,
      y,
      district: 'Khu vực mới',
    };
    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    showToast(`Đã thêm nút giao [${newId}] tại (${x}, ${y}).`);
  };

  const handleConnectNodes = (nodeAId: string, nodeBId: string) => {
    const nodeA = graph.nodes.find(n => n.id === nodeAId);
    const nodeB = graph.nodes.find(n => n.id === nodeBId);
    if (!nodeA || !nodeB) return;

    // Check if edge already exists
    const exists = graph.edges.some(
      e =>
        (e.startNode === nodeAId && e.endNode === nodeBId) ||
        (e.startNode === nodeBId && e.endNode === nodeAId)
    );

    if (exists) {
      showToast('Hai nút này đã có đoạn đường kết nối sẵn.');
      return;
    }

    const newEdge: TrafficEdge = {
      id: `e-custom-${Date.now()}`,
      startNode: nodeAId,
      endNode: nodeBId,
      weight: calculateDistance(nodeA, nodeB),
      isBlocked: false,
      roadName: `Tuyến nối ${nodeA.id}-${nodeB.id}`,
      laneCount: 3,
    };

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }));
    showToast(`Đã tạo tuyến đường nối [${nodeA.name}] và [${nodeB.name}].`);
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.startNode !== nodeId && e.endNode !== nodeId),
    }));
    if (startNodeId === nodeId) setStartNodeId(null);
    if (goalNodeId === nodeId) setGoalNodeId(null);
    showToast(`Đã xóa nút giao [${nodeId}] và các đoạn đường liên kết.`);
  };

  const handleDeleteEdge = (edgeId: string) => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== edgeId),
    }));
    showToast(`Đã xóa đoạn đường [${edgeId}].`);
  };

  const handleMoveNode = (nodeId: string, x: number, y: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setGraph(prev => {
      const updatedNodes = prev.nodes.map(n => (n.id === nodeId ? { ...n, x, y } : n));
      const nodeMap = new Map(updatedNodes.map(n => [n.id, n]));

      // Recalculate edge weights for incident edges
      const updatedEdges = prev.edges.map(edge => {
        if (edge.startNode === nodeId || edge.endNode === nodeId) {
          const u = nodeMap.get(edge.startNode);
          const v = nodeMap.get(edge.endNode);
          if (u && v) {
            return {
              ...edge,
              weight: calculateDistance(u, v),
            };
          }
        }
        return edge;
      });

      return {
        ...prev,
        nodes: updatedNodes,
        edges: updatedEdges,
      };
    });
  };

  const handleUpdateGraphDimensions = (width: number, height: number) => {
    setGraph(prev => ({
      ...prev,
      width,
      height,
    }));
    showToast(`Đã cập nhật kích thước bản đồ thành ${width}x${height}px.`);
  };

  const handleGenerateNewMap = (newGraph: TrafficGraph) => {
    setGraph(newGraph);
    setStartNodeId(newGraph.nodes[0]?.id || null);
    setGoalNodeId(newGraph.nodes[newGraph.nodes.length - 1]?.id || null);
    setCurrentStepIndex(0);
    showToast(`Đã sinh bản đồ mới thành công (${newGraph.nodes.length} nút, ${newGraph.edges.length} cạnh).`);
  };

  const handleLoadScenarioToCanvas = (scenarioGraph: TrafficGraph, sId: string, gId: string) => {
    setGraph(scenarioGraph);
    setStartNodeId(sId);
    setGoalNodeId(gId);
    setCurrentStepIndex(0);
    showToast(`Đã nạp kịch bản kiểm thử lên màn hình chính: ${sId} ➔ ${gId}.`);
  };

  // Toast Helper
  const showToast = (msg: string) => {
    const visibleMessage = displayGraphText(msg, graph);
    setStatusNotification(visibleMessage);
    setTimeout(() => {
      setStatusNotification(prev => (prev === visibleMessage ? null : prev));
    }, 3500);
  };

  const openFloatingPanel = (panel: 'tools' | 'playback' | 'results' | 'trace' | 'tests' | 'map') => {
    // Open secondary tool forms above the toolbox so closing them returns to the same controls.
    if (panel === 'map' || panel === 'tests') {
      setIsPlaybackOpen(false);
      setIsResultsOpen(false);
      setIsTraceOpen(false);
      if (panel === 'map') {
        setIsTestCasesModalOpen(false);
        setIsMapSettingsModalOpen(true);
      } else {
        setIsMapSettingsModalOpen(false);
        setIsTestCasesModalOpen(true);
      }
      return;
    }

    setIsSimulationSettingsOpen(false);
    setIsPlaybackOpen(false);
    setIsResultsOpen(false);
    setIsTraceOpen(false);
    setIsTestCasesModalOpen(false);
    setIsMapSettingsModalOpen(false);

    if (panel === 'tools') setIsSimulationSettingsOpen(true);
    if (panel === 'playback') setIsPlaybackOpen(true);
    if (panel === 'results') setIsResultsOpen(true);
    if (panel === 'trace') setIsTraceOpen(true);
    if (panel === 'tests') setIsTestCasesModalOpen(true);
    if (panel === 'map') setIsMapSettingsModalOpen(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans selection:bg-sky-200 selection:text-sky-950">
      {/* Top Header */}
      <header className="fixed inset-x-0 top-0 z-20 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="w-full px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                Mô phỏng tìm đường giao thông
                <span className="text-xs font-mono font-normal text-sky-400">f(n) = g(n) + h(n)</span>
                {graph.city === 'haiphong' && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-800">HẢI PHÒNG</span>}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Trực quan hóa A*</span>
                <span aria-hidden="true">·</span>
                <span>So sánh với BFS</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* The graph is the full-screen workspace; secondary panels open on demand. */}
      <main className="fixed inset-0 z-0">
        <TrafficCanvas
          graph={graph}
          startNodeId={startNodeId}
          goalNodeId={goalNodeId}
          activeStep={activeStep}
          optimalPath={optimalPath}
          optimalPathEdges={optimalPathEdges}
          interactionMode={interactionMode}
          onSelectNode={handleSelectNode}
          onToggleEdgeBlocked={handleToggleEdgeBlocked}
          onAddNode={handleAddNode}
          onConnectNodes={handleConnectNodes}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onMoveNode={handleMoveNode}
          algorithmLabel={
            algorithm === 'compare'
              ? `${activeCompareView === 'astar' ? 'A*' : 'BFS'} · so sánh`
              : algorithm === 'astar'
              ? `A* · ${heuristic[0].toUpperCase()}${heuristic.slice(1)}`
              : 'BFS'
          }
        />
      </main>

      <nav aria-label="Bảng điều khiển" className="fixed bottom-3 left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center justify-center gap-1 rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:bottom-4 sm:gap-2 sm:p-2">
        <button title="Công cụ" onClick={() => openFloatingPanel('tools')} className="flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 sm:px-4" aria-haspopup="dialog">
          <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Công cụ</span>
        </button>
        <button title="Chạy mô phỏng" onClick={() => openFloatingPanel('playback')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-4" aria-haspopup="dialog">
          <Play className="h-4 w-4 text-sky-600" /> <span className="hidden sm:inline">Chạy mô phỏng</span>
        </button>
        <button title="Kết quả" onClick={() => openFloatingPanel('results')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-4" aria-haspopup="dialog">
          <BarChart3 className="h-4 w-4 text-emerald-600" /> <span className="hidden sm:inline">Kết quả</span>
        </button>
        <button title="Ghi nhận từng bước" onClick={() => openFloatingPanel('trace')} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-4" aria-haspopup="dialog">
          <ListTree className="h-4 w-4 text-violet-600" /> <span className="hidden sm:inline">Ghi nhận bước</span>
        </button>
      </nav>
      {/* Floating Status Notification Toast */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {isSimulationSettingsOpen && (
        <PanelDialog
          title="Công cụ mô phỏng"
          description="Chọn bản đồ, điểm đi đến, thuật toán và thao tác chỉnh sửa đồ thị."
          onClose={() => setIsSimulationSettingsOpen(false)}
          placement="left"
          modal={false}
        >
          <ControlPanel
            embedded
            showPlayback={false}
            graph={graph}
            startNodeId={startNodeId}
            goalNodeId={goalNodeId}
            setStartNodeId={setStartNodeId}
            setGoalNodeId={setGoalNodeId}
            algorithm={algorithm}
            setAlgorithm={setAlgorithm}
            heuristic={heuristic}
            setHeuristic={setHeuristic}
            heuristicMultiplier={heuristicMultiplier}
            setHeuristicMultiplier={setHeuristicMultiplier}
            interactionMode={interactionMode}
            setInteractionMode={setInteractionMode}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onResetSimulation={handleResetSimulation}
            onJumpToEnd={handleJumpToEnd}
            speed={speed}
            setSpeed={setSpeed}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            onSeekStep={handleSeekStep}
            currentPreset={currentPreset}
            onSelectPreset={handleSelectPreset}
            onClearObstacles={handleClearObstacles}
            onRandomObstacles={handleRandomObstacles}
            onOpenMapSettings={() => {
              openFloatingPanel('map');
            }}
            onOpenTestCases={() => {
              openFloatingPanel('tests');
            }}
          />
        </PanelDialog>
      )}
      {isPlaybackOpen && (
        <PanelDialog title="Chạy mô phỏng" description="Điều khiển phát lại từng bước và tốc độ tìm đường." onClose={() => setIsPlaybackOpen(false)} size="regular" placement="left" modal={false}>
          <PlaybackBar
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onResetSimulation={handleResetSimulation}
            onJumpToEnd={handleJumpToEnd}
            speed={speed}
            setSpeed={setSpeed}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            onSeekStep={handleSeekStep}
          />
          {activeStep && <p className="mt-4 rounded-xl bg-sky-50 p-4 text-sm leading-relaxed text-slate-700">{displayGraphText(activeStep.message, graph)}</p>}
        </PanelDialog>
      )}

      {isResultsOpen && (
        <PanelDialog title="Kết quả thuật toán" description="So sánh số liệu của A* và BFS trên đồ thị hiện tại." onClose={() => setIsResultsOpen(false)} placement="left" modal={false}>
          {algorithm === 'compare' && (
            <div className="mb-4 flex items-center justify-end gap-2 rounded-xl bg-slate-50 p-2">
              <span className="mr-auto text-xs font-medium text-slate-500">Đồ thị đang hiển thị:</span>
              <button onClick={() => { setActiveCompareView('astar'); setCurrentStepIndex(0); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeCompareView === 'astar' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-white'}`}>A*</button>
              <button onClick={() => { setActiveCompareView('bfs'); setCurrentStepIndex(0); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeCompareView === 'bfs' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white'}`}>BFS</button>
            </div>
          )}
          <StatsComparison astarResult={astarResult} bfsResult={bfsResult} mode={algorithm} formatNodeId={id => displayNodeId(id, graph)} />
        </PanelDialog>
      )}

      {isTraceOpen && (
        <PanelDialog title="Ghi nhận từng bước" description="Chọn một bước để xem trạng thái tương ứng trên đồ thị." onClose={() => setIsTraceOpen(false)} placement="left" modal={false}>
          <StepTraceTable
            steps={activeSteps}
            currentStepIndex={currentStepIndex}
            onSelectStep={handleSeekStep}
            formatNodeId={id => displayNodeId(id, graph)}
            formatMessage={message => displayGraphText(message, graph)}
            algorithmName={algorithm === 'astar' ? `A* (${heuristic.toUpperCase()})` : algorithm === 'bfs' ? 'BFS' : `So sánh: ${activeCompareView.toUpperCase()}`}
          />
        </PanelDialog>
      )}

      {/* Test Cases Modal */}
      <TestCasesModal
        isOpen={isTestCasesModalOpen}
        onClose={() => setIsTestCasesModalOpen(false)}
        currentGraph={graph}
        onLoadScenarioToCanvas={handleLoadScenarioToCanvas}
      />

      {/* Map Settings & Resize Modal */}
      <MapSettingsModal
        isOpen={isMapSettingsModalOpen}
        onClose={() => setIsMapSettingsModalOpen(false)}
        graph={graph}
        onUpdateGraphDimensions={handleUpdateGraphDimensions}
        onGenerateNewMap={handleGenerateNewMap}
      />
    </div>
  );
}
