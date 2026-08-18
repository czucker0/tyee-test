import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  ALL_YEARS_DATA,
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  SEASON_DAYS,
  ADULT_EXPANSION_FACTOR,
  getPreviousDecadeYears,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  Fish,
} from 'lucide-react';

interface HeadToHeadCompareCardProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  isMetricInAdults: boolean;
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  onSelectYears: (years: number[]) => void;
  allYears?: YearRunData[];
}

export const HeadToHeadCompareCard: React.FC<HeadToHeadCompareCardProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
  selectedYears,
  onToggleYear,
  onSelectYears,
  allYears = [],
}) => {
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;
  const unitSuffix = isMetricInAdults ? 'adults' : 'pts';

  // Selected benchmark year to compare head-to-head with 2026 (-1 = 10-Year Average)
  const [benchmarkYear, setBenchmarkYear] = useState<number>(2024);

  // Synthetic 10-Year Average Baseline record
  const TEN_YEAR_AVG_RECORD: YearRunData = useMemo(() => {
    const finalAvg = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1]?.avgCumulative || 95.7;
    return {
      year: -1,
      isCurrentYear: false,
      totalIndex: finalAvg,
      projectedTotal: finalAvg,
      peakDate: 'Aug 14',
      peakDailyIndex: 3.2,
      medianDate: 'Aug 14',
      conservationStatus: 'Healthy',
      color: '#38bdf8',
      notes: 'Official 10-Year DFO Rolling Average (2016–2025 Baseline)',
      data: HISTORICAL_AVERAGE_CURVE.map((c, idx) => {
        const sDay = SEASON_DAYS[idx] || { month: 8, day: 16, monthDay: c.monthDay };
        return {
          dayOfYear: idx + 1,
          dateStr: `2026-${sDay.month < 10 ? '0' + sDay.month : sDay.month}-${sDay.day < 10 ? '0' + sDay.day : sDay.day}`,
          monthDay: c.monthDay,
          month: sDay.month,
          day: sDay.day,
          dailyIndex: c.avgDaily,
          cumulativeIndex: c.avgCumulative,
          waterTempC: 15.0,
          dischargeM3s: 2200,
        };
      }),
    };
  }, []);

  const currentYearRecord = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
  const isTenYearAvg = benchmarkYear === -1;
  const benchmarkRecord = isTenYearAvg
    ? TEN_YEAR_AVG_RECORD
    : allYears.find((y) => y.year === benchmarkYear) || TEN_YEAR_AVG_RECORD;

  const benchmarkDisplayName = isTenYearAvg ? '10-Yr DFO Average' : `${benchmarkYear}`;
  const benchmarkFullName = isTenYearAvg ? '10-Year DFO Average Baseline (2016–2025)' : `${benchmarkYear} Benchmark Run`;

  // Previous 10 years strictly computed relative to CURRENT_YEAR
  const previousDecadeYears = getPreviousDecadeYears(CURRENT_YEAR);
  const lastSeasonYear = CURRENT_YEAR - 1;

  // Find last published date
  const lastRecordedDayIndex = useMemo(() => {
    let lastRec = 67; // Aug 16
    if (currentYearRecord && currentYearRecord.data && currentYearRecord.data.length > 0) {
      for (let i = currentYearRecord.data.length - 1; i >= 0; i--) {
        const d: any = currentYearRecord.data[i];
        if (d.isRecorded === true || (d.dailyIndex > 0 && d.cumulativeIndex > 0)) {
          lastRec = i;
          break;
        }
      }
    }
    return lastRec;
  }, [currentYearRecord]);

  const isFutureDate = currentDayIndex > lastRecordedDayIndex;

  // Comparison metrics calculation on the current date
  const comparisonStats = useMemo(() => {
    const currentVal = projection.currentCumulative * mult;
    const benchmarkVal = (benchmarkRecord?.data[currentDayIndex]?.cumulativeIndex || 0) * mult;
    const diff = currentVal - benchmarkVal;
    const pctDiff = benchmarkVal > 0 ? (diff / benchmarkVal) * 100 : 0;

    const currentProjectedTotal = projection.projectedBaselineIndex * mult;
    const benchmarkTotal = (benchmarkRecord?.totalIndex || 0) * mult;
    const totalDiff = currentProjectedTotal - benchmarkTotal;
    const totalPctDiff = benchmarkTotal > 0 ? (totalDiff / benchmarkTotal) * 100 : 0;

    const benchmarkPctElapsedOnDate =
      benchmarkRecord?.totalIndex > 0
        ? Math.round(
            ((benchmarkRecord.data[currentDayIndex]?.cumulativeIndex || 0) /
              benchmarkRecord.totalIndex) *
              1000
          ) / 10
        : 0;

    return {
      currentVal: Math.round(currentVal * 10) / 10,
      benchmarkVal: Math.round(benchmarkVal * 10) / 10,
      diff: Math.round(diff * 10) / 10,
      pctDiff: Math.round(pctDiff * 10) / 10,
      currentProjectedTotal: Math.round(currentProjectedTotal * 10) / 10,
      benchmarkTotal: Math.round(benchmarkTotal * 10) / 10,
      totalDiff: Math.round(totalDiff * 10) / 10,
      totalPctDiff: Math.round(totalPctDiff * 10) / 10,
      benchmarkPctElapsedOnDate,
    };
  }, [currentDayIndex, projection, benchmarkRecord, mult]);

  // Differential trajectory chart data (2026 vs benchmark difference over time)
  const diffChartData = useMemo(() => {
    const trajectoryMap = new Map<number, typeof projection.projectedDailyTrajectory[0]>();
    projection.projectedDailyTrajectory.forEach((t) => {
      trajectoryMap.set(t.dayOfYear - 1, t);
    });

    return SEASON_DAYS.map((sDay, idx) => {
      const isPastOrRecorded = idx <= lastRecordedDayIndex;
      const bCum = (benchmarkRecord?.data[idx]?.cumulativeIndex || 0) * mult;

      let cCum = 0;

      if (isPastOrRecorded) {
        cCum = (currentYearRecord?.data[idx]?.cumulativeIndex ?? 0) * mult;
      } else {
        const projItem = trajectoryMap.get(idx);
        cCum = (projItem ? projItem.projectedCumulative : projection.projectedBaselineIndex) * mult;
      }

      const diffCumulative = Math.round((cCum - bCum) * 10) / 10;
      const currentValRound = Math.round(cCum * 10) / 10;
      const benchmarkValRound = Math.round(bCum * 10) / 10;

      return {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        current2026: currentValRound,
        benchmark: benchmarkValRound,
        delta: diffCumulative,
        isPositive: diffCumulative >= 0,
      };
    });
  }, [currentDayIndex, projection, benchmarkRecord, mult, currentYearRecord, lastRecordedDayIndex]);

  const quickComparePresets = [
    {
      title: '📊 10-Yr DFO Average',
      year: -1,
      desc: 'Official 10-year rolling mean baseline (~95.7 pts / ~21,000 fish)',
      tag: 'Baseline',
    },
    {
      title: `🐟 ${lastSeasonYear} (Last Season)`,
      year: lastSeasonYear,
      desc: `Most recent completed campaign benchmark (${allYears.find((y) => y.year === lastSeasonYear)?.totalIndex || 116.8} pts)`,
      tag: 'Last Season',
    },
    {
      title: '🏆 2018 (Record Peak)',
      year: 2018,
      desc: 'Modern all-time high of 140.7 pts (~31,000 adult steelhead)',
      tag: 'Decade High',
    },
    {
      title: '⚠️ 2021 (Crisis Low)',
      year: 2021,
      desc: 'Emergency closure year: historical low of 22.3 pts (~4,900 fish)',
      tag: 'Crisis Low',
    },
    {
      title: '📈 2024 (Healthy Return)',
      year: 2024,
      desc: 'Solid baseline escapement return (89.1 pts / ~19,600 fish)',
      tag: 'Benchmark',
    },
    {
      title: '🏛️ 1998 (El Niño Archive)',
      year: 1998,
      desc: 'Historic multi-decade reference from DFO archive (98.4 pts)',
      tag: 'Archive',
    },
  ];

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Head-to-Head Benchmark Differential: {CURRENT_YEAR} vs. {benchmarkDisplayName}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing current season pace on <strong>{selectedMonthDay}</strong> against {benchmarkFullName}.
              </p>
            </div>
          </div>
        </div>

        {/* Benchmark Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Benchmark Year:</label>
          <select
            value={benchmarkYear}
            onChange={(e) => setBenchmarkYear(parseInt(e.target.value, 10))}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
          >
            <option value={-1}>📊 10-Year DFO Average Baseline (2016–2025)</option>
            {allYears
              .filter((y) => !y.isCurrentYear && y.year !== CURRENT_YEAR)
              .sort((a, b) => b.year - a.year)
              .map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year} Season (Total: {y.totalIndex} pts) &bull; {y.conservationStatus}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Quick Compare Preset Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {quickComparePresets.map((preset) => {
          const isSelected = benchmarkYear === preset.year;
          return (
            <button
              key={preset.year}
              onClick={() => setBenchmarkYear(preset.year)}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {preset.tag}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                </div>
                <span className="text-xs font-bold text-white block truncate">{preset.title}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">{preset.desc}</p>
            </button>
          );
        })}
      </div>

      {/* KPI Comparison Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Value on selected date */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Cumulative on {selectedMonthDay}</span>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-300">
              {isFutureDate ? 'Model Forecast' : 'DFO Record'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-300">
              {comparisonStats.currentVal}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vs {comparisonStats.benchmarkVal} ({benchmarkDisplayName})
            </span>
          </div>
          <div className="text-xs pt-1 flex items-center gap-1 font-bold">
            {comparisonStats.diff >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{comparisonStats.diff} {unitSuffix} (+{comparisonStats.pctDiff}%)
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {comparisonStats.diff} {unitSuffix} ({comparisonStats.pctDiff}%)
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Final Projected Season Comparison */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Projected Season Total</span>
            <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold">Full Campaign</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-300">
              {comparisonStats.currentProjectedTotal}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vs {comparisonStats.benchmarkTotal} (Final)
            </span>
          </div>
          <div className="text-xs pt-1 flex items-center gap-1 font-bold">
            {comparisonStats.totalDiff >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{comparisonStats.totalDiff} {unitSuffix} (+{comparisonStats.totalPctDiff}%)
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {comparisonStats.totalDiff} {unitSuffix} ({comparisonStats.totalPctDiff}%)
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Run Progression Pace */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Run Timing Completion</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">Elapsed %</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {projection.percentElapsedHistorical}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vs {comparisonStats.benchmarkPctElapsedOnDate}% ({benchmarkDisplayName})
            </span>
          </div>
          <div className="text-xs text-slate-400 pt-1">
            {projection.percentElapsedHistorical < 50
              ? 'Early-to-mid season migration'
              : 'Post-peak / late season passage'}
          </div>
        </div>

        {/* Metric 4: Lead/Lag Status Badge */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-slate-400">Campaign Stance</span>
          <div className="my-1">
            {comparisonStats.diff >= 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 inline-block">
                Ahead of {benchmarkDisplayName} Pace
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/30 inline-block">
                Tracking Below {benchmarkDisplayName}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Delta: {comparisonStats.diff >= 0 ? `+${comparisonStats.diff}` : comparisonStats.diff} {unitSuffix}
          </span>
        </div>
      </div>

      {/* Differential Line Chart: 2026 vs Benchmark Curve */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span>Cumulative Run Head-to-Head Differential Curve</span>
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Positive (Green) = 2026 Leading &bull; Negative (Red) = 2026 Trailing
          </span>
        </div>

        <div className="h-[280px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={diffChartData} margin={{ top: 10, right: 20, left: 10, bottom: 15 }}>
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
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0]?.payload;
                  if (!item) return null;
                  const isRec = item.dayIndex <= lastRecordedDayIndex;
                  return (
                    <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 flex justify-between">
                        <span>{label}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {isRec ? 'Recorded DFO' : 'Model Forecast'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300 font-semibold">{CURRENT_YEAR} {isRec ? 'Actual' : 'Projected'}:</span>
                        <span className="font-mono text-white font-bold">{item.current2026}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{benchmarkDisplayName}:</span>
                        <span className="font-mono text-slate-300">{item.benchmark}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                        <span className="text-slate-300">Differential:</span>
                        <span className={`font-mono ${item.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.delta >= 0 ? `+${item.delta}` : item.delta} {unitSuffix}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              <ReferenceLine x={selectedMonthDay} stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="current2026"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                name={`${CURRENT_YEAR} Run`}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name={benchmarkDisplayName}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
