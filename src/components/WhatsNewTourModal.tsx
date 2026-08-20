import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Compass,
  Waves,
  Thermometer,
  Lock,
  Bot,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Zap,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface WhatsNewTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'overview' | 'forecast' | 'compare' | 'tributaries' | 'field-notes') => void;
  onOpenFieldManual?: () => void;
  onOpenSteelieDan?: () => void;
  onToggleSandbox?: () => void;
}

export const WhatsNewTourModal: React.FC<WhatsNewTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenFieldManual,
  onOpenSteelieDan,
  onToggleSandbox,
}) => {
  const [activeTab, setActiveTab] = useState<'whats_new' | 'tour'>('whats_new');
  const [currentWhatsNewIndex, setCurrentWhatsNewIndex] = useState<number>(0);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  
  // Read initial don't show preference from localStorage
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('skeena_hide_tour_on_launch') === 'true';
  });

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('skeena_hide_tour_on_launch', 'true');
    } else {
      localStorage.removeItem('skeena_hide_tour_on_launch');
    }
    onClose();
  };

  const handleToggleDontShow = (checked: boolean) => {
    setDontShowAgain(checked);
    if (checked) {
      localStorage.setItem('skeena_hide_tour_on_launch', 'true');
    } else {
      localStorage.removeItem('skeena_hide_tour_on_launch');
    }
  };

  // What's New Feature Highlights
  const whatsNewFeatures = [
    {
      featureNumber: '01',
      badge: 'Hydrology & Weather',
      badgeColor: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
      icon: Thermometer,
      title: 'Real-Time Hydrology & 5-Day Weather Intelligence',
      subtitle: 'Water Survey of Canada Telemetry & Atmospheric Models',
      description:
        'Live Water Survey of Canada (WSC) discharge telemetry (m³/s), river stage trends, estimated Secchi clarity, and Open-Meteo 5-day precipitation and temperature forecasts for all major Skeena sub-basins with regional Terrace & Smithers hubs.',
      takeaway: 'Know river flows, water clarity, and rainfall spikes before you rig up.',
      actionText: 'Explore Tributaries & Hydro',
      action: () => {
        handleClose();
        if (onNavigateToTab) onNavigateToTab('tributaries');
      },
    },
    {
      featureNumber: '02',
      badge: 'Mainstem Zoning',
      badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      icon: Waves,
      title: 'Lower & Middle Skeena Mainstem Reach Corridors',
      subtitle: 'Tidewater Estuary & Kitselas/Usk Transit Zones',
      description:
        'Dedicated telemetry tracking for the Tidewater-to-Terrace estuary migration corridor and the Middle Skeena (Terrace to Hazelton / Usk Station 08EF001) transit reach.',
      takeaway: 'Track fish pulses through the mainstem before they enter tributary systems.',
      actionText: 'View Mainstem Reaches',
      action: () => {
        handleClose();
        if (onNavigateToTab) onNavigateToTab('tributaries');
      },
    },
    {
      featureNumber: '03',
      badge: 'Conservation Alert',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      icon: Activity,
      title: '18°C Thermal Stress Safety Gauge',
      subtitle: 'Catch & Release Conservation Thresholds',
      description:
        'Prominently identifies cold-water optimal swung-fly temperatures (8.0°C – 14.5°C) and flags the 18°C (64.4°F) catch-and-release handling threshold to protect wild summer steelhead from warm-water mortality.',
      takeaway: 'Adhere to thermal safety ethics when water temps rise in mid-summer.',
      actionText: 'View Reference Guidelines',
      action: () => {
        handleClose();
        if (onOpenFieldManual) onOpenFieldManual();
      },
    },
    {
      featureNumber: '04',
      badge: 'Privacy & Security',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: Lock,
      title: 'Zero-Knowledge Notes Vault',
      subtitle: 'Client-Side AES-GCM 256-Bit Cryptography',
      description:
        'Military-grade browser-native AES-GCM 256-bit client-side encryption with PBKDF2 passphrases. Keep private GPS coordinates, honey holes, and fly patterns completely unreadable by third parties.',
      takeaway: 'Your private beats and catch data stay encrypted on your device.',
      actionText: 'Open Notes Vault',
      action: () => {
        handleClose();
        if (onNavigateToTab) onNavigateToTab('field-notes');
      },
    },
    {
      featureNumber: '05',
      badge: 'Reference Manual',
      badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      icon: Compass,
      title: '10-Chapter Skeena Master Reference Manual',
      subtitle: 'Complete Guide to Runs, Biology & Tactics',
      description:
        'Deep dive into test fishery physics, the 40-point emergency closure metric, genetic stock identification (GSI), Spey tactics, and First Nations territory access protocols.',
      takeaway: 'Comprehensive scientific handbook available on and offline.',
      actionText: 'Read Master Manual',
      action: () => {
        handleClose();
        if (onOpenFieldManual) onOpenFieldManual();
      },
    },
  ];

  // 5-Step Guided Tour Content
  const tourSteps = [
    {
      stepNumber: '01',
      title: 'Real-Time Tyee Test Fishery Index',
      subtitle: 'Daily Catch-Per-Unit-Effort & Slack Drift Mechanics',
      icon: Waves,
      content:
        'Operating at Telegraph Point since 1956, the DFO Tyee Test Fishery provides standardized daily CPUE indices. The dashboard visualizes daily migration pulses alongside the running cumulative index compared against 10-year, 20-year, and historical brood cycles.',
      highlights: [
        'Standardized 1-hour slack tide gillnet drifts',
        'Daily index pulses & run momentum indicator',
        'Interactive date timeline scrubber (June 10 – Sept 30)',
      ],
      quickAction: () => {
        handleClose();
        if (onNavigateToTab) onNavigateToTab('overview');
      },
      actionLabel: 'Go to Overview',
    },
    {
      stepNumber: '02',
      title: 'Sub-Basin Escapement & Hydrology',
      subtitle: 'Genetic Stock Shares & Real-Time River Gauges',
      icon: MapPin,
      content:
        'Genetic Stock Identification (GSI) partitions the run across the Bulkley/Morice, Babine, Kispiox, Sustut, Zymoetz, and Kalum sub-basins. Inspect live water temps, discharge (m³/s), clarity estimates, and 5-day weather forecasts.',
      highlights: [
        'Multi-decade GSI stock proportion baselines',
        'Live hydrometric data from WSC monitoring stations',
        '18°C thermal stress safety indicators',
      ],
      quickAction: () => {
        handleClose();
        if (onNavigateToTab) onNavigateToTab('tributaries');
      },
      actionLabel: 'Explore Tributary Forecasts',
    },
    {
      stepNumber: '03',
      title: 'Predictive Models & What-If Sandbox',
      subtitle: 'In-Season Statistical Envelopes & Run Simulation',
      icon: TrendingUp,
      content:
        'Evaluate projected season totals using Early (-5d), Normal (10-yr), and Late (+5d) Gaussian timing models. Open the What-If Sandbox to adjust the expansion multiplier, simulate pulse surges, or assess emergency conservation thresholds.',
      highlights: [
        '80% confidence interval projections & RMSE analog matching',
        'What-If multiplier adjustments (0.5x to 2.0x)',
        'Synthetic pulse injector for scenario testing',
      ],
      quickAction: () => {
        handleClose();
        if (onToggleSandbox) onToggleSandbox();
      },
      actionLabel: 'Open What-If Sandbox',
    },
    {
      stepNumber: '04',
      title: 'Zero-Knowledge Notes Vault',
      subtitle: 'AES-GCM 256-Bit Encrypted Angler Logbook',
      icon: Lock,
      content:
        'Store your river logs, fly patterns, water clarity observations, and confidential beats with client-side zero-knowledge encryption. Data is encrypted using your private master passphrase before saving.',
      highlights: [
        'Client-side AES-GCM 256-bit Web Crypto encryption',
        'PBKDF2 key derivation (100,000 iterations)',
        'Offline JSON backup download & restoration',
      ],
      quickAction: () => {
        handleClose();
        if (onNavigateToTab) onNavigateToTab('field-notes');
      },
      actionLabel: 'Go to Notes Vault',
    },
    {
      stepNumber: '05',
      title: 'Steelie Dan AI & Help Reference',
      subtitle: 'Watershed Intelligence, Spey Tactics & Classified Waters',
      icon: Bot,
      content:
        'Chat with Steelie Dan, an AI advisor grounded in real-time Skeena readings, river discharge, fly selection ethics, Classified Waters regulations, and First Nations access protocols.',
      highlights: [
        'Real-time hydro and weather-grounded AI responses',
        'Spey sink-tip, fly pattern, and holding reach guidance',
        'Classified Waters licensing & tribal access etiquette',
      ],
      quickAction: () => {
        handleClose();
        if (onOpenSteelieDan) onOpenSteelieDan();
      },
      actionLabel: 'Chat with Steelie Dan AI',
    },
  ];

  const activeFeature = whatsNewFeatures[currentWhatsNewIndex];
  const FeatureIcon = activeFeature.icon;

  const activeStep = tourSteps[currentTourStep];
  const StepIcon = activeStep.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden text-[var(--text-main)] transition-all max-h-[82dvh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="p-3.5 sm:p-5 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-heading font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                  Welcome to BKLYNFLY Run Tracker
                </h2>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)] px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  v3.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-mono">
                Skeena River Escapement Telemetry &amp; Field Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-main)] transition shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-[var(--border-main)] bg-[var(--bg-surface)] px-3 sm:px-6 shrink-0 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('whats_new')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'whats_new'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>What&apos;s New ({whatsNewFeatures.length})</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-amber-500/10 text-amber-500 font-extrabold border border-amber-500/30">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tour')}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'tour'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Interactive Tour ({tourSteps.length} Steps)</span>
          </button>
        </div>

        {/* Content Body Area (Smooth scrolling within viewport) */}
        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* TAB 1: WHAT'S NEW (PAGINATED CARDS) */}
          {activeTab === 'whats_new' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Pagination Dots & Count */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3">
                <div className="flex items-center gap-1.5">
                  {whatsNewFeatures.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentWhatsNewIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentWhatsNewIndex === idx
                          ? 'w-7 bg-[var(--accent-amber)]'
                          : 'w-2 bg-[var(--border-main)] hover:bg-[var(--text-muted)]'
                      }`}
                      title={`Go to feature ${idx + 1}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Feature <strong className="text-[var(--text-main)]">{currentWhatsNewIndex + 1}</strong> of {whatsNewFeatures.length}
                </span>
              </div>

              {/* Active Paginated What's New Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] shrink-0">
                    <FeatureIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${activeFeature.badgeColor}`}>
                        {activeFeature.badge}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                        Feature {activeFeature.featureNumber}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)]">
                      {activeFeature.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      {activeFeature.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                  {activeFeature.description}
                </p>

                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />
                  <span className="text-xs font-sans text-[var(--text-main)] italic">
                    {activeFeature.takeaway}
                  </span>
                </div>

                {/* Card Actions & Carousel Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--border-main)] flex-wrap">
                  <button
                    onClick={activeFeature.action}
                    className="px-3.5 py-2 rounded-xl bg-[var(--accent-amber)] hover:opacity-95 text-white text-xs font-mono font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    <span>{activeFeature.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => setCurrentWhatsNewIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentWhatsNewIndex === 0}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] disabled:opacity-40 text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentWhatsNewIndex((prev) =>
                          prev < whatsNewFeatures.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1 font-bold"
                    >
                      <span>{currentWhatsNewIndex === whatsNewFeatures.length - 1 ? 'Start Over' : 'Next'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE TOUR (PAGINATED CARDS) */}
          {activeTab === 'tour' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Step Navigation Dots */}
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3">
                <div className="flex items-center gap-1.5">
                  {tourSteps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTourStep(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentTourStep === idx
                          ? 'w-7 bg-[var(--accent-amber)]'
                          : 'w-2 bg-[var(--border-main)] hover:bg-[var(--text-muted)]'
                      }`}
                      title={`Go to step ${step.stepNumber}: ${step.title}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Step <strong className="text-[var(--text-main)]">{currentTourStep + 1}</strong> of {tourSteps.length}
                </span>
              </div>

              {/* Active Step Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] shrink-0">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)] uppercase tracking-wider block">
                      TOUR STEP {activeStep.stepNumber}
                    </span>
                    <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)]">
                      {activeStep.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      {activeStep.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                  {activeStep.content}
                </p>

                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider block">
                    Key Capabilities:
                  </span>
                  <ul className="space-y-1">
                    {activeStep.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--border-main)] flex-wrap">
                  <button
                    onClick={activeStep.quickAction}
                    className="px-3.5 py-2 rounded-xl bg-[var(--accent-amber)] hover:opacity-95 text-white text-xs font-mono font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    <span>{activeStep.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => setCurrentTourStep((prev) => Math.max(0, prev - 1))}
                      disabled={currentTourStep === 0}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] disabled:opacity-40 text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentTourStep((prev) =>
                          prev < tourSteps.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1 font-bold"
                    >
                      <span>{currentTourStep === tourSteps.length - 1 ? 'Start Over' : 'Next'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Area: Don't Show Toggle & Dismiss Button */}
        <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleToggleDontShow(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-main)] text-[var(--accent-amber)] focus:ring-[var(--accent-amber)] bg-[var(--bg-card)] cursor-pointer accent-[var(--accent-amber)]"
            />
            <span>Don&apos;t show on startup</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 rounded-xl bg-[var(--accent-amber)] hover:opacity-95 text-white font-heading font-extrabold text-xs tracking-wider uppercase transition shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
