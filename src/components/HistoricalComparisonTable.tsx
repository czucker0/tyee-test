import React, { useState } from 'react';
import {
  CURRENT_YEAR,
  ADULT_EXPANSION_FACTOR,
  HISTORICAL_ERAS,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import { ArrowUpDown, Table, AlertTriangle, AlertCircle, ShieldCheck, Filter } from 'lucide-react';

interface HistoricalComparisonTableProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  selectedMonthDay: string;
  isMetricInAdults: boolean;
  selectedYears?: number[];
  onToggleYear?: (year: number) => void;
  allYears?: YearRunData[];
}

type SortField = 'year' | 'onDate' | 'rank' | 'peakVal' | 'total' | 'adults';
type SortOrder = 'asc' | 'desc';

export const HistoricalComparisonTable: React.FC<HistoricalComparisonTableProps> = ({
  currentDayIndex,
  projection,
  selectedMonthDay,
  isMetricInAdults,
  selectedYears,
  allYears = [],
}) => {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeEra, setActiveEra] = useState<string>('all');
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;

  const currentEraObj = HISTORICAL_ERAS.find((e) => e.id === activeEra) || HISTORICAL_ERAS[0];

  // Filter according to era or active cohort
  const filteredArchiveYears = allYears.filter((y) => {
    if (activeEra === 'selected' && selectedYears && selectedYears.length > 0) {
      return selectedYears.includes(y.year);
    }
    if (activeEra === 'all') return true;
    return currentEraObj.years.includes(y.year);
  });

  // Build rows
  let rawRows = filteredArchiveYears.map((y) => {
    let onDateVal = y.data[currentDayIndex]?.cumulativeIndex || 0;
    let totalVal = y.totalIndex;
    let isCurrent = y.isCurrentYear || y.year === CURRENT_YEAR;

    if (isCurrent) {
      onDateVal = projection.currentCumulative;
      totalVal = projection.projectedBaselineIndex;
    }

    const isSelected = selectedYears ? selectedYears.includes(y.year) : true;

    return {
      year: y.year,
      isCurrent,
      isSelected,
      color: y.color,
      status: isCurrent ? projection.conservationTier : y.conservationStatus,
      notes: y.notes,
      peakDate: y.peakDate,
      peakDailyVal: Math.round(y.peakDailyIndex * mult * 10) / 10,
      onDateVal: Math.round(onDateVal * mult * 10) / 10,
      totalVal: Math.round(totalVal * mult * 10) / 10,
      adults: Math.round(totalVal * ADULT_EXPANSION_FACTOR),
      rank: 0,
      delta: 0,
    };
  });

  // Calculate ranks
  const sortedByDate = [...rawRows].sort((a, b) => b.onDateVal - a.onDateVal);
  sortedByDate.forEach((r, idx) => {
    const orig = rawRows.find((x) => x.year === r.year);
    if (orig) orig.rank = idx + 1;
  });

  // Calculate deltas relative to current 2026 value
  const cur2026Val = rawRows.find((r) => r.isCurrent)?.onDateVal || 1;
  rawRows.forEach((r) => {
    r.delta = Math.round(((r.onDateVal - cur2026Val) / cur2026Val) * 1000) / 10;
  });

  // Sort rows based on user preference
  rawRows.sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'year') return (a.year - b.year) * factor;
    if (sortField === 'onDate') return (a.onDateVal - b.onDateVal) * factor;
    if (sortField === 'rank') return (a.rank - b.rank) * factor;
    if (sortField === 'peakVal') return (a.peakDailyVal - b.peakDailyVal) * factor;
    if (sortField === 'total') return (a.totalVal - b.totalVal) * factor;
    if (sortField === 'adults') return (a.adults - b.adults) * factor;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Healthy':
      case 'Zone 1 (Healthy / Abundant)':
      case 'Abundant':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/40 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Healthy
          </span>
        );
      case 'Precautionary':
      case 'Zone 2 (Cautionary Band)':
      case 'Moderate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600/40 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Caution
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-600/40 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Critical
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-[var(--accent-amber)]" />
            <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              Complete Multi-Year Escapement Archive
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Compare cumulative run passage on {selectedMonthDay} and total season escapement ({rawRows.length} seasons shown)
          </p>
        </div>

        {/* Era Filter Toolbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto font-mono text-xs">
          <span className="text-[11px] text-[var(--text-muted)] font-bold shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[var(--accent-teal)]" />
            Filter:
          </span>
          <div className="bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] flex items-center gap-1">
            {selectedYears && selectedYears.length > 1 && (
              <button
                onClick={() => setActiveEra('selected')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  activeEra === 'selected'
                    ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                Cohort ({selectedYears.length})
              </button>
            )}
            {HISTORICAL_ERAS.map((era) => {
              const isSelected = activeEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => setActiveEra(era.id)}
                  title={era.description}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {era.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-main)] text-[var(--text-muted)] font-mono text-[11px]">
              <th className="p-3">
                <button
                  onClick={() => handleSort('rank')}
                  className="flex items-center gap-1 hover:text-[var(--text-main)] font-bold"
                >
                  <span>Rank</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('year')}
                  className="flex items-center gap-1 hover:text-[var(--text-main)] font-bold"
                >
                  <span>Season</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('onDate')}
                  className="flex items-center gap-1 hover:text-[var(--text-main)] font-bold"
                >
                  <span>Cumulative on {selectedMonthDay}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <span className="font-bold">Delta vs 2026</span>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('peakVal')}
                  className="flex items-center gap-1 hover:text-[var(--text-main)] font-bold"
                >
                  <span>Peak Migration</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center gap-1 hover:text-[var(--text-main)] font-bold"
                >
                  <span>Final Total</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">Status</th>
              <th className="p-3 hidden md:table-cell">Historical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-main)] font-mono">
            {rawRows.map((row) => (
              <tr
                key={row.year}
                className={`hover:bg-[var(--bg-subtle)] transition ${
                  row.isCurrent ? 'bg-[var(--accent-amber-light)] text-[var(--text-main)] font-bold' : 'text-[var(--text-secondary)]'
                }`}
              >
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-xs ${
                      row.rank === 1
                        ? 'bg-[var(--accent-amber)] text-white'
                        : row.rank <= 3
                        ? 'bg-[var(--bg-subtle)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    #{row.rank}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-bold text-[var(--text-main)]">{row.year}</span>
                    {row.isCurrent && (
                      <span className="stamp-badge stamp-amber">
                        Current
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-[var(--text-main)]">{row.onDateVal.toFixed(1)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      (~{Math.round(row.onDateVal * ADULT_EXPANSION_FACTOR).toLocaleString()} fish)
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  {row.isCurrent ? (
                    <span className="text-[var(--accent-amber)] text-xs font-bold">Baseline</span>
                  ) : (
                    <span
                      className={`text-xs font-semibold ${
                        row.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {row.delta >= 0 ? '+' : ''}
                      {row.delta}%
                    </span>
                  )}
                </td>
                <td className="p-3 text-[var(--text-muted)]">
                  <span className="text-[var(--text-main)] font-semibold">{row.peakDate}</span>{' '}
                  <span className="text-[10px]">({row.peakDailyVal.toFixed(1)} pts)</span>
                </td>
                <td className="p-3">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-[var(--text-main)]">{row.totalVal.toFixed(1)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      (~{row.adults.toLocaleString()} fish)
                    </span>
                  </div>
                </td>
                <td className="p-3">{getStatusBadge(row.status)}</td>
                <td className="p-3 hidden md:table-cell text-[11px] text-[var(--text-muted)] font-sans max-w-xs truncate">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
