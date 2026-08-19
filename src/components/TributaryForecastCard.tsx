import React, { useState } from 'react';
import { TributaryEscapement } from '../types/steelhead';
import {
  MapPin,
  Clock,
  Waves,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Compass,
  AlertCircle,
  Eye,
  Info,
} from 'lucide-react';

interface TributaryForecastCardProps {
  tributaries: TributaryEscapement[];
  selectedMonthDay: string;
}

// Signature color coding for rivers
const RIVER_COLORS: { [key: string]: { border: string; bg: string; dot: string } } = {
  'Bulkley / Morice River System': {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
  },
  'Babine River': {
    border: 'border-teal-500/40',
    bg: 'bg-teal-500/10',
    dot: 'bg-teal-500',
  },
  'Kispiox River': {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    dot: 'bg-rose-500',
  },
  'Zymoetz (Copper) River': {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    dot: 'bg-sky-500',
  },
  'Sustut River': {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    dot: 'bg-purple-500',
  },
  'Kalum (Kitsumkalum) River': {
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-500',
  },
  'Upper Skeena & Other Tributaries': {
    border: 'border-yellow-600/40',
    bg: 'bg-yellow-600/10',
    dot: 'bg-yellow-600',
  },
};

export const TributaryForecastCard: React.FC<TributaryForecastCardProps> = ({
  tributaries,
  selectedMonthDay,
}) => {
  // Store expanded card IDs (defaults to expanding the #1 Bulkley / Morice on load)
  const [expandedTribs, setExpandedTribs] = useState<{ [key: string]: boolean }>({
    'Bulkley / Morice River System': true,
  });

  const toggleTrib = (name: string) => {
    setExpandedTribs((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const expandAll = () => {
    const allExpanded: { [key: string]: boolean } = {};
    tributaries.forEach((t) => {
      allExpanded[t.name] = true;
    });
    setExpandedTribs(allExpanded);
  };

  const collapseAll = () => {
    setExpandedTribs({});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Strong':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700';
      case 'Fair':
        return 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700';
      case 'Concern':
        return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700';
      default:
        return 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700';
    }
  };

  const allExpandedState = tributaries.every((t) => expandedTribs[t.name]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)]">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              Skeena Watershed Tributary Escapement Distribution
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Genetic Stock Identification (GSI) escapement modeling, in-river travel times, &amp; seasonal timing tips.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={allExpandedState ? collapseAll : expandAll}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-xs font-mono text-[var(--text-main)] font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            {allExpandedState ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>Expand All River Profiles</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Watershed Proportion Visualizer Bar */}
      <div className="space-y-2 font-mono">
        <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span>Sub-Basin Escapement Proportions:</span>
          </span>
          <span className="text-[var(--accent-amber)] font-bold">100% Watershed Run</span>
        </div>

        <div className="w-full bg-[var(--bg-subtle)] h-4 rounded-xl overflow-hidden flex shadow-inner border border-[var(--border-main)] p-0.5">
          {tributaries.map((t) => {
            const riverStyle = RIVER_COLORS[t.name] || { dot: 'bg-stone-500' };
            const isExpanded = !!expandedTribs[t.name];

            return (
              <div
                key={`bar-${t.name}`}
                className={`${riverStyle.dot} h-full transition-all hover:opacity-100 cursor-pointer first:rounded-l-lg last:rounded-r-lg ${
                  isExpanded ? 'opacity-100 ring-2 ring-white/50' : 'opacity-80'
                }`}
                style={{ width: `${t.sharePct}%` }}
                title={`${t.name}: ${t.sharePct}% (~${t.projectedAdults.toLocaleString()} fish) - Click to inspect`}
                onClick={() => toggleTrib(t.name)}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[10px] text-[var(--text-muted)] pt-0.5 gap-2">
          <span>Click any river segment or card to expand comprehensive telemetry &amp; timing tips.</span>
          <span className="text-[var(--text-secondary)] font-bold">As of {selectedMonthDay}</span>
        </div>
      </div>

      {/* 3. List of Interactive Expandable River Cards */}
      <div className="space-y-3 pt-1">
        {tributaries.map((t, idx) => {
          const isExpanded = !!expandedTribs[t.name];
          const colorMeta = RIVER_COLORS[t.name] || {
            border: 'border-[var(--border-main)]',
            bg: 'bg-[var(--bg-card)]',
            dot: 'bg-[var(--accent-amber)]',
          };
          const tips = t.timingTips;

          return (
            <div
              key={t.name}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-[var(--bg-card)] border-[var(--accent-amber-border)] shadow-md'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)] shadow-sm'
              }`}
            >
              {/* Clickable Card Header */}
              <button
                onClick={() => toggleTrib(t.name)}
                className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition hover:bg-[var(--border-light)]/30"
              >
                {/* Left: River Name, Region, Rank Badge */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center justify-center">
                    <span className={`w-3.5 h-3.5 rounded-full ${colorMeta.dot} shrink-0 shadow-sm`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-heading font-extrabold text-[var(--text-main)]">
                        {t.name}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--accent-amber)] font-mono block mt-0.5">
                      {t.region}
                    </span>
                  </div>
                </div>

                {/* Right: Key Metrics & Expand Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 border-[var(--border-main)] pt-2 sm:pt-0 font-mono">
                  {/* Share % */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Stock Share</span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--accent-amber)]">
                      {t.sharePct}%
                    </span>
                  </div>

                  {/* Est Fish Passed */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Passed to Date</span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      {t.estimatedAdults.toLocaleString()} <span className="text-[10px] text-[var(--text-muted)]">fish</span>
                    </span>
                  </div>

                  {/* Projected Season Return */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Projected Total</span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--accent-amber)]">
                      {t.projectedAdults.toLocaleString()} <span className="text-[10px] text-[var(--text-muted)]">adults</span>
                    </span>
                  </div>

                  {/* Expand Chevron Icon */}
                  <div className="p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--accent-amber)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable Deep-Dive Dossier */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-[var(--border-main)] bg-[var(--bg-surface)] space-y-4 animate-in fade-in duration-200">
                  {/* Bio & System Overview */}
                  <div className="space-y-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <p className="font-sans text-xs sm:text-sm text-[var(--text-main)]">
                      {t.description}
                    </p>
                  </div>

                  {/* Grid of Timing Tips & Hydrology Telemetry */}
                  {tips && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                      {/* 1. Estuary & River Travel Times */}
                      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[var(--accent-amber)] font-bold text-[11px] uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Run Timing &amp; Travel Speed</span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-[var(--text-muted)] block">Estuary Passage (Tyee):</span>
                            <span className="text-[var(--text-main)] font-semibold">{tips.estuaryPassage}</span>
                          </div>
                          <div className="pt-1 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-muted)] block">Travel Time from River Mouth:</span>
                            <span className="text-[var(--text-secondary)]">{tips.travelTimeFromTyee}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Prime Holding Window & Daily Triggers */}
                      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold text-[11px] uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Prime Holding Window &amp; Bite Triggers</span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-[var(--text-muted)] block">Prime Valley / Holding Window:</span>
                            <span className="text-[var(--text-main)] font-semibold">{tips.primeHoldingWindow}</span>
                          </div>
                          <div className="pt-1 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-muted)] block">Weather &amp; Thermal Trigger:</span>
                            <span className="text-[var(--text-secondary)]">{tips.weatherTrigger}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Hydrology, Water Clarity & Recovery */}
                      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-1.5 text-[var(--accent-amber)] font-bold text-[11px] uppercase tracking-wider">
                          <Waves className="w-3.5 h-3.5" />
                          <span>Water Clarity &amp; Freshet Dynamics</span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <span className="text-[var(--text-muted)] block">Clarity &amp; Turbidity Notes:</span>
                          <span className="text-[var(--text-secondary)] leading-relaxed block">
                            {tips.waterClarityNotes}
                          </span>
                        </div>
                      </div>

                      {/* 4. Key Reaches & Headwater Pools */}
                      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5 md:col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold text-[11px] uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                          <span>Key River Reaches &amp; Holding Canyons</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {tips.keyReaches}
                        </p>
                      </div>

                      {/* 5. Classification & Regulations */}
                      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-1.5 text-[var(--accent-amber)] font-bold text-[11px] uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Classified Waters &amp; Regulations</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {tips.regulations}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quick Summary Pill Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-main)] text-[10px] font-mono text-[var(--text-muted)]">
                    <span>
                      Escapement Contribution: <strong>{t.sharePct}% of Skeena Run</strong> &bull; Sub-basin Peak:{' '}
                      <strong>{t.peakWindow}</strong>
                    </span>
                    <span className="text-[var(--accent-amber)] font-bold">
                      Est. Total: ~{t.projectedAdults.toLocaleString()} Adults
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
