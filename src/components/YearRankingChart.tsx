import React, { useState } from 'react';
import {
  CURRENT_YEAR,
  ADULT_EXPANSION_FACTOR,
  HISTORICAL_ERAS,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import { Trophy, Filter, ChevronDown } from 'lucide-react';

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
  const [activeEra, setActiveEra] = useState<string>('all');
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;

  // Selected era configuration
  const currentEraObj = HISTORICAL_ERAS.find((e) => e.id === activeEra) || HISTORICAL_ERAS[0];

  // Filter years according to selected era or active cohort
  const eraFilteredYears = allYears.filter((y) => {
    if (activeEra === 'selected' && selectedYears && selectedYears.length > 0) {
      return selectedYears.includes(y.year);
    }
    if (activeEra === 'all') return true;
    return currentEraObj.years.includes(y.year);
  });

  // Build ranking items
  let rankingData = eraFilteredYears.map((y) => {
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

  // Sort descending by active value
  rankingData.sort((a, b) => b.activeVal - a.activeVal);

  const maxVal = Math.max(...rankingData.map((d) => d.activeVal), 1);
  const currentRank = rankingData.findIndex((d) => d.isCurrent) + 1;

  // Compute all-time rank for context
  const allTimeRanking = allYears.map((y) => {
    const v = viewMode === 'onDate' 
      ? (y.isCurrentYear ? projection.currentCumulative : y.data[currentDayIndex]?.cumulativeIndex || 0)
      : (y.isCurrentYear ? projection.projectedBaselineIndex : y.totalIndex);
    return { year: y.year, val: v, isCurrent: y.isCurrentYear || y.year === CURRENT_YEAR };
  }).sort((a, b) => b.val - a.val);

  const allTimeRank = allTimeRanking.findIndex((d) => d.isCurrent) + 1;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3">
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
                2026 sits at <strong className="text-[var(--accent-amber)]">#{currentRank}</strong> of {rankingData.length} in <span className="text-[var(--text-main)] font-semibold">{activeEra === 'selected' ? 'Active Cohort' : currentEraObj.shortLabel}</span> (All-time: <strong className="text-[var(--text-main)]">#{allTimeRank} of 71</strong>)
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 font-mono">
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] flex items-center gap-1">
            <button
              onClick={() => setViewMode('onDate')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'onDate'
                  ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              On {selectedMonthDay}
            </button>
            <button
              onClick={() => setViewMode('seasonTotal')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'seasonTotal'
                  ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              Full Season Final
            </button>
          </div>
        </div>
      </div>

      {/* Standardized Era / Cohort Filter Dropdown (Matches rest of application) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span className="text-xs font-bold text-[var(--text-main)]">
            Cohort / Era Filter:
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <select
            value={activeEra}
            onChange={(e) => setActiveEra(e.target.value)}
            aria-label="Filter escapement standings by historical era"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] text-[var(--text-main)] font-mono text-xs font-semibold focus:outline-none focus:border-[var(--accent-amber)] cursor-pointer pr-8"
          >
            {selectedYears && selectedYears.length > 1 && (
              <option value="selected">
                ★ Active Comparison Cohort ({selectedYears.length} Selected Seasons)
              </option>
            )}
            <option value="all">
              All 70 Recorded Seasons (1956–2025 Complete Archive)
            </option>
            {HISTORICAL_ERAS.filter((e) => e.id !== 'all').map((era) => (
              <option key={era.id} value={era.id}>
                {era.label} ({era.years.length} Seasons)
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Ranking Bars Container */}
      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
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
