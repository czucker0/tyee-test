import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
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
import { ProjectionModelResult } from '../types/steelhead';
import { Activity, Waves, Clock, Sparkles, HelpCircle, Calendar, GitCompare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DailyRunPulseChartProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  isMetricInAdults: boolean;
  mode?: 'in-season-overview' | 'full-comparison';
}

// Standout historical seasons with their ecological context
const STANDOUT_PRESETS = [
  { year: 2026, label: '2026 Live', tag: 'Active Season', desc: 'Current in-season DFO test catches & ML model' },
  { year: 1998, label: '1998 Record', tag: 'All-Time High (1,540 pts)', desc: 'Mega El Niño super-run all-time Skeena record' },
  { year: 2004, label: '2004 Peak', tag: 'Historic High (1,480 pts)', desc: 'Major multi-tributary abundance across all basins' },
  { year: 1985, label: '1985 Golden Age', tag: 'Vintage Peak (245 pts)', desc: 'Golden Age return with immense wild summer steelhead density' },
  { year: 2010, label: '2010 Cold Run', tag: 'Cold Cohort (1,241 pts)', desc: 'Prime cold-water runoff and steady August pulse flow' },
  { year: 2018, label: '2018 High', tag: 'Decade Peak (1,419 pts)', desc: 'Highest return in the modern 2016-2025 decade' },
  { year: 2021, label: '2021 Crisis', tag: 'Crisis Low (229 pts)', desc: 'Severe ocean-heatwave collapse triggering closures' },
  { year: 2024, label: '2024 Prior', tag: 'Last Season (240 pts)', desc: 'Previous completed season baseline' },
  { year: 1956, label: '1956 Inaugural', tag: 'Inaugural Year', desc: 'First official operating season of DFO Tyee test fishery' },
];

