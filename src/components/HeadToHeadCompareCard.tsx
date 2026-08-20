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
  SEASON_DAYS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  Award,
  AlertTriangle,
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
    const allTimeTotal = 118.4; // 1956-present long term archive mean
    return {
      year: -2,
      isCurrentYear: false,
      totalIndex: allTimeTotal,
      projectedTotal: allTimeTotal,
      peakDate: 'Aug 16',
      peakDailyIndex: 3.8,
      medianDate: 'Aug 16',
      conservationStatus: 'Healthy',
      color: isDark ? '#38bdf8' : '#0284c7',
      notes: 'All-Time DFO Archive Mean (1956–Present Long-Term Baseline)',
      data: HISTORICAL_AVERAGE_CURVE.map((c, idx) => {
        const sDay = SEASON_DAYS[idx] || { month: 8, day: 16, monthDay: c.monthDay };
        const scaling = allTimeTotal / 95.7;
        return {
          dayOfYear: idx + 1,
          dateStr: `2026-${sDay.month < 10 ? '0' + sDay.month : sDay.month}-${sDay.day < 10 ? '0' + sDay.day : sDay.day}`,
          monthDay: c.monthDay,
          month: sDay.month,
          day: sDay.day,
          dailyIndex: Math.round(c.avgDaily * scaling * 100) / 100,
          cumulativeIndex: Math.round(c.avgCumulative * scaling * 100) / 100,
          waterTempC: 14.8,
          dischargeM3s: 2150,
        };
      }),
    };
  }, [isDark]);

  const currentYearRecord = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
  const isTenYearAvg = benchmarkYear === -1;
  const isAllTimeAvg = benchmarkYear === -2;

  const benchmarkRecord = isTenYearAvg
    ? TEN_YEAR_AVG_RECORD
    : isAllTimeAvg
    ? ALL_TIME_AVG_RECORD
    : allYears.find((y) => y.year === benchmarkYear) || TEN_YEAR_AVG_RECORD;

  const benchmarkDisplayName = isTenYearAvg
    ? '10-Yr DFO Avg'
    : isAllTimeAvg
    ? 'All-Time Avg (1956+)'
    : `${benchmarkYear} Season`;

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

  // Iconic multi-era benchmark pill presets
  const benchmarkPills = [
    { id: -1, label: '10-Yr Avg', badge: 'Baseline', icon: <Scale className="w-3 h-3 text-teal-500" /> },
    { id: -2, label: 'All-Time Avg', badge: '1956+', icon: <Sparkles className="w-3 h-3 text-sky-500" /> },
    { id: 2024, label: '2024 Season', badge: 'Recent High', icon: <TrendingUp className="w-3 h-3 text-emerald-500" /> },
    { id: 2025, label: '2025 Season', badge: 'Last Year', icon: <Scale className="w-3 h-3 text-amber-500" /> },
    { id: 2021, label: '2021 Record Low', badge: 'Crisis (22 pts)', icon: <AlertTriangle className="w-3 h-3 text-red-500" /> },
    { id: 2018, label: '2018 Strong Run', badge: '185 pts', icon: <Award className="w-3 h-3 text-amber-500" /> },
  ];

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

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      {/* Header - Single line title */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Scale className="w-5 h-5 text-[var(--accent-amber)] shrink-0" />
          <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight truncate">
            Head-to-Head Benchmark Matchup
          </h3>
        </div>

        {/* Dropdown for any historical year */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono">
          <select
            value={benchmarkYear}
            onChange={(e) => setBenchmarkYear(parseInt(e.target.value, 10))}
            className="bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg px-2 sm:px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-[var(--accent-amber)] cursor-pointer shadow-xs max-w-[140px] sm:max-w-[220px] truncate"
            aria-label="Select historical year for head-to-head comparison"
          >
            <option value={-1}>10-Yr DFO Average</option>
            <option value={-2}>All-Time Archive Avg (1956+)</option>
            {allYears
              .filter((y) => !y.isCurrentYear && y.year !== CURRENT_YEAR)
              .sort((a, b) => b.year - a.year)
              .map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year} Season ({y.totalIndex} pts)
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Streamlined Curated Benchmark Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
        {benchmarkPills.map((pill) => {
          const isSelected = benchmarkYear === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setBenchmarkYear(pill.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                isSelected
                  ? 'bg-[var(--accent-amber)] text-white font-bold shadow-xs'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] border border-[var(--border-main)]'
              }`}
            >
              {pill.icon}
              <span className="font-semibold">{pill.label}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'}`}>
                {pill.badge}
              </span>
            </button>
          );
        })}
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
            <span>Projected Season Total</span>
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
            <span>Historical Elapsed Share</span>
            <span className="font-bold text-[var(--text-main)]">{benchmarkDisplayName}</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-[var(--text-secondary)]">
            {comparisonStats.benchmarkPctElapsedOnDate}% completed <span className="text-xs font-normal text-[var(--text-muted)]">by {selectedMonthDay}</span>
          </p>
        </div>
      </div>

      {/* Head to Head Trajectory Line Chart */}
      <div className="h-[260px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={diffChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <XAxis
              dataKey="monthDay"
              stroke={isDark ? '#475569' : '#a39b8c'}
              tick={{ fill: isDark ? '#94a3b8' : '#5c6760', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: isDark ? '#263b40' : '#d8cfbe' }}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              stroke={isDark ? '#475569' : '#a39b8c'}
              tick={{ fill: isDark ? '#94a3b8' : '#5c6760', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: isDark ? '#263b40' : '#d8cfbe' }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              x={selectedMonthDay}
              stroke={isDark ? '#f59e0b' : '#c56a25'}
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: selectedMonthDay,
                fill: isDark ? '#f59e0b' : '#c56a25',
                fontSize: 10,
                position: 'top',
                fontWeight: 'bold',
              }}
            />

            {/* Benchmark Trajectory */}
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke={isDark ? '#2dd4bf' : '#1a6467'}
              strokeWidth={2}
              dot={false}
              name={benchmarkDisplayName}
            />

            {/* 2026 Campaign */}
            <Line
              type="monotone"
              dataKey="current2026"
              stroke={isDark ? '#3b82f6' : '#c56a25'}
              strokeWidth={3}
              dot={false}
              name="2026 Live Campaign"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-main)] pt-2 font-mono">
        <span>Active Benchmark: <strong className="text-[var(--text-main)]">{benchmarkDisplayName}</strong> ({benchmarkRecord.notes || `${benchmarkRecord.totalIndex} pts`})</span>
        <span>Selected: <strong className="text-[var(--accent-amber)]">{selectedMonthDay}</strong></span>
      </div>
    </div>
  );
};
