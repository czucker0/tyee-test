import React, { useState } from 'react';
import { TributaryEscapement } from '../types/steelhead';
import { useAuth } from '../context/AuthContext';
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
  EyeOff,
  Info,
  Lock,
  Unlock,
  Thermometer,
  Trees,
  Activity,
  Binary,
  Microscope,
} from 'lucide-react';

interface TributaryForecastCardProps {
  tributaries: TributaryEscapement[];
  selectedMonthDay: string;
}

// Signature color coding for rivers
const RIVER_COLORS: { [key: string]: { border: string; bg: string; dot: string; text: string } } = {
  'Bulkley / Morice River System': {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
    text: 'text-amber-500',
  },
  'Babine River': {
    border: 'border-teal-500/40',
    bg: 'bg-teal-500/10',
    dot: 'bg-teal-500',
    text: 'text-teal-500',
  },
  'Kispiox River': {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    dot: 'bg-rose-500',
    text: 'text-rose-500',
  },
  'Zymoetz (Copper) River': {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    dot: 'bg-sky-500',
    text: 'text-sky-500',
  },
  'Sustut River': {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    dot: 'bg-purple-500',
    text: 'text-purple-500',
  },
  'Kalum (Kitsumkalum) River': {
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
  },
  'Upper Skeena & Other Tributaries': {
    border: 'border-yellow-600/40',
    bg: 'bg-yellow-600/10',
    dot: 'bg-yellow-600',
    text: 'text-yellow-600',
  },
};

