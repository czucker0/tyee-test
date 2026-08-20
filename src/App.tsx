import React, { useState, useEffect, useMemo } from 'react';
import {
  ALL_YEARS_DATA,
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  SEASON_DAYS,
  TODAY_DAY_INDEX,
  ADULT_EXPANSION_FACTOR,
  getLatestRecordedSeasonDayIndex,
} from './data/historicalData';
import { useTyeeData } from './hooks/useTyeeData';
import {
  calculateProjection,
  getTributaryBreakdown,
  getComparisonMetricsOnDate,
} from './utils/projectionEngine';
import { Header } from './components/Header';
import { DateSliderControl } from './components/DateSliderControl';
import { SharedComparisonToolbar } from './components/SharedComparisonToolbar';
import { KeyMetricsBar } from './components/KeyMetricsBar';
import { CumulativeRunChart } from './components/CumulativeRunChart';
import { DailyRunPulseChart } from './components/DailyRunPulseChart';
import { YearRankingChart } from './components/YearRankingChart';
import { ProjectionDetailsCard } from './components/ProjectionDetailsCard';
import { TributaryForecastCard } from './components/TributaryForecastCard';
import { HistoricalComparisonTable } from './components/HistoricalComparisonTable';
import { HeadToHeadCompareCard } from './components/HeadToHeadCompareCard';
import { WhatIfSandbox } from './components/WhatIfSandbox';
import { AIAnalystModal } from './components/AIAnalystModal';
import { AboutTyeeModal } from './components/AboutTyeeModal';
import { FieldNotesView } from './components/FieldNotesView';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { AdminUserbaseModal } from './components/AdminUserbaseModal';
import { MultiplierDebateModal, MultiplierMode } from './components/MultiplierDebateModal';
import { UserGuideModal } from './components/UserGuideModal';
import { WhatsNewTourModal } from './components/WhatsNewTourModal';
import { RegionalWeatherWidget } from './components/RegionalWeatherWidget';
import { useAuth } from './context/AuthContext';
import { Footer } from './components/Footer';
import {
  TrendingUp,
  MapPin,
  Sparkles,
  Sliders,
  Waves,
  ArrowRightLeft,
  Bot,
  Lock,
  Fish,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type MainTabType = 'overview' | 'alluvial' | 'forecast' | 'compare' | 'tributaries' | 'biologist' | 'field-notes';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  // Persistent DFO Database hook with rolling decade + multi-decade archive search
  const {
    dataset,
    allYearsData: dynamicYearsData,
    selectedYears,
    setSelectedYears,
    toggleYear,
    addHistoricalYearToSelection,
  } = useTyeeData();

  const effectiveAllYears = dynamicYearsData.length > 0 ? dynamicYearsData : ALL_YEARS_DATA;

  // Calculate the highest recorded real data day index
  const latestRecordedDayIndex = useMemo(() => {
    const latestDate = dataset?.activeSeasonMetadata?.lastRecordedDate;
    if (latestDate) {
      const matchedIdx = SEASON_DAYS.findIndex(
        (s) =>
          `${CURRENT_YEAR}-${s.month < 10 ? '0' + s.month : s.month}-${s.day < 10 ? '0' + s.day : s.day}` ===
          latestDate
      );
      if (matchedIdx >= 0) return matchedIdx;
    }
    return getLatestRecordedSeasonDayIndex(effectiveAllYears);
  }, [dataset?.activeSeasonMetadata?.lastRecordedDate, effectiveAllYears]);

  // Scrubber date state (defaulting to the latest recorded real DFO data day)
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(() =>
    getLatestRecordedSeasonDayIndex()
  );
  const [hasUserScrubbed, setHasUserScrubbed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);

  // Automatically advance to latest recorded DFO day when fresh data arrives if user has not scrubbed backwards
  useEffect(() => {
    if (!hasUserScrubbed && latestRecordedDayIndex !== undefined && latestRecordedDayIndex >= 0) {
      setCurrentDayIndex(latestRecordedDayIndex);
    }
  }, [latestRecordedDayIndex, hasUserScrubbed]);

  // What-If Sandbox multiplier
  const [customMultiplier, setCustomMultiplier] = useState<number>(1.0);

  // Escapement Multiplier State (Dynamic 4-Year Rolling vs 220 Baseline vs Custom)
  const [multiplierMode, setMultiplierMode] = useState<MultiplierMode>('four_year');
  const [customExpansionFactor, setCustomExpansionFactor] = useState<number>(214);
  const [isMultiplierModalOpen, setIsMultiplierModalOpen] = useState<boolean>(false);

  const activeExpansionFactor = useMemo(() => {
    if (multiplierMode === 'four_year') return 214;
    if (multiplierMode === 'baseline_220') return 220;
    return customExpansionFactor;
  }, [multiplierMode, customExpansionFactor]);

  // Display Units: Tyee Index points vs Estimated Adult Steelhead
  const [isMetricInAdults, setIsMetricInAdults] = useState<boolean>(false);

  // 5 Main Mobile-First Tabs
  const [activeTab, setActiveTab] = useState<MainTabType>('overview');

  // Scroll detection for ultra-compact sticky date slider
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState<boolean>(() => {
    // Check if user previously checked "Don't show this popup on launch"
    const hideOnLaunch = localStorage.getItem('skeena_hide_tour_on_launch');
    return hideOnLaunch !== 'true';
  });

  // Select year presets
  const handleSelectYearPreset = (preset: 'all' | 'recent' | 'extremes' | 'vintage' | 'currentOnly') => {
    if (preset === 'all') {
      setSelectedYears(effectiveAllYears.map((y) => y.year));
    } else if (preset === 'recent') {
      setSelectedYears(effectiveAllYears.filter((y) => y.year >= 2022).map((y) => y.year));
    } else if (preset === 'extremes') {
      // Historical all-time highs and crisis lows
      const extremeYears = [1998, 2004, 2010, 2018, 2021, 2024, 2026];
      setSelectedYears(effectiveAllYears.filter((y) => extremeYears.includes(y.year)).map((y) => y.year));
    } else if (preset === 'vintage') {
      // Classic 1950s - 1980s runs
      const vintageYears = [1956, 1968, 1978, 1985, 1989, 2026];
      setSelectedYears(effectiveAllYears.filter((y) => vintageYears.includes(y.year)).map((y) => y.year));
    } else if (preset === 'currentOnly') {
      setSelectedYears([CURRENT_YEAR]);
    }
  };

  // Derived calculations
  const selectedDay = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const selectedMonthDay = selectedDay.monthDay;
  const isToday = currentDayIndex === TODAY_DAY_INDEX;

  const projection = useMemo(
    () => calculateProjection(currentDayIndex, customMultiplier, undefined, effectiveAllYears, activeExpansionFactor),
    [currentDayIndex, customMultiplier, effectiveAllYears, activeExpansionFactor]
  );

  const tributaries = useMemo(
    () =>
      getTributaryBreakdown(
        projection.projectedBaselineAdults,
        Math.round(projection.currentCumulative * activeExpansionFactor)
      ),
    [projection, activeExpansionFactor]
  );

  // Auto-synchronize slider to latest recorded date on dataset load if user hasn't manually scrubbed
  useEffect(() => {
    if (hasUserScrubbed) return;
    const latestDate = dataset?.activeSeasonMetadata?.lastRecordedDate;
    if (latestDate) {
      const matchedIdx = SEASON_DAYS.findIndex(
        (s) =>
          `${CURRENT_YEAR}-${s.month < 10 ? '0' + s.month : s.month}-${s.day < 10 ? '0' + s.day : s.day}` ===
          latestDate
      );
      if (matchedIdx >= 0) {
        setCurrentDayIndex(matchedIdx);
      }
    }
  }, [dataset?.activeSeasonMetadata?.lastRecordedDate, hasUserScrubbed]);

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(120, Math.floor(550 / playSpeed));
    const timer = setInterval(() => {
      setCurrentDayIndex((prev) => {
        if (prev >= SEASON_DAYS.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed]);

  // Handle manual date slider scrubbing
  const handleDayChange = (newIndex: number) => {
    setHasUserScrubbed(true);
    setCurrentDayIndex(newIndex);
  };

  // Reset to today
  const handleResetToToday = () => {
    setHasUserScrubbed(false);
    const latestDate = dataset?.activeSeasonMetadata?.lastRecordedDate;
    let targetIdx = TODAY_DAY_INDEX;
    if (latestDate) {
      const matchedIdx = SEASON_DAYS.findIndex(
        (s) =>
          `${CURRENT_YEAR}-${s.month < 10 ? '0' + s.month : s.month}-${s.day < 10 ? '0' + s.day : s.day}` ===
          latestDate
      );
      if (matchedIdx >= 0) targetIdx = matchedIdx;
    }
    setCurrentDayIndex(targetIdx);
    setIsPlaying(false);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#c97a2b', '#2c5a63', '#1e382b'],
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    let csv = 'Day_Index,Month_Day,Date,10Yr_Avg_Cumulative,';
    effectiveAllYears.forEach((y) => {
      csv += `${y.year}_Cumulative,`;
    });
    csv += '2026_Projected_Baseline,2026_Projected_LowCI,2026_Projected_HighCI\n';

    const projMap = new Map<number, typeof projection.projectedDailyTrajectory[0]>();
    projection.projectedDailyTrajectory.forEach((t) => {
      projMap.set(t.dayOfYear - 1, t);
    });

    SEASON_DAYS.forEach((sDay, idx) => {
      const hist = HISTORICAL_AVERAGE_CURVE[idx];
      const pItem = projMap.get(idx);
      csv += `${idx},"${sDay.monthDay}","2026-${sDay.month < 10 ? '0' + sDay.month : sDay.month}-${sDay.day < 10 ? '0' + sDay.day : sDay.day}",${hist?.avgCumulative || 0},`;
      effectiveAllYears.forEach((y) => {
        csv += `${y.data[idx]?.cumulativeIndex ?? ''},`;
      });
      csv += `${pItem?.projectedCumulative ?? ''},${pItem?.projectedCumulativeLow ?? ''},${pItem?.projectedCumulativeHigh ?? ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Skeena_Tyee_Run_Data_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tab definitions
  const tabs = [
    {
      id: 'overview' as MainTabType,
      label: 'Run Overview',
      shortLabel: 'Overview',
      icon: <Fish className="w-4 h-4" />,
      badge: 'Live',
    },
    {
      id: 'forecast' as MainTabType,
      label: 'Run Forecast',
      shortLabel: 'Forecast',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'compare' as MainTabType,
      label: 'Historical Archive',
      shortLabel: 'History',
      icon: <ArrowRightLeft className="w-4 h-4" />,
      badge: '70 Yrs',
    },
    {
      id: 'tributaries' as MainTabType,
      label: 'Tributaries',
      shortLabel: 'Watersheds',
      icon: <Waves className="w-4 h-4" />,
    },
    {
      id: 'field-notes' as MainTabType,
      label: 'Field Notes',
      shortLabel: 'Vault',
      icon: user ? <MapPin className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
      badge: user ? 'Sync' : 'Auth',
    },
  ];

  // Auth loading splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center">
        <div className="text-center space-y-3 font-mono">
          <div className="w-10 h-10 border-3 border-[var(--accent-amber)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-secondary)] font-bold tracking-wider uppercase">
            Synchronizing Skeena Telemetry...
          </p>
        </div>
      </div>
    );
  }

  // Auth gate check
  if (!user) {
    return (
      <>
        <AuthGate />
        <AuthModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] flex flex-col font-sans selection:bg-[var(--accent-amber)] selection:text-white pb-16 sm:pb-0 transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenAI={() => setIsAIModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenUserGuide={() => setIsUserGuideModalOpen(true)}
        onOpenTourModal={() => setIsTourModalOpen(true)}
        onToggleSandbox={() => setIsSandboxOpen(!isSandboxOpen)}
        isSandboxOpen={isSandboxOpen}
        onExportCSV={handleExportCSV}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLoadScenario={(m) => {
          setCustomMultiplier(m);
          setIsSandboxOpen(true);
        }}
      />

      {/* Timeline & Navigation Header Dock - Stable height, zero scroll jitter */}
      <div className="sticky top-0 sm:top-[53px] z-30 bg-[var(--bg-surface)]/95 border-b border-[var(--border-main)] shadow-sm backdrop-blur-md py-1.5 sm:py-2">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 space-y-1.5">
          {/* Date Slider Control (Ultra-compact minimal mode when scrolled) */}
          <DateSliderControl
            currentDayIndex={currentDayIndex}
            onDayChange={handleDayChange}
            percentElapsed={projection.percentElapsedHistorical}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            playSpeed={playSpeed}
            onChangeSpeed={(spd) => setPlaySpeed(spd)}
            latestRecordedDayIndex={latestRecordedDayIndex}
            isCompactSticky={isScrolled}
          />

          {/* Segmented Tab Navigation - Full Width 5-Column Grid on sm+ screens */}
          <div className="hidden sm:grid grid-cols-5 gap-1.5 sm:gap-2 w-full font-mono py-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-[13px] rounded-lg font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-amber)] text-white shadow-sm font-black'
                      : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)]'
                  }`}
                >
                  <span className="shrink-0">
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold uppercase shrink-0 hidden xl:inline ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">
        {/* What-If Sandbox Alert Banner (if multiplier != 1.0) */}
        {customMultiplier !== 1.0 && (
          <div className="bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] rounded-xl p-3.5 flex items-center justify-between shadow-sm text-xs animate-in fade-in text-[var(--text-main)]">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[var(--accent-amber)]" />
              <span>
                <strong>What-If Sandbox Active:</strong> Simulating run scaled to{' '}
                <strong className="text-[var(--accent-amber)] font-mono font-bold">{(customMultiplier * 100).toFixed(0)}%</strong> of live pace.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomMultiplier(1.0)}
                className="px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] transition font-bold cursor-pointer"
              >
                Reset to Live
              </button>
              <button
                onClick={() => setIsSandboxOpen(true)}
                className="text-[var(--accent-amber)] hover:underline font-medium cursor-pointer"
              >
                Adjust Sandbox
              </button>
            </div>
          </div>
        )}

        {/* 1. OVERVIEW TAB - Pure Live 2026 In-Season Focus */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Key Metric Cards */}
            <KeyMetricsBar
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              onToggleMetricMode={() => setIsMetricInAdults(!isMetricInAdults)}
              allYears={effectiveAllYears}
              currentDayIndex={currentDayIndex}
              multiplierMode={multiplierMode}
              multiplierValue={activeExpansionFactor}
              onSelectMultiplierMode={(m) => setMultiplierMode(m)}
              onOpenMultiplierDebate={() => setIsMultiplierModalOpen(true)}
            />

            {/* Primary Cumulative Run Line Chart (2026 vs 10-Yr Baseline) */}
            <CumulativeRunChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              selectedYears={[CURRENT_YEAR]}
              onToggleYear={toggleYear}
              onSelectPreset={handleSelectYearPreset}
              allYears={effectiveAllYears}
            />

            {/* Daily Drift Net Sets & In-Season Migration Pulses (2026 Focus) */}
            <DailyRunPulseChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
              mode="in-season-overview"
            />

            {/* Quick CTA to 70-Year Historical Comparison Archive (Positioned at bottom) */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-heading font-extrabold text-[var(--text-main)]">
                    Looking for 70-Year Multi-Season Comparisons?
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    Overlay benchmark years (1956–2025), compare modern decade curves, inspect daily pulse matchups, and download historical datasets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('compare')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--accent-amber)] text-xs font-mono font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Open Historical Comparison</span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              </button>
            </div>
          </div>
        )}

        {/* 2. FORECAST & PROJECTIONS TAB - 2026 Trajectory & Scenarios */}
        {activeTab === 'forecast' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Statistical Projection & Multi-Scenario Models */}
            <ProjectionDetailsCard
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              multiplierMode={multiplierMode}
              multiplierValue={activeExpansionFactor}
              onSelectMultiplierMode={(m) => setMultiplierMode(m)}
              onOpenMultiplierDebate={() => setIsMultiplierModalOpen(true)}
            />

            {/* Trajectory comparison on cumulative chart (2026 Projected Bounds & Envelope) */}
            <CumulativeRunChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
              selectedYears={[CURRENT_YEAR]}
              onToggleYear={toggleYear}
              onSelectPreset={handleSelectYearPreset}
              allYears={effectiveAllYears}
            />

            {/* Interactive Sandbox Trigger Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[var(--accent-amber)]" />
                  <h3 className="text-base font-heading font-extrabold text-[var(--text-main)]">Interactive Run Simulation Sandbox</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                  Adjust simulated run velocity, delay factors, or river temperatures to project end-of-season outcomes.
                </p>
              </div>
              <button
                onClick={() => setIsSandboxOpen(true)}
                className="px-4 py-2 rounded-xl bg-[var(--accent-amber)] text-white text-xs font-bold transition shadow-sm flex items-center gap-2 shrink-0 hover:opacity-90 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Open What-If Sandbox</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. HISTORICAL COMPARISON TAB */}
        {activeTab === 'compare' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Unified Comparison Year Selector Dock */}
            <SharedComparisonToolbar
              allYears={effectiveAllYears}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onSelectEraPreset={(yrs) => setSelectedYears([CURRENT_YEAR, ...yrs.filter((y) => y !== CURRENT_YEAR)])}
              onClearAll={() => setSelectedYears([CURRENT_YEAR])}
            />

            {/* Multi-Season Overlay S-Curve Line Chart */}
            <CumulativeRunChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onSelectPreset={handleSelectYearPreset}
              allYears={effectiveAllYears}
            />

            {/* Head-to-Head Benchmark Matchup */}
            <HeadToHeadCompareCard
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onSelectYears={setSelectedYears}
              allYears={effectiveAllYears}
            />

            {/* Comprehensive Multi-Season Daily Migration Pulse Comparison */}
            <DailyRunPulseChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
              mode="full-comparison"
            />

            {/* Annual Ranking Chart */}
            <YearRankingChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              allYears={effectiveAllYears}
            />

            {/* Full Historical Comparison Table */}
            <HistoricalComparisonTable
              currentDayIndex={currentDayIndex}
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              allYears={effectiveAllYears}
            />
          </div>
        )}

        {/* 4. TRIBUTARIES & RIVERS TAB */}
        {activeTab === 'tributaries' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Watershed Share Breakdown & Interactive Expandable River Profiles */}
            <TributaryForecastCard
              tributaries={tributaries}
              selectedMonthDay={selectedMonthDay}
            />
          </div>
        )}

        {/* 5. PRIVATE FIELD NOTES & RIVER VAULT TAB */}
        {activeTab === 'field-notes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <FieldNotesView />
          </div>
        )}
      </main>

      {/* Application Footer with Build Timestamp & Metadata */}
      <Footer
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenAI={() => setIsAIModalOpen(true)}
        onOpenUserGuide={() => setIsUserGuideModalOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* Interactive What-If Sandbox Drawer */}
      <WhatIfSandbox
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        customMultiplier={customMultiplier}
        onMultiplierChange={(m) => setCustomMultiplier(m)}
        projection={projection}
        selectedMonthDay={selectedMonthDay}
      />

      {/* AI Fisheries Escapement Analyst Modal */}
      <AIAnalystModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        projection={projection}
        selectedMonthDay={selectedMonthDay}
        tributaries={tributaries}
      />

      {/* About Tyee Test Fishery Educational Modal */}
      <AboutTyeeModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Skeena Field Manual & User Guide Master Modal */}
      <UserGuideModal
        isOpen={isUserGuideModalOpen}
        onClose={() => setIsUserGuideModalOpen(false)}
        onOpenMultiplierDebate={() => setIsMultiplierModalOpen(true)}
      />

      {/* What's New & Quick Tour Modal */}
      <WhatsNewTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onOpenFieldManual={() => setIsUserGuideModalOpen(true)}
        onOpenSteelieDan={() => setIsAIModalOpen(true)}
        onToggleSandbox={() => setIsSandboxOpen(true)}
      />

      {/* The Multiplier & Escapement Debate Modal */}
      <MultiplierDebateModal
        isOpen={isMultiplierModalOpen}
        onClose={() => setIsMultiplierModalOpen(false)}
        multiplierMode={multiplierMode}
        onSelectMode={(m) => setMultiplierMode(m)}
        currentMultiplierValue={activeExpansionFactor}
        customMultiplierValue={customExpansionFactor}
        onCustomMultiplierChange={(v) => setCustomExpansionFactor(v)}
        fourYearValue={214}
      />

      {/* Mobile Fixed Bottom Navigation Bar (5 full-width tabs) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 border-t border-[var(--border-main)] backdrop-blur-md shadow-lg transition-colors duration-200">
        <div className="grid grid-cols-5 h-14">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors relative font-mono cursor-pointer ${
                  isActive
                    ? 'text-[var(--accent-amber)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 inset-x-2 h-0.5 bg-[var(--accent-amber)] rounded-full" />
                )}
                <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-full px-0.5">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Authentication & Profile Modal */}
      <AuthModal />

      {/* Admin Userbase Directory & RBAC Permissions Modal */}
      <AdminUserbaseModal />
    </div>
  );
}
