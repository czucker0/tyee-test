import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  Compass,
  Fish,
  Gauge,
  Sparkles,
  Activity,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { ProjectionModelResult, YearRunData } from '../types/steelhead';
import {
  HISTORICAL_AVERAGE_CURVE,
  ADULT_EXPANSION_FACTOR,
  CURRENT_YEAR,
  ALL_YEARS_DATA,
} from '../data/historicalData';

interface KeyMetricsBarProps {
  projection: ProjectionModelResult;
  selectedMonthDay: string;
  isMetricInAdults?: boolean;
  onToggleMetricMode?: () => void;
  allYears?: YearRunData[];
  currentDayIndex?: number;
}

export const KeyMetricsBar: React.FC<KeyMetricsBarProps> = ({
  projection,
  selectedMonthDay,
  allYears = ALL_YEARS_DATA,
  currentDayIndex = projection.dayIndex,
}) => {
  const [showDetailedCards, setShowDetailedCards] = useState<boolean>(false);
  const dayIdx = Math.max(0, Math.min(HISTORICAL_AVERAGE_CURVE.length - 1, currentDayIndex));
  const histDay = HISTORICAL_AVERAGE_CURVE[dayIdx] || HISTORICAL_AVERAGE_CURVE[0];
  const histAvgCumulative = histDay ? histDay.avgCumulative : 1;
  const histFinalAvg = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1].avgCumulative;

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
  const isFinalSeasonDay = dayIdx === HISTORICAL_AVERAGE_CURVE.length - 1;

  const recordedCum = currentYearData?.data[dayIdx]?.cumulativeIndex ?? projection.currentCumulative;

  const trajectoryEntry =
    projection.projectedDailyTrajectory[dayIdx] ||
    projection.projectedDailyTrajectory.find(
      (t) => t.monthDay === selectedMonthDay || t.dayOfYear === dayIdx + 1
    );

  const projectedOnSelectedDate = isBeyondRecordedData
    ? projection.currentCumulative
    : recordedCum;

  const projectedLowOnDate = trajectoryEntry
    ? trajectoryEntry.projectedCumulativeLow
    : projection.projectedLowCI;
  const projectedHighOnDate = trajectoryEntry
    ? trajectoryEntry.projectedCumulativeHigh
    : projection.projectedHighCI;

  const currentCumAdults = Math.round(recordedCum * ADULT_EXPANSION_FACTOR);
  const histAvgAdults = Math.round(histAvgCumulative * ADULT_EXPANSION_FACTOR);

  const projectedTotal = projection.projectedBaselineIndex;
  const projectedAdults = Math.round(projectedTotal * ADULT_EXPANSION_FACTOR);
  const lowCIAdults = Math.round(projection.projectedLowCI * ADULT_EXPANSION_FACTOR);
  const highCIAdults = Math.round(projection.projectedHighCI * ADULT_EXPANSION_FACTOR);

  const projectedOnDateAdults = Math.round(projectedOnSelectedDate * ADULT_EXPANSION_FACTOR);
  const lowOnDateAdults = Math.round(projectedLowOnDate * ADULT_EXPANSION_FACTOR);
  const highOnDateAdults = Math.round(projectedHighOnDate * ADULT_EXPANSION_FACTOR);

  // Delta calculations
  const deltaVsAvgPct =
    histAvgCumulative > 0
      ? Math.round(((recordedCum - histAvgCumulative) / histAvgCumulative) * 1000) / 10
      : 0;

  const projDeltaVsAvgFinalPct =
    histFinalAvg > 0
      ? Math.round(((projectedTotal - histFinalAvg) / histFinalAvg) * 1000) / 10
      : 0;

  // Velocity calculations
  let rolling3DayPace = 0;
  let rolling5DayPace = 0;
  let singleDaySet = 0;
  let isAccelerating = false;
  let isDecelerating = false;
  let projectedDailyEntry = 0;

  if (!isBeyondRecordedData && currentYearData?.data) {
    singleDaySet = currentYearData.data[dayIdx]?.dailyIndex ?? 0;
    const d0 = singleDaySet;
    const d1 = dayIdx > 0 ? (currentYearData.data[dayIdx - 1]?.dailyIndex ?? 0) : d0;
    const d2 = dayIdx > 1 ? (currentYearData.data[dayIdx - 2]?.dailyIndex ?? 0) : d1;
    const count3 = dayIdx >= 2 ? 3 : dayIdx + 1;
    rolling3DayPace = Math.round(((d0 + d1 + d2) / count3) * 100) / 100;

    const d3 = dayIdx > 2 ? (currentYearData.data[dayIdx - 3]?.dailyIndex ?? 0) : d2;
    const d4 = dayIdx > 3 ? (currentYearData.data[dayIdx - 4]?.dailyIndex ?? 0) : d3;
    const count5 = dayIdx >= 4 ? 5 : dayIdx + 1;
    rolling5DayPace = (d0 + d1 + d2 + d3 + d4) / count5;

    isAccelerating = rolling3DayPace > rolling5DayPace * 1.08 && rolling3DayPace >= 1.0;
    isDecelerating = rolling3DayPace < rolling5DayPace * 0.92 && rolling3DayPace >= 0.5;
  } else {
    projectedDailyEntry = trajectoryEntry?.projectedDaily ?? 0;
  }

  const rollingAdultsPace = Math.round(rolling3DayPace * ADULT_EXPANSION_FACTOR);
  const projectedDailyAdults = Math.round(projectedDailyEntry * ADULT_EXPANSION_FACTOR);
  const peakDailyIndex = currentYearData?.peakDailyIndex || 9.35;
  const peakDate = currentYearData?.peakDate || 'Aug 5';

  const getStatusColor = (tier: string) => {
    switch (tier) {
      case 'Abundant':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Healthy':
        return 'text-teal-400 border-teal-500/30 bg-teal-500/10';
      case 'Moderate':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'Precautionary':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      default:
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    }
  };

  return (
    <div className="space-y-3">
      {/* Glanceable Hero Snapshot (Mobile-First & Clean) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              Run Escapement Snapshot &bull; {selectedMonthDay}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetailedCards(!showDetailedCards)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 flex items-center gap-1 transition"
            >
              <span>{showDetailedCards ? 'Compact View' : 'Detailed Analysis'}</span>
              {showDetailedCards ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3 Core Hero Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Hero Metric 1: Escapement to Date */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">
                {isBeyondRecordedData ? `Forecast on ${selectedMonthDay}` : `Passage to ${selectedMonthDay}`}
              </span>
              <Fish className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {recordedCum.toFixed(1)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-cyan-400 font-mono">
                  ~{currentCumAdults.toLocaleString()} Adults
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60">
              <span className="text-slate-400">vs 10-Yr Avg:</span>
              <span className={`font-bold flex items-center gap-0.5 ${deltaVsAvgPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltaVsAvgPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {deltaVsAvgPct >= 0 ? `+${deltaVsAvgPct}%` : `${deltaVsAvgPct}%`}
              </span>
            </div>
          </div>

          {/* Hero Metric 2: Health & Standing */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Escapement Health</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="my-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase border ${getStatusColor(projection.conservationTier)}`}>
                  {projection.conservationTier}
                </span>
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  {projection.escapementTargetPct}% of Target
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60 text-slate-400">
              <span>Analog Year:</span>
              <span className="font-bold text-cyan-300 font-mono">{projection.bestFitAnalogYear}</span>
            </div>
          </div>

          {/* Hero Metric 3: Projected Season Total */}
          <div className="bg-slate-950/60 border border-indigo-900/40 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-medium">Season Total Forecast</span>
              <Target className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="my-1.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-indigo-100 tracking-tight">
                  ~{projectedTotal.toFixed(0)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-indigo-300 font-mono">
                  ~{projectedAdults.toLocaleString()} Adults
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-indigo-900/40 text-slate-400">
              <span>80% CI:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                ~{lowCIAdults.toLocaleString()} – ~{highCIAdults.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure: Deep-Dive 4-Card Grid */}
      {showDetailedCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Detailed Card 1: To Date Telemetry */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Actual DFO Recorded</span>
              <Fish className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white">{recordedCum.toFixed(2)} pts</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Baseline Avg: <span className="text-slate-300 font-mono">{histAvgCumulative.toFixed(1)} pts</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>10-Yr Comparison:</span>
              <span className="text-emerald-400 font-bold">+{deltaVsAvgPct}%</span>
            </div>
          </div>

          {/* Detailed Card 2: Migration Velocity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Migration Velocity</span>
              <Gauge className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white">+{rolling3DayPace.toFixed(2)} pts/day</div>
              <div className="text-xs text-amber-300/90 font-mono mt-0.5">
                ~{rollingAdultsPace.toLocaleString()} fish/day (3-Day Roll)
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Single Set ({selectedMonthDay}):</span>
              <span className="text-slate-200 font-mono font-bold">{singleDaySet.toFixed(2)} pts</span>
            </div>
          </div>

          {/* Detailed Card 3: Season Peak Pulse */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Peak Migration Pulse</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white">{peakDailyIndex.toFixed(2)} pts</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Recorded on <span className="text-amber-300 font-bold">{peakDate}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Run Timing Phase:</span>
              <span className="text-cyan-300 font-bold">{projection.percentElapsedHistorical}% Elapsed</span>
            </div>
          </div>

          {/* Detailed Card 4: Escapement Multipliers */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Expansion Standard</span>
              <Compass className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white font-mono">1.0 &approx; 220</div>
              <div className="text-xs text-slate-400 mt-0.5">Adult Steelhead per Index pt</div>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Model Confidence:</span>
              <span className="text-indigo-300 font-bold">{projection.confidenceLevel}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
