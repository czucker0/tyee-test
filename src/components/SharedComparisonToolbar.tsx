import React from 'react';
import {
  Calendar,
  Sparkles,
  RotateCcw,
  Plus,
  X,
  Layers,
} from 'lucide-react';
import { YearRunData } from '../types/steelhead';
import { CURRENT_YEAR } from '../data/historicalData';

interface SharedComparisonToolbarProps {
  allYears: YearRunData[];
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  onSelectEraPreset?: (years: number[]) => void;
  onClearAll?: () => void;
  className?: string;
}

export const SharedComparisonToolbar: React.FC<SharedComparisonToolbarProps> = ({
  allYears = [],
  selectedYears = [],
  onToggleYear,
  onSelectEraPreset,
  onClearAll,
  className = '',
}) => {
  // Historical years only (excluding 2026 Live which is permanently anchored)
  const historicalYears = allYears
    .filter((y) => !y.isCurrentYear && y.year !== CURRENT_YEAR)
    .sort((a, b) => b.year - a.year);

  // Group historical seasons into eras for the mobile-friendly native select
  const modernYears = historicalYears.filter((y) => y.year >= 2016 && y.year <= 2025);
  const decade2000s = historicalYears.filter((y) => y.year >= 2000 && y.year <= 2015);
  const decade1990s = historicalYears.filter((y) => y.year >= 1990 && y.year <= 1999);
  const decade1980s = historicalYears.filter((y) => y.year >= 1980 && y.year <= 1989);
  const vintageYears = historicalYears.filter((y) => y.year >= 1956 && y.year <= 1979);

  // Curated benchmark presets
  const MILESTONE_YEARS = [1956, 1985, 1998, 2004, 2010, 2018, 2021, 2024];
  const MODERN_10YR = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const VINTAGE_HERITAGE = [1956, 1960, 1968, 1974, 1978, 1985, 1989];

  const handleSelectYearFromDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const yr = Number(val);
    if (!isNaN(yr)) {
      onToggleYear(yr);
    }
    // Reset dropdown so user can pick another year
    e.target.value = '';
  };

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-3 sm:p-4 shadow-sm transition-colors duration-200 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Quick Era Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)] uppercase tracking-wider mr-1">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span className="text-[11px] sm:text-xs">Compare Runs:</span>
          </div>

          <button
            onClick={() => onSelectEraPreset?.(MILESTONE_YEARS)}
            title="Select benchmark landmark runs: 1956, 1985, 1998, 2004, 2010, 2018, 2021, 2024"
            className="px-2 py-1 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] font-bold hover:brightness-105 transition shadow-2xs flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <Sparkles className="w-3 h-3" />
            Milestones ({MILESTONE_YEARS.length})
          </button>

          <button
            onClick={() => onSelectEraPreset?.(MODERN_10YR)}
            title="Select modern decade (2016–2025)"
            className="px-2 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--border-highlight)] font-semibold transition cursor-pointer text-[11px]"
          >
            Modern 10-Yr
          </button>

          <button
            onClick={() => onSelectEraPreset?.(VINTAGE_HERITAGE)}
            title="Select vintage classic seasons (1956–1989)"
            className="px-2 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--border-highlight)] font-semibold transition cursor-pointer text-[11px]"
          >
            Vintage
          </button>

          <button
            onClick={() => onSelectEraPreset?.(historicalYears.map((y) => y.year))}
            title="Select all 70 continuous seasons (1956–2025)"
            className="px-2 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-[10px] font-medium transition cursor-pointer hidden lg:inline-block"
          >
            All 70 Yrs
          </button>

          {selectedYears.filter((y) => y !== CURRENT_YEAR).length > 0 && (
            <button
              onClick={() => onClearAll?.()}
              title="Reset comparison to 2026 Live only"
              className="px-2 py-1 rounded-lg text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] flex items-center gap-1 transition cursor-pointer ml-auto md:ml-0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (2026 Only)
            </button>
          )}
        </div>

        {/* Right: Clean Search / Dropdown Year Picker */}
        <div className="w-full md:w-auto shrink-0">
          <div className="relative">
            <select
              value=""
              onChange={handleSelectYearFromDropdown}
              aria-label="Add or toggle historical season for comparison"
              className="w-full md:w-64 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] font-mono text-xs font-bold shadow-xs cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[var(--accent-amber)]"
            >
              <option value="" disabled className="text-[var(--text-muted)]">
                + Add / Toggle Specific Season (70 Yrs)...
              </option>

              <optgroup label="★ Key Milestone Landmark Runs" className="text-amber-600 dark:text-amber-400 bg-white dark:bg-stone-900 font-bold">
                {MILESTONE_YEARS.map((yr) => {
                  const y = historicalYears.find((h) => h.year === yr);
                  if (!y) return null;
                  return (
                    <option key={`ms-${y.year}`} value={y.year}>
                      {selectedYears.includes(y.year) ? '✓ ' : '+ '}
                      {y.year} Benchmark ({y.totalIndex.toFixed(1)} pts - {y.conservationStatus})
                    </option>
                  );
                })}
              </optgroup>

              <optgroup label="── Modern Era (2016–2025) ──" className="text-gray-900 bg-white dark:bg-stone-900 dark:text-gray-100 font-bold">
                {modernYears.map((y) => (
                  <option key={y.year} value={y.year}>
                    {selectedYears.includes(y.year) ? '✓ ' : '+ '}
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts - {y.conservationStatus})
                  </option>
                ))}
              </optgroup>

              <optgroup label="── 2000–2015 Seasons ──" className="text-gray-900 bg-white dark:bg-stone-900 dark:text-gray-100 font-bold">
                {decade2000s.map((y) => (
                  <option key={y.year} value={y.year}>
                    {selectedYears.includes(y.year) ? '✓ ' : '+ '}
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts - {y.conservationStatus})
                  </option>
                ))}
              </optgroup>

              <optgroup label="── 1990s Seasons ──" className="text-gray-900 bg-white dark:bg-stone-900 dark:text-gray-100 font-bold">
                {decade1990s.map((y) => (
                  <option key={y.year} value={y.year}>
                    {selectedYears.includes(y.year) ? '✓ ' : '+ '}
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts - {y.conservationStatus})
                  </option>
                ))}
              </optgroup>

              <optgroup label="── 1980s Seasons ──" className="text-gray-900 bg-white dark:bg-stone-900 dark:text-gray-100 font-bold">
                {decade1980s.map((y) => (
                  <option key={y.year} value={y.year}>
                    {selectedYears.includes(y.year) ? '✓ ' : '+ '}
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts - {y.conservationStatus})
                  </option>
                ))}
              </optgroup>

              <optgroup label="── Vintage Heritage (1956–1979) ──" className="text-gray-900 bg-white dark:bg-stone-900 dark:text-gray-100 font-bold">
                {vintageYears.map((y) => (
                  <option key={y.year} value={y.year}>
                    {selectedYears.includes(y.year) ? '✓ ' : '+ '}
                    {y.year} Season ({y.totalIndex.toFixed(1)} pts - {y.conservationStatus})
                  </option>
                ))}
              </optgroup>
            </select>

            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Selected Year Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[var(--border-main)] font-mono text-xs">
        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mr-1">
          Active Comparison:
        </span>

        {/* 2026 Live Chip (Always pinned) */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] font-bold text-xs shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
          2026 Live
        </span>

        {/* Selected Historical Years */}
        {selectedYears
          .filter((y) => y !== CURRENT_YEAR)
          .sort((a, b) => b - a)
          .map((yr) => {
            const yrData = allYears.find((y) => y.year === yr);
            return (
              <span
                key={yr}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs group hover:border-rose-400 transition"
              >
                <span>{yr}</span>
                {yrData && (
                  <span className="text-[10px] text-[var(--accent-amber)] font-bold">
                    ({yrData.totalIndex.toFixed(0)} pts)
                  </span>
                )}
                <button
                  onClick={() => onToggleYear(yr)}
                  title={`Remove ${yr} from comparison`}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

        {selectedYears.filter((y) => y !== CURRENT_YEAR).length === 0 && (
          <span className="text-xs text-[var(--text-muted)] italic">
            No historical seasons selected. Pick presets above or choose any season from the dropdown.
          </span>
        )}
      </div>
    </div>
  );
};
