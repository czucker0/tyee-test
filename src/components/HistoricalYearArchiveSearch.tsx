import React, { useState } from 'react';
import { Search, Plus, Check, Clock, Sparkles } from 'lucide-react';
import { YearRunData } from '../types/steelhead';

interface HistoricalYearArchiveSearchProps {
  availableArchiveYears: number[];
  allYearsData: YearRunData[];
  selectedYears: number[];
  onSelectYear: (year: number) => void;
  currentYear: number;
}

export const HistoricalYearArchiveSearch: React.FC<HistoricalYearArchiveSearchProps> = ({
  availableArchiveYears,
  allYearsData,
  selectedYears,
  onSelectYear,
  currentYear,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Notable highlight years for quick one-click add
  const highlightYears = [
    { year: 1998, label: '1998 Mega El Niño (1,540 pts)' },
    { year: 2004, label: '2004 Historic High (1,480 pts)' },
    { year: 2010, label: '2010 Cold Cohort (1,241 pts)' },
    { year: 2018, label: '2018 Modern High (1,419 pts)' },
    { year: 2021, label: '2021 Crisis Low (229 pts)' },
  ];

  const filteredYears = availableArchiveYears.filter((y) => {
    if (y === currentYear) return false;
    const term = searchTerm.toLowerCase();
    const yearMatch = y.toString().includes(term);
    const yrData = allYearsData.find((d) => d.year === y);
    const notesMatch = yrData?.notes?.toLowerCase().includes(term);
    const statusMatch = yrData?.conservationStatus?.toLowerCase().includes(term);
    return yearMatch || notesMatch || statusMatch;
  });

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 shadow-sm transition-colors duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-[var(--text-main)]">
              Compare Any Historical Season from DFO Archive
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Search &amp; overlay historical Skeena Tyee runs (1998–2025)
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 font-mono">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search season (e.g. 1998, 2004)..."
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-amber)]"
          />
        </div>
      </div>

      {/* Quick Highlights Pills */}
      <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-[var(--border-main)] font-mono">
        <span className="text-[10px] uppercase font-bold text-[var(--accent-amber)] flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-[var(--accent-amber)]" />
          Milestones:
        </span>
        {highlightYears.map((h) => {
          const isSelected = selectedYears.includes(h.year);
          return (
            <button
              key={h.year}
              onClick={() => onSelectYear(h.year)}
              className={`text-[11px] px-2 py-0.5 rounded-md font-mono transition flex items-center gap-1 ${
                isSelected
                  ? 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] font-bold'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--border-light)] border border-[var(--border-main)]'
              }`}
            >
              {isSelected ? <Check className="w-2.5 h-2.5 text-[var(--accent-amber)]" /> : <Plus className="w-2.5 h-2.5 text-[var(--text-muted)]" />}
              <span>{h.year}</span>
            </button>
          );
        })}
      </div>

      {/* Dropdown search results if user focused/typed */}
      {isOpen && searchTerm.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border-main)] grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto font-mono text-xs">
          {filteredYears.length > 0 ? (
            filteredYears.map((yr) => {
              const isSelected = selectedYears.includes(yr);
              const data = allYearsData.find((d) => d.year === yr);
              return (
                <button
                  key={yr}
                  onClick={() => {
                    onSelectYear(yr);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`p-1.5 rounded text-left border flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] text-[var(--accent-amber)]'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-main)] hover:border-[var(--border-highlight)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-[var(--text-main)]">{yr}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block truncate">{data?.totalIndex} pts</span>
                  </div>
                  {isSelected ? <Check className="w-3 h-3 text-[var(--accent-amber)]" /> : <Plus className="w-3 h-3 text-[var(--text-muted)]" />}
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-2 text-center text-xs text-[var(--text-muted)]">
              No matching archival seasons found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
