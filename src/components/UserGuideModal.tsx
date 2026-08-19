import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Compass,
  Scale,
  Waves,
  TrendingUp,
  Sliders,
  Sparkles,
  Fish,
  ShieldAlert,
  Clock,
  Layers,
  Thermometer,
  MapPin,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Printer,
  CheckCircle2,
  Info,
  Lock,
  Key,
  ShieldCheck,
  FileText,
  CloudRain,
  Gauge,
  Droplets,
  Share2,
  Database,
  History,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMultiplierDebate?: () => void;
}

type ChapterId =
  | 'tyee_mechanics'
  | 'multiplier_math'
  | 'tributaries_and_mainstem'
  | 'weather_hydrology'
  | 'forecasting_engine'
  | 'what_if_sandbox'
  | 'time_machine_comparison'
  | 'field_notes_vault'
  | 'steelie_dan_ai'
  | 'offline_data_sync';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenMultiplierDebate,
}) => {
  const [activeChapter, setActiveChapter] = useState<ChapterId>('tyee_mechanics');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const chapters: { id: ChapterId; title: string; number: string; icon: any; summary: string }[] = [
    {
      id: 'tyee_mechanics',
      number: '01',
      title: 'The Tyee Test Fishery Demystified',
      icon: Waves,
      summary: 'History, Telegraph Point location, slack-tide gillnet drifting, 1-hour standardization, and raw CPUE calculation.',
    },
    {
      id: 'multiplier_math',
      number: '02',
      title: 'The Multiplier & Escapement Science',
      icon: Scale,
      summary: '4-year brood cycles, Babine fence ground-truthing, and the 40-point emergency closure debate.',
    },
    {
      id: 'tributaries_and_mainstem',
      number: '03',
      title: 'Tributaries, Lower & Middle Skeena Zones',
      icon: MapPin,
      summary: 'Genetic stock shares (Bulkley, Babine, Kispiox, Sustut, Zymoetz, Kalum), mainstem zoning, and migration swim velocities.',
    },
    {
      id: 'weather_hydrology',
      number: '04',
      title: 'Hydrology, Water Temps & Weather Conditions',
      icon: Thermometer,
      summary: 'Discharge telemetry (m³/s), water clarity/Secchi depth, 18°C thermal stress limit, and 5-day weather models.',
    },
    {
      id: 'forecasting_engine',
      number: '05',
      title: 'Statistical In-Season Forecasting',
      icon: TrendingUp,
      summary: 'Early, Normal, and Late run timing models, RMSE analog matching, and 80% confidence interval envelopes.',
    },
    {
      id: 'what_if_sandbox',
      number: '06',
      title: 'What-If Simulation Sandbox',
      icon: Sliders,
      summary: 'Testing hypothetical pulses, drought catchability shifts, gear multiplier variations, and emergency closures.',
    },
    {
      id: 'time_machine_comparison',
      number: '07',
      title: 'Time Machine & Historical Comparison',
      icon: History,
      summary: 'Scrubbing through past seasons, multi-year overlay comparisons, and percentile rank indexing.',
    },
    {
      id: 'field_notes_vault',
      number: '08',
      title: 'Field Notes & Zero-Knowledge Vault',
      icon: Lock,
      summary: 'Client-side AES-GCM 256-bit encryption, PBKDF2 passphrase keys, offline backups, private vs shared logs, and JSON export.',
    },
    {
      id: 'steelie_dan_ai',
      number: '09',
      title: 'Steelie Dan AI & River Access Map',
      icon: Sparkles,
      summary: 'Spey tactical prompting, river access trails, boat ramps, Classified Waters regulations, and First Nations protocols.',
    },
    {
      id: 'offline_data_sync',
      number: '10',
      title: 'Data Sync & Offline Caching',
      icon: Database,
      summary: 'DFO refresh cycles, offline local storage persistence, manual entry overrides, and cache management.',
    },
  ];

  const filteredChapters = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                  Skeena River Field Manual &amp; Master Reference
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-[var(--accent-amber)] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  v3.0 Complete Field Edition
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Comprehensive Guide to Test Fishery Mechanics, In-Season Telemetry, Tributaries, Weather, Field Notes &amp; AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Reference Manual"
              className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-main)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Sidebar + Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[var(--border-main)] bg-[var(--bg-subtle)]/50 flex flex-col shrink-0">
            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border-main)]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search field manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] focus:outline-none focus:border-[var(--accent-teal)] text-[var(--text-main)] placeholder-[var(--text-muted)]"
                />
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChapters.map((chap) => {
                const IconComponent = chap.icon;
                const isActive = activeChapter === chap.id;

                return (
                  <button
                    key={chap.id}
                    onClick={() => setActiveChapter(chap.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-[var(--accent-teal)] text-white shadow-sm font-semibold'
                        : 'hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono ${isActive ? 'text-white/80' : 'text-[var(--accent-amber)]'}`}>
                          CHAPTER {chap.number}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'opacity-0'}`} />
                      </div>
                      <h4 className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-[var(--text-main)] font-semibold'}`}>
                        {chap.title}
                      </h4>
                      <p className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                        {chap.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Multiplier Debate Banner */}
            {onOpenMultiplierDebate && (
              <div className="p-3 border-t border-[var(--border-main)] bg-[var(--bg-card)]">
                <button
                  onClick={() => {
                    onClose();
                    onOpenMultiplierDebate();
                  }}
                  className="w-full p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-left transition flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold block uppercase">Deep Dive Modal</span>
                    <span className="text-xs font-heading font-extrabold block">The Multiplier Debate</span>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 text-amber-500" />
                </button>
              </div>
            )}
          </div>

          {/* Chapter Content View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            {/* CHAPTER 1: TYEE MECHANICS */}
            {activeChapter === 'tyee_mechanics' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 01 &bull; Operational Science
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    The Tyee Test Fishery Demystified
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Standardized Indexing, Estuary Hydrodynamics, and Catch-Per-Unit-Effort (CPUE) Mechanics
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                  <h4 className="text-sm font-heading font-bold text-[var(--accent-teal)] flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    <span>Location &amp; Historical Mandate</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Operating continuously since <strong>1956</strong> by Fisheries and Oceans Canada (DFO), the Tyee Test Fishery is situated at <strong>Telegraph Point</strong> on the Lower Skeena River tidewater reach (approx. 20 km upstream from Prince Rupert, near the mouth of the estuary). Its sole purpose is to provide real-time, in-season indices of abundance and migration timing for returning wild salmon and steelhead stocks before they disperse into the vast 54,000 km² Skeena watershed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <h5 className="font-heading font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>Slack Tide Standardization</span>
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      To isolate fish abundance from fluctuating tidal velocity, drifts occur precisely around high and low slack water tides twice daily. The test vessel drifts an unanchored, standardized 200-fathom gillnet for exactly one hour per set.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <h5 className="font-heading font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Waves className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>Variable Multi-Panel Mesh</span>
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      The net is composed of 10 distinct mesh panels ranging from 3.5 inches (targeting sockeye/pink) to 8.5 inches (targeting chinook &amp; large summer steelhead). This ensures non-selective, multi-species sampling across all age-classes.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/30 space-y-2">
                  <h5 className="text-xs font-mono font-bold uppercase text-[var(--accent-teal)] tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>How the Daily Index (CPUE) is Calculated</span>
                  </h5>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    The raw daily CPUE formula standardizes catch across fluctuating net drift durations:
                  </p>
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] font-mono text-xs text-[var(--accent-teal)] overflow-x-auto">
                    Daily CPUE = &sum; [ (Number of Steelhead Caught in Set &times; 60) / Actual Drift Minutes ] / Total Sets
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    The Cumulative Index is simply the running sum of all daily CPUE indices from June 10 through September 30.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 2: MULTIPLIER MATH */}
            {activeChapter === 'multiplier_math' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 02 &bull; Bio-Mathematical Calibration
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    The Multiplier &amp; Escapement Science
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Converting Test Fishery Index Points into Absolute Adult Spawning Returns
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                  <h4 className="text-sm font-heading font-bold text-[var(--accent-amber)] flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>The Multiplier Equation</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Because the test net catches only a tiny fraction of the total run migrating up the wide Skeena channel, index points must be expanded to estimate true total adult escapement.
                  </p>
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] font-mono text-xs text-[var(--accent-amber)]">
                    Estimated Total Adults = Cumulative Tyee Index &times; Expansion Multiplier (Default: ~110.0)
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-main)] tracking-wider">
                    Ground-Truthing &amp; Post-Season Weirs
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    The expansion factor is calibrated by comparing the Tyee cumulative index against total adult counts at upstream physical enumeration structures:
                  </p>
                  <ul className="list-disc pl-5 text-xs sm:text-sm text-[var(--text-secondary)] space-y-1.5">
                    <li><strong>Babine River Counting Fence:</strong> Enumerates 100% of adult salmon and steelhead entering the massive Babine sub-basin.</li>
                    <li><strong>Sustut River Counting Weir:</strong> High-altitude wild alpine enumeration fence.</li>
                    <li><strong>Genetic Stock Identification (GSI):</strong> DNA tissue sampling indicating what proportion of the Tyee catch belongs to each tributary.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <h5 className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>The 40-Point Emergency Conservation Threshold</span>
                  </h5>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Provincial fisheries managers establish an emergency closure trigger if the projected season-end Tyee index drops below <strong>40 Index Points</strong> (equivalent to &lt; 4,400 wild adults). When breached, all recreational catch-and-release steelhead fisheries across the entire Skeena watershed are shut down to safeguard the spawning gene pool.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 3: TRIBUTARIES & MAINSTEM */}
            {activeChapter === 'tributaries_and_mainstem' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 03 &bull; Watershed Geography
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Tributaries, Lower &amp; Middle Skeena Zones
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Stock Proportion Baselines, Mainstem Reaches, and Migration Transit Times
                  </p>
                </div>

                {/* Mainstem Skeena Reach Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--accent-teal)] tracking-wider">
                    Mainstem Skeena Zoning Architecture
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-main)] text-sm">1. Lower Skeena (Tidewater to Terrace)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-500 font-bold">2–6 Days Transit</span>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        Extends from the estuary at Telegraph Point through Exchamsiks and Exstew up to the Kalum confluence at Terrace (~140 km). Characterized by massive discharge (~1,450 m³/s), tidal clearing tides, and powerful chrome tide-runners.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-main)] text-sm">2. Middle Skeena (Terrace to Hazelton)</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-500 font-bold">7–16 Days Transit</span>
                      </div>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        Extends from Terrace through Kitselas Canyon, Usk (WSC Station 08EF001), Cedarvale, and Kitwanga to the Bulkley confluence at Hazelton (~230 km). Features deep canyon tailouts, classic boulder runs, and staging holding pools.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tributary GSI Shares Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-main)] tracking-wider">
                    Genetic Stock Identification (GSI) Shares
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-[var(--border-main)]">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] text-[var(--text-muted)] uppercase text-[10px]">
                        <tr>
                          <th className="p-3">River System</th>
                          <th className="p-3">GSI Share</th>
                          <th className="p-3">Distance</th>
                          <th className="p-3">Avg Travel Time</th>
                          <th className="p-3">Key Characteristics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-main)] bg-[var(--bg-card)]">
                        <tr>
                          <td className="p-3 font-bold text-[var(--text-main)]">Bulkley / Morice</td>
                          <td className="p-3 text-[var(--accent-amber)] font-bold">38.0%</td>
                          <td className="p-3 text-[var(--text-secondary)]">240–380 km</td>
                          <td className="p-3 text-[var(--text-secondary)]">14–24 days</td>
                          <td className="p-3 text-[var(--text-secondary)]">Largest run share; premier dry-fly water.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[var(--text-main)]">Babine River</td>
                          <td className="p-3 text-[var(--accent-teal)] font-bold">24.0%</td>
                          <td className="p-3 text-[var(--text-secondary)]">340–420 km</td>
                          <td className="p-3 text-[var(--text-secondary)]">22–32 days</td>
                          <td className="p-3 text-[var(--text-secondary)]">Lake-buffered gin-clear flows; large summer fish.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[var(--text-main)]">Kispiox River</td>
                          <td className="p-3 text-rose-500 font-bold">14.0%</td>
                          <td className="p-3 text-[var(--text-secondary)]">240–290 km</td>
                          <td className="p-3 text-[var(--text-secondary)]">12–20 days</td>
                          <td className="p-3 text-[var(--text-secondary)]">World-record body mass genetics; clay banks.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[var(--text-main)]">Zymoetz (Copper)</td>
                          <td className="p-3 text-sky-500 font-bold">9.0%</td>
                          <td className="p-3 text-[var(--text-secondary)]">145–210 km</td>
                          <td className="p-3 text-[var(--text-secondary)]">6–12 days</td>
                          <td className="p-3 text-[var(--text-secondary)]">Fast canyon drops; glacial transition water.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[var(--text-main)]">Sustut River</td>
                          <td className="p-3 text-purple-500 font-bold">5.0%</td>
                          <td className="p-3 text-[var(--text-secondary)]">460–510 km</td>
                          <td className="p-3 text-[var(--text-secondary)]">30–45 days</td>
                          <td className="p-3 text-[var(--text-secondary)]">Remote alpine wilderness sanctuary.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[var(--text-main)]">Kalum (Kitsumkalum)</td>
                          <td className="p-3 text-slate-400 font-bold">4.0%</td>
                          <td className="p-3 text-[var(--text-secondary)]">140–180 km</td>
                          <td className="p-3 text-[var(--text-secondary)]">5–10 days</td>
                          <td className="p-3 text-[var(--text-secondary)]">Lake-fed thermal stability; heavy spring/fall runs.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 4: WEATHER & HYDROLOGY */}
            {activeChapter === 'weather_hydrology' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 04 &bull; Environmental Telemetry
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Hydrology, Water Temps &amp; Weather Conditions
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Real-time Discharge Telemetry, Clarity Secchi Estimates, and Conservation Thermal Thresholds
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Hydrometric Telemetry</span>
                    <span className="text-sm font-bold text-[var(--text-main)] block">Discharge (m³/s)</span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Sourced from Water Survey of Canada (WSC) automated hydrometric stations (e.g. Usk 08EF001, Quick 08EE004).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Thermal Regime</span>
                    <span className="text-sm font-bold text-[var(--text-main)] block">Water Temp (°C / °F)</span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Critical indicator for fish metabolic rate, active surface feeding, and holding depth.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">5-Day Meteorological</span>
                    <span className="text-sm font-bold text-[var(--text-main)] block">Atmospheric Pressure &amp; Rain</span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Open-Meteo high-resolution model predicting rain mm, barometric shifts, and wind speeds.
                    </p>
                  </div>
                </div>

                {/* Thermal Ethics Card */}
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-heading font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>The 18°C (64.4°F) Angler Conservation Limit</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Steelhead are cold-water stenotherms. When water temperatures exceed <strong>18°C (64.4°F)</strong>, dissolved oxygen plummets and post-exercise lactic acid accumulation can cause severe delayed catch-and-release mortality.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 font-mono text-xs">
                    <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-main)]">
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase">8.0°C – 14.5°C</span>
                      <strong className="text-emerald-500">Prime Swung Fly</strong>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-main)]">
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase">15.0°C – 17.9°C</span>
                      <strong className="text-amber-500">Warm / Fish Early Morning</strong>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-main)]">
                      <span className="text-[10px] text-[var(--text-muted)] block uppercase">&ge; 18.0°C</span>
                      <strong className="text-rose-500">Critical Warm Stress Alert</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 5: FORECASTING ENGINE */}
            {activeChapter === 'forecasting_engine' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 05 &bull; Predictive Modeling
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Statistical In-Season Forecasting
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Gaussian Timing Envelopes, RMSE Historical Analogs, and Probability Bounds
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-main)] tracking-wider">
                    The Three Run-Timing Scenarios
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                      <span className="font-bold text-[var(--accent-amber)] text-sm">Early Run Timing (-5 Days)</span>
                      <p className="text-[var(--text-secondary)]">
                        Assumes the peak migration pulse entered the river early in late July. The remaining run will taper earlier in late August.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                      <span className="font-bold text-[var(--accent-teal)] text-sm">Normal 10-Yr Timing Model</span>
                      <p className="text-[var(--text-secondary)]">
                        Baseline projection assuming the run follows the multi-decade historical shape with mid-August peak.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                      <span className="font-bold text-sky-400 text-sm">Late Run Surge (+5 Days)</span>
                      <p className="text-[var(--text-secondary)]">
                        Assumes cool offshore marine temperatures or freshets delayed migration, resulting in a heavy late-August push.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                  <h5 className="text-xs font-mono font-bold uppercase text-[var(--accent-teal)] tracking-wider">
                    Root Mean Square Error (RMSE) Analog Year Matching
                  </h5>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    On every calendar day, the forecasting algorithm calculates the Euclidean distance (RMSE) between the current season’s cumulative CPUE trajectory and all previous historical years (1956–Present). The system identifies the closest historical analog year to project the most probable trajectory.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 6: WHAT-IF SANDBOX */}
            {activeChapter === 'what_if_sandbox' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 06 &bull; Simulation Sandbox
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    What-If Simulation Sandbox
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Testing Synthetic Pulses, Catchability Variances, and Climate Scenarios
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                  <h4 className="text-sm font-heading font-bold text-[var(--accent-teal)] flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    <span>How to Use the Simulation Controls</span>
                  </h4>
                  <ul className="list-disc pl-5 text-xs sm:text-sm text-[var(--text-secondary)] space-y-2">
                    <li>
                      <strong>Date Timeline Scrubber:</strong> Drag through any calendar day from June 10 to September 30 to see exactly how the forecast evolved in real-time.
                    </li>
                    <li>
                      <strong>Multiplier Slider (0.5x – 2.0x):</strong> Test the effect of changing the expansion factor from conservative estimates (e.g. 70x) to high abundance expansions (e.g. 150x).
                    </li>
                    <li>
                      <strong>Synthetic Pulse Injector:</strong> Simulate a hypothetical 20-point surge entering the river next week to observe the immediate impact on tributary escapement totals.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* CHAPTER 7: TIME MACHINE */}
            {activeChapter === 'time_machine_comparison' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 07 &bull; Historical Comparison
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Time Machine &amp; Head-to-Head Comparison
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Multi-Decade Benchmarks, Decadal Averages, and Percentile Rank Analysis
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-main)] tracking-wider">
                    Head-to-Head Metrics Table
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Compare any individual year (e.g. 1998, 2018, 2021) directly against the current year. The comparison table automatically computes:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                      <span className="font-bold text-[var(--text-main)] block">Cumulative on Date</span>
                      <span className="text-[var(--text-muted)] text-[10px]">Points accumulated by this exact day.</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                      <span className="font-bold text-[var(--text-main)] block">&Delta; Delta from Current</span>
                      <span className="text-[var(--text-muted)] text-[10px]">Percentage difference (+/- %).</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                      <span className="font-bold text-[var(--text-main)] block">Rank on Date</span>
                      <span className="text-[var(--text-muted)] text-[10px]">Historical standing out of 68 seasons.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 8: FIELD NOTES & ZERO-KNOWLEDGE VAULT */}
            {activeChapter === 'field_notes_vault' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 08 &bull; Privacy &amp; Security
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Field Notes &amp; Zero-Knowledge Vault
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Client-Side Cryptography, Private River Logs, and Secure Data Backups
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                  <h4 className="text-sm font-heading font-bold text-[var(--accent-teal)] flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Zero-Knowledge AES-GCM 256-Bit Architecture</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Angler secrets, specific GPS coordinates, fly patterns, and catch records are sacred. The <strong>Field Notes Vault</strong> uses military-grade <strong>AES-GCM 256-bit encryption</strong> executed purely inside your browser using the native Web Crypto API.
                  </p>
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 text-[var(--accent-teal)] font-bold">
                      <Key className="w-3.5 h-3.5" />
                      <span>PBKDF2 Key Derivation (100,000 Iterations)</span>
                    </div>
                    <p className="text-[var(--text-secondary)] font-sans">
                      Your master passphrase is never transmitted over any network, logged to servers, or stored in plaintext. It generates a single-session symmetric key that encrypts all note contents before storage.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <h5 className="font-heading font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>Storage Modes: Local vs Cloud</span>
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)]">
                      <li><strong>Local-Only Vault:</strong> Notes reside strictly in your device’s encrypted localStorage. Zero cloud sync.</li>
                      <li><strong>Encrypted Cloud Sync:</strong> Encrypted blobs sync to Firestore for cross-device access, but remain unreadable without your passphrase.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <h5 className="font-heading font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>Export, Backup &amp; Sharing</span>
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)]">
                      <li><strong>Encrypted Backup (.json):</strong> Download full encrypted archive files for offline preservation.</li>
                      <li><strong>Private vs Shared Notes:</strong> Keep secret holding spots locked in your private vault while optionally publishing anonymized river reports to the community board.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 9: STEELIE DAN AI & RIVER MAP */}
            {activeChapter === 'steelie_dan_ai' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 09 &bull; AI Field Assistant &amp; Maps
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Steelie Dan AI &amp; River Access Map
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Tactical Prompting, Spey Gear Recommendations, River Trails, and First Nations Protocols
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                  <h4 className="text-sm font-heading font-bold text-[var(--accent-teal)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>How to Prompt Steelie Dan AI</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Steelie Dan is grounded in live watershed telemetry, current river discharge, 5-day weather forecasts, and historical run curves.
                  </p>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)]">
                      &ldquo;What tip and fly size should I swing on the Bulkley at Moricetown given today&apos;s water temp?&rdquo;
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)]">
                      &ldquo;When will the peak of the Kispiox run arrive based on Tyee numbers over the last 10 days?&rdquo;
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-heading font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>Classified Waters &amp; First Nations Territory Protocols</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Always respect Classified Waters licence dates (Sept 1 – Oct 31) and obtain required Gitxsan, Wet&apos;suwet&apos;en, and Tsimshian territory stewardship access permits when entering unceded tribal lands or band-managed boat launches.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 10: OFFLINE DATA SYNC */}
            {activeChapter === 'offline_data_sync' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider">
                    Chapter 10 &bull; Connectivity &amp; Sync
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] mt-1">
                    Data Sync &amp; Offline Caching
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    Off-Grid River Functionality, DFO Updates, and Local Cache Management
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <h5 className="font-heading font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>Offline Riverbank Mode</span>
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      All historical dataset curves (1956–Present), river profiles, safety guidelines, and user field notes are cached locally in your browser. The app runs with full interactive capabilities even with zero cellular signal in the Skeena backcountry.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
                    <h5 className="font-heading font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[var(--accent-teal)]" />
                      <span>Automated DFO Refresh</span>
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Whenever an internet connection is established, the application checks for new official DFO daily test fishery updates and Environment Canada river telemetry, synchronizing the database seamlessly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:block">
            Skeena Steelhead Telemetry &bull; BC Ministry of Water, Land and Resource Stewardship &bull; DFO Tyee Operations
          </div>
          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-[var(--accent-teal)] hover:opacity-90 text-white font-mono font-bold text-xs transition shadow-sm"
          >
            Close Field Manual
          </button>
        </div>
      </div>
    </div>
  );
};
