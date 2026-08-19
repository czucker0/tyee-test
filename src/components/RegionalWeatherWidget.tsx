import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sun,
  CloudRain,
  CloudLightning,
  Cloud,
} from 'lucide-react';
import {
  fetchTributaryWeatherAndHydro,
  TributaryWeatherProfile,
  DailyWeatherOutlook,
} from '../services/hydroWeatherService';

export type WeatherHubZone = 'Terrace' | 'Smithers';

interface RegionalWeatherWidgetProps {
  defaultZone?: WeatherHubZone;
}

export const RegionalWeatherWidget: React.FC<RegionalWeatherWidgetProps> = ({
  defaultZone = 'Terrace',
}) => {
  const [selectedZone, setSelectedZone] = useState<WeatherHubZone>(defaultZone);
  const [weatherData, setWeatherData] = useState<{
    Terrace: TributaryWeatherProfile | null;
    Smithers: TributaryWeatherProfile | null;
  }>({
    Terrace: null,
    Smithers: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // River keys mapped to regional hubs
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

  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      setLoading(true);
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
        console.error('Failed to load regional weather:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeProfile = weatherData[selectedZone];
  const zoneMeta = zoneMapping[selectedZone];

  const getWeatherIcon = (iconType?: DailyWeatherOutlook['iconType']) => {
    switch (iconType) {
      case 'sunny':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'rain':
      case 'heavy_rain':
        return <CloudRain className="w-4 h-4 text-sky-500" />;
      case 'storm':
        return <CloudLightning className="w-4 h-4 text-purple-500" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-slate-400" />;
      case 'partly_cloudy':
      default:
        return <CloudSun className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-xs overflow-hidden text-[var(--text-main)] transition-all">
      {/* Top Bar: Location Switcher & Current Conditions Summary (Non-Sticky, Clean Flow) */}
      <div className="p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--bg-surface)]/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Location Toggle Pill */}
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)]">
            <button
              onClick={() => setSelectedZone('Terrace')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition flex items-center gap-1.5 ${
                selectedZone === 'Terrace'
                  ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Terrace (Lower)</span>
            </button>
            <button
              onClick={() => setSelectedZone('Smithers')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition flex items-center gap-1.5 ${
                selectedZone === 'Smithers'
                  ? 'bg-[var(--accent-teal)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Smithers (Bulkley)</span>
            </button>
          </div>

          <span className="text-[11px] text-[var(--text-muted)] font-mono hidden md:inline-block">
            {zoneMeta.subtitle}
          </span>
        </div>

        {/* Current Weather Snapshot Pill */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing weather...</span>
            </div>
          ) : activeProfile ? (
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                {getWeatherIcon(activeProfile.daily[0]?.iconType)}
                <span className="font-extrabold text-[var(--text-main)]">
                  {Math.round(activeProfile.current.tempC)}°C
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  ({Math.round(activeProfile.current.tempF)}°F)
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[var(--accent-teal)]" />
                  {Math.round(activeProfile.current.windSpeedKmh)} km/h
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-sky-500" />
                  {Math.round(activeProfile.current.pressureHpa)} hPa
                </span>
              </div>

              {/* 5-Day Toggle Accordion */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--accent-amber)] hover:underline ml-1"
                aria-label="Toggle 5-day forecast"
              >
                <span>5-Day Outlook</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <span className="text-xs text-[var(--text-muted)] font-mono">Weather offline</span>
          )}
        </div>
      </div>

      {/* Expandable 5-Day Daily Weather Forecast Outlook (Non-intrusive) */}
      {isExpanded && activeProfile && (
        <div className="p-3 sm:p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)]/40 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              5-Day Meteorological Outlook &bull; {selectedZone} Basin
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              {zoneMeta.stationNote}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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

                <div className="my-1.5 flex items-center justify-center p-1.5 rounded-full bg-[var(--bg-surface)]">
                  {getWeatherIcon(day.iconType)}
                </div>

                <div className="space-y-0.5 w-full">
                  <div className="text-xs font-mono font-extrabold text-[var(--text-main)]">
                    {Math.round(day.tempMaxC)}° / <span className="text-[var(--text-muted)] font-normal">{Math.round(day.tempMinC)}°C</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-sans truncate" title={day.conditionLabel}>
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
        </div>
      )}
    </div>
  );
};
