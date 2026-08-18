import React, { useState } from 'react';
import {
  CURRENT_YEAR,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import { Trophy } from 'lucide-react';

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
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
                Annual Escapement &amp; CPUE Standings
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                Relative historical ranking: 2026 sits at #{currentRank} of {rankingData.length} recorded seasons
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 font-mono">
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] flex items-center gap-1">
            <button
              onClick={() => setViewMode('onDate')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'onDate'
                  ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              On {selectedMonthDay}
            </button>
            <button
              onClick={() => setViewMode('seasonTotal')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'seasonTotal'
                  ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
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
                  ? 'bg-[var(--accent-teal-light)] border-[var(--accent-teal-border)] text-[var(--accent-teal)] font-bold'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
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
                  ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] shadow-sm'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
              }`}
            >
              {/* Year & Rank Info */}
              <div className="flex items-center gap-3 min-w-[130px]">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
                    rank === 1
                      ? 'bg-[var(--accent-amber)] text-white'
                      : rank === 2
                      ? 'bg-stone-300 text-stone-900'
                      : rank === 3
                      ? 'bg-stone-400 text-white'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)]'
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
                    <span className="font-mono font-black text-sm text-[var(--text-main)]">
                      {item.year}
                    </span>
                    {item.isCurrent && (
                      <span className="stamp-badge stamp-amber">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                    Status: {item.status}
                  </span>
                </div>
              </div>

              {/* Visual Bar Indicator */}
              <div className="flex-1 px-2 hidden sm:block">
                <div className="w-full bg-[var(--bg-subtle)] rounded-full h-3.5 overflow-hidden p-0.5 border border-[var(--border-main)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidthPct}%`,
                      backgroundColor: item.isCurrent ? 'var(--accent-amber)' : item.color,
                    }}
                  />
                </div>
              </div>

              {/* Value & Notes */}
              <div className="text-right min-w-[140px] flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                <div className="font-mono text-xs font-bold text-[var(--text-main)]">
                  <span>{item.activeVal.toFixed(1)}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">
                    (~{Math.round(item.activeVal * ADULT_EXPANSION_FACTOR).toLocaleString()} fish)
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {viewMode === 'onDate'
                    ? `Final: ${item.seasonTotal.toFixed(1)} (~${Math.round(item.seasonTotal * ADULT_EXPANSION_FACTOR).toLocaleString()})`
                    : `On Date: ${item.valOnDate.toFixed(1)} (~${Math.round(item.valOnDate * ADULT_EXPANSION_FACTOR).toLocaleString()})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
