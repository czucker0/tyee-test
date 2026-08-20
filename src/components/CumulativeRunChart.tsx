import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  ALL_TIME_AVERAGE_CURVE,
  SEASON_DAYS,
  ESCAPEMENT_THRESHOLDS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import {
  Sparkles,
  Fish,
  BarChart3,
  LineChart,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CumulativeRunChartProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  selectedMonthDay?: string;
  isMetricInAdults: boolean;
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  onSelectPreset: (preset: 'all' | 'recent' | 'extremes' | 'vintage' | 'currentOnly') => void;
  allYears?: YearRunData[];
}

export const CumulativeRunChart: React.FC<CumulativeRunChartProps> = ({
  currentDayIndex,
  projection,
  selectedMonthDay,
  isMetricInAdults,
  selectedYears,
  onSelectPreset,
  allYears = [],
}) => {
  const { isDark } = useTheme();
  const dateLabel = selectedMonthDay || SEASON_DAYS[currentDayIndex]?.monthDay || 'Selected Date';
  // Toggle between Horizontal Standings / Benchmark Bars and the S-Curve Line Chart
  const [visualMode, setVisualMode] = useState<'bars' | 'curve'>('bars');
  const [barScope, setBarScope] = useState<'onDate' | 'seasonTotal'>('onDate');

  const [showAverage, setShowAverage] = useState<boolean>(true);
  const [showAllTimeAverage, setShowAllTimeAverage] = useState<boolean>(true);
  const [showEnvelope] = useState<boolean>(true);
  const [showThresholds] = useState<boolean>(true);
  const [showConfidenceBands, setShowConfidenceBands] = useState<boolean>(true);

  // Multiplier for display units
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;

  const isYearSelected = (year: number) => selectedYears.includes(year);

  // Build line chart dataset
  const { chartData, isSelectedDateFuture } = useMemo(() => {
    const currentYearRecord = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
    
    let lastRecIdx = 67; // Aug 16 fallback
    if (currentYearRecord && currentYearRecord.data && currentYearRecord.data.length > 0) {
      for (let i = currentYearRecord.data.length - 1; i >= 0; i--) {
        const d: any = currentYearRecord.data[i];
        if (d.isRecorded === true || (d.dailyIndex > 0 && d.cumulativeIndex > 0)) {
          lastRecIdx = i;
          break;
        }
      }
    }

    const trajectoryMap = new Map<number, typeof projection.projectedDailyTrajectory[0]>();
    projection.projectedDailyTrajectory.forEach((t) => {
      trajectoryMap.set(t.dayOfYear - 1, t);
    });

    const isFuture = currentDayIndex > lastRecIdx;

    const data = SEASON_DAYS.map((sDay, idx) => {
      const hist = HISTORICAL_AVERAGE_CURVE[idx] || { avgCumulative: 0, minCumulative: 0, maxCumulative: 0 };
      const allTimeHist = ALL_TIME_AVERAGE_CURVE[idx] || { avgCumulative: 0, avgDaily: 0 };
      const projItem = trajectoryMap.get(idx);
      const isPastOrRecorded = idx <= lastRecIdx;

      const row: any = {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        avgCumulative: Math.round(hist.avgCumulative * mult * 10) / 10,
        allTimeCumulative: Math.round(allTimeHist.avgCumulative * mult * 10) / 10,
        minCumulative: Math.round(hist.minCumulative * mult * 10) / 10,
        maxCumulative: Math.round(hist.maxCumulative * mult * 10) / 10,
        envelopeRange: [Math.round(hist.minCumulative * mult * 10) / 10, Math.round(hist.maxCumulative * mult * 10) / 10],
      };

      // Previous years
      allYears.forEach((y) => {
        if (!y.isCurrentYear && y.year !== CURRENT_YEAR && y.data[idx]) {
          row[`year_${y.year}`] = Math.round(y.data[idx].cumulativeIndex * mult * 10) / 10;
        }
      });

      // 2026 In-Season actual vs projected trajectory
      if (isPastOrRecorded) {
        const recVal = currentYearRecord?.data[idx]?.cumulativeIndex ?? 0;
        row.currentActual = Math.round(recVal * mult * 10) / 10;
        if (idx === lastRecIdx) {
          row.currentProjected = Math.round(recVal * mult * 10) / 10;
        }
      } else {
        const projectedVal = projItem?.projectedCumulative ?? projection.projectedBaselineIndex;
        row.currentProjected = Math.round(projectedVal * mult * 10) / 10;

        if (projItem) {
          row.ciRange = [
            Math.round(projItem.projectedCumulativeLow * mult * 10) / 10,
            Math.round(projItem.projectedCumulativeHigh * mult * 10) / 10,
          ];
        }
      }

      return row;
    });

    return { chartData: data, lastRecordedDayIndex: lastRecIdx, isSelectedDateFuture: isFuture };
  }, [allYears, currentDayIndex, mult, projection]);

  // Build horizontal benchmark bar dataset
  const horizontalBarData = useMemo(() => {
    const histDay = HISTORICAL_AVERAGE_CURVE[currentDayIndex] || HISTORICAL_AVERAGE_CURVE[0];
    const histAvgOnDate = histDay.avgCumulative;
    const histFinalAvg = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1].avgCumulative;

    const currentYearRecord = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
    
    // Find last recorded day index
    let lastRecIdx = 67; // Aug 16 fallback
    if (currentYearRecord && currentYearRecord.data && currentYearRecord.data.length > 0) {
      for (let i = currentYearRecord.data.length - 1; i >= 0; i--) {
        const d: any = currentYearRecord.data[i];
        if (d.isRecorded === true || (d.dailyIndex > 0 && d.cumulativeIndex > 0)) {
          lastRecIdx = i;
          break;
        }
      }
    }

    const isDateFuture = currentDayIndex > lastRecIdx;

    // Trajectory lookup
    const trajectoryItem = projection.projectedDailyTrajectory.find((t) => t.dayOfYear - 1 === currentDayIndex);

    // Calculate current year value on date (use projection if date is beyond recorded data)
    let currentOnDate = currentYearRecord?.data[currentDayIndex]?.cumulativeIndex ?? projection.currentCumulative;
    if (isDateFuture) {
      currentOnDate = trajectoryItem?.projectedCumulative ?? projection.projectedBaselineIndex;
    }

    const currentSeasonTotal = projection.projectedBaselineIndex;

    const barItems: Array<{
      id: string;
      label: string;
      year?: number;
      isCurrent?: boolean;
      isProjected?: boolean;
      isAverage?: boolean;
      color: string;
      rawVal: number;
      valDisplay: number;
      adults: number;
      deltaVsBaseline: number;
    }> = [];

    // 1. Current 2026 Year
    const currentActiveVal = barScope === 'onDate' ? currentOnDate : currentSeasonTotal;
    const baseToCompare = barScope === 'onDate' ? histAvgOnDate : histFinalAvg;
    const curDelta = baseToCompare > 0 ? Math.round(((currentActiveVal - baseToCompare) / baseToCompare) * 1000) / 10 : 0;

    let currentLabel = `${CURRENT_YEAR} (Recorded to Date)`;
    if (barScope === 'seasonTotal') {
      currentLabel = `${CURRENT_YEAR} (Forecast Final)`;
    } else if (isDateFuture) {
      currentLabel = `${CURRENT_YEAR} (Projected on ${dateLabel})`;
    }

    barItems.push({
      id: `current_${CURRENT_YEAR}`,
      label: currentLabel,
      year: CURRENT_YEAR,
      isCurrent: true,
      isProjected: isDateFuture || barScope === 'seasonTotal',
      color: isDark ? '#f59e0b' : '#c56a25',
      rawVal: currentActiveVal,
      valDisplay: currentActiveVal * mult,
      adults: Math.round(currentActiveVal * ADULT_EXPANSION_FACTOR),
      deltaVsBaseline: curDelta,
    });

    // 2. 10-Year Historical Average
    const avgActiveVal = barScope === 'onDate' ? histAvgOnDate : histFinalAvg;
    barItems.push({
      id: 'hist_avg',
      label: barScope === 'onDate' ? '10-Year Average (On Date)' : '10-Year Average (Final)',
      isAverage: true,
      color: isDark ? '#2dd4bf' : '#1a6467',
      rawVal: avgActiveVal,
      valDisplay: avgActiveVal * mult,
      adults: Math.round(avgActiveVal * ADULT_EXPANSION_FACTOR),
      deltaVsBaseline: 0,
    });

    // 2b. 70-Year All-Time Baseline
    const allTimeDay = ALL_TIME_AVERAGE_CURVE[currentDayIndex] || ALL_TIME_AVERAGE_CURVE[0];
    const allTimeActiveVal = barScope === 'onDate' ? allTimeDay.avgCumulative : ALL_TIME_AVERAGE_CURVE[ALL_TIME_AVERAGE_CURVE.length - 1].avgCumulative;
    const allTimeDelta = baseToCompare > 0 ? Math.round(((allTimeActiveVal - baseToCompare) / baseToCompare) * 1000) / 10 : 0;
    barItems.push({
      id: 'all_time_avg',
      label: barScope === 'onDate' ? '70-Yr All-Time Avg (On Date)' : '70-Yr All-Time Avg (Final)',
      isAverage: true,
      color: isDark ? '#a855f7' : '#7e22ce',
      rawVal: allTimeActiveVal,
      valDisplay: allTimeActiveVal * mult,
      adults: Math.round(allTimeActiveVal * ADULT_EXPANSION_FACTOR),
      deltaVsBaseline: allTimeDelta,
    });

    // 3. Archival Selected Years
    allYears.forEach((y) => {
      if (y.isCurrentYear || y.year === CURRENT_YEAR || !isYearSelected(y.year)) return;
      const yValOnDate = y.data[currentDayIndex]?.cumulativeIndex || 0;
      const yValFinal = y.totalIndex;
      const yActive = barScope === 'onDate' ? yValOnDate : yValFinal;
      const yDelta = baseToCompare > 0 ? Math.round(((yActive - baseToCompare) / baseToCompare) * 1000) / 10 : 0;

      barItems.push({
        id: `year_${y.year}`,
        label: `${y.year} ${barScope === 'onDate' ? `(${y.data[currentDayIndex]?.monthDay || ''})` : 'Final'}`,
        year: y.year,
        color: y.color,
        rawVal: yActive,
        valDisplay: yActive * mult,
        adults: Math.round(yActive * ADULT_EXPANSION_FACTOR),
        deltaVsBaseline: yDelta,
      });
    });

    // Sort descending by value
    barItems.sort((a, b) => b.rawVal - a.rawVal);

    const maxVal = Math.max(...barItems.map((b) => b.rawVal), 1);
    const currentRank = barItems.findIndex((b) => b.isCurrent) + 1;

    return {
      items: barItems,
      maxVal,
      currentRank,
      totalCount: barItems.length,
    };
  }, [allYears, barScope, currentDayIndex, isDark, isYearSelected, mult, projection]);

  // Selected date info
  const selectedDayInfo = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const dateFormatted = selectedMonthDay || selectedDayInfo.monthDay;

  // Custom Tooltip for S-Curve Line Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-xl max-w-xs text-xs font-mono">
        <div className="border-b border-[var(--border-main)] pb-1.5 mb-2 flex items-center justify-between">
          <span className="font-bold text-[var(--text-main)] text-sm">{label}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Day {payload[0]?.payload?.dayIndex + 1}/113</span>
        </div>

        <div className="space-y-1.5">
          {payload.map((p: any) => {
            if (p.dataKey === 'envelopeRange' || p.dataKey === 'ciRange') return null;

            let yearName = p.name;
            let val = Number(p.value || 0);
            let expandedAdults = Math.round(val * (isMetricInAdults ? 1 : ADULT_EXPANSION_FACTOR));

            return (
              <div key={p.dataKey} className="flex items-center justify-between gap-3 text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#c56a25' }} />
                  <span className="font-medium font-mono text-[11px]">{yearName}</span>
                </div>
                <div className="font-mono font-bold text-right text-[var(--text-main)]">
                  <span>{val.toFixed(1)}</span>
                  {!isMetricInAdults && <span className="text-[10px] text-[var(--text-muted)] ml-1">(~{expandedAdults.toLocaleString()})</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      {/* Top Header & Visual Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide flex items-center gap-2">
              <span>{visualMode === 'bars' ? 'Escapement Standings & Benchmarks' : 'Cumulative Escapement'}</span>
            </h3>
            {isSelectedDateFuture ? (
              <span className="stamp-badge stamp-amber">
                <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
                Forecasting {dateFormatted}
              </span>
            ) : (
              <span className="stamp-badge stamp-teal">
                <Fish className="w-3 h-3" />
                <span>DFO Test Catch</span>
                <span className="font-bold normal-case">({dateFormatted})</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            {visualMode === 'bars'
              ? `2026 currently ranks #${horizontalBarData.currentRank} of ${horizontalBarData.totalCount} seasons in ledger`
              : 'Tracking in-season run progression against historical percentiles and model projection'}
          </p>
        </div>

        {/* Primary View Toggle Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] flex items-center gap-1 font-mono">
            <button
              onClick={() => setVisualMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                visualMode === 'bars'
                  ? 'bg-[var(--accent-amber)] text-white shadow-sm font-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Standings Bars</span>
            </button>

            <button
              onClick={() => setVisualMode('curve')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                visualMode === 'curve'
                  ? 'bg-[var(--accent-amber)] text-white shadow-sm font-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Run Curve</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. HORIZONTAL STANDINGS & BENCHMARK BAR VIEW */}
      {visualMode === 'bars' ? (
        <div className="space-y-3.5">
          {/* Sub-scope toggle: To-Date vs Season Total - Standardized Segmented Pill */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1 font-mono">
            <div className="bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] flex items-center gap-1">
              <button
                onClick={() => setBarScope('onDate')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                  barScope === 'onDate'
                    ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>On</span>
                <span className="font-bold">{dateLabel}</span>
              </button>
              <button
                onClick={() => setBarScope('seasonTotal')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  barScope === 'seasonTotal'
                    ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                Full Season Final / Proj
              </button>
            </div>

            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-amber)]" />
                <strong className="text-[var(--accent-amber)]">2026</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-teal)]" />
                <span>10-Yr Avg</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                <span>Archive</span>
              </span>
            </div>
          </div>

          {/* Vertical Stack of Horizontal Bars - Harmonized with YearRankingChart */}
          <div className="space-y-2.5">
            {horizontalBarData.items.map((item, idx) => {
              const rank = item.isAverage ? null : idx + 1;
              const barWidthPct = Math.max(4, Math.round((item.rawVal / horizontalBarData.maxVal) * 100));

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.isCurrent
                      ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] shadow-sm'
                      : item.isAverage
                      ? 'bg-[var(--accent-teal-light)] border-[var(--accent-teal-border)]'
                      : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
                  }`}
                >
                  {/* Left: Year & Rank Info */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                        rank === 1
                          ? 'bg-[var(--accent-amber)] text-white'
                          : rank === 2
                          ? 'bg-stone-300 text-stone-900'
                          : rank === 3
                          ? 'bg-stone-400 text-white'
                          : item.isAverage
                          ? 'bg-[var(--accent-teal)] text-white'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)]'
                      }`}
                    >
                      {rank !== null ? `#${rank}` : 'AVG'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={`font-mono font-black text-sm ${item.isCurrent ? 'text-[var(--accent-amber)]' : item.id === 'all_time_avg' ? 'text-purple-600 dark:text-purple-400 font-bold' : item.isAverage ? 'text-[var(--accent-teal)] font-bold' : 'text-[var(--text-main)]'}`}>
                          {item.id === 'all_time_avg' ? '70-Yr All-Time Avg' : item.id === 'hist_avg' ? '10-Yr Decade Mean' : item.year}
                        </span>
                        {item.isCurrent && (
                          <span className={`stamp-badge ${item.isProjected ? 'stamp-amber' : 'stamp-teal'}`}>
                            {item.isProjected ? 'Projection' : 'Recorded'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                        {item.isCurrent
                          ? barScope === 'onDate'
                            ? isSelectedDateFuture
                              ? `Projected on ${dateLabel}`
                              : `Recorded on ${dateLabel}`
                            : 'Season Forecast'
                          : item.id === 'all_time_avg'
                          ? '1956–2025 Long-Term Baseline'
                          : item.isAverage
                          ? '2016–2025 Rolling Baseline'
                          : barScope === 'onDate'
                          ? `On ${dateLabel}`
                          : 'Final Season Total'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Visual Bar Indicator Track */}
                  <div className="flex-1 px-2 hidden sm:block">
                    <div className="w-full bg-[var(--bg-subtle)] rounded-full h-3.5 overflow-hidden p-0.5 border border-[var(--border-main)] relative">
                      {/* Target Marker (110 pts) */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-spruce)] z-10 opacity-75 pointer-events-none"
                        style={{
                          left: `${Math.min(100, (ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY / horizontalBarData.maxVal) * 100)}%`,
                        }}
                        title="Healthy Conservation Target (110 pts)"
                      />

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isCurrent
                            ? 'bg-[var(--accent-amber)]'
                            : item.isAverage
                            ? 'bg-[var(--accent-teal)]'
                            : 'bg-stone-400 dark:bg-stone-600'
                        }`}
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Value & Fish Count Breakdown */}
                  <div className="text-right min-w-[150px] flex sm:flex-col justify-between sm:justify-center items-center sm:items-end font-mono">
                    <div className="text-xs font-bold text-[var(--text-main)]">
                      <span>{item.valDisplay.toFixed(1)} {isMetricInAdults ? 'adults' : 'pts'}</span>
                      {!isMetricInAdults && (
                        <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1 hidden xs:inline">
                          (~{item.adults.toLocaleString()} fish)
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
                      {!item.isAverage ? (
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                            item.deltaVsBaseline >= 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          {item.deltaVsBaseline >= 0 ? `+${item.deltaVsBaseline}%` : `${item.deltaVsBaseline}%`} vs avg
                        </span>
                      ) : (
                        <span>Historical Benchmark</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. S-CURVE TRAJECTORY LINE CHART */
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1 font-mono">
            {/* Active Year Cohort Indicator */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--text-muted)] font-mono">Comparing:</span>
              <span className="px-2 py-0.5 text-[11px] rounded bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] font-bold">
                {selectedYears.length} {selectedYears.length === 1 ? 'Season' : 'Seasons'}
              </span>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAverage(!showAverage)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium border transition cursor-pointer ${
                  showAverage ? 'bg-[var(--accent-teal-light)] border-[var(--accent-teal-border)] text-[var(--accent-teal)] font-bold' : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-muted)]'
                }`}
              >
                10-Yr Avg
              </button>
              <button
                onClick={() => setShowAllTimeAverage(!showAllTimeAverage)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium border transition cursor-pointer ${
                  showAllTimeAverage ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold' : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-muted)]'
                }`}
              >
                70-Yr Avg
              </button>
              <button
                onClick={() => setShowConfidenceBands(!showConfidenceBands)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium border transition cursor-pointer ${
                  showConfidenceBands ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] text-[var(--accent-amber)] font-bold' : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-muted)]'
                }`}
              >
                80% CI
              </button>
            </div>
          </div>

          {/* Line Chart Canvas */}
          <div className="h-[320px] sm:h-[400px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
                {showEnvelope && (
                  <Area
                    type="monotone"
                    dataKey="envelopeRange"
                    stroke="none"
                    fill={isDark ? '#1e2e33' : '#e4dcd0'}
                    fillOpacity={isDark ? 0.25 : 0.45}
                    isAnimationActive={false}
                  />
                )}

                {showConfidenceBands && (
                  <Area
                    type="monotone"
                    dataKey="ciRange"
                    stroke="none"
                    fill={isDark ? '#d97706' : '#e89553'}
                    fillOpacity={isDark ? 0.18 : 0.25}
                    isAnimationActive={false}
                  />
                )}

                <XAxis
                  dataKey="monthDay"
                  stroke={isDark ? '#475569' : '#a39b8c'}
                  tick={{ fill: isDark ? '#94a3b8' : '#5c6760', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: isDark ? '#263b40' : '#d8cfbe' }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />

                <YAxis
                  stroke={isDark ? '#475569' : '#a39b8c'}
                  tick={{ fill: isDark ? '#94a3b8' : '#5c6760', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: isDark ? '#263b40' : '#d8cfbe' }}
                  domain={[0, 'auto']}
                />

                <Tooltip content={<CustomTooltip />} />

                {showThresholds && (
                  <ReferenceLine
                    y={ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY * mult}
                    stroke={isDark ? '#10b981' : '#224b38'}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}

                {/* Selected Date Pin */}
                <ReferenceLine
                  x={selectedMonthDay}
                  stroke={isDark ? '#f59e0b' : '#c56a25'}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />

                {showAverage && (
                  <Line
                    type="monotone"
                    dataKey="avgCumulative"
                    stroke={isDark ? '#2dd4bf' : '#1a6467'}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="10-Year Average"
                    isAnimationActive={false}
                  />
                )}

                {showAllTimeAverage && (
                  <Line
                    type="monotone"
                    dataKey="allTimeCumulative"
                    stroke={isDark ? '#a855f7' : '#7e22ce'}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    name="70-Yr All-Time Average"
                    isAnimationActive={false}
                  />
                )}

                {allYears.map((yr) => {
                  if (yr.isCurrentYear || yr.year === CURRENT_YEAR || !isYearSelected(yr.year)) return null;
                  return (
                    <Line
                      key={yr.year}
                      type="monotone"
                      dataKey={`year_${yr.year}`}
                      stroke={yr.color}
                      strokeWidth={1.75}
                      dot={false}
                      name={`${yr.year}`}
                      isAnimationActive={false}
                    />
                  );
                })}

                <Line
                  type="monotone"
                  dataKey="currentActual"
                  stroke={isDark ? '#f59e0b' : '#c56a25'}
                  strokeWidth={3.5}
                  dot={false}
                  name={`${CURRENT_YEAR} Recorded`}
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="currentProjected"
                  stroke={isDark ? '#fbbf24' : '#e89553'}
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  name={`${CURRENT_YEAR} Forecast`}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] border-t border-[var(--border-main)] pt-2.5 text-[var(--text-muted)] font-mono">
        <span>Target: 110 Index pts (~24,200 adult wild steelhead)</span>
        <span className="text-[var(--accent-amber)]">Conversion: 1.0 pt &approx; 220 adult fish</span>
      </div>
    </div>
  );
};
