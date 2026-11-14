import React from 'react';
import {
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';

interface PlaybackBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onResetSimulation: () => void;
  onJumpToEnd: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  currentStepIndex: number;
  totalSteps: number;
  onSeekStep: (stepIndex: number) => void;
}

const speeds = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '5x', value: 5 },
];

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
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
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:items-stretch">
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={onResetSimulation}
        aria-label="Đặt lại mô phỏng"
        title="Đặt lại mô phỏng"
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        onClick={onStepBackward}
        disabled={currentStepIndex <= 0}
        aria-label="Lùi một bước"
        title="Lùi một bước"
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
      >
        <SkipBack className="w-4 h-4" />
      </button>
      <button
        onClick={isPlaying ? onPause : onPlay}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white hover:bg-sky-500'}`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isPlaying ? 'Tạm dừng' : 'Chạy mô phỏng'}
      </button>
      <button
        onClick={onStepForward}
        disabled={currentStepIndex >= totalSteps - 1}
        aria-label="Tiến một bước"
        title="Tiến một bước"
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
      >
        <SkipForward className="w-4 h-4" />
      </button>
      <button
        onClick={onJumpToEnd}
        aria-label="Đến kết quả cuối"
        title="Đến kết quả cuối"
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
      >
        <FastForward className="w-4 h-4" />
      </button>
    </div>

    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="shrink-0 text-xs font-mono text-slate-600">
        Bước {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps || 1}
      </span>
      <input
        type="range"
        min={0}
        max={Math.max(0, totalSteps - 1)}
        value={currentStepIndex}
        disabled={!totalSteps}
        onChange={event => onSeekStep(Number(event.target.value))}
        aria-label="Tiến trình mô phỏng"
        className="h-1.5 w-full cursor-pointer accent-sky-500"
      />
    </div>

    <div className="flex flex-wrap items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      <span className="px-1 text-[11px] text-slate-500">Tốc độ</span>
      {speeds.map(option => (
        <button
          key={option.value}
          onClick={() => setSpeed(option.value)}
          aria-pressed={speed === option.value}
          className={`rounded px-2 py-1 text-[11px] font-mono ${speed === option.value ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);
