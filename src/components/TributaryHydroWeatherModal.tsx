import React from 'react';
import {
  X,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Activity,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import { TributaryWeatherProfile, DailyWeatherOutlook } from '../services/hydroWeatherService';

interface TributaryHydroWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TributaryWeatherProfile | null;
}

export const TributaryHydroWeatherModal: React.FC<TributaryHydroWeatherModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen || !profile) return null;

  const getWeatherIcon = (type: DailyWeatherOutlook['iconType']) => {
    switch (type) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'partly_cloudy':
        return <Cloud className="w-5 h-5 text-sky-400" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-teal-400" />;
      case 'heavy_rain':
      case 'storm':
        return <CloudRain className="w-5 h-5 text-indigo-400" />;
      case 'cloudy':
      default:
        return <Cloud className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSafetyBadgeStyle = (status: string) => {
    switch (status) {
      case 'Prime Swung Fly':
      case 'Optimal Grab':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300';
      case 'Warm Alert (>18°C)':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400';
      default:
        return 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-teal)]/15 border border-[var(--accent-teal)]/30 text-[var(--accent-teal)]">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)]">
                  {profile.riverDisplayName}
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getSafetyBadgeStyle(
                    profile.hydro.tempSafetyStatus
                  )}`}
                >
                  {profile.hydro.tempSafetyStatus}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Real-Time Hydrometric Flow, Water Temperature &amp; 5-Day Meteorological Outlook
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-main)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Bar: Current Hydro & Atmosphere Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            {/* Water Temp */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                Water Temp
              </span>
              <div className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {profile.hydro.waterTempC}&deg;C{' '}
                <span className="text-xs text-[var(--text-muted)] font-normal">({profile.hydro.waterTempF}&deg;F)</span>
              </div>
              <span className="text-[10px] text-[var(--accent-teal)] block font-semibold">
                {profile.hydro.tempSafetyStatus}
              </span>
            </div>

            {/* Discharge & Flow */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-teal-500" />
                Flow / Discharge
              </span>
              <div className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {profile.hydro.dischargeM3s}{' '}
                <span className="text-xs text-[var(--text-muted)] font-normal">m&sup3;/s</span>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] block font-semibold">
                {profile.hydro.flowTrend}
              </span>
            </div>

            {/* Water Clarity */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                Water Clarity
              </span>
              <div className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate mt-1">
                {profile.hydro.waterClarityEstimate}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] block">Secchi Estimate</span>
            </div>

            {/* Ambient Weather */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Ambient Temp
              </span>
              <div className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {profile.current.tempC}&deg;C{' '}
                <span className="text-xs text-[var(--text-muted)] font-normal">({profile.current.tempF}&deg;F)</span>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] block truncate">
                {profile.current.conditionText}
              </span>
            </div>
          </div>

          {/* Angling & Migration Conditions Verdict */}
          <div className="p-4 rounded-xl bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent-teal)] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Watershed Migration &amp; Angling Verdict</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
              {profile.hydro.anglingVerdict}
            </p>
          </div>

          {/* 5-Day Weather Outlook Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--accent-teal)]" />
                <span>5-Day Meteorological Forecast</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Open-Meteo High-Resolution Model
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
              {profile.daily.map((d, i) => (
                <div
                  key={d.date}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center gap-2 ${
                    i === 0
                      ? 'bg-[var(--bg-card)] border-[var(--accent-teal)]/50 ring-1 ring-[var(--accent-teal)]/30'
                      : 'bg-[var(--bg-card)] border-[var(--border-main)]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-[var(--text-main)] block">
                      {d.dayName}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block">{d.date.slice(5)}</span>
                  </div>

                  <div className="my-1">{getWeatherIcon(d.iconType)}</div>

                  <div className="space-y-0.5 w-full border-t border-[var(--border-main)] pt-1.5">
                    <div className="text-xs font-extrabold text-[var(--text-main)]">
                      {d.tempMaxC}&deg; <span className="text-[10px] text-[var(--text-muted)] font-normal">/ {d.tempMinC}&deg;C</span>
                    </div>
                    <div className="text-[10px] text-sky-500 font-semibold flex items-center justify-center gap-0.5">
                      <Droplets className="w-2.5 h-2.5" />
                      <span>{d.precipitationMm} mm</span>
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate max-w-full">
                      {d.conditionLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hydrometric Monitoring Benchmark Specs */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[var(--text-main)] font-bold uppercase tracking-wider">
                <Gauge className="w-4 h-4 text-[var(--accent-teal)]" />
                <span>Station Telemetry &amp; WSC Benchmark</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                Station ID: {profile.hydro.stationId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Station Name:</span>
                <span className="text-[var(--text-main)] font-semibold">{profile.hydro.stationName}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Elevation &amp; Coordinates:</span>
                <span className="text-[var(--text-main)]">
                  {profile.elevationM}m &bull; {profile.lat.toFixed(4)}&deg;N, {Math.abs(profile.lng).toFixed(4)}&deg;W
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Atmospheric Pressure &amp; Wind:</span>
                <span className="text-[var(--text-main)]">
                  {profile.current.pressureHpa} hPa &bull; {profile.current.windSpeedKmh} km/h wind
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Telemetry Provider:</span>
                <span className="text-[var(--accent-teal)] font-medium">Water Survey of Canada (WSC) / ECCC</span>
              </div>
            </div>

            {/* Thermal Ethics Note */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-sans space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold uppercase font-mono text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Angler Conservation Note: Thermal Handling Thresholds</span>
              </div>
              <p className="text-[var(--text-secondary)]">
                Wild summer steelhead experience acute metabolic stress at water temperatures above <strong>18&deg;C (64.4&deg;F)</strong>. If temperatures reach this threshold, prioritize fishing in early mornings or give fish a rest in deep oxygenated reaches.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:block">
            Updated: {profile.hydro.lastUpdated}
          </div>
          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-[var(--accent-teal)] hover:opacity-90 text-white font-mono font-bold text-xs transition shadow-sm"
          >
            Close Hydro Outlook
          </button>
        </div>
      </div>
    </div>
  );
};
