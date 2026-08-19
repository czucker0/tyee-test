import React, { useState, useEffect } from 'react';
import { TributaryEscapement, RiverAccessPoint, FloatSafetyProfile, WadeSafetyProfile } from '../types/steelhead';
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
  LifeBuoy,
  Footprints,
  Anchor,
  Navigation,
  AlertTriangle,
  ExternalLink,
  Map,
  CloudRain,
  Sun,
  Droplets,
  Gauge,
} from 'lucide-react';
import { RiverAccessMapModal } from './RiverAccessMapModal';
import { TributaryHydroWeatherModal } from './TributaryHydroWeatherModal';
import {
  fetchTributaryWeatherAndHydro,
  TributaryWeatherProfile,
  SKEENA_HYDRO_STATIONS,
} from '../services/hydroWeatherService';

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

  // Store expanded card IDs (all collapsed by default)
  const [expandedTribs, setExpandedTribs] = useState<{ [key: string]: boolean }>({});

  // Admin tactical mode toggle (only togglable if user is admin)
  const [showAdminTacticalIntel, setShowAdminTacticalIntel] = useState<boolean>(true);

  // River Access & Map Modal State
  const [mapModalData, setMapModalData] = useState<{
    riverName: string;
    accessPoints: RiverAccessPoint[];
    floatSafety?: FloatSafetyProfile;
    wadeSafety?: WadeSafetyProfile;
    tribalProtocols?: any;
    initialPointId?: string;
  } | null>(null);

  // Weather & Hydro Profiles Cache & Modal State
  const [weatherProfiles, setWeatherProfiles] = useState<{ [riverName: string]: TributaryWeatherProfile }>({});
  const [selectedHydroModalProfile, setSelectedHydroModalProfile] = useState<TributaryWeatherProfile | null>(null);

  // Load weather and hydro telemetry on mount
  useEffect(() => {
    let isMounted = true;
    const loadAllWeather = async () => {
      const keys = Object.keys(SKEENA_HYDRO_STATIONS);
      for (const k of keys) {
        try {
          const prof = await fetchTributaryWeatherAndHydro(k);
          if (isMounted) {
            setWeatherProfiles((prev) => ({ ...prev, [k]: prof }));
          }
        } catch (e) {
          // ignore
        }
      }
    };
    loadAllWeather();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const getWaypointIcon = (type: string) => {
    switch (type) {
      case 'put-in':
        return <Anchor className="w-3.5 h-3.5 text-emerald-400" />;
      case 'take-out':
        return <Navigation className="w-3.5 h-3.5 text-cyan-400" />;
      case 'hazard-canyon':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'bushwhack':
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case 'crown-land':
        return <Trees className="w-3.5 h-3.5 text-emerald-400" />;
      case 'railway-easement':
        return <Activity className="w-3.5 h-3.5 text-indigo-400" />;
      case 'tribal-access':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'bridge-access':
        return <Waves className="w-3.5 h-3.5 text-sky-400" />;
      case 'walk-in':
      default:
        return <Footprints className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getWaypointBadgeClass = (type: string) => {
    switch (type) {
      case 'put-in':
        return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      case 'take-out':
        return 'border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300';
      case 'hazard-canyon':
        return 'border-rose-500/50 bg-rose-500/20 text-rose-700 dark:text-rose-300';
      case 'bushwhack':
        return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
      case 'crown-land':
        return 'border-emerald-600/40 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300';
      case 'railway-easement':
        return 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300';
      case 'tribal-access':
        return 'border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300';
      case 'bridge-access':
        return 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300';
      case 'walk-in':
      default:
        return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
    }
  };

  const allExpandedState = tributaries.length > 0 && tributaries.every((t) => expandedTribs[t.name]);

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

      {/* Mainstem Quick Telemetry Banner: Lower Skeena & Middle Skeena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
        {/* Lower Skeena (Tidewater to Terrace) */}
        {weatherProfiles['Lower Skeena'] && (
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500 shrink-0">
                <Waves className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-main)] text-xs">
                  Lower Skeena (Tidewater to Terrace)
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Estuary Corridor &bull; Transit: 2–6 Days &bull; ~1,450 m³/s
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedHydroModalProfile(weatherProfiles['Lower Skeena'])}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border border-[var(--border-main)] font-bold transition flex items-center gap-1 shrink-0 text-[11px]"
              title="Open Lower Skeena 5-day weather and hydro outlook"
            >
              <Thermometer className="w-3 h-3 text-amber-500" />
              <span>{weatherProfiles['Lower Skeena'].hydro.waterTempC}°C</span>
              <span className="text-[10px] text-[var(--text-muted)]">({weatherProfiles['Lower Skeena'].current.tempC}°C Air)</span>
            </button>
          </div>
        )}

        {/* Middle Skeena (Terrace to Hazelton / Usk) */}
        {weatherProfiles['Middle Skeena'] && (
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-500 shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-main)] text-xs">
                  Middle Skeena (Terrace to Hazelton / Usk)
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Station 08EF001 &bull; Transit: 7–16 Days &bull; ~1,120 m³/s
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedHydroModalProfile(weatherProfiles['Middle Skeena'])}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border border-[var(--border-main)] font-bold transition flex items-center gap-1 shrink-0 text-[11px]"
              title="Open Middle Skeena / Usk 5-day weather and hydro outlook"
            >
              <Thermometer className="w-3 h-3 text-amber-500" />
              <span>{weatherProfiles['Middle Skeena'].hydro.waterTempC}°C</span>
              <span className="text-[10px] text-[var(--text-muted)]">({weatherProfiles['Middle Skeena'].current.tempC}°C Air)</span>
            </button>
          </div>
        )}
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

      {/* 3. List of Interactive Expandable River Cards */}
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
          const hydroProfile = weatherProfiles[t.name];

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
              <div className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition hover:bg-[var(--border-light)]/30">
                {/* Left: River Name, Region, Status Badge */}
                <div
                  className="flex items-start gap-3 cursor-pointer flex-1"
                  onClick={() => toggleTrib(t.name)}
                >
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

                {/* Right: Hydro Pill, Key Metrics & Expand Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 border-t sm:border-t-0 border-[var(--border-main)] pt-2.5 sm:pt-0 font-mono flex-wrap sm:flex-nowrap">
                  {/* Real-Time Hydro & Weather Badge */}
                  {hydroProfile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHydroModalProfile(hydroProfile);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--accent-teal)]/10 text-[var(--text-main)] hover:text-[var(--accent-teal)] border border-[var(--border-main)] transition shadow-xs flex items-center gap-1.5 text-[11px]"
                      title="Click to open 5-day weather forecast & real-time hydrograph"
                    >
                      <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-bold">{hydroProfile.hydro.waterTempC}°C</span>
                      <span className="text-[10px] text-[var(--text-muted)] hidden md:inline">
                        • {hydroProfile.hydro.dischargeM3s} m³/s
                      </span>
                      <Sun className="w-3 h-3 text-amber-500 ml-0.5" />
                    </button>
                  )}

                  {/* Stock Share % */}
                  <div className="text-left sm:text-right" onClick={() => toggleTrib(t.name)}>
                    <span className="text-xs text-[var(--text-secondary)] font-medium block uppercase tracking-wider">Share</span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--accent-teal)]">
                      {t.sharePct}%
                    </span>
                  </div>

                  {/* Est Passed to Date */}
                  <div className="text-left sm:text-right" onClick={() => toggleTrib(t.name)}>
                    <span className="text-xs text-[var(--text-secondary)] font-medium block uppercase tracking-wider">To Date</span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">
                      {t.estimatedAdults.toLocaleString()} <span className="text-xs text-[var(--text-secondary)] font-normal">fish</span>
                    </span>
                  </div>

                  {/* Projected Total Season */}
                  <div className="text-left sm:text-right" onClick={() => toggleTrib(t.name)}>
                    <span className="text-xs text-[var(--text-secondary)] font-medium block uppercase tracking-wider">Projected</span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--accent-amber)]">
                      ~{t.projectedAdults.toLocaleString()}
                    </span>
                  </div>

                  {/* Expand Chevron Icon */}
                  <button
                    onClick={() => toggleTrib(t.name)}
                    className="p-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)]"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--accent-teal)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Deep-Dive Scientific Dossier */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-[var(--border-main)] bg-[var(--bg-surface)] space-y-4 animate-in fade-in duration-200">
                  {/* Sub-Basin Overview & Live Weather Quick Bar */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-teal)] uppercase tracking-wider font-mono">
                        <Binary className="w-4 h-4" />
                        <span>Ecological &amp; Sub-Basin Overview</span>
                      </div>
                      {hydroProfile && (
                        <button
                          onClick={() => setSelectedHydroModalProfile(hydroProfile)}
                          className="text-[11px] font-mono text-[var(--accent-teal)] hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>5-Day Weather &amp; Discharge &rarr;</span>
                        </button>
                      )}
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

                  {/* 6. ADMIN CONFIDENTIAL SECTION (Restricted to authenticated admins) */}
                  {isAdmin ? (
                    showAdminTacticalIntel && (
                      <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-red-500 dark:border-white bg-[var(--bg-card)] space-y-4 font-mono text-xs shadow-sm">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--border-main)] pb-3">
                          <div className="flex items-center gap-2 text-[var(--text-main)] font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                            <Lock className="w-4 h-4 shrink-0 text-[var(--accent-teal)]" />
                            <span>Admin Confidential Dossier</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)] whitespace-nowrap">
                              Admin Intel
                            </span>
                            {t.accessPoints && t.accessPoints.length > 0 && (
                              <button
                                onClick={() =>
                                  setMapModalData({
                                    riverName: t.name,
                                    accessPoints: t.accessPoints || [],
                                    floatSafety: t.floatSafety,
                                    wadeSafety: t.wadeSafety,
                                    tribalProtocols: t.tribalProtocols,
                                  })
                                }
                                className="px-3 py-1 rounded-lg bg-[var(--accent-teal)] hover:opacity-90 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 text-xs whitespace-nowrap"
                              >
                                <Map className="w-3.5 h-3.5" />
                                <span>River Map ({t.accessPoints.length})</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* First Nations Tribal Protocols & Access Permitting */}
                        {t.tribalProtocols && (
                          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2.5 text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[var(--accent-teal)]" />
                                <span className="font-heading font-bold text-xs sm:text-sm text-[var(--text-main)]">
                                  First Nations Territory: {t.tribalProtocols.nation}
                                </span>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border whitespace-nowrap ${
                                  t.tribalProtocols.permitRequired
                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                                    : 'bg-teal-500/15 border-teal-500/40 text-[var(--accent-teal)]'
                                }`}
                              >
                                {t.tribalProtocols.permitRequired ? 'Permit Required' : 'Standard Crown Access'}
                              </span>
                            </div>

                            <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                              {t.tribalProtocols.permitDetails}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border-main)] text-[11px] font-mono">
                              <div>
                                <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">Permit Office:</span>
                                <span className="text-[var(--text-main)] font-medium">{t.tribalProtocols.officeLocation}</span>
                              </div>
                              {t.tribalProtocols.costInfo && (
                                <div>
                                  <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">Access / Stewardship Fee:</span>
                                  <span className="text-[var(--text-main)] font-semibold">{t.tribalProtocols.costInfo}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[var(--border-main)] text-[11px] font-sans">
                              <span className="font-mono font-bold text-[var(--text-muted)] uppercase text-[10px] block mb-0.5">Etiquette &amp; River Guidelines:</span>
                              <p className="italic text-[var(--text-secondary)]">{t.tribalProtocols.etiquette}</p>
                            </div>
                          </div>
                        )}

                        {/* Tactical Reach Intel Grid */}
                        {adminIntel && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                              <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                                Sensitive Holding Reaches &amp; Pools:
                              </span>
                              <span className="text-[var(--text-main)] leading-relaxed block font-sans text-xs font-semibold">
                                {adminIntel.keyReaches}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                              <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                                Tactical Swing &amp; Bite Triggers:
                              </span>
                              <span className="text-[var(--text-secondary)] leading-relaxed block font-sans text-xs">
                                {adminIntel.tacticalBiteTriggers}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                              <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                                Water Clarity &amp; Drop Dynamic:
                              </span>
                              <span className="text-[var(--text-secondary)] leading-relaxed block font-sans text-xs">
                                {adminIntel.waterClarityDynamics}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                              <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                                Historical Guide &amp; Season Timing:
                              </span>
                              <span className="text-[var(--text-secondary)] leading-relaxed block font-sans text-xs">
                                {adminIntel.historicalGuideNotes || adminIntel.estuaryPassageNotes}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Float & Wade Safety Profiles - Theme-consistent Design */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {t.floatSafety && (
                            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
                                <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold uppercase tracking-wider text-[11px]">
                                  <LifeBuoy className="w-4 h-4 text-[var(--accent-teal)]" />
                                  <span>Raft &amp; Float Profile</span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)]">
                                  {t.floatSafety.rating}
                                </span>
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] space-y-1 font-sans">
                                <p><strong className="text-[var(--text-main)] font-mono">Suitable Craft:</strong> {t.floatSafety.suitableCraft}</p>
                                <p><strong className="text-[var(--text-main)] font-mono">Whitewater Class:</strong> {t.floatSafety.whitewaterClass}</p>
                                <p><strong className="text-[var(--text-main)] font-mono">Typical Float Times:</strong> {t.floatSafety.typicalFloatTimes}</p>
                              </div>
                            </div>
                          )}

                          {t.wadeSafety && (
                            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2">
                                <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold uppercase tracking-wider text-[11px]">
                                  <Footprints className="w-4 h-4 text-[var(--accent-teal)]" />
                                  <span>Wade Friendliness</span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)]">
                                  {t.wadeSafety.difficulty}
                                </span>
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] space-y-1 font-sans">
                                <p><strong className="text-[var(--text-main)] font-mono">Footwear:</strong> {t.wadeSafety.footwearRecommendation}</p>
                                <p><strong className="text-[var(--text-main)] font-mono">Bank Access:</strong> {t.wadeSafety.bankAccessibility}</p>
                                <p><strong className="text-[var(--text-main)] font-mono">Wading Staff:</strong> {t.wadeSafety.wadingStaffAdvice}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Critical Float & Navigation Hazards Card */}
                        {t.floatSafety?.hazardWarnings && t.floatSafety.hazardWarnings.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-rose-500">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Navigational &amp; Safety Hazards:</span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1 font-sans text-xs text-[var(--text-secondary)]">
                              {t.floatSafety.hazardWarnings.map((hz, i) => (
                                <li key={i}>{hz}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Verified Access Points & Bushwhacking Routes Grid */}
                        {t.accessPoints && t.accessPoints.length > 0 && (
                          <div className="space-y-2.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[var(--text-main)] uppercase font-bold tracking-wider block">
                                Access Points, Informal Trails &amp; Crown Land:
                              </span>
                              <span className="text-xs text-[var(--accent-teal)] font-mono font-bold">
                                {t.accessPoints.length} Points
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {t.accessPoints.map((pt) => (
                                <div
                                  key={pt.id}
                                  className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--accent-teal)] transition-all flex flex-col justify-between gap-2.5 shadow-sm"
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`p-1.5 rounded-md border text-xs font-bold ${getWaypointBadgeClass(pt.type)}`}>
                                          {getWaypointIcon(pt.type)}
                                        </span>
                                        <span className="font-heading font-bold text-xs text-[var(--text-main)] truncate max-w-[180px]">
                                          {pt.name}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Land Tenure and Bushwhack badges */}
                                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                                      {pt.landTenure && (
                                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] font-medium">
                                          🏛️ {pt.landTenure}
                                        </span>
                                      )}
                                      {pt.bushwhackDifficulty && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold">
                                          {pt.bushwhackDifficulty}
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                                      {pt.description}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                      📍 {pt.roadAccess}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-main)] text-[10px] gap-1 flex-wrap">
                                    <button
                                      onClick={() =>
                                        setMapModalData({
                                          riverName: t.name,
                                          accessPoints: t.accessPoints || [],
                                          floatSafety: t.floatSafety,
                                          wadeSafety: t.wadeSafety,
                                          tribalProtocols: t.tribalProtocols,
                                          initialPointId: pt.id,
                                        })
                                      }
                                      className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] font-semibold flex items-center gap-1 transition-colors text-[10px]"
                                    >
                                      <Map className="w-3 h-3 text-[var(--accent-teal)]" />
                                      <span>Map</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                      <a
                                        href={`https://maps.apple.com/?q=${encodeURIComponent(pt.name)}&ll=${pt.lat},${pt.lng}&t=m`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-1.5 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] font-semibold flex items-center gap-0.5 transition-colors text-[10px]"
                                        title="Open in Apple Maps"
                                      >
                                        <span>Apple</span>
                                        <ExternalLink className="w-2.5 h-2.5 text-sky-500" />
                                      </a>

                                      <a
                                        href={pt.googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-0.5 rounded-md bg-[var(--accent-teal)] hover:opacity-90 text-white font-semibold flex items-center gap-0.5 transition-opacity text-[10px]"
                                        title="Open in Google Maps"
                                      >
                                        <span>Google</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)]/50 flex items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500/70" />
                        <span>Admin Beat Intel, Tribal Access, Raft Safety &amp; Access Waypoints (Protected for Authorized Admins)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)] font-bold">
                        ADMIN ONLY
                      </span>
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

      {/* River Access & Interactive Map Modal (Option C) */}
      {mapModalData && (
        <RiverAccessMapModal
          isOpen={true}
          onClose={() => setMapModalData(null)}
          riverName={mapModalData.riverName}
          accessPoints={mapModalData.accessPoints}
          floatSafety={mapModalData.floatSafety}
          wadeSafety={mapModalData.wadeSafety}
          initialSelectedPointId={mapModalData.initialPointId}
        />
      )}

      {/* Real-time 5-Day Weather & Hydrometric Deep Dive Modal */}
      {selectedHydroModalProfile && (
        <TributaryHydroWeatherModal
          isOpen={true}
          onClose={() => setSelectedHydroModalProfile(null)}
          profile={selectedHydroModalProfile}
        />
      )}
    </div>
  );
};