export const DailyRunPulseChart: React.FC<DailyRunPulseChartProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
  mode = 'full-comparison',
}) => {
  const { isDark } = useTheme();
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [overlay2026, setOverlay2026] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'waveform' | 'bars'>('waveform');
  const [showTransitHelp, setShowTransitHelp] = useState(false);

  // If in overview mode, force selectedYear to CURRENT_YEAR
  const effectiveYear = mode === 'in-season-overview' ? CURRENT_YEAR : selectedYear;
  const isSelectedCurrentYear = effectiveYear === CURRENT_YEAR;

  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;
  
  // Sorted list of all available years in archive
  const availableYears = useMemo(() => {
    return ALL_YEARS_DATA.map((y) => y.year).sort((a, b) => b - a);
  }, []);

  const activeYearRecord = useMemo(() => {
    return ALL_YEARS_DATA.find((y) => y.year === effectiveYear) || ALL_YEARS_DATA[0];
  }, [effectiveYear]);

  const currentYearRecord = useMemo(() => {
    return ALL_YEARS_DATA.find((y) => y.year === CURRENT_YEAR) || ALL_YEARS_DATA[0];
  }, []);

  // Dynamically find the last published DFO data day for 2026
  const lastRecordedDayIndex2026 = useMemo(() => {
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

  const trajectoryMap = useMemo(() => {
    const map = new Map<number, typeof projection.projectedDailyTrajectory[0]>();
    projection.projectedDailyTrajectory.forEach((t) => {
      map.set(t.dayOfYear - 1, t);
    });
    return map;
  }, [projection]);

  // Compute daily chart points for the selected year + optional 2026 overlay + 10-Yr Avg
  const chartData = useMemo(() => {
    const rawPoints = SEASON_DAYS.map((sDay, idx) => {
      const hist = HISTORICAL_AVERAGE_CURVE[idx] || { avgDaily: 0 };
      
      // Target active year daily values
      let targetDailyVal = 0;
      let recordedDaily: number | null = null;
      let projectedDaily: number | null = null;

      if (isSelectedCurrentYear) {
        const isPastOrRecorded = idx <= lastRecordedDayIndex2026;
        const projItem = trajectoryMap.get(idx);

        if (isPastOrRecorded) {
          const dVal = currentYearRecord?.data[idx]?.dailyIndex ?? 0;
          targetDailyVal = dVal;
          recordedDaily = Math.round(dVal * mult * 10) / 10;
        } else {
          if (projItem) {
            targetDailyVal = projItem.projectedDaily;
            projectedDaily = Math.round(projItem.projectedDaily * mult * 10) / 10;
          }
        }
      } else {
        // Historical archival year (all recorded)
        const dVal = activeYearRecord?.data[idx]?.dailyIndex ?? 0;
        targetDailyVal = dVal;
        recordedDaily = Math.round(dVal * mult * 10) / 10;
      }

      // 2026 Overlay values if viewing historical year
      let overlay2026Daily: number | null = null;
      if (!isSelectedCurrentYear && overlay2026) {
        const isPast2026 = idx <= lastRecordedDayIndex2026;
        if (isPast2026) {
          overlay2026Daily = Math.round((currentYearRecord?.data[idx]?.dailyIndex ?? 0) * mult * 10) / 10;
        } else {
          const proj = trajectoryMap.get(idx);
          if (proj) {
            overlay2026Daily = Math.round(proj.projectedDaily * mult * 10) / 10;
          }
        }
      }

      return {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        histAvgDaily: Math.round(hist.avgDaily * mult * 10) / 10,
        recordedDaily,
        projectedDaily,
        overlay2026Daily,
        activeDailyVal: Math.round(targetDailyVal * mult * 10) / 10,
      };
    });

    // Calculate 5-day rolling average for smooth trendline
    return rawPoints.map((pt, i, arr) => {
      const start = Math.max(0, i - 2);
      const end = Math.min(arr.length - 1, i + 2);
      let sum = 0;
      let count = 0;
      for (let j = start; j <= end; j++) {
        sum += arr[j].activeDailyVal;
        count++;
      }
      const rollingAvg = count > 0 ? Math.round((sum / count) * 10) / 10 : pt.activeDailyVal;

      return {
        ...pt,
        rollingAvg,
      };
    });
  }, [activeYearRecord, currentYearRecord, isSelectedCurrentYear, lastRecordedDayIndex2026, mult, overlay2026, trajectoryMap]);

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';

  // Peak and latest pulse stats for plain-language summary cards
  const stats = useMemo(() => {
    let peakVal = 0;
    let peakDate = 'Aug 14';
    let latestVal = 0;
    let latestDate = SEASON_DAYS[lastRecordedDayIndex2026]?.monthDay || 'Aug 16';

    chartData.forEach((d) => {
      if (d.recordedDaily !== null && d.recordedDaily > peakVal) {
        peakVal = d.recordedDaily;
        peakDate = d.monthDay;
      }
      if (d.dayIndex === currentDayIndex && (d.recordedDaily !== null || d.projectedDaily !== null)) {
        latestVal = d.recordedDaily ?? d.projectedDaily ?? 0;
      }
    });

    const fishPerDay = isMetricInAdults ? Math.round(latestVal) : Math.round(latestVal * ADULT_EXPANSION_FACTOR);
    const peakFishPerDay = isMetricInAdults ? Math.round(peakVal) : Math.round(peakVal * ADULT_EXPANSION_FACTOR);
    const totalSeasonVal = activeYearRecord?.totalIndex ?? 0;

    return {
      peakVal,
      peakDate,
      latestVal,
      latestDate: selectedMonthDay,
      fishPerDay,
      peakFishPerDay,
      totalSeasonVal,
      status: activeYearRecord?.conservationStatus || 'Healthy',
      color: activeYearRecord?.color || '#38bdf8',
    };
  }, [activeYearRecord, chartData, currentDayIndex, isMetricInAdults, lastRecordedDayIndex2026, selectedMonthDay]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dayIdx = payload[0]?.payload?.dayIndex;
    const isRecorded = dayIdx !== undefined && (isSelectedCurrentYear ? dayIdx <= lastRecordedDayIndex2026 : true);

    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[230px] font-mono">
        <div className="border-b border-[var(--border-main)] pb-1 flex justify-between items-center">
          <span className="text-sm font-bold text-[var(--text-main)]">{label}</span>
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)]">
            {isSelectedCurrentYear ? (isRecorded ? '2026 Test Catch' : '2026 Forecast') : `${selectedYear} Archive`}
          </span>
        </div>
        {payload.map((p: any) => {
          if (p.value === null || p.value === undefined) return null;
          if (p.dataKey === 'activeDailyVal') return null; // hide duplicate helper
          const rawVal = typeof p.value === 'number' ? p.value : 0;
          const expandedDaily = isMetricInAdults ? rawVal : Math.round(rawVal * ADULT_EXPANSION_FACTOR);
          return (
            <div key={p.dataKey} className="flex justify-between items-center py-1 gap-2">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
              </span>
              <div className="text-right">
                <span className="font-bold text-[var(--text-main)]">
                  {rawVal.toFixed(1)} {isMetricInAdults ? 'adults/day' : 'pts/day'}
                </span>
                {!isMetricInAdults && (
                  <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">
                    (~{expandedDaily.toLocaleString()} fish)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-[var(--accent-amber)] shrink-0" />
          <div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">
              {mode === 'in-season-overview'
                ? '2026 Daily Migration Pulses & Catches'
                : 'Daily Migration Pulses & Historical Comparisons'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              {mode === 'in-season-overview'
                ? 'Daily drift-net catch rates and migration pulses vs 10-year rolling average'
                : 'Inspect daily drift-net catch rates and migration pulses for any season since 1956'}
            </p>
          </div>
        </div>

        {/* Controls: Year Selector (if comparison) & View Mode */}
        <div className="flex items-center gap-2 font-mono flex-wrap sm:flex-nowrap">
          {mode === 'full-comparison' && (
            <>
              {/* Year Dropdown */}
              <div className="flex items-center gap-1.5 bg-[var(--bg-subtle)] px-2.5 py-1.5 rounded-xl border border-[var(--border-main)] text-xs">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  aria-label="Select Historical Season for Daily Data"
                  className="bg-transparent text-[var(--text-main)] font-bold font-mono focus:outline-none cursor-pointer"
                >
                  <optgroup label="Active Live Season">
                    <option value={2026}>2026 (Live In-Season Data)</option>
                  </optgroup>
                  <optgroup label="Modern Decade (2016–2025)">
                    {availableYears
                      .filter((y) => y >= 2016 && y <= 2025)
                      .map((yr) => (
                        <option key={yr} value={yr} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                          {yr} Season
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Millennial Super-Runs (1990–2015)">
                    {availableYears
                      .filter((y) => y >= 1990 && y < 2016)
                      .map((yr) => (
                        <option key={yr} value={yr} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                          {yr} Season
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Vintage Heritage Era (1956–1989)">
                    {availableYears
                      .filter((y) => y >= 1956 && y < 1990)
                      .map((yr) => (
                        <option key={yr} value={yr} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                          {yr} Season
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* If viewing historical year: Toggle 2026 Overlay */}
              {!isSelectedCurrentYear && (
                <button
                  onClick={() => setOverlay2026(!overlay2026)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    overlay2026
                      ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] text-[var(--accent-amber)]'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title="Overlay 2026 live pulses against this historical season"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Overlay 2026</span>
                </button>
              )}
            </>
          )}

          {/* Segmented View Mode Toggle */}
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] flex items-center gap-1 shrink-0 text-xs">
            <button
              onClick={() => setViewMode('waveform')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                viewMode === 'waveform'
                  ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
              title="Smooth Flowing Waveform"
            >
              <Waves className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Wave</span>
            </button>
            <button
              onClick={() => setViewMode('bars')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                viewMode === 'bars'
                  ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
              title="Daily Drift Net Sets"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standout Season Quick-Access Chips (Only in Full Comparison Mode) */}
      {mode === 'full-comparison' && (
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-[var(--text-muted)] shrink-0 font-bold">Standout Eras:</span>
            {STANDOUT_PRESETS.map((p) => {
              const isSelected = selectedYear === p.year;
              return (
                <button
                  key={p.year}
                  onClick={() => setSelectedYear(p.year)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber)] shadow-xs'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--accent-amber)]'
                  }`}
                  title={`${p.tag}: ${p.desc}`}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Migration Pulse Summary Cards for Selected Season */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Waves className="w-3 h-3 text-[var(--accent-amber)]" />
              {isSelectedCurrentYear ? 'Current Date Pulse' : `${selectedYear} Pulse on ${selectedMonthDay}`}
            </span>
            <span className="font-bold text-[var(--text-main)]">{stats.latestDate}</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-[var(--accent-amber)]">
            {stats.latestVal.toFixed(1)} {isMetricInAdults ? 'adults/day' : 'pts'}
            <span className="text-xs text-[var(--text-muted)] font-normal ml-1.5">
              (~{stats.fishPerDay.toLocaleString()} fish/day)
            </span>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Peak Single-Day Catch
            </span>
            <span className="font-bold text-[var(--text-main)]">{stats.peakDate}</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-[var(--text-main)]">
            {stats.peakVal.toFixed(1)} {isMetricInAdults ? 'adults/day' : 'pts'}
            <span className="text-xs text-[var(--text-muted)] font-normal ml-1.5">
              (~{stats.peakFishPerDay.toLocaleString()} fish)
            </span>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1 relative">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--accent-teal)]" />
              Upriver Travel Transit
            </span>
            <button
              onClick={() => setShowTransitHelp(!showTransitHelp)}
              className="text-[var(--text-muted)] hover:text-[var(--accent-amber)] transition"
              title="Transit speed details"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-mono font-semibold text-[var(--text-secondary)] truncate">
            Terrace: <span className="text-[var(--text-main)] font-bold">3–5d</span> &bull; Hazelton: <span className="text-[var(--text-main)] font-bold">10–14d</span> &bull; Babine: <span className="text-[var(--text-main)] font-bold">22–30d</span>
          </p>
        </div>
      </div>

      {showTransitHelp && (
        <div className="p-2.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-xs font-mono text-[var(--text-secondary)] flex items-start gap-2">
          <p>
            Steelhead average 14–20 km/day ascending the mainstem Skeena. An ocean pulse recorded at Tyee test fishery typically reaches Terrace in ~4 days, Witset/Kispiox in ~12 days, and Babine in ~25 days.
          </p>
        </div>
      )}

      {/* Main Pulse Chart */}
      <div className="h-[280px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="selectedYearWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stats.color || (isDark ? '#3b82f6' : '#c56a25')} stopOpacity={0.45} />
                <stop offset="95%" stopColor={stats.color || (isDark ? '#3b82f6' : '#c56a25')} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="projectedWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#60a5fa' : '#e89553'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isDark ? '#60a5fa' : '#e89553'} stopOpacity={0.0} />
              </linearGradient>
            </defs>

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

            {/* Slider Date Marker */}
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

            {/* 10-Year Average Mean Baseline Curve */}
            <Line
              type="monotone"
              dataKey="histAvgDaily"
              stroke={isDark ? '#2dd4bf' : '#1a6467'}
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
              name="10-Yr Historical Mean"
            />

            {/* 2026 Overlay Curve (if inspecting historical year) */}
            {!isSelectedCurrentYear && overlay2026 && (
              <Line
                type="monotone"
                dataKey="overlay2026Daily"
                stroke={isDark ? '#fbbf24' : '#c56a25'}
                strokeWidth={2}
                dot={false}
                name="2026 Live Comparison"
              />
            )}

            {viewMode === 'waveform' ? (
              <>
                {/* Selected Year Daily Waveform */}
                <Area
                  type="monotone"
                  dataKey="recordedDaily"
                  stroke={isSelectedCurrentYear ? (isDark ? '#3b82f6' : '#c56a25') : stats.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#selectedYearWave)"
                  name={`${selectedYear} Daily CPUE`}
                />

                {/* 2026 Projected Flow Area (if 2026 active) */}
                {isSelectedCurrentYear && (
                  <Area
                    type="monotone"
                    dataKey="projectedDaily"
                    stroke={isDark ? '#60a5fa' : '#e89553'}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#projectedWave)"
                    name="Modeled Daily Arrival"
                  />
                )}

                {/* 5-Day Trend Smoothed Line */}
                <Line
                  type="monotone"
                  dataKey="rollingAvg"
                  stroke={isDark ? '#fbbf24' : '#b45309'}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="2 2"
                  name={`${selectedYear} 5-Day Trend`}
                />
              </>
            ) : (
              <>
                {/* Selected Year Daily Sets */}
                <Bar
                  dataKey="recordedDaily"
                  fill={isSelectedCurrentYear ? (isDark ? '#3b82f6' : '#c56a25') : stats.color}
                  fillOpacity={0.85}
                  stroke={stats.color}
                  strokeWidth={1}
                  name={`${selectedYear} Daily CPUE`}
                />

                {/* 2026 Projected Sets */}
                {isSelectedCurrentYear && (
                  <Bar
                    dataKey="projectedDaily"
                    fill={isDark ? '#60a5fa' : '#e89553'}
                    fillOpacity={0.4}
                    stroke={isDark ? '#3b82f6' : '#c56a25'}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    name="Modeled Daily Arrival"
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-main)] pt-2 font-mono flex-wrap gap-2">
        <span>Inspecting season: <strong className="text-[var(--accent-amber)]">{selectedYear}</strong> ({activeYearRecord?.notes || 'DFO Skeena record'})</span>
        <span>Selected date: <strong className="text-[var(--text-main)]">{selectedMonthDay}</strong></span>
      </div>
    </div>
  );
};
