import React from 'react';
import {
  X,
  Scale,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Info,
  Waves,
  CheckCircle2,
  Sliders,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export type MultiplierMode = 'four_year' | 'baseline_220' | 'custom';

interface MultiplierDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  multiplierMode: MultiplierMode;
  onSelectMode: (mode: MultiplierMode) => void;
  currentMultiplierValue: number;
  customMultiplierValue: number;
  onCustomMultiplierChange: (val: number) => void;
  fourYearValue?: number;
}

export const MultiplierDebateModal: React.FC<MultiplierDebateModalProps> = ({
  isOpen,
  onClose,
  multiplierMode,
  onSelectMode,
  currentMultiplierValue,
  customMultiplierValue,
  onCustomMultiplierChange,
  fourYearValue = 214,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] uppercase tracking-wide flex items-center gap-2">
                <span>The Multiplier & Escapement Debate</span>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  {currentMultiplierValue}x Active
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                How DFO & BC Provincial Biologists Convert Tyee Gillnet CPUE into Wild Adult Steelhead
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-main)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* Multiplier Mode Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                Select In-Season Expansion Method:
              </label>
              <span className="text-[11px] font-mono text-[var(--accent-amber)] font-semibold">
                Active Factor: ~{currentMultiplierValue} fish / index pt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: 4-Year Dynamic Rolling */}
              <button
                onClick={() => onSelectMode('four_year')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  multiplierMode === 'four_year'
                    ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--accent-amber-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-sm text-[var(--text-main)]">
                      Dynamic 4-Yr Rolling
                    </span>
                    {multiplierMode === 'four_year' && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-amber)]" />
                    )}
                  </div>
                  <div className="text-xl font-mono font-black text-[var(--accent-amber)] my-1.5">
                    ~{fourYearValue}x
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                    Calibrated from the last 4 brood cycles vs. Babine counting fence telemetry and recent net selectivity.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border-main)]/50 text-[10px] font-mono font-bold text-[var(--accent-teal)]">
                  In-Season Management Model
                </div>
              </button>

              {/* Option 2: 220 Benchmark */}
              <button
                onClick={() => onSelectMode('baseline_220')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  multiplierMode === 'baseline_220'
                    ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--accent-amber-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-sm text-[var(--text-main)]">
                      Historical 220 Baseline
                    </span>
                    {multiplierMode === 'baseline_220' && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-amber)]" />
                    )}
                  </div>
                  <div className="text-xl font-mono font-black text-[var(--text-main)] my-1.5">
                    220x
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                    Standard operational constant used across historical decades (1956–present) for multi-decadal trend comparisons.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border-main)]/50 text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                  Long-Term Benchmark
                </div>
              </button>

              {/* Option 3: Custom Sandbox Slider */}
              <button
                onClick={() => onSelectMode('custom')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  multiplierMode === 'custom'
                    ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--accent-amber-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-sm text-[var(--text-main)]">
                      Custom Hypothesis
                    </span>
                    {multiplierMode === 'custom' && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-amber)]" />
                    )}
                  </div>
                  <div className="text-xl font-mono font-black text-[var(--accent-spruce)] my-1.5">
                    {customMultiplierValue}x
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                    Test high freshet scenarios (180x) vs. low-water drought avoidance (240x).
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--border-main)]/50 text-[10px] font-mono font-bold text-[var(--accent-spruce)]">
                  Sandbox Scenario Mode
                </div>
              </button>
            </div>

            {/* Custom Slider Control */}
            {multiplierMode === 'custom' && (
              <div className="p-3 bg-[var(--bg-card)] border border-[var(--accent-amber-border)] rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)]">Adjust Custom Multiplier:</span>
                  <span className="font-bold text-[var(--accent-amber)]">{customMultiplierValue} Adult Steelhead / Index Point</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="280"
                  step="2"
                  value={customMultiplierValue}
                  onChange={(e) => onCustomMultiplierChange(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--accent-amber)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>160x (High Catchability)</span>
                  <span>220x (Historical Median)</span>
                  <span>280x (Low Catchability / Flood)</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Where the Multiplier Comes From */}
          <div className="space-y-2.5">
            <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent-amber)]" />
              1. The Science: Converting CPUE into Escapement
            </h3>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
              The <strong>Tyee Test Fishery</strong> does not count every single fish. Instead, standard 1-hour gillnet sets operate twice daily near the mouth of the Skeena, measuring <strong>Catch Per Unit Effort (CPUE)</strong>.
            </p>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
              To convert this relative index into estimated adult steelhead escaping into the watershed, biologists calibrate cumulative Tyee points against the <strong>Babine River Counting Fence</strong> (which monitors ~25%–30% of total Skeena summer escapement) and mark-recapture telemetry data from tributaries like the Sustut and Kispiox.
            </p>
          </div>

          {/* Section 2: The 4-Year Generation Cycle */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-teal)]" />
              Why a 4-Year Rolling Multiplier?
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Wild Skeena summer steelhead have a dominant <strong>4- to 5-year generation life cycle</strong> (2–3 years in freshwater tributaries followed by 2–3 years in the North Pacific). 
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              In-season management computes a rolling 4-year ratio to account for modern gillnet mesh materials, riverbed bathymetry shifts at Telegraph Point, and recent ocean age structure. Over the past decade, this dynamic calculation has fluctuated between <strong>~195x and ~235x</strong>.
            </p>
          </div>

          {/* Section 3: The Controversies & Environmental Nuance */}
          <div className="space-y-3">
            <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" />
              2. The Controversies: Why Biologists & Anglers Debate the Number
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                  River Discharge & Water Clarity
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  During heavy glacial runoffs or floods, steelhead travel lower in the water column under the net lead lines. Net catchability drops, meaning 1.0 index point may actually represent <strong>240–260+ fish</strong>. Conversely, in low, clear water, net avoidance can increase during daylight sets.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                  Impact on Emergency Closures
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  The provincial <strong>Extreme Conservation Threshold</strong> is <strong>40 Tyee index points</strong>. Under a 200x multiplier, that equals 8,000 fish; under a 235x multiplier, it equals 9,400 fish. A slight change in the expansion ratio can determine whether emergency recreational closures are triggered.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-xs text-[var(--text-main)] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Our Philosophy:</span> We provide full transparency. You can view the telemetry under the <strong>Dynamic 4-Year Rolling Ratio</strong>, the <strong>220x Historical Baseline</strong>, or explore custom scenarios in the What-If Sandbox.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
            Source: DFO Pacific Region &bull; BC Ministry of Water, Land and Resource Stewardship
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--accent-amber)] hover:opacity-90 text-white font-mono font-bold text-xs transition shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
