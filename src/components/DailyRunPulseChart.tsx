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
import { Activity, Sparkles, Fish } from 'lucide-react';

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
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur text-xs space-y-1.5 min-w-[220px]">
        <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1 flex justify-between items-center">
          <span>{label}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {isRecorded ? 'DFO Recorded' : 'Model Forecast'}
          </span>
        </div>
        {payload.map((p: any) => {
          if (p.value === null || p.value === undefined) return null;
          const rawVal = typeof p.value === 'number' ? p.value : 0;
          const expandedDaily = isMetricInAdults ? rawVal : Math.round(rawVal * ADULT_EXPANSION_FACTOR);
          return (
            <div key={p.dataKey} className="flex justify-between items-center py-1 gap-2">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
              </span>
              <div className="font-mono text-right">
                <span className="font-bold text-white">
                  {rawVal.toFixed(1)} {isMetricInAdults ? 'adults/day' : 'pts/day'}
                </span>
                {!isMetricInAdults && (
                  <span className="text-[11px] text-slate-400 font-normal ml-1">
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Daily Migration Pulses &amp; Run Timing Peaks</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily CPUE index showing tidal entry surges, peak runs, and modeled daily arrivals through September.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <span className="w-3 h-3 bg-indigo-500 rounded-sm" />
            <span>Recorded Daily</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-300/70">
            <span className="w-3 h-3 bg-indigo-400/40 border border-indigo-400 rounded-sm border-dashed" />
            <span>Projected Inflow</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-3 h-3 bg-cyan-500/30 border border-cyan-400 rounded-sm" />
            <span>10-Yr Avg</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Slider Date Marker */}
            <ReferenceLine
              x={selectedMonthDay}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: selectedMonthDay,
                fill: '#38bdf8',
                fontSize: 10,
                position: 'top',
                fontWeight: 'bold',
              }}
            />

            {/* 10-Year Average Bar Baseline */}
            <Bar
              dataKey="histAvgDaily"
              fill="#0ea5e9"
              fillOpacity={0.25}
              stroke="#38bdf8"
              strokeWidth={1}
              name="10-Yr Historical Mean"
            />

            {/* Recorded Daily Catch Sets (up to Aug 16) */}
            <Bar
              dataKey="recordedDaily"
              fill="#6366f1"
              fillOpacity={0.9}
              stroke="#818cf8"
              strokeWidth={1}
              name="Recorded Daily CPUE"
            />

            {/* Projected Daily Inflow (Aug 17 to Sep 30) */}
            <Bar
              dataKey="projectedDaily"
              fill="#a855f7"
              fillOpacity={0.4}
              stroke="#c084fc"
              strokeDasharray="3 3"
              strokeWidth={1}
              name="Modeled Daily Arrival"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
        <span>Anchor: Recorded data published through <strong>{SEASON_DAYS[lastRecordedDayIndex]?.monthDay}</strong></span>
        <span>Selected: <strong className="text-cyan-300">{selectedMonthDay}</strong></span>
      </div>
    </div>
  );
};
