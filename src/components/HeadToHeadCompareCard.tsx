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
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  ALL_TIME_AVERAGE_CURVE,
  SEASON_DAYS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
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

  // Selected benchmark year to compare head-to-head with current year (-1 = 10-Year Average, -2 = All-Time Historical Average)
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

  // Synthetic All-Time Archive Average (1956–Present)
  const ALL_TIME_AVG_RECORD: YearRunData = useMemo(() => {
    const finalAllTime = ALL_TIME_AVERAGE_CURVE[ALL_TIME_AVERAGE_CURVE.length - 1]?.avgCumulative || 165.2;
    return {
      year: -2,
      isCurrentYear: false,
      totalIndex: finalAllTime,
      projectedTotal: finalAllTime,
      peakDate: 'Aug 14',
      peakDailyIndex: 4.8,
      medianDate: 'Aug 15',
      conservationStatus: 'Healthy',
      color: isDark ? '#38bdf8' : '#0284c7',
      notes: 'All-Time DFO Tyee Archive Mean (1956–2025 70-Year Long-Term Baseline)',
      data: ALL_TIME_AVERAGE_CURVE.map((c, idx) => {
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

  // Active current year record (2026)
  const currentYearRecord = useMemo(() => {
    return allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
  }, [allYears]);

  // Active benchmark record
  const benchmarkRecord = useMemo(() => {
    if (benchmarkYear === -1) return TEN_YEAR_AVG_RECORD;
    if (benchmarkYear === -2) return ALL_TIME_AVG_RECORD;
    return allYears.find((y) => y.year === benchmarkYear) || allYears.find((y) => y.year === 2024) || TEN_YEAR_AVG_RECORD;
  }, [benchmarkYear, allYears, TEN_YEAR_AVG_RECORD, ALL_TIME_AVG_RECORD]);

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || 'Aug 16';

  // Benchmark display label
  const benchmarkDisplayName = useMemo(() => {
    if (benchmarkYear === -1) return '10-Yr DFO Rolling Avg';
    if (benchmarkYear === -2) return '70-Yr All-Time Baseline';
    return `${benchmarkYear} Season`;
  }, [benchmarkYear]);

  // Latest recorded index in current year
  const lastRecordedDayIndex = useMemo(() => {
    if (!currentYearRecord?.data) return 67;
    for (let i = currentYearRecord.data.length - 1; i >= 0; i--) {
      const d: any = currentYearRecord.data[i];
      if (d.isRecorded === true || (d.dailyIndex > 0 && d.cumulativeIndex > 0)) {
        return i;
      }
    }
    return 67;
  }, [currentYearRecord]);

  // Comparison metrics calculations
  const comparisonStats = useMemo(() => {
    const isBeyond = currentDayIndex > lastRecordedDayIndex;
    const curVal = isBeyond
      ? (projection.projectedDailyTrajectory.find((t) => t.dayOfYear - 1 === currentDayIndex)?.projectedCumulative || projection.currentCumulative)
      : (currentYearRecord?.data[currentDayIndex]?.cumulativeIndex || projection.currentCumulative);

    const benchVal = benchmarkRecord?.data[currentDayIndex]?.cumulativeIndex || 0;
    const curDisplay = Math.round(curVal * mult);
    const benchDisplay = Math.round(benchVal * mult);
    const diff = curDisplay - benchDisplay;
    const pctDiff = benchDisplay > 0 ? Math.round((diff / benchDisplay) * 100) : 0;

    const curProj = Math.round(projection.projectedBaselineIndex * mult);
    const benchTotal = Math.round(benchmarkRecord.totalIndex * mult);
    const totalDiff = curProj - benchTotal;
    const totalPctDiff = benchTotal > 0 ? Math.round((totalDiff / benchTotal) * 100) : 0;

    const curPeakDate = currentYearRecord?.peakDate || 'Aug 16';
    const benchPeakDate = benchmarkRecord?.peakDate || 'Aug 14';

    const curPctRunPassed = Math.min(100, Math.round((curVal / (projection.projectedBaselineIndex || 1)) * 100));
    const benchPctRunPassed = Math.min(100, Math.round((benchVal / (benchmarkRecord.totalIndex || 1)) * 100));

    return {
      currentVal: curDisplay,
      benchmarkVal: benchDisplay,
      diff,
      pctDiff,
      currentProjectedTotal: curProj,
      benchmarkTotal: benchTotal,
      totalDiff,
      totalPctDiff,
      curPeakDate,
      benchPeakDate,
      curPctRunPassed,
      benchPctRunPassed,
      isBeyond,
    };
  }, [currentDayIndex, lastRecordedDayIndex, projection, currentYearRecord, benchmarkRecord, mult]);

  // Chart data points
  const chartData = useMemo(() => {
    return SEASON_DAYS.map((sDay, idx) => {
      let curVal: number | null = null;
      if (idx <= lastRecordedDayIndex) {
        curVal = currentYearRecord?.data[idx]?.cumulativeIndex ?? null;
      } else {
        const projItem = projection.projectedDailyTrajectory.find((t) => t.dayOfYear - 1 === idx);
        curVal = projItem ? projItem.projectedCumulative : null;
      }

      const benchVal = benchmarkRecord?.data[idx]?.cumulativeIndex ?? 0;
      const curDisplay = curVal !== null ? Math.round(curVal * mult * 10) / 10 : null;
      const benchDisplay = Math.round(benchVal * mult * 10) / 10;
      const delta = curDisplay !== null ? Math.round((curDisplay - benchDisplay) * 10) / 10 : null;

      return {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        current2026: curDisplay,
        benchmark: benchDisplay,
        delta,
      };
    });
  }, [currentYearRecord, benchmarkRecord, lastRecordedDayIndex, projection, mult]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[210px]">
        <div className="font-bold text-[var(--accent-amber)] font-mono border-b border-[var(--border-main)] pb-1 flex justify-between items-center">
          <span className="text-sm font-bold text-[var(--text-main)]">{label}</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Head-to-Head</span>
        </div>
        {payload.map((p: any) => {
          if (p.value === null || p.value === undefined) return null;
          return (
            <div key={p.dataKey} className="flex justify-between items-center py-0.5 gap-2">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span>{p.name}:</span>
              </span>
              <span className="font-mono font-bold text-[var(--text-main)]">
                {p.value.toLocaleString()} {unitSuffix}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Benchmark quick pick list
  const BENCHMARK_QUICK_PICKS = [
    { label: '10-Yr Avg', val: -1 },
    { label: '70-Yr Avg', val: -2 },
    { label: '1998 Record', val: 1998 },
    { label: '1985 Golden Age', val: 1985 },
    { label: '2004 Peak', val: 2004 },
    { label: '2010 Cold Run', val: 2010 },
    { label: '2021 Crisis Low', val: 2021 },
    { label: '2024 Prior', val: 2024 },
  ];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Scale className="w-5 h-5 text-[var(--accent-amber)] shrink-0" />
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight truncate">
              Head-to-Head Benchmark Matchup
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Compare 2026 live run trajectory side-by-side against any season in the 70-year DFO archive.
            </p>
          </div>
        </div>

        {/* Dropdown for any historical year organized by era across all 70 seasons */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono">
          <select
            value={benchmarkYear}
            onChange={(e) => setBenchmarkYear(parseInt(e.target.value, 10))}
            className="bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg px-2 sm:px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-[var(--accent-amber)] cursor-pointer shadow-xs max-w-[220px] sm:max-w-[300px] truncate"
            aria-label="Select historical year for head-to-head comparison"
          >
            <optgroup label="Official Baselines">
              <option value={-1}>📊 10-Yr DFO Rolling Avg (2016–2025)</option>
              <option value={-2}>📈 70-Yr All-Time Baseline (1956–2025)</option>
            </optgroup>
            <optgroup label="Benchmark Milestones">
              <option value={1998}>🏆 1998 Mega El Niño Record (260 pts)</option>
              <option value={2004}>🌊 2004 Historic Peak (243 pts)</option>
              <option value={1985}>🌿 1985 Golden Age (246 pts)</option>
              <option value={2010}>❄️ 2010 Cold Cohort (215 pts)</option>
              <option value={2018}>🔥 2018 Decade Peak (178 pts)</option>
              <option value={2021}>🚨 2021 Crisis Low (22 pts)</option>
              <option value={2024}>⏱️ 2024 Prior Season (182 pts)</option>
              <option value={1956}>🏛️ 1956 Inaugural Year (145 pts)</option>
            </optgroup>
            <optgroup label="Modern Era (2016–2025)">
              {allYears
                .filter((y) => !y.isCurrentYear && y.year >= 2016 && y.year <= 2025)
                .sort((a, b) => b.year - a.year)
                .map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts)
                  </option>
                ))}
            </optgroup>
            <optgroup label="2000s & 2010s Seasons">
              {allYears
                .filter((y) => !y.isCurrentYear && y.year >= 2000 && y.year < 2016)
                .sort((a, b) => b.year - a.year)
                .map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts)
                  </option>
                ))}
            </optgroup>
            <optgroup label="1980s & 1990s Seasons">
              {allYears
                .filter((y) => !y.isCurrentYear && y.year >= 1980 && y.year < 2000)
                .sort((a, b) => b.year - a.year)
                .map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts)
                  </option>
                ))}
            </optgroup>
            <optgroup label="Vintage 1956–1979 Seasons">
              {allYears
                .filter((y) => !y.isCurrentYear && y.year >= 1956 && y.year < 1980)
                .sort((a, b) => b.year - a.year)
                .map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts)
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Quick Landmark Benchmark Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs scrollbar-thin">
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold shrink-0">
          Quick Match:
        </span>
        {BENCHMARK_QUICK_PICKS.map((b) => (
          <button
            key={b.val}
            onClick={() => setBenchmarkYear(b.val)}
            className={`px-2 py-1 rounded-lg transition whitespace-nowrap cursor-pointer text-xs font-semibold ${
              benchmarkYear === b.val
                ? 'bg-[var(--accent-amber)] text-white shadow-xs font-bold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)]'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Benchmark Head-to-Head Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* On Date Tracking */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Progress as of {selectedMonthDay}</span>
            <span className="font-bold text-[var(--accent-amber)]">2026 vs {benchmarkDisplayName}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-mono font-bold text-[var(--text-main)]">
              {comparisonStats.currentVal.toLocaleString()} vs {comparisonStats.benchmarkVal.toLocaleString()}
            </span>
            <span
              className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                comparisonStats.diff >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {comparisonStats.diff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {comparisonStats.diff >= 0 ? `+${comparisonStats.diff}` : `${comparisonStats.diff}`} ({comparisonStats.pctDiff > 0 ? `+${comparisonStats.pctDiff}%` : `${comparisonStats.pctDiff}%`})
            </span>
          </div>
        </div>

        {/* Projected Season Total Delta */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Season Total Benchmark</span>
            <span className="font-bold text-[var(--text-main)]">Forecast</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-mono font-bold text-[var(--accent-amber)]">
              {comparisonStats.currentProjectedTotal.toLocaleString()} vs {comparisonStats.benchmarkTotal.toLocaleString()}
            </span>
            <span
              className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                comparisonStats.totalDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {comparisonStats.totalDiff >= 0 ? `+${comparisonStats.totalDiff}` : `${comparisonStats.totalDiff}`} ({comparisonStats.totalPctDiff > 0 ? `+${comparisonStats.totalPctDiff}%` : `${comparisonStats.totalPctDiff}%`})
            </span>
          </div>
        </div>

        {/* Run Timing Completion */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span>Timing Completion</span>
            <span className="font-bold text-[var(--accent-amber)]">{selectedMonthDay}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-mono font-bold text-[var(--text-main)]">
              2026: {comparisonStats.curPctRunPassed}% | Bench: {comparisonStats.benchPctRunPassed}%
            </span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Peak: {comparisonStats.curPeakDate} vs {comparisonStats.benchPeakDate}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Head-to-Head Comparison Chart */}
      <div className="h-[280px] sm:h-[340px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
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

            {/* Current day scrubber reference line */}
            <ReferenceLine
              x={selectedMonthDay}
              stroke="var(--accent-amber)"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: `📍 ${selectedMonthDay}`,
                fill: 'var(--accent-amber)',
                fontSize: 10,
                position: 'top',
              }}
            />

            {/* Benchmark season line */}
            <Line
              type="monotone"
              dataKey="benchmark"
              name={benchmarkDisplayName}
              stroke={benchmarkRecord.color || (isDark ? '#38bdf8' : '#0284c7')}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* 2026 Live run line */}
            <Line
              type="monotone"
              dataKey="current2026"
              name="2026 Season"
              stroke="var(--accent-amber)"
              strokeWidth={3.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
