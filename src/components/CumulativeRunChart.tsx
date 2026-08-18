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
  SEASON_DAYS,
  ESCAPEMENT_THRESHOLDS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import {
  Eye,
  EyeOff,
  Filter,
  Sparkles,
  Fish,
  BarChart3,
  LineChart,
  Trophy,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

interface CumulativeRunChartProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  isMetricInAdults: boolean;
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  onSelectPreset: (preset: 'all' | 'recent' | 'extremes' | 'currentOnly') => void;
  allYears?: YearRunData[];
}

export const CumulativeRunChart: React.FC<CumulativeRunChartProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
  selectedYears,
  onToggleYear,
  onSelectPreset,
  allYears = [],
}) => {
  // Toggle between Horizontal Standings / Benchmark Bars and the S-Curve Line Chart
  const [visualMode, setVisualMode] = useState<'bars' | 'curve'>('bars');
  const [barScope, setBarScope] = useState<'onDate' | 'seasonTotal'>('onDate');

  const [showAverage, setShowAverage] = useState<boolean>(true);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(true);
  const [showThresholds, setShowThresholds] = useState<boolean>(true);
  const [showConfidenceBands, setShowConfidenceBands] = useState<boolean>(true);

  // Multiplier for display units
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;
  const unitLabel = isMetricInAdults ? 'Adult Steelhead' : 'Tyee Index Points';

  const isYearSelected = (year: number) => selectedYears.includes(year);

  // Build line chart dataset
  const { chartData, lastRecordedDayIndex, isSelectedDateFuture } = useMemo(() => {
    const currentYearRecord = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
    
    // Find the latest day with published in-season DFO data
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
      const projItem = trajectoryMap.get(idx);
      const isPastOrRecorded = idx <= lastRecIdx;

      const row: any = {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        avgCumulative: Math.round(hist.avgCumulative * mult * 10) / 10,
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

      // Current Year 2026 handling:
      if (isPastOrRecorded) {
        const raw = currentYearRecord?.data[idx]?.cumulativeIndex ?? 0;
        row.currentActual = Math.round(raw * mult * 10) / 10;
        if (idx === lastRecIdx) {
          row.currentProjected = row.currentActual;
          row.ciLow = row.currentActual;
          row.ciHigh = row.currentActual;
          row.ciRange = [row.currentActual, row.currentActual];
        } else {
          row.currentProjected = null;
          row.ciLow = null;
          row.ciHigh = null;
          row.ciRange = null;
        }
      } else {
        row.currentActual = null;
        if (projItem) {
          row.currentProjected = Math.round(projItem.projectedCumulative * mult * 10) / 10;
          row.ciLow = Math.round(projItem.projectedCumulativeLow * mult * 10) / 10;
          row.ciHigh = Math.round(projItem.projectedCumulativeHigh * mult * 10) / 10;
          row.ciRange = [
            Math.round(projItem.projectedCumulativeLow * mult * 10) / 10,
            Math.round(projItem.projectedCumulativeHigh * mult * 10) / 10,
          ];
        }
      }

      return row;
    });

    return { chartData: data, lastRecordedDayIndex: lastRecIdx, isSelectedDateFuture: isFuture };
  }, [currentDayIndex, projection, mult, allYears]);

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';

  // =========================================================================
  // HORIZONTAL STANDINGS & BENCHMARK BAR DATA
  // =========================================================================
  const horizontalBarData = useMemo(() => {
    const histDay = HISTORICAL_AVERAGE_CURVE[currentDayIndex] || HISTORICAL_AVERAGE_CURVE[0];
    const histAvgCumulative = histDay.avgCumulative;
    const histFinalAvg = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1].avgCumulative;

    // Items list
    const items = allYears.map((y) => {
      const isCurrent = y.isCurrentYear || y.year === CURRENT_YEAR;
      let valOnDate = y.data[currentDayIndex]?.cumulativeIndex || 0;
      let seasonTotal = y.totalIndex;

      if (isCurrent) {
        valOnDate = projection.currentCumulative;
        seasonTotal = projection.projectedBaselineIndex;
      }

      const activeRaw = barScope === 'onDate' ? valOnDate : seasonTotal;
      const baseline = barScope === 'onDate' ? histAvgCumulative : histFinalAvg;
      const deltaVsBaseline = baseline > 0 ? Math.round(((activeRaw - baseline) / baseline) * 100) : 0;

      return {
        id: `year_${y.year}`,
        label: `${y.year}`,
        isCurrent,
        isAverage: false,
        color: isCurrent ? '#06b6d4' : y.color,
        rawVal: activeRaw,
        valDisplay: Math.round(activeRaw * mult * 10) / 10,
        adults: Math.round(activeRaw * ADULT_EXPANSION_FACTOR),
        status: y.conservationStatus,
        deltaVsBaseline,
        notes: y.notes,
      };
    });

    // Add 10-Yr Historical Average Bar as a reference item
    const avgVal = barScope === 'onDate' ? histAvgCumulative : histFinalAvg;
    items.push({
      id: 'avg_10yr',
      label: '10-Yr Average',
      isCurrent: false,
      isAverage: true,
      color: '#38bdf8',
      rawVal: avgVal,
      valDisplay: Math.round(avgVal * mult * 10) / 10,
      adults: Math.round(avgVal * ADULT_EXPANSION_FACTOR),
      status: 'Target Baseline',
      deltaVsBaseline: 0,
      notes: 'DFO 10-Year Historical Mean',
    });

    // Sort descending by raw value
    items.sort((a, b) => b.rawVal - a.rawVal);

    const maxVal = Math.max(...items.map((i) => i.rawVal), 1);
    const currentItemRank = items.filter((i) => !i.isAverage).findIndex((i) => i.isCurrent) + 1;

    return {
      items,
      maxVal,
      currentRank: currentItemRank,
      totalCount: items.filter((i) => !i.isAverage).length,
    };
  }, [allYears, currentDayIndex, projection, barScope, mult]);

  // Custom Line Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const hoveredDayIndex = payload[0]?.payload?.dayIndex;
    const isHoveredRecorded = hoveredDayIndex !== undefined && hoveredDayIndex <= lastRecordedDayIndex;

    const filteredEntries = payload.filter((p: any) => {
      if (!p.dataKey || p.value === undefined || p.value === null || isNaN(p.value)) return false;
      if (p.dataKey.includes('envelope') || p.dataKey.includes('ciRange') || p.dataKey === 'ciLow' || p.dataKey === 'ciHigh') {
        return false;
      }
      if (isHoveredRecorded && p.dataKey === 'currentProjected' && hoveredDayIndex !== lastRecordedDayIndex) return false;
      if (!isHoveredRecorded && p.dataKey === 'currentActual') return false;
      return true;
    });

    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 min-w-[230px] max-w-[300px]">
        <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex justify-between items-center">
          <span className="text-cyan-400 font-extrabold">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
            {isHoveredRecorded ? 'Recorded DFO' : 'Forecast'}
          </span>
        </div>

        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {filteredEntries.map((p: any) => {
            const is2026 = p.dataKey === 'currentActual' || p.dataKey === 'currentProjected';
            const isAvg = p.dataKey === 'avgCumulative';
            const yearName = is2026 ? `${CURRENT_YEAR} (Current)` : isAvg ? '10-Yr DFO Average' : p.name;
            const val = typeof p.value === 'number' ? p.value : 0;
            const expandedAdults = isMetricInAdults ? val : Math.round(val * ADULT_EXPANSION_FACTOR);

            return (
              <div
                key={p.dataKey}
                className={`flex justify-between items-center py-1 px-1.5 rounded ${
                  is2026 ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-200' : isAvg ? 'bg-slate-900/80 text-slate-300' : 'text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#38bdf8' }} />
                  <span className="font-medium">{yearName}</span>
                </div>
                <div className="font-mono font-bold text-right">
                  <span>{val.toFixed(1)}</span>
                  {!isMetricInAdults && <span className="text-[10px] text-slate-500 ml-1">(~{expandedAdults.toLocaleString()})</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4">
      {/* Top Header & Visual Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{visualMode === 'bars' ? 'Escapement Standings & Benchmarks' : 'S-Curve Migration Trajectory'}</span>
            </h3>
            {isSelectedDateFuture ? (
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Forecasting {selectedMonthDay}
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-semibold flex items-center gap-1">
                <Fish className="w-3 h-3 text-emerald-400" />
                DFO Data ({selectedMonthDay})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {visualMode === 'bars'
              ? `2026 currently ranks #${horizontalBarData.currentRank} of ${horizontalBarData.totalCount} seasons recorded`
              : 'Tracking in-season run progression against historical percentiles and model projection'}
          </p>
        </div>

        {/* Primary View Toggle Switch: [ 📊 Standings Bars ] ⟷ [ 📈 Run Curve ] */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setVisualMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                visualMode === 'bars'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Standings Bars</span>
            </button>

            <button
              onClick={() => setVisualMode('curve')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                visualMode === 'curve'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Run Curve</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HORIZONTAL STANDINGS & BENCHMARK BAR VIEW (Mobile Preferred)            */}
      {/* ========================================================================= */}
      {visualMode === 'bars' ? (
        <div className="space-y-3.5">
          {/* Sub-scope toggle: To-Date vs Season Total */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-1">
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setBarScope('onDate')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  barScope === 'onDate' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Passage on {selectedMonthDay}
              </button>
              <button
                onClick={() => setBarScope('seasonTotal')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  barScope === 'seasonTotal' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full Season Final / Proj
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <strong className="text-cyan-300">2026</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>10-Yr Avg</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>Archive</span>
              </span>
            </div>
          </div>

          {/* Vertical Stack of Horizontal Bars */}
          <div className="space-y-2.5">
            {horizontalBarData.items.map((item, idx) => {
              const rank = item.isAverage ? null : idx + 1;
              const barWidthPct = Math.max(5, Math.round((item.rawVal / horizontalBarData.maxVal) * 100));

              return (
                <div
                  key={item.id}
                  className={`p-2.5 sm:p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                    item.isCurrent
                      ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/30'
                      : item.isAverage
                      ? 'bg-slate-950/90 border-sky-500/40'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {/* Rank & Year Label */}
                    <div className="flex items-center gap-2 min-w-0">
                      {rank !== null ? (
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${
                            rank === 1
                              ? 'bg-amber-500 text-slate-950'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{rank}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-md bg-sky-950 text-sky-400 border border-sky-800/60 flex items-center justify-center text-[10px] font-bold shrink-0">
                          AVG
                        </span>
                      )}

                      <span className={`font-bold truncate ${item.isCurrent ? 'text-cyan-300 text-sm' : item.isAverage ? 'text-sky-300 font-semibold' : 'text-slate-200'}`}>
                        {item.label}
                        {item.isCurrent && <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">CURRENT RUN</span>}
                      </span>
                    </div>

                    {/* Escapement Values & Delta */}
                    <div className="flex items-center gap-2 text-right shrink-0">
                      <div className="font-mono">
                        <span className={`font-black ${item.isCurrent ? 'text-cyan-300 text-sm' : 'text-white'}`}>
                          {item.valDisplay.toFixed(1)} {isMetricInAdults ? 'adults' : 'pts'}
                        </span>
                        {!isMetricInAdults && (
                          <span className="text-[10px] text-slate-400 ml-1.5 hidden xs:inline">
                            (~{item.adults.toLocaleString()} fish)
                          </span>
                        )}
                      </div>

                      {!item.isAverage && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            item.deltaVsBaseline >= 0
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-red-500/15 text-red-300'
                          }`}
                        >
                          {item.deltaVsBaseline >= 0 ? `+${item.deltaVsBaseline}%` : `${item.deltaVsBaseline}%`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar Metric Track */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2.5 sm:h-3 overflow-hidden relative">
                    {/* Conservation Target Marker line (110 pts) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10 opacity-70 pointer-events-none"
                      style={{
                        left: `${Math.min(100, (ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY / horizontalBarData.maxVal) * 100)}%`,
                      }}
                      title="Healthy Conservation Target (110 pts)"
                    />

                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isCurrent
                          ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/50'
                          : item.isAverage
                          ? 'bg-gradient-to-r from-sky-400 to-blue-400'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                      style={{
                        width: `${barWidthPct}%`,
                        backgroundColor: !item.isCurrent && !item.isAverage ? item.color : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. S-CURVE MIGRATION LINE CHART VIEW                                      */
        /* ========================================================================= */
        <div className="space-y-3">
          {/* Controls / Filter Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Presets:
              </span>
              <button
                onClick={() => onSelectPreset('currentOnly')}
                className={`px-2 py-1 rounded-md transition font-medium ${
                  selectedYears.length === 1 && selectedYears[0] === CURRENT_YEAR
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                2026 + Avg
              </button>
              <button
                onClick={() => onSelectPreset('recent')}
                className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
              >
                Recent (2022–2026)
              </button>
              <button
                onClick={() => onSelectPreset('all')}
                className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
              >
                All 10 Years
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAverage(!showAverage)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium border transition ${
                  showAverage ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                10-Yr Avg
              </button>
              <button
                onClick={() => setShowConfidenceBands(!showConfidenceBands)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium border transition ${
                  showConfidenceBands ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'
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
                    fill="#334155"
                    fillOpacity={0.18}
                    isAnimationActive={false}
                  />
                )}

                {showConfidenceBands && (
                  <Area
                    type="monotone"
                    dataKey="ciRange"
                    stroke="none"
                    fill="#6366f1"
                    fillOpacity={0.22}
                    isAnimationActive={false}
                  />
                )}

                <XAxis
                  dataKey="monthDay"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={{ stroke: '#334155' }}
                  interval={12}
                />

                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickLine={{ stroke: '#334155' }}
                  domain={[0, 'auto']}
                />

                <Tooltip content={<CustomTooltip />} />

                {showThresholds && (
                  <ReferenceLine
                    y={ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY * mult}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}

                {/* Selected Date Pin */}
                <ReferenceLine
                  x={selectedMonthDay}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />

                {showAverage && (
                  <Line
                    type="monotone"
                    dataKey="avgCumulative"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="10-Year Average"
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
                  stroke="#06b6d4"
                  strokeWidth={3.5}
                  dot={false}
                  name={`${CURRENT_YEAR} Recorded`}
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="currentProjected"
                  stroke="#818cf8"
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
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] border-t border-slate-800/80 pt-2.5 text-slate-400">
        <span>Target: 110 Index pts (~24,200 adult wild steelhead)</span>
        <span className="font-mono text-cyan-300">Conversion: 1.0 pt &approx; 220 adult fish</span>
      </div>
    </div>
  );
};
