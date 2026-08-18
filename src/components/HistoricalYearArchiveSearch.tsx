import React, { useState } from 'react';
import { Search, Plus, Check, Clock, Sparkles, AlertCircle } from 'lucide-react';
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              Compare Any Historical Year from DFO Archive
            </h4>
            <span className="text-[10px] text-slate-400">
              Search & overlay historical Skeena Tyee runs (1998–2025)
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search year (e.g. 1998, 2004, 2010)..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Quick Highlights Pills */}
      <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-slate-800/80">
        <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
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
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50'
              }`}
            >
              {isSelected ? <Check className="w-2.5 h-2.5 text-indigo-400" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
              <span>{h.year}</span>
            </button>
          );
        })}
      </div>

      {/* Dropdown Results when searching */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="mt-2 bg-slate-950 border border-slate-700 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
          {filteredYears.length === 0 ? (
            <div className="text-center py-2 text-xs text-slate-500">
              No historical years found matching "{searchTerm}".
            </div>
          ) : (
            filteredYears.map((yr) => {
              const yrData = allYearsData.find((d) => d.year === yr);
              const isSelected = selectedYears.includes(yr);
              return (
                <div
                  key={yr}
                  onClick={() => {
                    onSelectYear(yr);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{yr}</span>
                    <span className="text-[11px] text-slate-400">
                      Total: <strong className="text-slate-200">{yrData?.totalIndex?.toFixed(1) || '--'} pts</strong> (~{Math.round((yrData?.totalIndex || 0) * 50).toLocaleString()} fish)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      Peak: {yrData?.peakDate || '--'}
                    </span>
                    <button
                      className={`text-xs px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white font-medium'
                      }`}
                    >
                      {isSelected ? 'Active' : '+ Add to Chart'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
