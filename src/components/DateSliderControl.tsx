import React, { useState } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar,
  Sparkles,
  Fish,
  SlidersHorizontal
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
    { label: 'Peak (Aug 14)', shortLabel: 'Peak', index: 65, icon: <Flame className="w-2.5 h-2.5 text-amber-400" /> },
    { label: `Latest (${latestRecordedMonthDay})`, shortLabel: `Latest (${latestRecordedMonthDay})`, index: latestRecordedDayIndex, highlight: true },
    { label: 'Sep 05', shortLabel: 'Sep 05', index: 87 },
    { label: 'Finish (Sep 30)', shortLabel: 'Finish', index: SEASON_DAYS.length - 1 },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg relative overflow-hidden">
      {/* Background subtle gradient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-2 sm:space-y-3">
        {/* Top Info Bar: Date Title, % Complete Meter, Playback Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Current Selected Date Display */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1 sm:p-2 bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/30 rounded-lg text-center min-w-[50px] sm:min-w-[65px] shadow-inner shrink-0">
              <span className="block text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                {currentDay.monthDay.split(' ')[0]}
              </span>
              <span className="block text-base sm:text-2xl font-black text-white leading-none mt-0.5">
                {currentDay.day}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5 truncate">
                  <span>{currentDay.monthDay}</span>
                  {isFutureForecast ? (
                    <span className="text-[9px] sm:text-xs px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30 flex items-center gap-0.5 shrink-0">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      FORECAST
                    </span>
                  ) : isLatestRecorded ? (
                    <span className="text-[9px] sm:text-xs px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 flex items-center gap-0.5 shrink-0">
                      <Fish className="w-2.5 h-2.5 text-cyan-400" />
                      LATEST
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-xs px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-bold border border-emerald-500/30 shrink-0">
                      RECORDED
                    </span>
                  )}
                  {isPeak && (
                    <span className="hidden xs:flex text-[9px] sm:text-xs px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 items-center gap-0.5 shrink-0">
                      <Flame className="w-2.5 h-2.5 text-amber-400" />
                      PEAK
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Day {currentDayIndex + 1}/113 &bull; {percentElapsed.toFixed(0)}% Elapsed
              </p>
            </div>
          </div>

          {/* Stepper / Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/70 border border-slate-800/80 p-1 sm:p-1.5 rounded-lg sm:rounded-xl shrink-0">
            {/* Run Elapsed meter (visible on sm+) */}
            <div className="space-y-0.5 hidden md:block w-24 lg:w-32 pr-2 border-r border-slate-800">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Run Passed</span>
                <span className="text-cyan-300 font-bold font-mono">{percentElapsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, percentElapsed))}%` }}
                />
              </div>
            </div>

            {/* Stepper Buttons */}
            <button
              onClick={() => onDayChange(Math.max(0, currentDayIndex - 1))}
              disabled={currentDayIndex === 0}
              title="Previous Day"
              className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause Animation' : 'Play Timeline Animation'}
              className={`p-1.5 sm:p-2 rounded-lg font-bold flex items-center justify-center transition shadow-sm ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
            </button>

            <button
              onClick={() => onDayChange(Math.min(SEASON_DAYS.length - 1, currentDayIndex + 1))}
              disabled={currentDayIndex === SEASON_DAYS.length - 1}
              title="Next Day"
              className="p-1 sm:p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition"
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
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 hover:text-white border border-slate-700 transition"
            >
              {playSpeed}x
            </button>

            {/* Mobile quick presets toggle button */}
            <button
              onClick={() => setShowMobilePresets(!showMobilePresets)}
              className={`sm:hidden p-1 rounded border transition ${
                showMobilePresets
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Presets Bar"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Slider Track */}
        <div className="space-y-1.5">
          <div className="relative py-1">
            {/* Peak Window Highlight Band on Slider track */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2.5 bg-amber-500/25 border border-amber-500/40 rounded-sm pointer-events-none z-0"
              style={{
                left: `${(61 / (SEASON_DAYS.length - 1)) * 100}%`,
                width: `${(11 / (SEASON_DAYS.length - 1)) * 100}%`,
              }}
              title="Historical Peak Migration Window (Aug 10 - Aug 20)"
            />

            {/* Today's Marker Pin */}
            <div
              className="absolute top-0 -translate-y-1 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center"
              style={{ left: `${(TODAY_DAY_INDEX / (SEASON_DAYS.length - 1)) * 100}%` }}
            >
              <span className="text-[7px] sm:text-[8px] font-bold font-mono px-1 rounded bg-cyan-500 text-slate-950 shadow">
                Today
              </span>
              <div className="w-0.5 h-2 bg-cyan-400" />
            </div>

            <input
              type="range"
              min={0}
              max={SEASON_DAYS.length - 1}
              value={currentDayIndex}
              onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none relative z-10 transition"
            />
          </div>

          {/* Month & Preset Quick Jumps (Always shown on sm+, expandable or horizontal scroll on mobile) */}
          <div
            className={`flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[10px] sm:text-[11px] ${
              showMobilePresets ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {/* Months */}
            <div className="flex items-center gap-1 shrink-0 border-r border-slate-800 pr-1.5">
              {monthStarts.map((m) => (
                <button
                  key={m.label}
                  onClick={() => onDayChange(m.startIdx)}
                  className={`px-2 py-0.5 rounded transition font-medium border ${
                    currentDay.month === m.monthNum
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1 shrink-0">
              {presets.map((p) => {
                const isActive = currentDayIndex === p.index;
                return (
                  <button
                    key={p.label}
                    onClick={() => onDayChange(p.index)}
                    className={`px-2 py-0.5 rounded transition flex items-center gap-1 border shrink-0 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                        : p.highlight
                        ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 font-semibold'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:text-white'
                    }`}
                  >
                    {p.icon}
                    <span>{p.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
