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
import { Activity, Waves, Clock, MapPin, Sparkles, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DailyRunPulseChartProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  isMetricInAdults: boolean;
}

export const DailyRunPulseChart: React.FC<DailyRunPulseChartProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'waveform' | 'bars'>('waveform');
  const [showTransitHelp, setShowTransitHelp] = useState(false);

  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;
  const currentYearRecord = ALL_YEARS_DATA.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || ALL_YEARS_DATA[0];

  // Dynamically find the last published DFO data day
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

  const trajectoryMap = useMemo(() => {
    const map = new Map<number, typeof projection.projectedDailyTrajectory[0]>();
    projection.projectedDailyTrajectory.forEach((t) => {
      map.set(t.dayOfYear - 1, t);
    });
    return map;
  }, [projection]);

  // Compute 5-day rolling average for smooth trendline
  const chartData = useMemo(() => {
    const rawPoints = SEASON_DAYS.map((sDay, idx) => {
      const hist = HISTORICAL_AVERAGE_CURVE[idx] || { avgDaily: 0 };
      const isPastOrRecorded = idx <= lastRecordedDayIndex;
      const projItem = trajectoryMap.get(idx);

      let dailyVal = 0;
      let recordedDaily: number | null = null;
      let projectedDaily: number | null = null;

      if (isPastOrRecorded) {
        const dVal = currentYearRecord?.data[idx]?.dailyIndex ?? 0;
        dailyVal = dVal;
        recordedDaily = Math.round(dVal * mult * 10) / 10;
      } else {
        if (projItem) {
          dailyVal = projItem.projectedDaily;
          projectedDaily = Math.round(projItem.projectedDaily * mult * 10) / 10;
        }
      }

      return {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        histAvgDaily: Math.round(hist.avgDaily * mult * 10) / 10,
        recordedDaily,
        projectedDaily,
        activeDailyVal: Math.round(dailyVal * mult * 10) / 10,
      };
    });

    // Calculate 5-day rolling average
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
  }, [currentYearRecord, lastRecordedDayIndex, trajectoryMap, mult]);

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';

  // Peak and latest pulse stats for plain-language summary cards
  const stats = useMemo(() => {
    let peakVal = 0;
    let peakDate = 'Aug 14';
    let latestVal = 0;
    let latestDate = SEASON_DAYS[lastRecordedDayIndex]?.monthDay || 'Aug 16';

    chartData.forEach((d) => {
      if (d.recordedDaily !== null && d.recordedDaily > peakVal) {
        peakVal = d.recordedDaily;
        peakDate = d.monthDay;
      }
      if (d.dayIndex === lastRecordedDayIndex && d.recordedDaily !== null) {
        latestVal = d.recordedDaily;
      }
    });

    const fishPerDay = isMetricInAdults ? Math.round(latestVal) : Math.round(latestVal * ADULT_EXPANSION_FACTOR);
    const peakFishPerDay = isMetricInAdults ? Math.round(peakVal) : Math.round(peakVal * ADULT_EXPANSION_FACTOR);

    return {
      peakVal,
      peakDate,
      latestVal,
      latestDate,
      fishPerDay,
      peakFishPerDay,
    };
  }, [chartData, lastRecordedDayIndex, isMetricInAdults]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dayIdx = payload[0]?.payload?.dayIndex;
    const isRecorded = dayIdx !== undefined && dayIdx <= lastRecordedDayIndex;

    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[220px]">
        <div className="font-bold text-[var(--accent-amber)] font-mono border-b border-[var(--border-main)] pb-1 flex justify-between items-center">
          <span className="text-sm font-bold text-[var(--text-main)]">{label}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)]">
            {isRecorded ? 'DFO Telemetry' : 'Model Forecast'}
          </span>
        </div>
        {payload.map((p: any) => {
          if (p.value === null || p.value === undefined) return null;
          if (p.dataKey === 'activeDailyVal') return null; // hide duplicate helper
          const rawVal = typeof p.value === 'number' ? p.value : 0;
          const expandedDaily = isMetricInAdults ? rawVal : Math.round(rawVal * ADULT_EXPANSION_FACTOR);
          return (
            <div key={p.dataKey} className="flex justify-between items-center py-1 gap-2">
              <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
              </span>
              <div className="font-mono text-right">
                <span className="font-bold text-[var(--text-main)]">
                  {rawVal.toFixed(1)} {isMetricInAdults ? 'adults/day' : 'pts/day'}
                </span>
                {!isMetricInAdults && (
                  <span className="text-[11px] text-[var(--text-muted)] font-normal ml-1">
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
      {/* Header & Controls - Strictly Single Line on Mobile */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-5 h-5 text-[var(--accent-amber)] shrink-0" />
          <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight truncate">
            Daily Migration Pulses
          </h3>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] p-0.5 rounded-lg shrink-0 text-xs font-mono">
          <button
            onClick={() => setViewMode('waveform')}
            className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1.5 ${
              viewMode === 'waveform'
                ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
            title="Smooth Flowing River Waveform"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Smooth Wave</span>
          </button>
          <button
            onClick={() => setViewMode('bars')}
            className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1.5 ${
              viewMode === 'bars'
                ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
            title="Daily Drift Net Sets"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Daily Sets</span>
          </button>
        </div>
      </div>

      {/* Migration Pulse Meaning Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Waves className="w-3 h-3 text-[var(--accent-amber)]" />
              Latest Inflow Pulse
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
              Peak Migration Day
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
          <MapPin className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
          <p>
            Steelhead average 14–20 km/day ascending the mainstem Skeena. An ocean pulse recorded today at Tyee test fishery typically reaches Terrace in ~4 days, Witset/Kispiox in ~12 days, and Babine in ~25 days.
          </p>
        </div>
      )}

      {/* Main Pulse Chart */}
      <div className="h-[280px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="recordedWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#3b82f6' : '#c56a25'} stopOpacity={0.45} />
                <stop offset="95%" stopColor={isDark ? '#3b82f6' : '#c56a25'} stopOpacity={0.02} />
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

            {/* 10-Year Average Mean Curve */}
            <Line
              type="monotone"
              dataKey="histAvgDaily"
              stroke={isDark ? '#2dd4bf' : '#1a6467'}
              strokeWidth={2}
              dot={false}
              name="10-Yr Historical Mean"
            />

            {viewMode === 'waveform' ? (
              <>
                {/* Recorded Flow Area */}
                <Area
                  type="monotone"
                  dataKey="recordedDaily"
                  stroke={isDark ? '#3b82f6' : '#c56a25'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#recordedWave)"
                  name="Recorded Daily CPUE"
                />

                {/* Projected Flow Area */}
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

                {/* 5-Day Trend Smoothed Line */}
                <Line
                  type="monotone"
                  dataKey="rollingAvg"
                  stroke={isDark ? '#fbbf24' : '#b45309'}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="2 2"
                  name="5-Day Trendline"
                />
              </>
            ) : (
              <>
                {/* Recorded Daily Catch Sets */}
                <Bar
                  dataKey="recordedDaily"
                  fill={isDark ? '#3b82f6' : '#c56a25'}
                  fillOpacity={0.9}
                  stroke={isDark ? '#60a5fa' : '#e89553'}
                  strokeWidth={1}
                  name="Recorded Daily CPUE"
                />

                {/* Projected Daily Inflow */}
                <Bar
                  dataKey="projectedDaily"
                  fill={isDark ? '#60a5fa' : '#e89553'}
                  fillOpacity={0.4}
                  stroke={isDark ? '#3b82f6' : '#c56a25'}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  name="Modeled Daily Arrival"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-main)] pt-2 font-mono">
        <span>Anchor: Published data through <strong className="text-[var(--text-main)]">{SEASON_DAYS[lastRecordedDayIndex]?.monthDay}</strong></span>
        <span>Selected: <strong className="text-[var(--accent-amber)]">{selectedMonthDay}</strong></span>
      </div>
    </div>
  );
};
