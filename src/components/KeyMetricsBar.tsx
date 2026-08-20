import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  Compass,
  Fish,
  Gauge,
  Activity,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Scale,
  Calendar,
} from 'lucide-react';
import { ProjectionModelResult, YearRunData } from '../types/steelhead';
import {
  HISTORICAL_AVERAGE_CURVE,
  ALL_TIME_AVERAGE_CURVE,
  ADULT_EXPANSION_FACTOR,
  CURRENT_YEAR,
  ALL_YEARS_DATA,
} from '../data/historicalData';
import { MultiplierMode } from './MultiplierDebateModal';

interface KeyMetricsBarProps {
  projection: ProjectionModelResult;
  selectedMonthDay: string;
  isMetricInAdults?: boolean;
  onToggleMetricMode?: () => void;
  allYears?: YearRunData[];
  currentDayIndex?: number;
  multiplierMode?: MultiplierMode;
  multiplierValue?: number;
  onSelectMultiplierMode?: (mode: MultiplierMode) => void;
  onOpenMultiplierDebate?: () => void;
}

export const KeyMetricsBar: React.FC<KeyMetricsBarProps> = ({
  projection,
  selectedMonthDay,
  allYears = ALL_YEARS_DATA,
  currentDayIndex = projection.dayIndex,
  multiplierMode = 'four_year',
  multiplierValue = 214,
  onSelectMultiplierMode,
  onOpenMultiplierDebate,
}) => {
  const [showDetailedCards, setShowDetailedCards] = useState<boolean>(false);
  const [benchmarkBaseline, setBenchmarkBaseline] = useState<'10yr' | '70yr'>('10yr');
  const dayIdx = Math.max(0, Math.min(HISTORICAL_AVERAGE_CURVE.length - 1, currentDayIndex));
  
  // Baseline curves
  const histDay10 = HISTORICAL_AVERAGE_CURVE[dayIdx] || HISTORICAL_AVERAGE_CURVE[0];
  const histDay70 = ALL_TIME_AVERAGE_CURVE[dayIdx] || ALL_TIME_AVERAGE_CURVE[0];
  const activeBaselineDay = benchmarkBaseline === '70yr' ? histDay70 : histDay10;
  const histAvgCumulative = activeBaselineDay ? activeBaselineDay.avgCumulative : 1;

  // Locate current year record
  const currentYearData = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];

  // Latest recorded day
  let lastRecordedDayIndex = 67;
  if (currentYearData && currentYearData.data && currentYearData.data.length > 0) {
    for (let i = currentYearData.data.length - 1; i >= 0; i--) {
      const d: any = currentYearData.data[i];
      if (d.isRecorded === true || (d.dailyIndex > 0 && d.cumulativeIndex > 0)) {
        lastRecordedDayIndex = i;
        break;
      }
    }
  }

  const isBeyondRecordedData = dayIdx > lastRecordedDayIndex;
  
  // Find trajectory item if looking at future / projection
  const trajectoryItem = projection.projectedDailyTrajectory?.find((t) => t.dayOfYear - 1 === dayIdx);

  // Use projection.currentCumulative for the active selected date (accurately handles both recorded past and projected future)
  const activeCumulative = isBeyondRecordedData 
    ? (trajectoryItem?.projectedCumulative ?? projection.currentCumulative)
    : (currentYearData?.data[dayIdx]?.cumulativeIndex ?? projection.currentCumulative);

  const activeCumAdults = Math.round(activeCumulative * multiplierValue);

  const projectedTotal = projection.projectedBaselineIndex;
  const projectedAdults = Math.round(projectedTotal * multiplierValue);
  const lowCIAdults = Math.round(projection.projectedLowCI * multiplierValue);
  const highCIAdults = Math.round(projection.projectedHighCI * multiplierValue);

  // Delta calculations against selected baseline on this day
  const deltaVsAvgPct =
    histAvgCumulative > 0
      ? Math.round(((activeCumulative - histAvgCumulative) / histAvgCumulative) * 1000) / 10
      : 0;

  // Velocity calculations
  let rolling3DayPace = 0;
  let singleDaySet = 0;

  if (!isBeyondRecordedData && currentYearData?.data) {
    singleDaySet = currentYearData.data[dayIdx]?.dailyIndex ?? 0;
    const d0 = singleDaySet;
    const d1 = dayIdx > 0 ? (currentYearData.data[dayIdx - 1]?.dailyIndex ?? 0) : d0;
    const d2 = dayIdx > 1 ? (currentYearData.data[dayIdx - 2]?.dailyIndex ?? 0) : d1;
    const count3 = dayIdx >= 2 ? 3 : dayIdx + 1;
    rolling3DayPace = Math.round(((d0 + d1 + d2) / count3) * 100) / 100;
  } else if (trajectoryItem) {
    singleDaySet = trajectoryItem.projectedDaily;
    rolling3DayPace = trajectoryItem.projectedDaily;
  }

  const rollingAdultsPace = Math.round(rolling3DayPace * multiplierValue);
  const peakDailyIndex = currentYearData?.peakDailyIndex || 9.35;
  const peakDate = currentYearData?.peakDate || 'Aug 5';

  return (
    <div className="space-y-3">
      {/* Glanceable Hero Snapshot */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2.5 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--accent-amber)] flex items-center gap-1.5">
              <span>Field Escapement Telemetry</span>
              <span>&bull;</span>
              <span className="font-bold text-sm text-[var(--text-main)] normal-case tracking-normal">{selectedMonthDay}</span>
            </span>

            {/* Baseline Benchmark Toggle: 10-Yr Modern vs 70-Yr All-Time */}
            <div className="flex items-center gap-1 ml-1 sm:ml-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setBenchmarkBaseline('10yr')}
                title="10-Year Rolling Decade Mean (2016-2025)"
                className={`px-2 py-0.5 font-bold rounded-md transition ${
                  benchmarkBaseline === '10yr'
                    ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                10-Yr Base
              </button>
              <button
                onClick={() => setBenchmarkBaseline('70yr')}
                title="70-Year All-Time Baseline (1956-2025)"
                className={`px-2 py-0.5 font-bold rounded-md transition ${
                  benchmarkBaseline === '70yr'
                    ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                70-Yr All-Time
              </button>
            </div>

            {/* Prominent Multiplier Mode Pill with Info Trigger */}
            <div className="flex items-center gap-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg p-0.5">
              <button
                onClick={() => onSelectMultiplierMode?.('four_year')}
                title="4-Year Dynamic Rolling Ratio (Derived from recent brood cycles)"
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition ${
                  multiplierMode === 'four_year'
                    ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                4-Yr Roll (~{multiplierMode === 'four_year' ? multiplierValue : '214'}x)
              </button>
              <button
                onClick={() => onSelectMultiplierMode?.('baseline_220')}
                title="Historical 220x Baseline Benchmark"
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition ${
                  multiplierMode === 'baseline_220'
                    ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                220x Base
              </button>
              {multiplierMode === 'custom' && (
                <button
                  onClick={() => onSelectMultiplierMode?.('custom')}
                  title="Custom Multiplier"
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[var(--accent-spruce)] text-white shadow-xs"
                >
                  {multiplierValue}x Custom
                </button>
              )}
              <button
                onClick={onOpenMultiplierDebate}
                title="Explain the Skeena Multiplier & Escapement Debate"
                className="px-1.5 py-0.5 text-[11px] font-bold text-[var(--accent-amber)] hover:text-[var(--accent-amber-hover)] hover:bg-[var(--bg-card)] rounded transition flex items-center gap-0.5"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetailedCards(!showDetailedCards)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] font-mono flex items-center gap-1 transition"
            >
              <span>{showDetailedCards ? 'Compact' : 'Field Log Details'}</span>
              {showDetailedCards ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3 Core Hero Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Hero Metric 1: Escapement to Date / Forecast on Date */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">
                {isBeyondRecordedData ? `Forecast on ${selectedMonthDay}` : `Passage to ${selectedMonthDay}`}
              </span>
              <Fish className="w-4 h-4 text-[var(--accent-teal)]" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-mono tracking-tight">
                  {activeCumulative.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-[var(--accent-teal)] font-mono">
                  ~{activeCumAdults.toLocaleString()} Adults
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-main)] font-mono">
              <span className="text-[var(--text-secondary)] font-medium">
                vs {benchmarkBaseline === '70yr' ? '70-Yr All-Time' : '10-Yr'} Mean:
              </span>
              <span className={`font-bold flex items-center gap-0.5 ${deltaVsAvgPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {deltaVsAvgPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {deltaVsAvgPct >= 0 ? `+${deltaVsAvgPct}%` : `${deltaVsAvgPct}%`}
              </span>
            </div>
          </div>

          {/* Hero Metric 2: Health & Standing */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">Escapement Health</span>
              <ShieldCheck className="w-4 h-4 text-[var(--accent-spruce)]" />
            </div>
            <div className="my-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="stamp-badge stamp-spruce">
                  {projection.conservationTier}
                </span>
                <span className="text-xs sm:text-sm font-mono text-[var(--text-main)] font-bold">
                  {projection.escapementTargetPct}% Target
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-main)] font-mono text-[var(--text-secondary)]">
              <span className="font-medium">Analog Season:</span>
              <span className="font-bold text-[var(--accent-amber)] font-mono">{projection.bestFitAnalogYear}</span>
            </div>
          </div>

          {/* Hero Metric 3: Projected Season Total */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">Season Total Forecast</span>
              <Target className="w-4 h-4 text-[var(--accent-amber)]" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--accent-amber)] font-mono tracking-tight">
                  ~{projectedTotal.toFixed(0)}
                </span>
                <span className="text-sm font-bold text-[var(--text-secondary)] font-mono">
                  ~{projectedAdults.toLocaleString()} Adults
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-main)] text-[var(--text-secondary)] font-mono">
              <span className="font-medium">80% CI:</span>
              <span className="font-mono text-[var(--text-main)] font-bold">
                ~{lowCIAdults.toLocaleString()} – ~{highCIAdults.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Deep-Dive 4-Card Grid */}
      {showDetailedCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Detailed Card 1: To Date Telemetry / Future Forecast */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">
                {isBeyondRecordedData ? 'Projected Cumulative' : 'Actual DFO Recorded'}
              </span>
              <Fish className="w-4 h-4 text-[var(--accent-teal)]" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">{activeCumulative.toFixed(2)} pts</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono font-medium">
                Baseline Avg: <span className="text-[var(--text-main)] font-bold">{histAvgCumulative.toFixed(1)} pts</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-main)] text-xs font-mono text-[var(--text-secondary)] flex justify-between">
              <span className="font-medium">10-Yr Delta:</span>
              <span className={`font-bold ${deltaVsAvgPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {deltaVsAvgPct >= 0 ? `+${deltaVsAvgPct}%` : `${deltaVsAvgPct}%`}
              </span>
            </div>
          </div>

          {/* Detailed Card 2: Migration Velocity */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">Migration Velocity</span>
              <Gauge className="w-4 h-4 text-[var(--accent-amber)]" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">+{rolling3DayPace.toFixed(2)} pts/day</div>
              <div className="text-xs text-[var(--accent-amber)] font-mono mt-0.5 font-bold">
                ~{rollingAdultsPace.toLocaleString()} fish/day (3-Day Roll)
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-main)] text-xs font-mono text-[var(--text-secondary)] flex justify-between">
              <span className="font-medium">Single Set ({selectedMonthDay}):</span>
              <span className="text-[var(--text-main)] font-mono font-bold">{singleDaySet.toFixed(2)} pts</span>
            </div>
          </div>

          {/* Detailed Card 3: Season Peak Pulse */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">Peak Migration Pulse</span>
              <Activity className="w-4 h-4 text-[var(--accent-amber)]" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">{peakDailyIndex.toFixed(2)} pts</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono font-medium">
                Recorded on <span className="text-[var(--accent-amber)] font-bold">{peakDate}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-main)] text-xs font-mono text-[var(--text-secondary)] flex justify-between">
              <span className="font-medium">Run Timing Phase:</span>
              <span className="text-[var(--accent-teal)] font-bold">{projection.percentElapsedHistorical}% Elapsed</span>
            </div>
          </div>

          {/* Detailed Card 4: Escapement Multipliers */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
              <span className="uppercase tracking-wider">Expansion Standard</span>
              <button
                onClick={onOpenMultiplierDebate}
                className="text-[var(--accent-amber)] hover:underline flex items-center gap-1 text-[11px]"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Debate (?)</span>
              </button>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
                1.0 ≈ {multiplierValue}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono font-medium">
                {multiplierMode === 'four_year'
                  ? 'Dynamic 4-Yr Rolling Ratio'
                  : multiplierMode === 'baseline_220'
                  ? 'Historical 220 Baseline'
                  : 'Custom Sandbox Ratio'}
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-main)] text-xs font-mono text-[var(--text-secondary)] flex justify-between">
              <span className="font-medium">Model Confidence:</span>
              <span className="text-[var(--accent-amber)] font-bold">{projection.confidenceLevel}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
