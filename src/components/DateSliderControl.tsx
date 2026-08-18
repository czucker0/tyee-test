import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar,
  Sparkles,
  RotateCcw,
  FastForward,
  Fish,
} from 'lucide-react';
import { SEASON_DAYS, TODAY_DAY_INDEX, TODAY_MONTH_DAY, LATEST_RECORDED_DAY_INDEX } from '../data/historicalData';

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
  const currentDay = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const isLatestRecorded = currentDayIndex === latestRecordedDayIndex;
  const isPastRecorded = currentDayIndex < latestRecordedDayIndex;
  const isFutureForecast = currentDayIndex > latestRecordedDayIndex;
  const isPeak = currentDay.isHistoricalPeakWindow;
  const latestRecordedMonthDay = SEASON_DAYS[latestRecordedDayIndex]?.monthDay || 'Aug 17';

  // Month range indices
  const monthStarts = [
    { label: 'Jun', fullLabel: 'June (Jun 10–30)', startIdx: 0, monthNum: 6 },
    { label: 'Jul', fullLabel: 'July (Jul 01–31)', startIdx: 21, monthNum: 7 },
    { label: 'Aug', fullLabel: 'August (Peak)', startIdx: 52, monthNum: 8 },
    { label: 'Sep', fullLabel: 'September', startIdx: 83, monthNum: 9 },
  ];

  // Presets
  const presets = [
    { label: 'Start', fullLabel: 'Jun 10', index: 0 },
    { label: 'Jul 15', fullLabel: 'Jul 15', index: 35 },
    { label: 'Peak (Aug 14)', fullLabel: 'Peak (Aug 14)', index: 65, icon: <Flame className="w-3 h-3 text-amber-400" /> },
    { label: `Latest (${latestRecordedMonthDay})`, fullLabel: `Latest DFO Data (${latestRecordedMonthDay})`, index: latestRecordedDayIndex, highlight: true },
    { label: 'Sep 05', fullLabel: 'Sep 05', index: 87 },
    { label: 'Finish', fullLabel: 'Sep 30', index: SEASON_DAYS.length - 1 },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg relative overflow-hidden">
      {/* Background subtle gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-2.5 sm:space-y-3">
        {/* Top Info Bar: Date Title, % Complete Meter, Playback Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Current Selected Date Display */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-cyan-900/60 to-slate-800 border border-cyan-500/30 rounded-lg sm:rounded-xl text-center min-w-[58px] sm:min-w-[70px] shadow-inner">
              <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                {currentDay.monthDay.split(' ')[0]}
              </span>
              <span className="block text-lg sm:text-2xl font-black text-white leading-none mt-0.5">
                {currentDay.day}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                  <span>{currentDay.monthDay}</span>
                  {isFutureForecast ? (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                      FORECAST
                    </span>
                  ) : isLatestRecorded ? (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30 flex items-center gap-1">
                      <Fish className="w-2.5 h-2.5 text-cyan-400" />
                      LATEST DFO DATA
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                      RECORDED
                    </span>
                  )}
                  {isPeak && (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                      PEAK
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Day {currentDayIndex + 1}/113 &bull; Skeena Steelhead Run
              </p>
            </div>
          </div>

          {/* Historical Run Completion Progress Bar + Playback Stepper */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/70 border border-slate-800/80 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl">
            <div className="space-y-0.5 hidden xs:block w-24 sm:w-36">
              <div className="flex justify-between text-[10px] sm:text-xs">
                <span className="text-slate-400">Run Elapsed</span>
                <span className="text-cyan-300 font-bold font-mono">{percentElapsed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, percentElapsed))}%` }}
                />
              </div>
            </div>

            {/* Play/Pause & Speed Stepper */}
            <div className="flex items-center gap-1 sm:border-l sm:border-slate-800 sm:pl-2">
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
                title={isPlaying ? 'Pause Run Animation' : 'Play Run Animation'}
                className={`p-1.5 sm:p-2 rounded-lg font-bold flex items-center justify-center transition shadow-md ${
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
                title="Playback Speed"
                className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 hover:text-white border border-slate-700 transition"
              >
                {playSpeed}x
              </button>
            </div>
          </div>
        </div>

        {/* Main Slider Track */}
        <div className="space-y-1.5">
          {/* Slider Input with Custom Styling */}
          <div className="relative py-1 sm:py-2">
            {/* Peak Window Highlight Band on Slider track */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 bg-amber-500/20 border border-amber-500/40 rounded-sm pointer-events-none z-0"
              style={{
                left: `${(61 / (SEASON_DAYS.length - 1)) * 100}%`,
                width: `${(11 / (SEASON_DAYS.length - 1)) * 100}%`,
              }}
              title="Historical Peak Migration Window (Aug 10 - Aug 20)"
            />

            {/* Today's Marker Pin */}
            <div
              className="absolute top-0 -translate-y-1.5 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center"
              style={{ left: `${(TODAY_DAY_INDEX / (SEASON_DAYS.length - 1)) * 100}%` }}
            >
              <span className="text-[8px] sm:text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-cyan-500 text-slate-950 shadow">
                Today
              </span>
              <div className="w-0.5 h-2.5 bg-cyan-400" />
            </div>

            <input
              type="range"
              min={0}
              max={SEASON_DAYS.length - 1}
              value={currentDayIndex}
              onChange={(e) => onDayChange(parseInt(e.target.value, 10))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none relative z-10 transition"
            />
          </div>

          {/* Month & Preset Quick Jumps in Compact Scrollable Row */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[10px] sm:text-[11px]">
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
                    <span>{p.label}</span>
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
