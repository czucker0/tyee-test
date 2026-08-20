import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  CloudSun,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Sun,
  CloudRain,
  CloudLightning,
  Cloud,
  Droplets,
  Wind,
  Gauge,
  Thermometer,
} from 'lucide-react';
import { SEASON_DAYS, LATEST_RECORDED_DAY_INDEX } from '../data/historicalData';
import {
  fetchTributaryWeatherAndHydro,
  TributaryWeatherProfile,
  DailyWeatherOutlook,
} from '../services/hydroWeatherService';

export type WeatherHubZone = 'Terrace' | 'Smithers';

interface DateSliderControlProps {
  currentDayIndex: number;
  onDayChange: (newIndex: number) => void;
  percentElapsed: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playSpeed: number;
  onChangeSpeed: (speed: number) => void;
  latestRecordedDayIndex?: number;
  isCompactSticky?: boolean;
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
  isCompactSticky = false,
}) => {
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<WeatherHubZone>('Terrace');
  const [weatherData, setWeatherData] = useState<{
    Terrace: TributaryWeatherProfile | null;
    Smithers: TributaryWeatherProfile | null;
  }>({
    Terrace: null,
    Smithers: null,
  });
  const [weatherLoading, setWeatherLoading] = useState(false);

  const currentDay = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const isFutureForecast = currentDayIndex > latestRecordedDayIndex;
  const latestRecordedMonthDay = SEASON_DAYS[latestRecordedDayIndex]?.monthDay || 'Aug 18';

  // Load weather when component mounts or expanded
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const [terraceProfile, smithersProfile] = await Promise.all([
          fetchTributaryWeatherAndHydro('Lower Skeena'),
          fetchTributaryWeatherAndHydro('Bulkley / Morice River System'),
        ]);

        if (isMounted) {
          setWeatherData({
            Terrace: terraceProfile,
            Smithers: smithersProfile,
          });
        }
      } catch (err) {
        console.error('Failed to load watershed weather:', err);
      } finally {
        if (isMounted) setWeatherLoading(false);
      }
    };

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  const zoneMapping: Record<WeatherHubZone, { riverKey: string; subtitle: string; stationNote: string }> = {
    Terrace: {
      riverKey: 'Lower Skeena',
      subtitle: 'Lower Skeena / Kalum / Coastal Zone Hub (El. 25m)',
      stationNote: 'Skeena River at Usk & Terrace Weather Station',
    },
    Smithers: {
      riverKey: 'Bulkley / Morice River System',
      subtitle: 'Upper Skeena / Bulkley / Babine Zone Hub (El. 490m)',
      stationNote: 'Smithers Airport & Bulkley River at Quick Station',
    },
  };

  const activeProfile = weatherData[selectedZone];
  const zoneMeta = zoneMapping[selectedZone];

  const getWeatherIcon = (iconType?: DailyWeatherOutlook['iconType']) => {
    switch (iconType) {
      case 'sunny':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'rain':
      case 'heavy_rain':
        return <CloudRain className="w-3.5 h-3.5 text-sky-500" />;
      case 'storm':
        return <CloudLightning className="w-3.5 h-3.5 text-purple-500" />;
      case 'cloudy':
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
      case 'partly_cloudy':
      default:
        return <CloudSun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Presets for quick scrub
  const presets = [
    { label: 'Start (Jun 10)', shortLabel: 'Start', index: 0 },
    { label: 'Jul 15', shortLabel: 'Jul 15', index: 35 },
    {
      label: 'Peak (Aug 14)',
      shortLabel: 'Peak',
      index: 65,
      icon: (
        <Flame
          className={`w-3 h-3 ${
            currentDayIndex === 65
              ? 'text-white fill-white/30'
              : 'text-[var(--accent-amber)] fill-[var(--accent-amber)]/20'
          }`}
        />
      ),
    },
    { label: `Latest (${latestRecordedMonthDay})`, shortLabel: 'Latest', index: latestRecordedDayIndex, highlight: true },
    { label: 'Sep 05', shortLabel: 'Sep 05', index: 87 },
    { label: 'Finish (Sep 30)', shortLabel: 'Finish', index: SEASON_DAYS.length - 1 },
  ];

  // Ultra-Compact Sticky Minimal Mode
  if (isCompactSticky) {
    return (
      <div className="bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-main)] rounded-xl px-2.5 py-1.5 shadow-sm transition-all duration-200 flex items-center justify-between gap-2">
        {/* Date Chip */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md font-mono text-[11px] font-bold text-[var(--accent-amber)] flex items-center gap-1">
            <span>{currentDay.monthDay}</span>
            {isFutureForecast && <Sparkles className="w-2.5 h-2.5" />}
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] hidden xs:inline">
            Day {currentDayIndex + 1}
          </span>
        </div>

        {/* Minimal Timeline Track */}
        <div className="flex-1 min-w-[120px] max-w-xl mx-2">
          <input
            type="range"
            min="0"
            max={SEASON_DAYS.length - 1}
            value={currentDayIndex}
            onChange={(e) => onDayChange(Number(e.target.value))}
            aria-label="Season Timeline Slider Compact"
            className="w-full h-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg appearance-none cursor-pointer focus:outline-none accent-[var(--accent-amber)]"
          />
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onDayChange(Math.max(0, currentDayIndex - 1))}
            disabled={currentDayIndex === 0}
            className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] border border-[var(--border-main)] transition shrink-0 cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-6 h-6 flex items-center justify-center rounded bg-[var(--accent-amber)] text-white hover:opacity-90 transition shadow-xs shrink-0 cursor-pointer"
            title={isPlaying ? 'Pause Simulation' : 'Play Season'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onDayChange(Math.min(SEASON_DAYS.length - 1, currentDayIndex + 1))}
            disabled={currentDayIndex === SEASON_DAYS.length - 1}
            className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] border border-[var(--border-main)] transition shrink-0 cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-2 sm:p-2.5 shadow-xs relative overflow-hidden transition-colors duration-200">
      <div className="relative z-10 space-y-1.5">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Current Selected Date Display + Weather Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="px-2 py-0.5 sm:py-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-center shrink-0 flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)]">
                {currentDay.monthDay.split(' ')[0]}
              </span>
              <span className="text-sm sm:text-base font-black text-[var(--text-main)] leading-none">
                {currentDay.day}
              </span>
            </div>

            <div className="min-w-0">
              {/* Date Title & Forecast Tag */}
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-base font-heading font-black text-[var(--text-main)] tracking-tight truncate leading-tight">
                  {currentDay.monthDay}, 2026
                </h2>
                {isFutureForecast && (
                  <span className="stamp-badge stamp-amber font-mono text-[8px] px-1 py-0 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                    FORECAST
                  </span>
                )}
                <span className="hidden sm:inline-block text-[11px] text-[var(--text-secondary)] font-mono">
                  &bull; Day {currentDayIndex + 1}/113 ({percentElapsed.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Stepper / Playback Controls & Weather Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Weather Toggle Button */}
            <button
              onClick={() => setIsWeatherOpen(!isWeatherOpen)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition cursor-pointer shrink-0"
              title="Toggle watershed river & weather conditions"
            >
              <CloudSun className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span className="hidden md:inline">Weather &amp; Hydro</span>
              {activeProfile && (
                <span className="text-[var(--text-main)] font-bold">
                  {Math.round(activeProfile.current.tempC)}°C
                </span>
              )}
              {isWeatherOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <div className="flex items-center gap-0.5 sm:gap-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] p-0.5 rounded-lg shrink-0">
              {/* Previous Day */}
              <button
                onClick={() => onDayChange(Math.max(0, currentDayIndex - 1))}
                disabled={currentDayIndex === 0}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-[var(--bg-card)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] border border-[var(--border-main)] transition shrink-0 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={onTogglePlay}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-[var(--accent-amber)] text-white hover:opacity-90 transition shadow-xs shrink-0 cursor-pointer"
                title={isPlaying ? 'Pause Simulation' : 'Play Season Time-Lapse'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              {/* Next Day */}
              <button
                onClick={() => onDayChange(Math.min(SEASON_DAYS.length - 1, currentDayIndex + 1))}
                disabled={currentDayIndex === SEASON_DAYS.length - 1}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-[var(--bg-card)] hover:bg-[var(--border-light)] disabled:opacity-30 text-[var(--text-secondary)] border border-[var(--border-main)] transition shrink-0 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Play Speed Toggle */}
              <button
                onClick={() => {
                  const nextSpeed = playSpeed === 1 ? 2 : playSpeed === 2 ? 4 : 1;
                  onChangeSpeed(nextSpeed);
                }}
                className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-[10px] font-mono font-bold text-[var(--text-secondary)] border border-[var(--border-main)] transition hidden sm:inline-block cursor-pointer"
                title="Change playback speed"
              >
                {playSpeed}x
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Slider Track + Presets (Ultra-compact) */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={SEASON_DAYS.length - 1}
            value={currentDayIndex}
            onChange={(e) => onDayChange(Number(e.target.value))}
            aria-label="Season Timeline Slider"
            className="flex-1 h-1.5 sm:h-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg appearance-none cursor-pointer focus:outline-none accent-[var(--accent-amber)]"
          />

          {/* Preset Buttons Bar */}
          <div className="flex items-center gap-1 font-mono text-[9px] sm:text-[10px] shrink-0">
            {presets.map((preset) => {
              const isActive = currentDayIndex === preset.index;
              return (
                <button
                  key={preset.label}
                  onClick={() => onDayChange(preset.index)}
                  className={`px-1.5 py-0.5 rounded transition whitespace-nowrap flex items-center gap-0.5 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-amber)] text-white font-bold shadow-2xs'
                      : preset.highlight
                      ? 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {preset.icon}
                  <span className="hidden sm:inline">{preset.label}</span>
                  <span className="sm:hidden">{preset.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Weather & River Conditions Panel (Hidden when collapsed) */}
        {isWeatherOpen && (
          <div className="pt-2 border-t border-[var(--border-main)] space-y-2.5 animate-in fade-in duration-150">
            {/* Weather Hub Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                <button
                  onClick={() => setSelectedZone('Terrace')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    selectedZone === 'Terrace'
                      ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>Terrace (Lower Skeena)</span>
                </button>
                <button
                  onClick={() => setSelectedZone('Smithers')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                    selectedZone === 'Smithers'
                      ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>Smithers (Bulkley Basin)</span>
                </button>
              </div>

              <span className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:inline-block">
                {zoneMeta.subtitle}
              </span>
            </div>

            {/* Current Conditions & 5-Day Outlook */}
            {weatherLoading ? (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent-amber)]" />
                <span>Syncing watershed river and weather conditions...</span>
              </div>
            ) : activeProfile ? (
              <div className="space-y-2">
                {/* 5-Day Forecast Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {activeProfile.daily.slice(0, 5).map((day, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex flex-col items-center text-center justify-between ${
                        idx === 0 ? 'border-[var(--accent-teal)]/40 ring-1 ring-[var(--accent-teal)]/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[10px] font-mono text-[var(--text-secondary)]">
                        <span className="font-bold text-[var(--text-main)]">
                          {idx === 0 ? 'Today' : day.dayName}
                        </span>
                        <span>{day.date.slice(5)}</span>
                      </div>

                      <div className="my-1 flex items-center justify-center p-1 rounded-full bg-[var(--bg-surface)]">
                        {getWeatherIcon(day.iconType)}
                      </div>

                      <div className="space-y-0.5 w-full">
                        <div className="text-xs font-mono font-extrabold text-[var(--text-main)]">
                          {Math.round(day.tempMaxC)}° / <span className="text-[var(--text-muted)] font-normal">{Math.round(day.tempMinC)}°C</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] truncate" title={day.conditionLabel}>
                          {day.conditionLabel}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-sky-600 dark:text-sky-400">
                          <Droplets className="w-2.5 h-2.5" />
                          <span>{day.precipitationMm > 0 ? `${day.precipitationMm.toFixed(1)}mm` : '0 mm'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub-bar with Live Readings */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1">
                  <span>{zoneMeta.stationNote}</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-[var(--accent-teal)]" />
                      {Math.round(activeProfile.current.windSpeedKmh)} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-500" />
                      {Math.round(activeProfile.current.pressureHpa)} hPa
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)] font-mono">Weather and river readings currently unavailable</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
