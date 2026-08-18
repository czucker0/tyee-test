import React from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import { ProjectionModelResult } from '../types/steelhead';

interface WhatIfSandboxProps {
  isOpen: boolean;
  onClose: () => void;
  customMultiplier: number;
  onMultiplierChange: (mult: number) => void;
  projection: ProjectionModelResult;
  selectedMonthDay: string;
}

export const WhatIfSandbox: React.FC<WhatIfSandboxProps> = ({
  isOpen,
  onClose,
  customMultiplier,
  onMultiplierChange,
  projection,
  selectedMonthDay,
}) => {
  if (!isOpen) return null;

  const presets = [
    { label: 'Live Recorded Pace (1.0x)', mult: 1.0, icon: <RotateCcw className="w-3.5 h-3.5" /> },
    { label: 'Late August Surge (+30%)', mult: 1.3, icon: <Flame className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Massive Late Return (+60%)', mult: 1.6, icon: <Sparkles className="w-3.5 h-3.5 text-teal-400" /> },
    { label: 'Early Drop-off (-25%)', mult: 0.75, icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> },
    { label: 'Drought Collapse (-50%)', mult: 0.5, icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl shadow-purple-950/50 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>What-If Scenario Sandbox</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Simulation
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Simulate alternate run trajectories and test in-season management threshold impacts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Multiplier Slider */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Run Volume Adjustment Factor</span>
            <span className="text-sm font-mono font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30">
              {(customMultiplier * 100).toFixed(0)}% ({customMultiplier.toFixed(2)}x)
            </span>
          </div>

          <input
            type="range"
            min={0.4}
            max={1.8}
            step={0.05}
            value={customMultiplier}
            onChange={(e) => onMultiplierChange(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 hover:accent-purple-300 focus:outline-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Severe Decline (0.4x)</span>
            <span>Recorded Live (1.0x)</span>
            <span>Mega Surge (1.8x)</span>
          </div>
        </div>

        {/* Simulation Output Dashboard */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Simulated Cumulative ({selectedMonthDay})</span>
            <span className="text-lg font-bold text-cyan-300">
              {projection.currentCumulative.toFixed(1)} pts
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 font-sans">
              ~{Math.round(projection.currentCumulative * 50).toLocaleString()} adult fish
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40">
            <span className="text-[10px] text-purple-300 block uppercase">Simulated Projected Season Total</span>
            <span className="text-lg font-bold text-white">
              {projection.projectedBaselineIndex.toFixed(1)} pts
            </span>
            <span className="text-[11px] text-purple-200 block mt-0.5 font-sans">
              ~{projection.projectedBaselineAdults.toLocaleString()} adult fish ({projection.conservationTier})
            </span>
          </div>
        </div>

        {/* Quick Simulation Presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Scenario Presets:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((p) => {
              const isSelected = Math.abs(customMultiplier - p.mult) < 0.02;
              return (
                <button
                  key={p.label}
                  onClick={() => onMultiplierChange(p.mult)}
                  className={`p-2 rounded-lg text-xs font-medium text-left border transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md font-bold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
          <button
            onClick={() => onMultiplierChange(1.0)}
            className="text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Live 1.0x</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-md"
          >
            Apply & View Models
          </button>
        </div>
      </div>
    </div>
  );
};
