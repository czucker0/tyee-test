import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Flame,
  AlertTriangle,
  X,
  Bookmark,
  BookmarkCheck,
  FolderOpen,
  Trash2
} from 'lucide-react';
import { ProjectionModelResult } from '../types/steelhead';
import { useAuth } from '../context/AuthContext';

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
  const { user, openAuthModal, savedScenarios, saveScenario, deleteScenario } = useAuth();
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { label: 'Live Recorded Pace (1.0x)', mult: 1.0, icon: <RotateCcw className="w-3.5 h-3.5" /> },
    { label: 'Late August Surge (+30%)', mult: 1.3, icon: <Flame className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> },
    { label: 'Massive Late Return (+60%)', mult: 1.6, icon: <Sparkles className="w-3.5 h-3.5 text-[var(--accent-teal)]" /> },
    { label: 'Early Drop-off (-25%)', mult: 0.75, icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> },
    { label: 'Drought Collapse (-50%)', mult: 0.5, icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  const handleSaveToAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = scenarioTitle.trim() || `Simulation ${(customMultiplier * 100).toFixed(0)}% (${selectedMonthDay})`;
    setIsSaving(true);
    try {
      await saveScenario({
        title,
        multiplier: customMultiplier,
        timingShiftDays: 0,
        notes: `Simulated total: ~${projection.projectedBaselineAdults.toLocaleString()} fish (${projection.conservationTier})`
      });
      setScenarioTitle('');
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save scenario:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
                <span>What-If Scenario Sandbox</span>
                <span className="stamp-badge stamp-amber">
                  Simulation
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Simulate alternate run trajectories and test in-season management threshold impacts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Multiplier Slider */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Run Volume Adjustment Factor</span>
            <span className="text-sm font-mono font-bold text-[var(--accent-amber)] px-2 py-0.5 rounded bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)]">
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
            className="w-full h-2.5 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none border border-[var(--border-main)]"
          />

          <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>Severe Decline (0.4x)</span>
            <span>Recorded Live (1.0x)</span>
            <span>Mega Surge (1.8x)</span>
          </div>
        </div>

        {/* Simulation Output Dashboard */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">Simulated Cumulative ({selectedMonthDay})</span>
            <span className="text-lg font-bold text-[var(--accent-teal)]">
              {projection.currentCumulative.toFixed(1)} pts
            </span>
            <span className="text-[11px] text-[var(--text-muted)] block mt-0.5 font-sans">
              ~{Math.round(projection.currentCumulative * 220).toLocaleString()} adult fish
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)]">
            <span className="text-[10px] text-[var(--accent-amber)] block uppercase font-bold">Simulated Projected Season Total</span>
            <span className="text-lg font-bold text-[var(--text-main)]">
              {projection.projectedBaselineIndex.toFixed(1)} pts
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5 font-sans">
              ~{projection.projectedBaselineAdults.toLocaleString()} adult fish ({projection.conservationTier})
            </span>
          </div>
        </div>

        {/* Quick Simulation Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Scenario Presets:</span>
            {savedScenarios.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSavedList(!showSavedList)}
                className="text-[11px] text-[var(--accent-amber)] hover:underline flex items-center gap-1 font-semibold"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{showSavedList ? 'Hide My Runs' : `My Saved Runs (${savedScenarios.length})`}</span>
              </button>
            )}
          </div>

          {showSavedList && savedScenarios.length > 0 ? (
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2 max-h-36 overflow-y-auto">
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-main)] truncate">{sc.title}</p>
                    <p className="text-[10px] text-[var(--accent-amber)]">{sc.multiplier}x multiplier</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMultiplierChange(sc.multiplier)}
                      className="px-2 py-0.5 bg-[var(--accent-amber)] text-white rounded text-[10px] font-bold hover:opacity-90"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteScenario(sc.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p) => {
                const isSelected = Math.abs(customMultiplier - p.mult) < 0.02;
                return (
                  <button
                    key={p.label}
                    onClick={() => onMultiplierChange(p.mult)}
                    className={`p-2 rounded-lg text-xs font-medium text-left border transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber-border)] shadow-sm font-bold'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-[var(--border-highlight)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Scenario to Account form */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5 font-mono">
              <Bookmark className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              Save this Scenario to Field Ledger
            </span>
            {user ? (
              <span className="text-[10px] text-[var(--accent-teal)] font-medium font-mono">
                {user.isLocalOnly ? 'Local Log' : 'Cloud Synced'}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('social')}
                className="text-[10px] text-[var(--accent-amber)] hover:underline font-mono"
              >
                Sign in to sync
              </button>
            )}
          </div>

          <form onSubmit={handleSaveToAccount} className="flex gap-2">
            <input
              type="text"
              placeholder="Scenario name (e.g. Late Cold Surge)"
              value={scenarioTitle}
              onChange={(e) => setScenarioTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1.5 bg-[var(--accent-amber)] hover:opacity-90 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              {showSaveSuccess ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-main)] pt-3 text-xs">
          <button
            onClick={() => onMultiplierChange(1.0)}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Live 1.0x</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--accent-amber)] text-white font-bold transition shadow-sm hover:opacity-90"
          >
            Apply & View Models
          </button>
        </div>
      </div>
    </div>
  );
};
