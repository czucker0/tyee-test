import React, { useState } from 'react';
import {
  CURRENT_YEAR,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import { Trophy, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface YearRankingChartProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  selectedMonthDay: string;
  isMetricInAdults: boolean;
  selectedYears?: number[];
  onToggleYear?: (year: number) => void;
  allYears?: YearRunData[];
}

export const YearRankingChart: React.FC<YearRankingChartProps> = ({
  currentDayIndex,
  projection,
  selectedMonthDay,
  isMetricInAdults,
  selectedYears,
  onToggleYear,
  allYears = [],
}) => {
  const [viewMode, setViewMode] = useState<'onDate' | 'seasonTotal'>('onDate');
  const [filterToSelectedOnly, setFilterToSelectedOnly] = useState<boolean>(false);
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;

  // Build ranking items
  let rankingData = allYears.map((y) => {
    let valOnDate = y.data[currentDayIndex]?.cumulativeIndex || 0;
    let seasonTotal = y.totalIndex;

    if (y.isCurrentYear || y.year === CURRENT_YEAR) {
      valOnDate = projection.currentCumulative;
      seasonTotal = projection.projectedBaselineIndex;
    }

    const isSelected = selectedYears ? selectedYears.includes(y.year) : true;

    return {
      year: y.year,
      isCurrent: y.isCurrentYear || y.year === CURRENT_YEAR,
      isSelected,
      color: y.color,
      status: y.conservationStatus,
      notes: y.notes,
      peakDate: y.peakDate,
      valOnDate: Math.round(valOnDate * mult * 10) / 10,
      seasonTotal: Math.round(seasonTotal * mult * 10) / 10,
      activeVal: viewMode === 'onDate' ? Math.round(valOnDate * mult * 10) / 10 : Math.round(seasonTotal * mult * 10) / 10,
    };
  });

  if (filterToSelectedOnly && selectedYears && selectedYears.length > 0) {
    rankingData = rankingData.filter((d) => selectedYears.includes(d.year));
  }

  // Sort descending by active value
  rankingData.sort((a, b) => b.activeVal - a.activeVal);

  const maxVal = Math.max(...rankingData.map((d) => d.activeVal), 1);
  const currentRank = rankingData.findIndex((d) => d.isCurrent) + 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Annual Escapement & CPUE Standings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative historical ranking: 2026 sits at #{currentRank} of {rankingData.length} recorded seasons
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('onDate')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'onDate'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              On {selectedMonthDay}
            </button>
            <button
              onClick={() => setViewMode('seasonTotal')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'seasonTotal'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Season Final
            </button>
          </div>

          {selectedYears && selectedYears.length > 0 && (
            <button
              onClick={() => setFilterToSelectedOnly(!filterToSelectedOnly)}
              className={`text-xs px-2.5 py-2 rounded-xl border font-medium transition ${
                filterToSelectedOnly
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filterToSelectedOnly ? 'Selected Only' : 'All Years'}
            </button>
          )}
        </div>
      </div>

      {/* Ranking Bars Container */}
      <div className="space-y-2.5">
        {rankingData.map((item, idx) => {
          const rank = idx + 1;
          const barWidthPct = Math.max(4, Math.round((item.activeVal / maxVal) * 100));

          return (
            <div
              key={item.year}
              className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.isCurrent
                  ? 'bg-indigo-950/60 border-indigo-500/50 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Year & Rank Info */}
              <div className="flex items-center gap-3 min-w-[130px]">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
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
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-mono font-black text-sm text-white">
                      {item.year}
                    </span>
                    {item.isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-bold uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Status: {item.status}
                  </span>
                </div>
              </div>

              {/* Visual Bar Indicator */}
              <div className="flex-1 px-2 hidden sm:block">
                <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidthPct}%`,
                      backgroundColor: item.isCurrent ? '#818cf8' : item.color,
                    }}
                  />
                </div>
              </div>

              {/* Value & Notes */}
              <div className="text-right min-w-[140px] flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                <div className="font-mono text-xs font-bold text-white">
                  <span>{item.activeVal.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (~{Math.round(item.activeVal * 50).toLocaleString()} fish)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {viewMode === 'onDate'
                    ? `Final: ${item.seasonTotal.toFixed(1)} (~${Math.round(item.seasonTotal * 50).toLocaleString()})`
                    : `On Date: ${item.valOnDate.toFixed(1)} (~${Math.round(item.valOnDate * 50).toLocaleString()})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
