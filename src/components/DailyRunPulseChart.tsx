import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
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
import { Activity } from 'lucide-react';
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

  const chartData = useMemo(() => {
    return SEASON_DAYS.map((sDay, idx) => {
      const hist = HISTORICAL_AVERAGE_CURVE[idx] || { avgDaily: 0 };
      const isPastOrRecorded = idx <= lastRecordedDayIndex;
      const projItem = trajectoryMap.get(idx);

      let recordedDaily: number | null = null;
      let projectedDaily: number | null = null;

      if (isPastOrRecorded) {
        const dVal = currentYearRecord?.data[idx]?.dailyIndex ?? 0;
        recordedDaily = Math.round(dVal * mult * 10) / 10;
      } else {
        if (projItem) {
          projectedDaily = Math.round(projItem.projectedDaily * mult * 10) / 10;
        }
      }

      return {
        dayIndex: idx,
        monthDay: sDay.monthDay,
        histAvgDaily: Math.round(hist.avgDaily * mult * 10) / 10,
        recordedDaily,
        projectedDaily,
      };
    });
  }, [currentYearRecord, lastRecordedDayIndex, trajectoryMap, mult]);

  const selectedMonthDay = SEASON_DAYS[currentDayIndex]?.monthDay || '';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--accent-amber)]" />
            <span>Daily Migration Pulses &amp; Run Timing Peaks</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Daily CPUE index showing tidal entry surges, peak runs, and modeled daily arrivals through September.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[var(--accent-amber)] font-bold">
            <span className="w-3 h-3 bg-[var(--accent-amber)] rounded-sm" />
            <span>Recorded Daily</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--accent-amber)]/70">
            <span className="w-3 h-3 bg-amber-400/40 border border-[var(--accent-amber)] rounded-sm border-dashed" />
            <span>Projected Inflow</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--accent-teal)]">
            <span className="w-3 h-3 bg-teal-500/30 border border-[var(--accent-teal)] rounded-sm" />
            <span>10-Yr Avg</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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

            {/* 10-Year Average Bar Baseline */}
            <Bar
              dataKey="histAvgDaily"
              fill={isDark ? '#0d9488' : '#1a6467'}
              fillOpacity={isDark ? 0.3 : 0.25}
              stroke={isDark ? '#14b8a6' : '#1a6467'}
              strokeWidth={1}
              name="10-Yr Historical Mean"
            />

            {/* Recorded Daily Catch Sets */}
            <Bar
              dataKey="recordedDaily"
              fill={isDark ? '#f59e0b' : '#c56a25'}
              fillOpacity={0.9}
              stroke={isDark ? '#fbbf24' : '#e89553'}
              strokeWidth={1}
              name="Recorded Daily CPUE"
            />

            {/* Projected Daily Inflow */}
            <Bar
              dataKey="projectedDaily"
              fill={isDark ? '#d97706' : '#e89553'}
              fillOpacity={0.4}
              stroke={isDark ? '#f59e0b' : '#c56a25'}
              strokeDasharray="3 3"
              strokeWidth={1}
              name="Modeled Daily Arrival"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-main)] pt-2 font-mono">
        <span>Anchor: Recorded data published through <strong className="text-[var(--text-main)]">{SEASON_DAYS[lastRecordedDayIndex]?.monthDay}</strong></span>
        <span>Selected: <strong className="text-[var(--accent-amber)]">{selectedMonthDay}</strong></span>
      </div>
    </div>
  );
};
