import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  SEASON_DAYS,
  ESCAPEMENT_THRESHOLDS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import { Eye, EyeOff, Layers, Check, Filter, Sparkles, Fish } from 'lucide-react';

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
  const [showAverage, setShowAverage] = useState<boolean>(true);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(true);
  const [showThresholds, setShowThresholds] = useState<boolean>(true);
  const [showConfidenceBands, setShowConfidenceBands] = useState<boolean>(true);

  // Multiplier for display units
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;
  const unitLabel = isMetricInAdults ? 'Adult Steelhead' : 'Tyee Index Points';

  const isYearSelected = (year: number) => selectedYears.includes(year);

  // Build chart dataset
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
      // 1. Solid Cyan line ONLY up to the last authentic recorded day (Aug 16)
      if (isPastOrRecorded) {
        const raw = currentYearRecord?.data[idx]?.cumulativeIndex ?? 0;
        row.currentActual = Math.round(raw * mult * 10) / 10;
        // Connect seam on last recorded day
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
        // 2. Beyond last recorded day (Aug 17 - Sep 30): Statistical Projection Trajectory
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

      // Slider marker tracking
      if (idx === currentDayIndex) {
        row.sliderSelectedValue = isPastOrRecorded ? row.currentActual : row.currentProjected;
      }

      return row;
    });

    return { chartData: data, lastRecordedDayIndex: lastRecIdx, isSelectedDateFuture: isFuture };
  }, [currentDayIndex, projection, mult, allYears]);

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const hoveredDayIndex = payload[0]?.payload?.dayIndex;
    const isHoveredRecorded = hoveredDayIndex !== undefined && hoveredDayIndex <= lastRecordedDayIndex;

    const filteredEntries = payload.filter((p: any) => {
      if (!p.dataKey || p.value === undefined || p.value === null || isNaN(p.value)) return false;
      if (p.dataKey.includes('envelope') || p.dataKey.includes('ciRange') || p.dataKey === 'ciLow' || p.dataKey === 'ciHigh' || p.dataKey === 'sliderSelectedValue') {
        return false;
      }

      if (isHoveredRecorded && p.dataKey === 'currentProjected' && hoveredDayIndex !== lastRecordedDayIndex) return false;
      if (!isHoveredRecorded && p.dataKey === 'currentActual') return false;

      return true;
    });

    const getYearWeight = (dataKey: string): number => {
      if (dataKey === 'currentActual' || dataKey === 'currentProjected') return 2026;
      if (dataKey.startsWith('year_')) {
        return parseInt(dataKey.replace('year_', ''), 10) || 0;
      }
      if (dataKey === 'avgCumulative') return 0;
      return -1;
    };

    const sortedEntries = [...filteredEntries].sort((a: any, b: any) => {
      return getYearWeight(b.dataKey) - getYearWeight(a.dataKey);
    });

    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 min-w-[240px] max-w-[320px]">
        <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-extrabold">{label}</span>
            <span className="text-slate-400 font-normal">
              (Day {hoveredDayIndex !== undefined ? hoveredDayIndex + 1 : ''}/113)
            </span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase bg-slate-800 text-slate-300">
            {isHoveredRecorded ? 'Recorded DFO' : 'Model Forecast'}
          </span>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {sortedEntries.map((p: any) => {
            const is2026 = p.dataKey === 'currentActual' || p.dataKey === 'currentProjected';
            const isAvg = p.dataKey === 'avgCumulative';
            const yearName = is2026
              ? isHoveredRecorded
                ? `${CURRENT_YEAR} (Recorded)`
                : `${CURRENT_YEAR} (Model Forecast)`
              : isAvg
              ? '10-Yr DFO Average'
              : p.name;

            const val = typeof p.value === 'number' ? p.value : 0;
            const expandedAdults = isMetricInAdults
              ? val
              : Math.round(val * ADULT_EXPANSION_FACTOR);

            return (
              <div
                key={p.dataKey}
                className={`flex justify-between items-center py-1 px-1.5 rounded transition ${
                  is2026
                    ? 'bg-cyan-950/40 border border-cyan-500/30'
                    : isAvg
                    ? 'bg-slate-900/60'
                    : 'hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || '#38bdf8' }}
                  />
                  <span
                    className={`font-medium ${
                      is2026 ? 'text-cyan-200 font-bold' : isAvg ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {yearName}
                  </span>
                </div>
                <div className="font-mono text-right">
                  <span className={`font-bold ${is2026 ? 'text-cyan-300' : 'text-white'}`}>
                    {val.toFixed(1)}
                  </span>
                  {!isMetricInAdults && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (~{expandedAdults.toLocaleString()} fish)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confidence Band info on future dates */}
        {!isHoveredRecorded && payload[0]?.payload?.ciLow !== null && (
          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-indigo-300/90 font-mono flex justify-between">
            <span>80% Model Envelope:</span>
            <span>
              {payload[0].payload.ciLow?.toFixed(1)} – {payload[0].payload.ciHigh?.toFixed(1)}{' '}
              {!isMetricInAdults ? 'pts' : 'fish'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Cumulative Tyee Test Fishery Migration Curve</span>
            </h3>
            {isSelectedDateFuture ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Forecasting {selectedMonthDay}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-semibold flex items-center gap-1">
                <Fish className="w-3 h-3" />
                DFO Recorded through {SEASON_DAYS[lastRecordedDayIndex]?.monthDay}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking in-season run progression against historical benchmarks and statistical projection bounds.
          </p>
        </div>

        {/* Toggle Layers Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowAverage(!showAverage)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition flex items-center gap-1.5 ${
              showAverage
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showAverage ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>10-Yr Mean</span>
          </button>

          <button
            onClick={() => setShowConfidenceBands(!showConfidenceBands)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition flex items-center gap-1.5 ${
              showConfidenceBands
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showConfidenceBands ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>80% Model CI</span>
          </button>

          <button
            onClick={() => setShowEnvelope(!showEnvelope)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition flex items-center gap-1.5 ${
              showEnvelope
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showEnvelope ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Historical Range</span>
          </button>

          <button
            onClick={() => setShowThresholds(!showThresholds)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition flex items-center gap-1.5 ${
              showThresholds
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showThresholds ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Escapement Target (110)</span>
          </button>
        </div>
      </div>

      {/* Year Filter Quick Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Compare:
          </span>
          <button
            onClick={() => onSelectPreset('currentOnly')}
            className={`px-2 py-1 rounded-md transition font-medium ${
              selectedYears.length === 1 && selectedYears[0] === CURRENT_YEAR
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2026 Only
          </button>
          <button
            onClick={() => onSelectPreset('recent')}
            className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
          >
            Recent (2022–2026)
          </button>
          <button
            onClick={() => onSelectPreset('extremes')}
            className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
          >
            Record Years (2018/2021)
          </button>
          <button
            onClick={() => onSelectPreset('all')}
            className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
          >
            All Archive
          </button>
        </div>

        {/* Dynamic Year Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {allYears
            .filter((y) => !y.isCurrentYear && y.year !== CURRENT_YEAR)
            .slice(0, 6)
            .map((yr) => {
              const selected = isYearSelected(yr.year);
              return (
                <button
                  key={yr.year}
                  onClick={() => onToggleYear(yr.year)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition flex items-center gap-1 border ${
                    selected
                      ? 'bg-slate-800 border-slate-600 text-white font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: yr.color }} />
                  <span>{yr.year}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-[360px] sm:h-[420px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            {/* Historical Min-Max Envelope Band */}
            {showEnvelope && (
              <Area
                type="monotone"
                dataKey="envelopeRange"
                stroke="none"
                fill="#334155"
                fillOpacity={0.18}
                name="Historical Range (1998–2025)"
                isAnimationActive={false}
              />
            )}

            {/* 80% Projection Confidence Interval Band */}
            {showConfidenceBands && (
              <Area
                type="monotone"
                dataKey="ciRange"
                stroke="none"
                fill="#6366f1"
                fillOpacity={0.22}
                name="80% Projection Confidence Envelope"
                isAnimationActive={false}
              />
            )}

            <XAxis
              dataKey="monthDay"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={{ stroke: '#334155' }}
              interval={10}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={{ stroke: '#334155' }}
              domain={[0, 'auto']}
              label={{
                value: unitLabel,
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
                fontSize: 11,
                offset: 0,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Escapement Target Reference Line (110 index) */}
            {showThresholds && (
              <ReferenceLine
                y={ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY * mult}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Target: ${ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY * mult} ${isMetricInAdults ? 'adults' : 'pts'}`,
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'right',
                }}
              />
            )}

            {/* Selected Date Slider Marker */}
            <ReferenceLine
              x={selectedMonthDay}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: selectedMonthDay,
                fill: '#38bdf8',
                fontSize: 11,
                position: 'top',
                fontWeight: 'bold',
              }}
            />

            {/* 10-Year Historical Average Baseline Line */}
            {showAverage && (
              <Line
                type="monotone"
                dataKey="avgCumulative"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="10-Year Average (Baseline)"
                isAnimationActive={false}
              />
            )}

            {/* Historical Years Lines */}
            {allYears.map((yr) => {
              if (yr.isCurrentYear || yr.year === CURRENT_YEAR || !isYearSelected(yr.year)) {
                return null;
              }
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

            {/* Current Year Recorded Actuals (Solid Cyan Line up to Aug 16) */}
            <Line
              type="monotone"
              dataKey="currentActual"
              stroke="#06b6d4"
              strokeWidth={3.5}
              dot={false}
              name={`${CURRENT_YEAR} (Recorded DFO Actual)`}
              isAnimationActive={false}
            />

            {/* Current Year Statistical Projection (Dashed Indigo Line from Aug 16 to Sep 30) */}
            <Line
              type="monotone"
              dataKey="currentProjected"
              stroke="#818cf8"
              strokeWidth={2.75}
              strokeDasharray="6 4"
              dot={false}
              name={`${CURRENT_YEAR} (Model Forecast)`}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-t border-slate-800/80 pt-3 text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-cyan-400 rounded-full" />
            <span className="text-cyan-300 font-semibold">{CURRENT_YEAR} Recorded DFO</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-indigo-400 rounded-full border-t border-dashed border-indigo-400" />
            <span className="text-indigo-300 font-semibold">{CURRENT_YEAR} Model Projection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-sky-400 rounded-full border-t border-dashed border-sky-400" />
            <span className="text-sky-300">10-Yr Baseline</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Last published test fishery record: <strong>{SEASON_DAYS[lastRecordedDayIndex]?.monthDay}</strong>
        </span>
      </div>
    </div>
  );
};
