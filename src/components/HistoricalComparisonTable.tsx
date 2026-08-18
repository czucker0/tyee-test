import React, { useState } from 'react';
import {
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { YearRunData, ProjectionModelResult } from '../types/steelhead';
import { ArrowUpDown, Table, Check, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

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
  onToggleYear,
  allYears = [],
}) => {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterToSelected, setFilterToSelected] = useState<boolean>(false);
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;

  // Build rows
  let rawRows = allYears.map((y) => {
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

  if (filterToSelected && selectedYears && selectedYears.length > 0) {
    rawRows = rawRows.filter((r) => selectedYears.includes(r.year));
  }

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
      case 'Abundant':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Abundant
          </span>
        );
      case 'Healthy':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Healthy
          </span>
        );
      case 'Moderate':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Moderate
          </span>
        );
      case 'Precautionary':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
            Precautionary
          </span>
        );
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Critical
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Historical Run Escapement Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Direct comparison of all recorded Skeena seasons on {selectedMonthDay}
            </p>
          </div>
        </div>

        {selectedYears && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterToSelected(!filterToSelected)}
              className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                filterToSelected
                  ? 'bg-purple-950/70 border-purple-500/50 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filterToSelected ? 'Showing Selected Only' : 'Show All Years'}
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-3">
                <button
                  onClick={() => handleSort('rank')}
                  className="flex items-center gap-1 hover:text-white font-bold"
                >
                  <span>Rank</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('year')}
                  className="flex items-center gap-1 hover:text-white font-bold"
                >
                  <span>Season</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('onDate')}
                  className="flex items-center gap-1 hover:text-white font-bold"
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
                  className="flex items-center gap-1 hover:text-white font-bold"
                >
                  <span>Peak Migration</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center gap-1 hover:text-white font-bold"
                >
                  <span>Final Total</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-3">Status</th>
              <th className="p-3 hidden md:table-cell">Historical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {rawRows.map((row) => (
              <tr
                key={row.year}
                className={`hover:bg-slate-900/80 transition ${
                  row.isCurrent ? 'bg-indigo-950/40 text-white font-bold' : 'text-slate-300'
                }`}
              >
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-xs ${
                      row.rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : row.rank <= 3
                        ? 'bg-slate-800 text-amber-300'
                        : 'text-slate-400'
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
                    <span className="font-bold text-white">{row.year}</span>
                    {row.isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 uppercase">
                        Current
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-white">{row.onDateVal.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (~{Math.round(row.onDateVal * 50).toLocaleString()} fish)
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  {row.isCurrent ? (
                    <span className="text-indigo-400 text-xs font-bold">Baseline</span>
                  ) : (
                    <span
                      className={`text-xs font-semibold ${
                        row.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {row.delta >= 0 ? '+' : ''}
                      {row.delta}%
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-400">
                  <span className="text-slate-200 font-semibold">{row.peakDate}</span>{' '}
                  <span className="text-[10px]">({row.peakDailyVal.toFixed(1)} pts)</span>
                </td>
                <td className="p-3">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-white">{row.totalVal.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (~{row.adults.toLocaleString()} fish)
                    </span>
                  </div>
                </td>
                <td className="p-3">{getStatusBadge(row.status)}</td>
                <td className="p-3 hidden md:table-cell text-[11px] text-slate-400 font-sans max-w-xs truncate">
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
