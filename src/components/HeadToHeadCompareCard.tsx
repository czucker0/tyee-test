import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  ALL_YEARS_DATA,
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  SEASON_DAYS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  allYears = [],
}) => {
  const { isDark } = useTheme();
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
      color: isDark ? '#2dd4bf' : '#1a6467',
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
  }, [isDark]);

  const currentYearRecord = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
  const isTenYearAvg = benchmarkYear === -1;
  const benchmarkRecord = isTenYearAvg
    ? TEN_YEAR_AVG_RECORD
    : allYears.find((y) => y.year === benchmarkYear) || TEN_YEAR_AVG_RECORD;

  const benchmarkDisplayName = isTenYearAvg ? '10-Yr DFO Average' : `${benchmarkYear}`;

  // Find last recorded day index
  const lastRecordedDayIndex = useMemo(() => {
    let lastRec = 67;
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

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';
  const isFutureDate = currentDayIndex > lastRecordedDayIndex;

  // Comparison metrics calculation
  const comparisonStats = useMemo(() => {
    const currentOnDateRaw =
      currentDayIndex <= lastRecordedDayIndex
        ? (currentYearRecord?.data[currentDayIndex]?.cumulativeIndex ?? projection.currentCumulative)
        : projection.projectedDailyTrajectory[currentDayIndex]?.projectedCumulative ?? projection.currentCumulative;

    const benchmarkOnDateRaw = benchmarkRecord.data[currentDayIndex]?.cumulativeIndex ?? 0;

    const currentVal = Math.round(currentOnDateRaw * mult * 10) / 10;
    const benchmarkVal = Math.round(benchmarkOnDateRaw * mult * 10) / 10;
    const diff = Math.round((currentVal - benchmarkVal) * 10) / 10;
    const pctDiff = benchmarkVal > 0 ? Math.round(((currentVal - benchmarkVal) / benchmarkVal) * 100) : 0;

    const currentProjectedTotal = Math.round(projection.projectedBaselineIndex * mult * 10) / 10;
    const benchmarkTotal = Math.round(benchmarkRecord.totalIndex * mult * 10) / 10;
    const totalDiff = Math.round((currentProjectedTotal - benchmarkTotal) * 10) / 10;
    const totalPctDiff = benchmarkTotal > 0 ? Math.round(((currentProjectedTotal - benchmarkTotal) / benchmarkTotal) * 100) : 0;

    const benchmarkPctElapsedOnDate =
      benchmarkRecord.totalIndex > 0
        ? Math.round((benchmarkOnDateRaw / benchmarkRecord.totalIndex) * 100)
        : 0;

    return {
      currentVal,
      benchmarkVal,
      diff,
      pctDiff,
      currentProjectedTotal,
      benchmarkTotal,
      totalDiff,
      totalPctDiff,
      benchmarkPctElapsedOnDate,
    };
  }, [currentDayIndex, lastRecordedDayIndex, currentYearRecord, projection, benchmarkRecord, mult]);

  // Differential line chart dataset
  const diffChartData = useMemo(() => {
    const trajectoryMap = new Map<number, typeof projection.projectedDailyTrajectory[0]>();
    projection.projectedDailyTrajectory.forEach((t) => {
      trajectoryMap.set(t.dayOfYear - 1, t);
    });

    return SEASON_DAYS.map((sDay, idx) => {
      const isPastOrRecorded = idx <= lastRecordedDayIndex;
      let cur2026 = 0;
      if (isPastOrRecorded) {
        cur2026 = currentYearRecord?.data[idx]?.cumulativeIndex ?? 0;
      } else {
        const projItem = trajectoryMap.get(idx);
        cur2026 = projItem?.projectedCumulative ?? 0;
      }

      const benchVal = benchmarkRecord.data[idx]?.cumulativeIndex ?? 0;
      const curDisplay = Math.round(cur2026 * mult * 10) / 10;
      const benchDisplay = Math.round(benchVal * mult * 10) / 10;
      const delta = Math.round((curDisplay - benchDisplay) * 10) / 10;

      return {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        current2026: curDisplay,
        benchmark: benchDisplay,
        delta,
      };
    });
  }, [currentYearRecord, benchmarkRecord, lastRecordedDayIndex, projection, mult]);

  // Quick comparison presets
  const quickComparePresets = [
    { year: -1, title: '10-Yr Baseline', desc: 'Official Mean', tag: 'Baseline' },
    { year: 2024, title: '2024 Season', desc: 'Recent Analog', tag: 'Strong Run' },
    { year: 2025, title: '2025 Season', desc: 'Previous Year', tag: 'Recent' },
    { year: 2021, title: '2021 Low Return', desc: 'Historical Dip', tag: 'Precautionary' },
    { year: 2018, title: '2018 Strong Run', desc: 'High Escapement', tag: 'Abundant' },
    { year: 2020, title: '2020 Season', desc: 'Mid Tier', tag: 'Moderate' },
  ];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--accent-amber)]" />
            <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              Head-to-Head Benchmark Matchup
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Comparing the live 2026 campaign against historical seasons and the official DFO 10-year mean.
          </p>
        </div>

        {/* Benchmark Selector Dropdown */}
        <div className="flex items-center gap-2 font-mono w-full sm:w-auto min-w-0 max-w-full">
          <label className="text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap shrink-0">Benchmark:</label>
          <select
            value={benchmarkYear}
            onChange={(e) => setBenchmarkYear(parseInt(e.target.value, 10))}
            className="bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[var(--accent-amber)] w-full sm:max-w-[280px] md:max-w-xs truncate cursor-pointer shadow-xs"
          >
            <option value={-1}>10-Year DFO Average Baseline</option>
            {allYears
              .filter((y) => !y.isCurrentYear && y.year !== CURRENT_YEAR)
              .sort((a, b) => b.year - a.year)
              .map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year} Season ({y.totalIndex} pts) &bull; {y.conservationStatus}
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
                  ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] shadow-sm'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-amber)]">
                    {preset.tag}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-[var(--accent-amber)]" />}
                </div>
                <span className="text-xs font-mono font-bold text-[var(--text-main)] block truncate">{preset.title}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-tight">{preset.desc}</p>
            </button>
          );
        })}
      </div>

      {/* KPI Comparison Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        {/* Metric 1: Value on selected date */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>Passage to <span className="text-[var(--text-main)] font-bold">{selectedMonthDay}</span></span>
            <span className="text-xs font-mono font-bold uppercase text-[var(--accent-amber)]">
              {isFutureDate ? 'Model Forecast' : 'DFO Record'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--accent-amber)]">
              {comparisonStats.currentVal}
            </span>
            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              vs {comparisonStats.benchmarkVal} ({benchmarkDisplayName})
            </span>
          </div>
          <div className="text-xs pt-1.5 border-t border-[var(--border-main)] flex items-center gap-1 font-bold">
            {comparisonStats.diff >= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
                <TrendingUp className="w-4 h-4" />
                +{comparisonStats.diff} {unitSuffix} (+{comparisonStats.pctDiff}%)
              </span>
            ) : (
              <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1 font-bold">
                <TrendingDown className="w-4 h-4" />
                {comparisonStats.diff} {unitSuffix} ({comparisonStats.pctDiff}%)
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Final Projected Season Comparison */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>Projected Season Total</span>
            <span className="text-xs uppercase text-[var(--accent-amber)] font-bold">Full Campaign</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
              {comparisonStats.currentProjectedTotal}
            </span>
            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              vs {comparisonStats.benchmarkTotal} (Final)
            </span>
          </div>
          <div className="text-xs pt-1.5 border-t border-[var(--border-main)] flex items-center gap-1 font-bold">
            {comparisonStats.totalDiff >= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
                <TrendingUp className="w-4 h-4" />
                +{comparisonStats.totalDiff} {unitSuffix} (+{comparisonStats.totalPctDiff}%)
              </span>
            ) : (
              <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1 font-bold">
                <TrendingDown className="w-4 h-4" />
                {comparisonStats.totalDiff} {unitSuffix} ({comparisonStats.totalPctDiff}%)
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Run Progression Pace */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center text-[var(--text-secondary)] text-xs font-bold">
            <span>Run Timing Completion</span>
            <span className="text-xs text-[var(--accent-teal)] font-bold">Elapsed %</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
              {projection.percentElapsedHistorical}%
            </span>
            <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              vs {comparisonStats.benchmarkPctElapsedOnDate}% ({benchmarkDisplayName})
            </span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium pt-1.5 border-t border-[var(--border-main)]">
            {projection.percentElapsedHistorical < 50
              ? 'Early-to-mid season migration'
              : 'Post-peak / late season passage'}
          </div>
        </div>

        {/* Metric 4: Lead/Lag Status Badge */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm space-y-1.5">
          <span className="text-xs text-[var(--text-secondary)] font-bold">Campaign Stance</span>
          <div className="my-1">
            {comparisonStats.diff >= 0 ? (
              <span className="stamp-badge stamp-spruce">
                Ahead of {benchmarkDisplayName} Pace
              </span>
            ) : (
              <span className="stamp-badge bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                Tracking Below {benchmarkDisplayName}
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium pt-1.5 border-t border-[var(--border-main)]">
            Delta: {comparisonStats.diff >= 0 ? `+${comparisonStats.diff}` : comparisonStats.diff} {unitSuffix}
          </span>
        </div>
      </div>

      {/* Differential Line Chart: 2026 vs Benchmark Curve */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-heading font-extrabold text-[var(--text-main)] flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-[var(--accent-amber)]" />
            <span>Cumulative Run Head-to-Head Differential Curve</span>
          </h4>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Positive = 2026 Leading &bull; Negative = 2026 Trailing
          </span>
        </div>

        <div className="h-[280px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={diffChartData} margin={{ top: 10, right: 20, left: 10, bottom: 15 }}>
              <XAxis
                dataKey="monthDay"
                stroke={isDark ? '#475569' : '#a39b8c'}
                tick={{ fill: isDark ? '#94a3b8' : '#5c6760', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: isDark ? '#263b40' : '#d8cfbe' }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                stroke={isDark ? '#475569' : '#a39b8c'}
                tick={{ fill: isDark ? '#94a3b8' : '#5c6760', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: isDark ? '#263b40' : '#d8cfbe' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0]?.payload;
                  if (!item) return null;
                  const isRec = item.dayIndex <= lastRecordedDayIndex;
                  return (
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px] font-mono">
                      <div className="font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-1 flex justify-between font-editorial">
                        <span>{label}</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">
                          {isRec ? 'Recorded DFO' : 'Model Forecast'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--accent-amber)] font-semibold">{CURRENT_YEAR} {isRec ? 'Actual' : 'Projected'}:</span>
                        <span className="text-[var(--text-main)] font-bold">{item.current2026}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">{benchmarkDisplayName}:</span>
                        <span className="text-[var(--text-secondary)]">{item.benchmark}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[var(--border-main)] font-bold">
                        <span className="text-[var(--text-secondary)]">Differential:</span>
                        <span className={`${item.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {item.delta >= 0 ? `+${item.delta}` : item.delta} {unitSuffix}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke={isDark ? '#475569' : '#a39b8c'} strokeWidth={1.5} />
              <ReferenceLine x={selectedMonthDay} stroke={isDark ? '#f59e0b' : '#c56a25'} strokeWidth={2} strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="current2026"
                stroke={isDark ? '#f59e0b' : '#c56a25'}
                strokeWidth={2.5}
                dot={false}
                name={`${CURRENT_YEAR} Run`}
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke={isDark ? '#2dd4bf' : '#1a6467'}
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
