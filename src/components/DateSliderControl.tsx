import React, { useState } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Fish,
  SlidersHorizontal,
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
}) => {
  const [showMobilePresets, setShowMobilePresets] = useState<boolean>(false);
  const currentDay = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const isLatestRecorded = currentDayIndex === latestRecordedDayIndex;
  const isFutureForecast = currentDayIndex > latestRecordedDayIndex;
  const isPeak = currentDay.isHistoricalPeakWindow;
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
    { label: 'Peak (Aug 14)', shortLabel: 'Peak', index: 65, icon: <Flame className="w-2.5 h-2.5 text-[var(--accent-amber)]" /> },
    { label: `Latest (${latestRecordedMonthDay})`, shortLabel: `Latest (${latestRecordedMonthDay})`, index: latestRecordedDayIndex, highlight: true },
    { label: 'Sep 05', shortLabel: 'Sep 05', index: 87 },
    { label: 'Finish (Sep 30)', shortLabel: 'Finish', index: SEASON_DAYS.length - 1 },
  ];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm relative overflow-hidden transition-colors duration-200">
      <div className="relative z-10 space-y-2.5 sm:space-y-3.5">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Current Selected Date Display - Editorial Serif */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-1 sm:p-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-center min-w-[54px] sm:min-w-[68px] shrink-0">
              <span className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--accent-amber)]">
                {currentDay.monthDay.split(' ')[0]}
              </span>
              <span className="block text-base sm:text-2xl font-black text-[var(--text-main)] leading-none mt-0.5">
                {currentDay.day}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-xl font-heading font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2 truncate">
                  <span>{currentDay.monthDay}, 2026</span>
                  {isFutureForecast ? (
                    <span className="stamp-badge stamp-amber font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                      FORECAST
                    </span>
                  ) : isLatestRecorded ? (
                    <span className="stamp-badge stamp-teal font-mono">
                      <Fish className="w-2.5 h-2.5" />
                      LATEST
                    </span>
                  ) : (
                    <span className="stamp-badge stamp-spruce font-mono">
                      RECORDED
                    </span>
                  )}
                  {isPeak && (
                    <span className="hidden xs:flex stamp-badge stamp-amber font-mono">
                      <Flame className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                      PEAK
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono truncate mt-0.5">
                Day {currentDayIndex + 1}/113 &bull; {percentElapsed.toFixed(0)}% Elapsed
              </p>
            </div>
          </div>

          {/* Stepper / Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] p-1 sm:p-1.5 rounded-lg sm:rounded-xl shrink-0">
            {/* Run Elapsed meter (visible on sm+) */}
            <div className="space-y-0.5 hidden md:block w-24 lg:w-32 pr-2 border-r border-[var(--border-main)]">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[var(--text-muted)]">Run Passed</span>
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
              className="p-1 sm:p-1.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] transition border border-[var(--border-main)]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause Timeline Animation' : 'Play Timeline Animation'}
              className="p-1.5 sm:p-2 rounded-lg font-bold flex items-center justify-center transition shadow-sm bg-[var(--accent-amber)] text-white hover:opacity-90"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
            </button>

            <button
              onClick={() => onDayChange(Math.min(SEASON_DAYS.length - 1, currentDayIndex + 1))}
              disabled={currentDayIndex === SEASON_DAYS.length - 1}
              title="Next Day"
              className="p-1 sm:p-1.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] transition border border-[var(--border-main)]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Speed toggle */}
            <button
              onClick={() => {
                const speeds = [1, 2, 5];
                const nextSpeed = speeds[(speeds.indexOf(playSpeed) + 1) % speeds.length];
                onChangeSpeed(nextSpeed);
              }}
              title="Change Playback Speed"
              className="px-1.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[10px] font-mono font-bold text-[var(--text-secondary)] border border-[var(--border-main)] transition"
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
              className="w-full h-2 sm:h-2.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg appearance-none cursor-pointer focus:outline-none accent-[var(--accent-amber)]"
            />
          </div>

          {/* Month labels along track */}
          <div className="flex justify-between px-1 text-[9px] sm:text-[10px] font-editorial text-[var(--text-muted)] font-medium">
            {monthStarts.map((m) => (
              <button
                key={m.label}
                onClick={() => onDayChange(m.startIdx)}
                className={`hover:text-[var(--text-main)] transition ${
                  currentDayIndex >= m.startIdx ? 'text-[var(--accent-amber)] font-bold' : ''
                }`}
              >
                {m.label} 01
              </button>
            ))}
            <button
              onClick={() => onDayChange(SEASON_DAYS.length - 1)}
              className="hover:text-[var(--text-main)] transition"
            >
              Sep 30
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono mr-1 font-semibold">
              Field Milestones:
            </span>
            {presets.map((preset) => {
              const isSelected = currentDayIndex === preset.index;
              return (
                <button
                  key={preset.label}
                  onClick={() => onDayChange(preset.index)}
                  className={`px-2 py-0.5 rounded text-[11px] font-editorial transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                      : preset.highlight
                      ? 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] font-medium hover:bg-[var(--accent-amber)] hover:text-white'
                      : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] border border-[var(--border-main)]'
                  }`}
                >
                  {preset.icon}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Presets Toggle */}
          <div className="sm:hidden w-full flex items-center justify-between">
            <button
              onClick={() => setShowMobilePresets(!showMobilePresets)}
              className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[10px] text-[var(--text-secondary)] flex items-center gap-1 font-mono"
            >
              <SlidersHorizontal className="w-3 h-3 text-[var(--accent-amber)]" />
              <span>{showMobilePresets ? 'Hide Milestones' : 'Milestones'}</span>
            </button>

            {/* Quick jump to latest on mobile */}
            <button
              onClick={() => onDayChange(latestRecordedDayIndex)}
              className="px-2 py-1 rounded bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[10px] text-[var(--accent-amber)] font-bold flex items-center gap-1 font-editorial"
            >
              <Fish className="w-3 h-3" />
              <span>Latest ({latestRecordedMonthDay})</span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown preset chips */}
        {showMobilePresets && (
          <div className="sm:hidden grid grid-cols-3 gap-1.5 pt-1 border-t border-[var(--border-main)] animate-in fade-in duration-150">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onDayChange(preset.index);
                  setShowMobilePresets(false);
                }}
                className={`px-2 py-1 rounded text-[10px] font-editorial text-center transition ${
                  currentDayIndex === preset.index
                    ? 'bg-[var(--accent-amber)] text-white font-bold'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)]'
                }`}
              >
                {preset.shortLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