export const TributaryForecastCard: React.FC<TributaryForecastCardProps> = ({
  tributaries,
  selectedMonthDay,
}) => {
  const { isAdmin } = useAuth();

  // Store expanded card IDs (defaults to expanding the #1 Bulkley / Morice on load)
  const [expandedTribs, setExpandedTribs] = useState<{ [key: string]: boolean }>({
    'Bulkley / Morice River System': true,
  });

  // Admin tactical mode toggle (only togglable if user is admin)
  const [showAdminTacticalIntel, setShowAdminTacticalIntel] = useState<boolean>(true);

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
      {/* 1. Header & Scientific Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 text-[var(--accent-teal)]">
              <Microscope className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              Skeena Sub-Basin Escapement &amp; Conservation Telemetry
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Genetic Stock Identification (GSI) multi-decade stock composition baselines, watershed hydrology, &amp; provincial escapement status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Admin Tactical Toggle (Visible only to authorized Admins) */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminTacticalIntel(!showAdminTacticalIntel)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                showAdminTacticalIntel
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-muted)]'
              }`}
              title="Admin-only: toggle tactical reach intel and fishing guides"
            >
              {showAdminTacticalIntel ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Beat Intel: ON</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Admin Beat Intel: OFF</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={allExpandedState ? collapseAll : expandAll}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-xs font-mono text-[var(--text-main)] font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            {allExpandedState ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
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
            <Waves className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
            <span>Genetic Stock Identification (GSI) Escapement Shares:</span>
          </span>
          <span className="text-[var(--accent-teal)] font-bold">100% Watershed Run</span>
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
                title={`${t.name}: ${t.sharePct}% (~${t.projectedAdults.toLocaleString()} fish) - Click to inspect scientific dossier`}
                onClick={() => toggleTrib(t.name)}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[10px] text-[var(--text-muted)] pt-0.5 gap-2">
          <span>Click any sub-basin bar or card to inspect complete hydrological &amp; ecological telemetry.</span>
          <span className="text-[var(--text-secondary)] font-bold">Estimated as of {selectedMonthDay}</span>
        </div>
      </div>

      {/* 4. List of Interactive Expandable River Cards */}
      <div className="space-y-3 pt-1">
        {tributaries.map((t) => {
          const isExpanded = !!expandedTribs[t.name];
          const colorMeta = RIVER_COLORS[t.name] || {
            border: 'border-[var(--border-main)]',
            bg: 'bg-[var(--bg-card)]',
            dot: 'bg-[var(--accent-teal)]',
            text: 'text-[var(--accent-teal)]',
          };
          const sci = t.scientificProfile;
          const adminIntel = t.adminTacticalIntel;

          return (
            <div
              key={t.name}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-[var(--bg-card)] border-[var(--border-highlight)] shadow-md'
                  : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)] shadow-sm'
              }`}
            >
              {/* Clickable Card Header */}
              <button
                onClick={() => toggleTrib(t.name)}
                className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition hover:bg-[var(--border-light)]/30"
              >
                {/* Left: River Name, Region, Status Badge */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center justify-center">
                    <span className={`w-3.5 h-3.5 rounded-full ${colorMeta.dot} shrink-0 shadow-sm`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)]">
                        {t.name}
                      </h4>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono font-medium block mt-0.5">
                      {t.region}
                    </span>
                  </div>
                </div>

                {/* Right: Key Metrics & Expand Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-t-0 border-[var(--border-main)] pt-2.5 sm:pt-0 font-mono">
                  {/* Stock Share % */}
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[var(--text-secondary)] font-medium block uppercase tracking-wider">Share</span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--accent-teal)]">
                      {t.sharePct}%
                    </span>
                  </div>

                  {/* Est Passed to Date */}
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[var(--text-secondary)] font-medium block uppercase tracking-wider">To Date</span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">
                      {t.estimatedAdults.toLocaleString()} <span className="text-xs text-[var(--text-secondary)] font-normal">fish</span>
                    </span>
                  </div>

                  {/* Projected Total Season */}
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[var(--text-secondary)] font-medium block uppercase tracking-wider">Projected</span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--accent-amber)]">
                      ~{t.projectedAdults.toLocaleString()}
                    </span>
                  </div>

                  {/* Expand Chevron Icon */}
                  <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)]">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--accent-teal)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable Deep-Dive Scientific Dossier */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-[var(--border-main)] bg-[var(--bg-surface)] space-y-4 animate-in fade-in duration-200">
                  {/* Sub-Basin Overview */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-teal)] uppercase tracking-wider font-mono">
                      <Binary className="w-4 h-4" />
                      <span>Ecological &amp; Sub-Basin Overview</span>
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Grid of Scientific & Conservation Telemetry */}
                  {sci && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                      {/* 1. Migration Velocity & Distances */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold text-xs uppercase tracking-wider">
                          <Compass className="w-4 h-4" />
                          <span>Migration Telemetry &amp; Distance</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[var(--text-secondary)] font-medium block">Estuary to Basin Distance:</span>
                            <span className="text-[var(--text-main)] font-bold">{sci.migrationDistanceKm}</span>
                          </div>
                          <div className="pt-1.5 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-secondary)] font-medium block">Mean In-River Velocity:</span>
                            <span className="text-[var(--text-main)] font-semibold">{sci.meanTravelVelocity}</span>
                          </div>
                          <div className="pt-1.5 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-secondary)] font-medium block">Sub-Basin Drainage Area:</span>
                            <span className="text-[var(--text-main)] font-bold">{sci.basinAreaKm2}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Hydrology & Lake Buffering */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold text-xs uppercase tracking-wider">
                          <Waves className="w-4 h-4" />
                          <span>Hydrology &amp; Lacustrine Buffering</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[var(--text-secondary)] font-medium block">Discharge &amp; Sediment Dynamic:</span>
                            <span className="text-[var(--text-secondary)] font-medium leading-relaxed">{sci.lakeBuffering}</span>
                          </div>
                          <div className="pt-1.5 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-secondary)] font-medium block">Thermal Regime:</span>
                            <span className="text-[var(--text-main)] font-bold">{sci.thermalRegime}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Conservation Priority & Spawning Habitat */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-1.5 text-[var(--accent-amber)] font-bold text-xs uppercase tracking-wider">
                          <Trees className="w-4 h-4" />
                          <span>Conservation Status &amp; Spawning</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[var(--text-secondary)] font-medium block">Conservation Priority:</span>
                            <span className="text-[var(--text-main)] font-bold">{sci.conservationPriority}</span>
                          </div>
                          <div className="pt-1.5 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-secondary)] font-medium block">Spawning &amp; Rearing Habitat:</span>
                            <span className="text-[var(--text-secondary)] font-medium leading-relaxed">{sci.habitatEcology}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Stock Monitoring & Enumeration Methodology */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2 md:col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold text-xs uppercase tracking-wider">
                          <Activity className="w-4 h-4 text-[var(--accent-teal)]" />
                          <span>Escapement Enumeration &amp; Monitoring Framework</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                          {sci.monitoringMethodology}
                        </p>
                      </div>

                      {/* 5. Provincial Management Classification */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2 md:col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold text-xs uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Provincial Regulatory Framework</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                          {sci.provincialRegulations}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 6. ADMIN CONFIDENTIAL SECTION (Only accessible to authenticated admins) */}
                  {isAdmin && showAdminTacticalIntel && adminIntel && (
                    <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                          <Lock className="w-4 h-4" />
                          <span>Admin Confidential &bull; Beat Intel &amp; Tactical Dossier</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                          INTERNAL ONLY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="space-y-1">
                          <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                            Sensitive Holding Reaches &amp; Pools:
                          </span>
                          <span className="text-[var(--text-main)] leading-relaxed block font-sans text-xs">
                            {adminIntel.keyReaches}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                            Tactical Swing &amp; Bite Triggers:
                          </span>
                          <span className="text-[var(--text-secondary)] leading-relaxed block">
                            {adminIntel.tacticalBiteTriggers}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                            Water Clarity &amp; Drop Dynamic:
                          </span>
                          <span className="text-[var(--text-secondary)] leading-relaxed block">
                            {adminIntel.waterClarityDynamics}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                            Historical Guide &amp; Season Notes:
                          </span>
                          <span className="text-[var(--text-secondary)] leading-relaxed block">
                            {adminIntel.historicalGuideNotes || adminIntel.estuaryPassageNotes}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Footer Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-main)] text-[10px] font-mono text-[var(--text-muted)]">
                    <span>
                      GSI Contribution Baseline: <strong>{t.sharePct}% of Skeena Run</strong> &bull; Migration Window:{' '}
                      <strong>{t.peakWindow}</strong>
                    </span>
                    <span className="text-[var(--accent-teal)] font-bold">
                      Projected Sub-Basin Escapement: ~{t.projectedAdults.toLocaleString()} Wild Adults
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
