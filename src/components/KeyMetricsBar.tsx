import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  Compass,
  Fish,
  Gauge,
  Sparkles,
  Zap,
  Activity,
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
  const dayIdx = Math.max(0, Math.min(HISTORICAL_AVERAGE_CURVE.length - 1, currentDayIndex));
  const histDay = HISTORICAL_AVERAGE_CURVE[dayIdx] || HISTORICAL_AVERAGE_CURVE[0];
  const histAvgCumulative = histDay ? histDay.avgCumulative : 1;
  const histFinalAvg = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1].avgCumulative;

  // Locate the current year's time-series
  const currentYearData = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];

  // Dynamically find the latest day with published in-season DFO data
  let lastRecordedDayIndex = 67; // Aug 16 fallback
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

  // Ground truth actual cumulative vs projected trajectory
  const recordedCum = currentYearData?.data[dayIdx]?.cumulativeIndex ?? projection.currentCumulative;
  const lastRecordedCum = currentYearData?.data[lastRecordedDayIndex]?.cumulativeIndex ?? 161.93;
  const lastRecordedDateStr = currentYearData?.data[lastRecordedDayIndex]?.monthDay ?? 'Aug 16';

  // Projected value on selected future day
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

  // ==========================================
  // VELOCITY CALCULATIONS (Card 2)
  // ==========================================
  let rolling3DayPace = 0;
  let rolling5DayPace = 0;
  let singleDaySet = 0;
  let isAccelerating = false;
  let isDecelerating = false;
  let projectedDailyEntry = 0;

  if (!isBeyondRecordedData && currentYearData?.data) {
    singleDaySet = currentYearData.data[dayIdx]?.dailyIndex ?? 0;

    // 3-Day Rolling Average Pace
    const d0 = singleDaySet;
    const d1 = dayIdx > 0 ? (currentYearData.data[dayIdx - 1]?.dailyIndex ?? 0) : d0;
    const d2 = dayIdx > 1 ? (currentYearData.data[dayIdx - 2]?.dailyIndex ?? 0) : d1;
    const count3 = dayIdx >= 2 ? 3 : dayIdx + 1;
    rolling3DayPace = Math.round(((d0 + d1 + d2) / count3) * 100) / 100;

    // 5-Day Rolling Average for acceleration baseline
    const d3 = dayIdx > 2 ? (currentYearData.data[dayIdx - 3]?.dailyIndex ?? 0) : d2;
    const d4 = dayIdx > 3 ? (currentYearData.data[dayIdx - 4]?.dailyIndex ?? 0) : d3;
    const count5 = dayIdx >= 4 ? 5 : dayIdx + 1;
    rolling5DayPace = (d0 + d1 + d2 + d3 + d4) / count5;

    isAccelerating = rolling3DayPace > rolling5DayPace * 1.08 && rolling3DayPace >= 1.0;
    isDecelerating = rolling3DayPace < rolling5DayPace * 0.92 && rolling3DayPace >= 0.5;
  } else {
    // Beyond recorded data: extract modeled daily velocity from trajectory
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
      {/* Telemetry Status Bar */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            DFO Skeena River Tyee Test Fishery Telemetry
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            &bull; Real-time in-season indices &amp; predictive run modeling
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
          Conversion: <strong className="text-cyan-300">1.0 Tyee Index &approx; 220 Adult Steelhead</strong>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* ========================================================================= */}
        {/* CARD 1: UNIFIED RUN ESCAPEMENT (Actual Catch to Date OR Model Projection) */}
        {/* ========================================================================= */}
        {!isBeyondRecordedData ? (
          // STATE A: ACTUAL DFO DATA (On or before last recorded date)
          <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between transition group">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-400">Actual Catch to Date</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    DFO Recorded ({selectedMonthDay})
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition">
                <Fish className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {recordedCum.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-cyan-400 font-mono">
                  (~{currentCumAdults.toLocaleString()} fish)
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>10-Yr Baseline Avg:</span>
                <span className="font-mono text-slate-300">
                  {histAvgCumulative.toFixed(1)} (~{histAvgAdults.toLocaleString()} fish)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1">
                {deltaVsAvgPct >= 0 ? (
                  <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{deltaVsAvgPct}%
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 font-bold text-red-400">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {deltaVsAvgPct}%
                  </span>
                )}
                <span className="text-slate-500 text-[11px]">vs 10-yr pace</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                EoS Proj: <strong className="text-indigo-300">~{projectedTotal.toFixed(0)}</strong>
              </div>
            </div>
          </div>
        ) : (
          // STATE B: MODEL PROJECTION (When slider moves beyond last recorded date)
          <div className="bg-gradient-to-br from-slate-900/95 via-indigo-950/20 to-slate-900/95 border border-indigo-500/40 hover:border-indigo-400/60 rounded-xl p-4 shadow-lg shadow-indigo-950/20 relative overflow-hidden flex flex-col justify-between transition group animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-indigo-300">
                  {isFinalSeasonDay ? 'Final Projected Total' : `Projected on ${selectedMonthDay}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    Statistical Forecast
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500/25 transition">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-indigo-100 tracking-tight">
                  {projectedOnSelectedDate.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-indigo-300 font-mono">
                  (~{projectedOnDateAdults.toLocaleString()} fish)
                </span>
              </div>
              <div className="text-[11px] text-indigo-300/80 font-mono mt-1">
                80% CI: {projectedLowOnDate.toFixed(1)} (~{lowOnDateAdults.toLocaleString()}) – {projectedHighOnDate.toFixed(1)} (~{highOnDateAdults.toLocaleString()})
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-indigo-900/60 text-xs">
              <span className="text-slate-400 text-[11px]">
                Confidence: <strong className="text-indigo-300 font-mono">{projection.confidenceLevel}%</strong>
              </span>
              <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{projDeltaVsAvgFinalPct}% vs avg
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARD 2 (NEW OPEN SLOT): MIGRATION VELOCITY (Daily CPUE & Inflow Pace)      */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between transition group">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-slate-400">Migration Velocity</span>
              <div className="flex items-center gap-1.5">
                {!isBeyondRecordedData ? (
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      isAccelerating
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isDecelerating
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    <Activity className="w-2.5 h-2.5" />
                    {isAccelerating ? 'Surging Pace ↑' : isDecelerating ? 'Decelerating ↓' : 'Steady Pace →'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Modeled Inflow
                  </span>
                )}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2.5">
            {!isBeyondRecordedData ? (
              <>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    +{rolling3DayPace.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-amber-400 font-mono">
                    pts/day (~{rollingAdultsPace.toLocaleString()} fish/day)
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>Single Set ({selectedMonthDay}):</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {singleDaySet.toFixed(2)} pts (~{Math.round(singleDaySet * ADULT_EXPANSION_FACTOR).toLocaleString()} fish)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-100 tracking-tight">
                    ~{projectedDailyEntry.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-indigo-300 font-mono">
                    pts/day (~{projectedDailyAdults.toLocaleString()} fish/day)
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Estimated daily river entry pace on {selectedMonthDay}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-500 text-[11px]">Season Peak Pulse:</span>
            <span className="font-mono font-bold text-amber-300 text-[11px]">
              {peakDailyIndex.toFixed(2)} pts ({peakDate})
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3: MIGRATION TIMING & ANALOG                                         */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between transition group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-400">Migration Timing &amp; Analog</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition">
              <Compass className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{projection.bestFitAnalogYear}</span>
              <span className="text-xs font-normal font-sans text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                Best Fit Analog
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {projection.percentElapsedHistorical < 40
                ? 'Early migration phase'
                : projection.percentElapsedHistorical < 80
                ? 'Peak run passage window'
                : 'Late season tail passage'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Historical Run Elapsed:</span>
            <span className="font-mono font-bold text-cyan-300">{projection.percentElapsedHistorical}%</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 4: CONSERVATION & ESCAPEMENT TARGET                                 */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between transition group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-400">Escapement Status</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${getStatusColor(
                  projection.conservationTier
                )}`}
              >
                {projection.conservationTier}
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold">
                {projection.escapementTargetPct}% of Target
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  projection.escapementTargetPct >= 100
                    ? 'bg-emerald-500'
                    : projection.escapementTargetPct >= 75
                    ? 'bg-teal-500'
                    : projection.escapementTargetPct >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, projection.escapementTargetPct)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span>
              Target: <strong className="text-slate-200">110 pts (~24.2k Fish)</strong>
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">Above Target!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
