import React from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Fish,
  Calendar,
} from 'lucide-react';
import { SEASON_DAYS, TODAY_DAY_INDEX, LATEST_RECORDED_DAY_INDEX } from '../data/historicalData';

interface DateSliderControlProps {
  currentDayIndex: number;
  onDayChange: (newIndex: number) => void;
  percentElapsed: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playSpeed: number;
  onChangeSpeed: (speed: number) => void;
  latestRecordedDayIndex?: number;
  isCondensed?: boolean;
}

export const DateSliderControl: React.FC<DateSliderControlProps> = ({
  currentDayIndex,
  onDayChange,
  percentElapsed,
  isPlaying,
  onTogglePlay,
  playSpeed,
  onChangeSpeed,
  latestRecordedDayIndex = LATEST_RECORDED_DAY_INDEX,
  isCondensed = false,
}) => {
  const currentDay = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const isLatestRecorded = currentDayIndex === latestRecordedDayIndex;
  const isFutureForecast = currentDayIndex > latestRecordedDayIndex;
  const latestRecordedMonthDay = SEASON_DAYS[latestRecordedDayIndex]?.monthDay || 'Aug 17';

  // Month range indices
  const monthStarts = [
    { label: 'Jun', startIdx: 0, monthNum: 6 },
    { label: 'Jul', startIdx: 21, monthNum: 7 },
    { label: 'Aug', startIdx: 52, monthNum: 8 },
    { label: 'Sep', startIdx: 83, monthNum: 9 },
  ];

  // Presets
  const presets = [
    { label: 'Start (Jun 10)', shortLabel: 'Start', index: 0 },
    { label: 'Jul 15', shortLabel: 'Jul 15', index: 35 },
    {
      label: 'Peak (Aug 14)',
      shortLabel: 'Peak',
      index: 65,
      icon: (
        <Flame
          className={`w-2.5 h-2.5 ${
            currentDayIndex === 65
              ? 'text-white fill-white/20'
              : 'text-[var(--accent-amber)]'
          }`}
        />
      ),
    },
    { label: `Latest (${latestRecordedMonthDay})`, shortLabel: `Latest (${latestRecordedMonthDay})`, index: latestRecordedDayIndex, highlight: true },
    { label: 'Sep 05', shortLabel: 'Sep 05', index: 87 },
    { label: 'Finish (Sep 30)', shortLabel: 'Finish', index: SEASON_DAYS.length - 1 },
  ];

  // ---------------------------------------------------------------------------
  // 1. CONDENSED STICKY BAR (When Scrolled Down)
  // ---------------------------------------------------------------------------
  if (isCondensed) {
    return (
      <div className="bg-[var(--bg-surface)]/95 border border-[var(--border-main)] rounded-xl px-2.5 py-1.5 shadow-md flex items-center justify-between gap-2 transition-all duration-200 backdrop-blur-md">
        {/* Left: Date Pill & Steppers */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] font-mono font-bold text-xs">
            <Calendar className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
            <span>{currentDay.monthDay}</span>
            {isFutureForecast && (
              <span className="text-[8px] px-1 bg-[var(--accent-amber)] text-white rounded font-bold">FCST</span>
            )}
          </div>

          <button
            onClick={() => onDayChange(Math.max(0, currentDayIndex - 1))}
            disabled={currentDayIndex === 0}
            title="Previous Day"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] border border-[var(--border-main)] transition shrink-0 aspect-square"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--accent-amber)] text-white hover:opacity-90 transition shadow-xs shrink-0 aspect-square"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onDayChange(Math.min(SEASON_DAYS.length - 1, currentDayIndex + 1))}
            disabled={currentDayIndex === SEASON_DAYS.length - 1}
            title="Next Day"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] border border-[var(--border-main)] transition shrink-0 aspect-square"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Inline Scrubber Slider Track */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline shrink-0">Jun 10</span>
          <input
            type="range"
            min="0"
            max={SEASON_DAYS.length - 1}
            value={currentDayIndex}
            onChange={(e) => onDayChange(Number(e.target.value))}
            aria-label="Condensed Season Scrubber"
            className="w-full h-1.5 sm:h-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg appearance-none cursor-pointer focus:outline-none accent-[var(--accent-amber)]"
          />
          <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline shrink-0">Sep 30</span>
        </div>

        {/* Right: % Elapsed + Quick Jump */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
          <span className="text-[10px] text-[var(--text-muted)] hidden md:inline">
            <strong className="text-[var(--accent-amber)]">{percentElapsed.toFixed(0)}%</strong> passed
          </span>

          {!isLatestRecorded && (
            <button
              onClick={() => onDayChange(latestRecordedDayIndex)}
              className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--accent-amber-light)] border border-[var(--border-main)] hover:border-[var(--accent-amber-border)] text-[10px] text-[var(--accent-amber)] font-bold transition flex items-center gap-1"
              title={`Jump to latest DFO update (${latestRecordedMonthDay})`}
            >
              <Fish className="w-3 h-3" />
              <span className="hidden sm:inline">Latest</span> ({latestRecordedMonthDay.split(' ')[1]})
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. FULL EXPANDED VIEW (At Top of Page)
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm relative overflow-hidden transition-colors duration-200">
      <div className="relative z-10 space-y-2.5 sm:space-y-3.5">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Current Selected Date Display */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="p-1 sm:p-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-center min-w-[50px] sm:min-w-[68px] shrink-0">
              <span className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--accent-amber)]">
                {currentDay.monthDay.split(' ')[0]}
              </span>
              <span className="block text-base sm:text-2xl font-black text-[var(--text-main)] leading-none mt-0.5">
                {currentDay.day}
              </span>
            </div>

            <div className="min-w-0">
              {/* Date Title */}
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-heading font-black text-[var(--text-main)] tracking-tight truncate leading-tight">
                  {currentDay.monthDay}, 2026
                </h2>
                {isFutureForecast && (
                  <span className="stamp-badge stamp-amber font-mono text-[9px] sm:text-[10px] px-1.5 py-0.2 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                    FORECAST
                  </span>
                )}
              </div>

              {/* Sub-line with clear season progress */}
              <p className="text-xs text-[var(--text-secondary)] font-mono font-medium truncate mt-0.5">
                Day {currentDayIndex + 1} of 113 &bull; <strong className="text-[var(--accent-amber)] font-bold">{percentElapsed.toFixed(0)}% Elapsed</strong>
              </p>
            </div>
          </div>

          {/* Stepper / Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] p-1 sm:p-1.5 rounded-lg sm:rounded-xl shrink-0">
            {/* Run Elapsed meter (visible on sm+) */}
            <div className="space-y-0.5 hidden md:block w-24 lg:w-32 pr-2 border-r border-[var(--border-main)]">
              <div className="flex justify-between text-xs font-mono font-medium">
                <span className="text-[var(--text-secondary)]">Run Passed</span>
                <span className="text-[var(--accent-amber)] font-bold">{percentElapsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[var(--border-main)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[var(--accent-amber)] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, percentElapsed))}%` }}
                />
              </div>
            </div>

            {/* Stepper Buttons */}
            <button
              onClick={() => onDayChange(Math.max(0, currentDayIndex - 1))}
              disabled={currentDayIndex === 0}
              title="Previous Day"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-main)] transition border border-[var(--border-main)] font-bold shrink-0 aspect-square"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause Timeline Animation' : 'Play Timeline Animation'}
              className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition shadow-sm bg-[var(--accent-amber)] text-white hover:opacity-90 shrink-0 aspect-square"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => onDayChange(Math.min(SEASON_DAYS.length - 1, currentDayIndex + 1))}
              disabled={currentDayIndex === SEASON_DAYS.length - 1}
              title="Next Day"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-main)] transition border border-[var(--border-main)] font-bold shrink-0 aspect-square"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Speed toggle */}
            <button
              onClick={() => {
                const speeds = [1, 2, 5];
                const nextSpeed = speeds[(speeds.indexOf(playSpeed) + 1) % speeds.length];
                onChangeSpeed(nextSpeed);
              }}
              title="Change Playback Speed"
              className="h-8 px-2 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-xs font-mono font-bold text-[var(--text-main)] border border-[var(--border-main)] transition shrink-0"
            >
              {playSpeed}x
            </button>
          </div>
        </div>

        {/* Date Timeline Track Slider */}
        <div className="space-y-1 sm:space-y-1.5">
          <div className="relative flex items-center">
            {/* Native range input */}
            <input
              type="range"
              min="0"
              max={SEASON_DAYS.length - 1}
              value={currentDayIndex}
              onChange={(e) => onDayChange(Number(e.target.value))}
              aria-label="Season Day Scrubber"
              className="w-full h-2.5 sm:h-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg appearance-none cursor-pointer focus:outline-none accent-[var(--accent-amber)]"
            />
          </div>

          {/* Month labels along track */}
          <div className="flex justify-between px-1 text-[11px] sm:text-xs font-editorial text-[var(--text-secondary)] font-semibold select-none">
            <button
              onClick={() => onDayChange(0)}
              className={`hover:text-[var(--text-main)] transition ${
                currentDayIndex >= 0 && currentDayIndex < 21 ? 'text-[var(--accent-amber)] font-bold' : ''
              }`}
            >
              Jun 10
            </button>
            <button
              onClick={() => onDayChange(21)}
              className={`hover:text-[var(--text-main)] transition ${
                currentDayIndex >= 21 && currentDayIndex < 52 ? 'text-[var(--accent-amber)] font-bold' : ''
              }`}
            >
              Jul 01
            </button>
            <button
              onClick={() => onDayChange(52)}
              className={`hover:text-[var(--text-main)] transition ${
                currentDayIndex >= 52 && currentDayIndex < 83 ? 'text-[var(--accent-amber)] font-bold' : ''
              }`}
            >
              Aug 01
            </button>
            <button
              onClick={() => onDayChange(83)}
              className={`hover:text-[var(--text-main)] transition ${
                currentDayIndex >= 83 ? 'text-[var(--accent-amber)] font-bold' : ''
              }`}
            >
              Sep 01
            </button>
            <button
              onClick={() => onDayChange(SEASON_DAYS.length - 1)}
              className="hover:text-[var(--text-main)] transition"
            >
              Sep 30
            </button>
          </div>
        </div>

        {/* Preset Chips - Always on a single line */}
        <div className="pt-0.5 w-full min-w-0">
          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-mono mr-0.5 font-bold shrink-0 whitespace-nowrap hidden sm:inline">
              Field Milestones:
            </span>
            {presets.map((preset) => {
              const isSelected = currentDayIndex === preset.index;
              return (
                <button
                  key={preset.label}
                  onClick={() => onDayChange(preset.index)}
                  className={`px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-editorial transition flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                      : preset.highlight
                      ? 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] font-bold hover:bg-[var(--accent-amber)] hover:text-white'
                      : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] font-semibold'
                  }`}
                >
                  {preset.icon}
                  <span className="hidden xs:inline">{preset.label}</span>
                  <span className="xs:hidden">{preset.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
