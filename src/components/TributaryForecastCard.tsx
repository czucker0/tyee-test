import React, { useState, useEffect } from 'react';
import { TributaryEscapement, RiverAccessPoint, FloatSafetyProfile, WadeSafetyProfile, TribalAccessProtocol, TributaryAdminTacticalIntel, SuggestedFloat, RadioRoadProtocol } from '../types/steelhead';
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
  Thermometer,
  Trees,
  Activity,
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
  CheckCircle2,
  FileText,
  Sliders,
  Scale,
  ShieldAlert,
  Radio,
  Truck,
  Car,
} from 'lucide-react';
import { RiverAccessMapModal } from './RiverAccessMapModal';
import { TributaryHydroWeatherModal } from './TributaryHydroWeatherModal';
import { trackSiteEvent } from '../utils/analytics';
import {
  fetchTributaryWeatherAndHydro,
  TributaryWeatherProfile,
  SKEENA_HYDRO_STATIONS,
} from '../services/hydroWeatherService';
import { ENCRYPTED_TRIBUTARY_VAULT } from '../data/encryptedDossierVault';
import { decryptTributaryDossier } from '../utils/dossierSecurity';
import { AUTHENTIC_TACTICAL_DOSSIERS } from '../data/authenticTacticalDossiers';

interface TributaryForecastCardProps {
  tributaries: TributaryEscapement[];
  selectedMonthDay: string;
}

const VAULT_BASIN_MAP: Record<string, string> = {
  lower_skeena: 'Lower Skeena Mainstem',
  kalum: 'Kalum (Kitsumkalum) River',
  zymoetz: 'Zymoetz (Copper) River',
  middle_skeena: 'Middle Skeena Mainstem',
  kispiox: 'Kispiox River',
  bulkley: 'Bulkley / Morice River System',
  upper_skeena: 'Upper Skeena & Other Tributaries',
  babine: 'Babine River',
  sustut: 'Sustut River',
};

// Signature color coding for rivers
const RIVER_COLORS: { [key: string]: { border: string; bg: string; dot: string; text: string; lightHex: string } } = {
  'Lower Skeena Mainstem': {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
    text: 'text-blue-500',
    lightHex: '#3b82f6',
  },
  'Kalum (Kitsumkalum) River': {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
    text: 'text-emerald-500',
    lightHex: '#10b981',
  },
  'Zymoetz (Copper) River': {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    dot: 'bg-sky-500',
    text: 'text-sky-500',
    lightHex: '#0ea5e9',
  },
  'Middle Skeena Mainstem': {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
    dot: 'bg-cyan-500',
    text: 'text-cyan-500',
    lightHex: '#06b6d4',
  },
  'Kispiox River': {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    dot: 'bg-rose-500',
    text: 'text-rose-500',
    lightHex: '#f43f5e',
  },
  'Bulkley / Morice River System': {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
    text: 'text-amber-500',
    lightHex: '#f59e0b',
  },
  'Upper Skeena & Other Tributaries': {
    border: 'border-yellow-600/40',
    bg: 'bg-yellow-600/10',
    dot: 'bg-yellow-600',
    text: 'text-yellow-600',
    lightHex: '#ca8a04',
  },
  'Babine River': {
    border: 'border-teal-500/40',
    bg: 'bg-teal-500/10',
    dot: 'bg-teal-500',
    text: 'text-teal-500',
    lightHex: '#14b8a6',
  },
  'Sustut River': {
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    dot: 'bg-purple-500',
    text: 'text-purple-500',
    lightHex: '#a855f7',
  },
};

interface DecryptedDossierData {
  adminTacticalIntel?: TributaryAdminTacticalIntel;
  accessPoints?: RiverAccessPoint[];
  suggestedFloats?: SuggestedFloat[];
  roadProtocols?: RadioRoadProtocol[];
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  tribalProtocols?: TribalAccessProtocol;
  confidenceRating?: 'High Confidence' | 'Moderate Confidence' | 'Unverified/Anecdotal';
  confidenceRationale?: string;
}

export const TributaryForecastCard: React.FC<TributaryForecastCardProps> = ({
  tributaries,
  selectedMonthDay,
}) => {
  const { isAdmin, user } = useAuth();

  // Active selected basin
  const [selectedRiverName, setSelectedRiverName] = useState<string>(
    tributaries[0]?.name || 'Bulkley / Morice River System'
  );

  // For Admins only: Switch between Overview and Tactical Intel
  const [adminViewMode, setAdminViewMode] = useState<'overview' | 'tactical'>('overview');

  // Toggle for stylized watershed map drawer
  const [showWatershedMap, setShowWatershedMap] = useState<boolean>(true);

  // Encrypted Dossier Cache for Admins
  const [decryptedDossiers, setDecryptedDossiers] = useState<Record<string, DecryptedDossierData>>({});

  // River Access & Map Modal State (Admins only)
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

  // Sync selectedRiverName if current list changes and doesn't contain it
  useEffect(() => {
    if (tributaries.length > 0 && !tributaries.some((t) => t.name === selectedRiverName)) {
      setSelectedRiverName(tributaries[0].name);
    }
  }, [tributaries, selectedRiverName]);

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

  // Decrypt confidential intel only for verified admins
  useEffect(() => {
    if (!isAdmin) {
      setDecryptedDossiers({});
      return;
    }

    let isMounted = true;
    const decryptAll = async () => {
      const results: Record<string, DecryptedDossierData> = {};

      try {
        // Populate from authentic tactical dossiers (covers all 9 basins)
        Object.entries(AUTHENTIC_TACTICAL_DOSSIERS).forEach(([basinName, dossier]) => {
          results[basinName] = {
            adminTacticalIntel: dossier.adminTacticalIntel,
            accessPoints: dossier.accessPoints,
            suggestedFloats: dossier.suggestedFloats,
            roadProtocols: dossier.roadProtocols,
            floatSafety: dossier.floatSafety,
            wadeSafety: dossier.wadeSafety,
            tribalProtocols: dossier.tribalProtocols,
            confidenceRating: dossier.confidenceRating,
            confidenceRationale: dossier.confidenceRationale,
          };
        });

        // Check if encrypted payloads exist and decrypt on top
        const vaultKeys = ['lower_skeena', 'kalum', 'zymoetz', 'middle_skeena', 'kispiox', 'bulkley', 'upper_skeena', 'babine', 'sustut'] as const;
        for (const key of vaultKeys) {
          const encrypted = (ENCRYPTED_TRIBUTARY_VAULT as any)[key];
          const displayName = VAULT_BASIN_MAP[key];

          if (encrypted && displayName) {
            try {
              const dec = await decryptTributaryDossier(encrypted);
              if (dec) {
                results[displayName] = {
                  ...results[displayName],
                  ...dec,
                  confidenceRating: results[displayName]?.confidenceRating || 'High Confidence',
                };
              }
            } catch (err: any) {
              console.error(`Decryption error for ${key}`, err);
            }
          }
        }

        if (isMounted) {
          setDecryptedDossiers(results);
          trackSiteEvent({
            type: 'DOSSIER_DECRYPT',
            category: 'intelligence',
            action: 'Decrypted Encrypted Tactical Dossiers for all Skeena Watershed Basins',
            userRole: user?.riverRole || 'admin',
            userId: user?.uid,
            userEmail: user?.email
          });
        }
      } catch (err: any) {
        console.error('Tactical dossier load error', err);
      }
    };

    decryptAll();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, user]);

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

  const getConfidenceBadge = (rating: string) => {
    switch (rating) {
      case 'High Confidence':
        return {
          badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'Verified: Official Survey / WSC / Parks'
        };
      case 'Moderate Confidence':
        return {
          badge: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500',
          label: 'Probable: Provincial ROW / Aerial Satellite'
        };
      case 'Unverified/Anecdotal':
      default:
        return {
          badge: 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400',
          dot: 'bg-rose-500',
          label: 'Anecdotal: Vintage Guide / 20+ Yr Forum Post'
        };
    }
  };

  // The active tributary selected by the user
  const activeTrib = tributaries.find((t) => t.name === selectedRiverName) || tributaries[0];
  const colorMeta = (activeTrib && RIVER_COLORS[activeTrib.name]) || {
    border: 'border-[var(--border-main)]',
    bg: 'bg-[var(--bg-card)]',
    dot: 'bg-[var(--accent-teal)]',
    text: 'text-[var(--accent-teal)]',
    lightHex: '#14b8a6',
  };
  const sci = activeTrib?.scientificProfile;
  const hydroProfile = activeTrib ? weatherProfiles[activeTrib.name] : undefined;

  // Decrypted data for the active river (for authorized admins)
  const decrypted = activeTrib && isAdmin ? decryptedDossiers[activeTrib.name] : undefined;
  const adminIntel = decrypted?.adminTacticalIntel;
  const accessPoints = decrypted?.accessPoints || [];
  const suggestedFloats = decrypted?.suggestedFloats || [];
  const roadProtocols = decrypted?.roadProtocols || [];
  const floatSafety = decrypted?.floatSafety;
  const wadeSafety = decrypted?.wadeSafety;
  const confidenceRating = decrypted?.confidenceRating || 'High Confidence';
  const confidenceRationale = decrypted?.confidenceRationale || 'Verified field telemetry & provincial hydrological baselines';
  const confMeta = getConfidenceBadge(confidenceRating);

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 text-[var(--accent-teal)]">
              <Microscope className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              Watershed Escapement &amp; Sub-Basins
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] border border-[var(--accent-teal)]/30">
              {tributaries.length} Basins
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Telemetry Reference Day: <strong className="text-[var(--text-main)]">{selectedMonthDay}</strong> &bull; Multi-decade genetic stock composition &amp; escapement models.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Stylized Map Toggle */}
          <button
            onClick={() => setShowWatershedMap(!showWatershedMap)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
              showWatershedMap
                ? 'bg-[var(--accent-teal)]/15 border-[var(--accent-teal)]/40 text-[var(--accent-teal)]'
                : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="Toggle interactive stylized Skeena watershed corridor map"
          >
            <Map className="w-3.5 h-3.5" />
            <span>{showWatershedMap ? 'Map Active' : 'Show Map'}</span>
          </button>

          {/* Admin Mode Switcher: Theme-Adaptive White/Night Cautionary Button */}
          {isAdmin && (
            <button
              onClick={() => setAdminViewMode(adminViewMode === 'tactical' ? 'overview' : 'tactical')}
              className={`relative group overflow-hidden px-3.5 py-1.5 rounded-xl border-2 font-mono text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                adminViewMode === 'tactical'
                  ? 'border-rose-500 bg-white dark:bg-zinc-950 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/40 shadow-rose-500/15 opacity-100'
                  : 'border-rose-300 dark:border-rose-900/60 bg-white/70 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-300 opacity-65 hover:opacity-100 hover:border-rose-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Toggle Super Secret Stuff (Access Points, Radio Protocols, Suggested Floats, Bear Safety)"
            >
              {/* Caution Hazard Diagonal Red/White Stripes Accent Bar (Left) */}
              <div 
                className="absolute inset-y-0 left-0 w-2.5 opacity-90 transition-opacity"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 5px, #ffffff 5px, #ffffff 10px)'
                }}
              />
              
              <div className="pl-1.5 flex items-center gap-2">
                {/* Blinking Red Warning LED */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    adminViewMode === 'tactical' ? 'bg-rose-500 opacity-75' : 'bg-rose-400 opacity-40'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    adminViewMode === 'tactical' ? 'bg-rose-600' : 'bg-rose-400/80'
                  }`} />
                </span>

                <div className="flex items-center leading-none">
                  <span className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                    Super Secret Stuff
                  </span>
                </div>
              </div>

              {/* Caution Hazard Diagonal Red/White Stripes Accent Bar (Right) */}
              <div 
                className="absolute inset-y-0 right-0 w-2.5 opacity-90 transition-opacity"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 5px, #ffffff 5px, #ffffff 10px)'
                }}
              />
            </button>
          )}
        </div>
      </div>

      {/* 2. Clean Theme-Adaptive Stylized Watershed Map (Synchronized with Field Notes Topology Style) */}
      {showWatershedMap && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
              <span>Skeena Watershed Topology &bull; Click Reach to Inspect Basin</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--accent-teal)] font-bold">
              KM 0 (Tyee) ➔ KM 450 (Sustut)
            </span>
          </div>

          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl overflow-hidden p-3 select-none">
            {/* In-Map Active HUD */}
            <div className="absolute top-2.5 left-2.5 pointer-events-none z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-main)] shadow-xs">
              <Compass className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
              <span className="text-[11px] font-mono font-extrabold text-[var(--text-main)]">
                {selectedRiverName}
              </span>
            </div>

            {/* Watershed SVG Topology */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="watershedSkeenaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
                </linearGradient>
                
                <filter id="wsGlowEffect" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Lower Skeena Mainstem: Tyee Estuary (12,85) to Terrace/Kalum Junction (35,68) */}
              <g
                onClick={() => setSelectedRiverName('Lower Skeena Mainstem')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '24% 76%' }}
              >
                <path 
                  d="M 12 85 Q 24 75 35 68" 
                  fill="none" 
                  stroke={selectedRiverName === 'Lower Skeena Mainstem' ? '#38bdf8' : 'url(#watershedSkeenaGradient)'} 
                  strokeWidth={selectedRiverName === 'Lower Skeena Mainstem' ? '5.2' : '4.2'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Lower Skeena Mainstem' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#38bdf8] group-hover:stroke-[5.2] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Lower Skeena Mainstem' ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: '24% 76%'
                  }}
                />
              </g>

              {/* 2. Middle Skeena Mainstem: Terrace (35,68) to Hazelton / Bulkley Junction (50,48) */}
              <g
                onClick={() => setSelectedRiverName('Middle Skeena Mainstem')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '42% 58%' }}
              >
                <path 
                  d="M 35 68 Q 42 58 50 48" 
                  fill="none" 
                  stroke={selectedRiverName === 'Middle Skeena Mainstem' ? '#38bdf8' : 'url(#watershedSkeenaGradient)'} 
                  strokeWidth={selectedRiverName === 'Middle Skeena Mainstem' ? '4.8' : '3.8'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Middle Skeena Mainstem' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#38bdf8] group-hover:stroke-[4.8] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Middle Skeena Mainstem' ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: '42% 58%'
                  }}
                />
              </g>

              {/* 3. Upper Skeena Corridor: Hazelton (50,48) through Kuldo/Sustut (60,25 T 75,12) */}
              <g
                onClick={() => setSelectedRiverName('Upper Skeena & Other Tributaries')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '65% 25%' }}
              >
                <path 
                  d="M 50 48 Q 55 35 60 25 T 75 12" 
                  fill="none" 
                  stroke={selectedRiverName === 'Upper Skeena & Other Tributaries' ? '#818cf8' : 'url(#watershedSkeenaGradient)'} 
                  strokeWidth={selectedRiverName === 'Upper Skeena & Other Tributaries' ? '4.2' : '3.2'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Upper Skeena & Other Tributaries' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#818cf8] group-hover:stroke-[4.2] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Upper Skeena & Other Tributaries' ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: '65% 25%'
                  }}
                />
              </g>

              {/* Bulkley River Tributary Branch */}
              <g
                onClick={() => setSelectedRiverName('Bulkley / Morice River System')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '65% 65%' }}
              >
                <path 
                  d="M 45 55 Q 58 60 68 64 T 82 75" 
                  fill="none" 
                  stroke={selectedRiverName === 'Bulkley / Morice River System' ? '#fbbf24' : '#d97706'} 
                  strokeWidth={selectedRiverName === 'Bulkley / Morice River System' ? '3.8' : '2.8'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Bulkley / Morice River System' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#fbbf24] group-hover:stroke-[3.8] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Bulkley / Morice River System' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '65% 65%'
                  }}
                />
              </g>

              {/* Babine River Branch */}
              <g
                onClick={() => setSelectedRiverName('Babine River')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '70% 35%' }}
              >
                <path 
                  d="M 52 45 Q 62 38 72 32 T 85 28" 
                  fill="none" 
                  stroke={selectedRiverName === 'Babine River' ? '#34d399' : '#10b981'} 
                  strokeWidth={selectedRiverName === 'Babine River' ? '3.5' : '2.4'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Babine River' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#34d399] group-hover:stroke-[3.5] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Babine River' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '70% 35%'
                  }}
                />
              </g>

              {/* Kispiox River Branch */}
              <g
                onClick={() => setSelectedRiverName('Kispiox River')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '50% 38%' }}
              >
                <path 
                  d="M 46 48 Q 48 38 52 28" 
                  fill="none" 
                  stroke={selectedRiverName === 'Kispiox River' ? '#fde047' : '#f59e0b'} 
                  strokeWidth={selectedRiverName === 'Kispiox River' ? '3.2' : '2.2'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Kispiox River' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#fde047] group-hover:stroke-[3.2] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Kispiox River' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '50% 38%'
                  }}
                />
              </g>

              {/* Kalum River Branch */}
              <g
                onClick={() => setSelectedRiverName('Kalum (Kitsumkalum) River')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '28% 58%' }}
              >
                <path 
                  d="M 28 68 Q 26 58 28 48" 
                  fill="none" 
                  stroke={selectedRiverName === 'Kalum (Kitsumkalum) River' ? '#7dd3fc' : '#38bdf8'} 
                  strokeWidth={selectedRiverName === 'Kalum (Kitsumkalum) River' ? '3.2' : '2.2'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Kalum (Kitsumkalum) River' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#7dd3fc] group-hover:stroke-[3.2] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Kalum (Kitsumkalum) River' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '28% 58%'
                  }}
                />
              </g>

              {/* Copper / Zymoetz River Branch */}
              <g
                onClick={() => setSelectedRiverName('Zymoetz (Copper) River')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '40% 75%' }}
              >
                <path 
                  d="M 32 70 Q 40 75 48 82" 
                  fill="none" 
                  stroke={selectedRiverName === 'Zymoetz (Copper) River' ? '#67e8f9' : '#06b6d4'} 
                  strokeWidth={selectedRiverName === 'Zymoetz (Copper) River' ? '3.2' : '2.2'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Zymoetz (Copper) River' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#67e8f9] group-hover:stroke-[3.2] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Zymoetz (Copper) River' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '40% 75%'
                  }}
                />
              </g>

              {/* Sustut Headwater Branch */}
              <g
                onClick={() => setSelectedRiverName('Upper Skeena & Other Tributaries')}
                className="cursor-pointer group transition-all duration-200"
                style={{ transformOrigin: '73% 20%' }}
              >
                <path 
                  d="M 62 25 Q 74 18 84 14" 
                  fill="none" 
                  stroke={selectedRiverName === 'Upper Skeena & Other Tributaries' ? '#6ee7b7' : '#059669'} 
                  strokeWidth={selectedRiverName === 'Upper Skeena & Other Tributaries' ? '3' : '2'}
                  strokeLinecap="round"
                  filter={selectedRiverName === 'Upper Skeena & Other Tributaries' ? 'url(#wsGlowEffect)' : undefined}
                  className="transition-all duration-200 group-hover:stroke-[#6ee7b7] group-hover:stroke-[3] group-hover:[filter:url(#wsGlowEffect)]"
                  style={{
                    transform: selectedRiverName === 'Upper Skeena & Other Tributaries' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '73% 20%'
                  }}
                />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 3. Mobile Basin Selector (Clean Native Dropdown with Sub-Basin Name Only) */}
      <div className="lg:hidden w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-3 shadow-xs">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Select Sub-Basin
        </label>
        <div className="relative">
          <select
            value={selectedRiverName}
            onChange={(e) => setSelectedRiverName(e.target.value)}
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-[var(--accent-teal)] cursor-pointer appearance-none shadow-xs"
            aria-label="Select river sub-basin"
          >
            {tributaries.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Main Master-Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sub-Basin Directory Ledger (Hidden on small screens, 4 Cols on lg) */}
        <div className="hidden lg:block lg:col-span-4 space-y-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-3 shadow-xs sticky top-[125px]">
          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-main)] pb-2">
            <span>Sub-Basin</span>
            <span>Stock / Est.</span>
          </div>

          <div className="space-y-1 pt-1">
            {tributaries.map((t) => {
              const isSelected = t.name === selectedRiverName;
              const cMeta = RIVER_COLORS[t.name] || { dot: 'bg-[var(--accent-teal)]' };

              return (
                <div
                  key={t.name}
                  onClick={() => setSelectedRiverName(t.name)}
                  className={`w-full p-3 rounded-xl transition-all cursor-pointer text-left flex items-center justify-between gap-2 border ${
                    isSelected
                      ? 'bg-[var(--accent-teal)]/10 border-[var(--accent-teal)] shadow-xs ring-1 ring-[var(--accent-teal)]/30'
                      : 'bg-transparent border-transparent hover:bg-[var(--bg-subtle)] hover:border-[var(--border-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${cMeta.dot} shrink-0 shadow-xs`} />
                    <div className="min-w-0">
                      <p className="font-heading font-extrabold text-xs text-[var(--text-main)] truncate">
                        {t.name}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                        {t.region}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-extrabold text-[var(--accent-teal)]">
                        {t.sharePct}%
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
                      {t.estimatedAdults.toLocaleString()} fish
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Flat Single-Surface Active River Stage (8 Cols on lg) */}
        {activeTrib && (
          <div className="lg:col-span-8 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            {/* River Stage Hero Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-main)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`w-3.5 h-3.5 rounded-full ${colorMeta.dot} shrink-0 shadow-xs`} />
                  <h2 className="text-lg sm:text-xl font-heading font-black text-[var(--text-main)]">
                    {activeTrib.name}
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold ${getStatusBadge(activeTrib.status)}`}>
                    {activeTrib.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  {activeTrib.region} &bull; Peak Window: <strong className="text-[var(--text-main)]">{activeTrib.peakWindow}</strong>
                </p>
              </div>

              {/* Weather & Hydro Live Status */}
              {hydroProfile && (
                <button
                  onClick={() => setSelectedHydroModalProfile(hydroProfile)}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] transition shadow-xs flex items-center gap-1.5 text-xs font-mono font-semibold self-start sm:self-auto"
                  title="Open 5-day weather forecast & real-time hydrograph"
                >
                  <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{hydroProfile.hydro.waterTempC}°C</span>
                  <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                    • {hydroProfile.hydro.dischargeM3s} m³/s
                  </span>
                  <Sun className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
                </button>
              )}
            </div>

            {/* River Run Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Stock Proportion</span>
                <span className="text-base sm:text-lg font-black text-[var(--accent-teal)]">
                  {activeTrib.sharePct}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Est. Escapement</span>
                <span className="text-base sm:text-lg font-black text-[var(--text-main)]">
                  {activeTrib.estimatedAdults.toLocaleString()} <span className="text-[10px] text-[var(--text-muted)] font-normal">adults</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Season Projection</span>
                <span className="text-base sm:text-lg font-black text-[var(--accent-amber)]">
                  ~{activeTrib.projectedAdults.toLocaleString()}
                </span>
              </div>
            </div>

            {/* VIEW MODE 1: PUBLIC SCIENTIFIC OVERVIEW & PROTOCOLS (Unified for Regular Visitors) */}
            {(!isAdmin || adminViewMode === 'overview') && (
              <div className="space-y-4 animate-in fade-in duration-150 font-mono text-xs">
                {/* Description */}
                <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {activeTrib.description}
                </p>

                {/* Key Scientific Telemetry Cards */}
                {sci && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Migration Distance & Upriver Transit Velocity */}
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                      <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold uppercase tracking-wider text-[11px]">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Migration Corridor</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px]">Estuary Distance:</span>
                          <span className="text-[var(--text-main)] font-bold">{sci.migrationDistanceKm}</span>
                        </div>
                        <div className="pt-1 border-t border-[var(--border-main)]">
                          <span className="text-[var(--text-muted)] block text-[10px]">Transit Velocity:</span>
                          <span className="text-[var(--text-main)] font-semibold">{sci.meanTravelVelocity}</span>
                        </div>
                        <div className="pt-1 border-t border-[var(--border-main)]">
                          <span className="text-[var(--text-muted)] block text-[10px]">Basin Area:</span>
                          <span className="text-[var(--text-main)] font-bold">{sci.basinAreaKm2}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hydrology & Thermal Regime */}
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                      <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold uppercase tracking-wider text-[11px]">
                        <Waves className="w-3.5 h-3.5" />
                        <span>Hydrology &amp; Buffering</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px]">Discharge &amp; Sediment:</span>
                          <span className="text-[var(--text-secondary)] font-sans text-xs">{sci.lakeBuffering}</span>
                        </div>
                        <div className="pt-1 border-t border-[var(--border-main)]">
                          <span className="text-[var(--text-muted)] block text-[10px]">Thermal Regime:</span>
                          <span className="text-[var(--text-main)] font-bold">{sci.thermalRegime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Conservation Status */}
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-1.5 text-[var(--accent-amber)] font-bold uppercase tracking-wider text-[11px]">
                        <Trees className="w-3.5 h-3.5" />
                        <span>Conservation Priority</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px]">Stock Status:</span>
                          <span className="text-[var(--text-main)] font-bold">{sci.conservationPriority}</span>
                        </div>
                        <div className="pt-1 border-t border-[var(--border-main)]">
                          <span className="text-[var(--text-muted)] block text-[10px]">Habitat Ecology:</span>
                          <span className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">{sci.habitatEcology}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* First Nations Territory Protocols & Permitting Rules */}
                {activeTrib.tribalProtocols && (
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--accent-teal)]" />
                        <span className="font-heading font-extrabold text-xs uppercase tracking-wide text-[var(--text-main)]">
                          First Nations Territory &amp; Permitting Protocols
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-teal)]/10 text-[var(--accent-teal)] border border-[var(--accent-teal)]/30">
                        {activeTrib.tribalProtocols.nation}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Regulations &amp; Licencing:</span>
                        <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                          {activeTrib.tribalProtocols.permitDetails}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Watershed Etiquette:</span>
                        <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                          {activeTrib.tribalProtocols.etiquette}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: ADMIN TACTICAL INTELLIGENCE (Strictly Gated for Authorized Admins) */}
            {isAdmin && adminViewMode === 'tactical' && adminIntel && (
              <div className="space-y-5 animate-in fade-in duration-150 font-mono text-xs">
                {/* Admin Intel Header: Clean Single Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-heading font-extrabold text-xs uppercase tracking-wide text-[var(--text-main)]">
                      Confidential Basin Intelligence &amp; Access Vault
                    </span>
                  </div>
                  {accessPoints && accessPoints.length > 0 && (
                    <button
                      onClick={() =>
                        setMapModalData({
                          riverName: activeTrib.name,
                          accessPoints: accessPoints,
                          floatSafety: floatSafety,
                          wadeSafety: wadeSafety,
                          tribalProtocols: activeTrib.tribalProtocols,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-teal)] hover:opacity-90 text-white font-bold text-xs font-mono transition shadow-xs flex items-center gap-1 self-start sm:self-auto"
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>Interactive Satellite Map ({accessPoints.length} Spots)</span>
                    </button>
                  )}
                </div>

                {/* Holding Water Anatomy & Swing Bite Triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                    <span className="text-[var(--accent-teal)] block uppercase text-[10px] font-bold">
                      Key Holding Reaches &amp; Pools:
                    </span>
                    <p className="font-sans text-xs text-[var(--text-main)] font-semibold leading-relaxed">
                      {adminIntel.keyReaches}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                    <span className="text-[var(--accent-amber)] block uppercase text-[10px] font-bold">
                      Fly Swing &amp; Bite Triggers:
                    </span>
                    <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                      {adminIntel.tacticalBiteTriggers}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                    <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                      Water Clarity Dynamics:
                    </span>
                    <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                      {adminIntel.waterClarityDynamics}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                    <span className="text-[var(--text-muted)] block uppercase text-[10px] font-bold">
                      Passage &amp; Guide Notes:
                    </span>
                    <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                      {adminIntel.historicalGuideNotes || adminIntel.estuaryPassageNotes}
                    </p>
                  </div>
                </div>

                {/* Backcountry Bear Safety & River Etiquette */}
                {(adminIntel.bearSafetyNotes || adminIntel.streamEtiquette) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {adminIntel.bearSafetyNotes && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px] truncate">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Bear Safety Protocols</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                          {adminIntel.bearSafetyNotes}
                        </p>
                      </div>
                    )}

                    {adminIntel.streamEtiquette && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px] truncate">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Etiquette &amp; Keep 'Em Wet</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                          {adminIntel.streamEtiquette}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* VHF Resource Road Radio Protocols */}
                {roadProtocols.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-sky-500 font-bold uppercase tracking-wider text-[11px] truncate">
                        <Radio className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">VHF Resource Road Channels</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                        Logging Corridors
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {roadProtocols.map((rp, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                            <div className="flex items-center gap-1.5 truncate">
                              <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate">{rp.roadName}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-mono border border-sky-500/30 shrink-0">
                              {rp.rrChannel}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed">
                            {rp.callingRules}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Float & Wade Safety Profiles */}
                {(floatSafety || wadeSafety) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {floatSafety && (
                      <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                        <div className="flex items-center gap-1.5 text-rose-500 font-bold uppercase tracking-wider text-[11px] truncate">
                          <LifeBuoy className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Float Navigation Profile</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-[var(--text-muted)] block text-[10px]">Rating:</span>
                            <span className="text-[var(--text-main)] font-bold">{floatSafety.rating}</span>
                          </div>
                          <div className="pt-1 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">Whitewater Class:</span>
                            <span className="text-[var(--text-secondary)] font-sans text-xs">{floatSafety.whitewaterClass}</span>
                          </div>
                          <div className="pt-1 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">Hazard Warnings:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)] font-sans text-xs pt-0.5">
                              {floatSafety.hazardWarnings.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {wadeSafety && (
                      <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold uppercase tracking-wider text-[11px] truncate">
                          <Footprints className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Wading Safety Profile</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-[var(--text-muted)] block text-[10px]">Difficulty:</span>
                            <span className="text-[var(--text-main)] font-bold">{wadeSafety.difficulty}</span>
                          </div>
                          <div className="pt-1 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">Footwear Advice:</span>
                            <span className="text-[var(--text-secondary)] font-sans text-xs">{wadeSafety.footwearRecommendation}</span>
                          </div>
                          <div className="pt-1 border-t border-[var(--border-main)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">Wading Staff:</span>
                            <span className="text-[var(--text-secondary)] font-sans text-xs">{wadeSafety.wadingStaffAdvice}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Classic Floats */}
                {suggestedFloats.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[var(--accent-teal)] font-bold uppercase tracking-wide text-xs truncate">
                        <Waves className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Suggested Classic Floats ({suggestedFloats.length})</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                        Distances in km
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestedFloats.map((fl) => (
                        <div
                          key={fl.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2 flex flex-col justify-between shadow-xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <h5 className="font-heading font-extrabold text-xs text-[var(--text-main)]">
                                {fl.name}
                              </h5>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] border border-[var(--accent-teal)]/30">
                                {fl.distanceKm} &bull; {fl.estimatedTime}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-[var(--text-secondary)] font-sans">
                              <p><strong className="text-[var(--text-main)] font-mono text-[10px]">Whitewater:</strong> {fl.whitewaterClass}</p>
                              <p><strong className="text-[var(--text-main)] font-mono text-[10px]">Suitable Craft:</strong> {fl.suitableCraft}</p>
                              <p><strong className="text-[var(--text-main)] font-mono text-[10px]">Put-In:</strong> {fl.putInParking}</p>
                              <p><strong className="text-[var(--text-main)] font-mono text-[10px]">Take-Out:</strong> {fl.takeOutParking}</p>
                              
                              {fl.vehicleClearance && (
                                <p className="pt-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800/20 dark:bg-zinc-800 text-zinc-300 border border-zinc-600/30">
                                    <Car className="w-3 h-3 text-amber-500" />
                                    <span>{fl.vehicleClearance}</span>
                                  </span>
                                </p>
                              )}

                              {fl.mandatoryExitPoint && (
                                <p className="text-rose-500 font-bold text-[11px] pt-1">
                                  🚨 Mandatory Exit: {fl.mandatoryExitPoint}
                                </p>
                              )}

                              <p className="text-amber-600 dark:text-amber-400 text-[11px] pt-0.5">
                                ⚠️ {fl.hazardNotes}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified & Anecdotal River Access Waypoints */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-heading font-extrabold uppercase tracking-wide text-[var(--text-main)] truncate">
                      River Access Points ({accessPoints.length})
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                      Clearance &bull; km
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accessPoints.map((pt) => {
                      const spotConf = pt.confidenceRating || 'High Confidence';
                      const spotConfMeta = getConfidenceBadge(spotConf);

                      return (
                        <div
                          key={pt.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] hover:border-[var(--accent-teal)] transition-all flex flex-col justify-between gap-2.5 shadow-xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`p-1.5 rounded-md border text-xs font-bold shrink-0 ${getWaypointBadgeClass(pt.type)}`}>
                                  {getWaypointIcon(pt.type)}
                                </span>
                                <span className="font-heading font-bold text-xs text-[var(--text-main)] truncate max-w-[150px] sm:max-w-[180px]">
                                  {pt.name}
                                </span>
                              </div>
                              <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${spotConfMeta.badge}`}>
                                <span className={`w-1 h-1 rounded-full ${spotConfMeta.dot}`} />
                                <span>{spotConf}</span>
                              </span>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                              {pt.description}
                            </p>

                            <div className="space-y-0.5 pt-1 text-[10px] font-mono">
                              <p className="text-[var(--text-muted)] truncate">
                                📍 {pt.roadAccess}
                              </p>
                              {pt.vehicleClearance && (
                                <p className="text-amber-500 flex items-center gap-1">
                                  <Car className="w-3 h-3 shrink-0" />
                                  <span>{pt.vehicleClearance}</span>
                                </p>
                              )}
                              {pt.trailDistanceKm && (
                                <p className="text-sky-500">
                                  🥾 Trail: {pt.trailDistanceKm} ({pt.bushwhackDifficulty || 'Foot path'})
                                </p>
                              )}
                              {pt.parkingInfo && (
                                <p className="text-[var(--text-secondary)]">
                                  🅿️ {pt.parkingInfo}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-main)] text-[10px] gap-1 flex-wrap font-mono">
                            <button
                              onClick={() =>
                                setMapModalData({
                                  riverName: activeTrib.name,
                                  accessPoints: accessPoints,
                                  floatSafety: floatSafety,
                                  wadeSafety: wadeSafety,
                                  tribalProtocols: activeTrib.tribalProtocols,
                                  initialPointId: pt.id,
                                })
                              }
                              className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] transition"
                            >
                              Launch in Map
                            </button>
                            <a
                              href={pt.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-md bg-[var(--accent-teal)]/10 hover:bg-[var(--accent-teal)]/20 text-[var(--accent-teal)] border border-[var(--accent-teal)]/30 transition flex items-center gap-1"
                            >
                              <span>GPS Nav</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Prominent Backcountry Peril & User Liability Notice */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-[var(--text-secondary)] space-y-1.5 mt-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Wilderness Intelligence &bull; Access Strictly at Your Own Risk &amp; Peril</span>
              </div>
              <p className="leading-relaxed font-sans text-xs">
                All tactical intelligence, road navigation spurs, canyon tracks, and boat access waypoints are compiled for backcountry navigational awareness only. Skeena wilderness corridors present extreme natural hazards including unmaintained logging roads, sudden flash flooding, Class IV/V whitewater canyons, glacial currents, hypothermia, dense grizzly bear populations, and zero cellular coverage. You are solely responsible for your own safety, satellite SOS transceivers, proper permits, and river-reading judgment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* River Access & Satellite Map Modal (Admins only) */}
      {mapModalData && (
        <RiverAccessMapModal
          isOpen={true}
          onClose={() => setMapModalData(null)}
          riverName={mapModalData.riverName}
          accessPoints={mapModalData.accessPoints}
          floatSafety={mapModalData.floatSafety}
          wadeSafety={mapModalData.wadeSafety}
          tribalProtocols={mapModalData.tribalProtocols}
          initialSelectedPointId={mapModalData.initialPointId}
        />
      )}

      {/* Weather & Hydro Profile Modal */}
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
