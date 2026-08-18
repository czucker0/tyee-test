import React, { useState, useEffect, useMemo } from 'react';
import {
  ALL_YEARS_DATA,
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  SEASON_DAYS,
  TODAY_DAY_INDEX,
  TODAY_MONTH_DAY,
  ADULT_EXPANSION_FACTOR,
  LATEST_RECORDED_DAY_INDEX,
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
import { KeyMetricsBar } from './components/KeyMetricsBar';
import { CumulativeRunChart } from './components/CumulativeRunChart';
import { DailyRunPulseChart } from './components/DailyRunPulseChart';
import { YearRankingChart } from './components/YearRankingChart';
import { ProjectionDetailsCard } from './components/ProjectionDetailsCard';
import { TributaryForecastCard } from './components/TributaryForecastCard';
import { HistoricalComparisonTable } from './components/HistoricalComparisonTable';
import { HeadToHeadCompareCard } from './components/HeadToHeadCompareCard';
import { HistoricalYearArchiveSearch } from './components/HistoricalYearArchiveSearch';
import { WhatIfSandbox } from './components/WhatIfSandbox';
import { AIAnalystModal } from './components/AIAnalystModal';
import { AboutTyeeModal } from './components/AboutTyeeModal';
import { DFODataSyncModal } from './components/DFODataSyncModal';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { AdminUserbaseModal } from './components/AdminUserbaseModal';
import { useAuth } from './context/AuthContext';
import { Footer } from './components/Footer';
import {
  TrendingUp,
  Activity,
  MapPin,
  Table,
  Sparkles,
  Sliders,
  BarChart3,
  Waves,
  ArrowRightLeft,
  Bot,
  LayoutDashboard,
  Calendar,
  Layers,
  Database,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type MainTabType = 'overview' | 'forecast' | 'compare' | 'tributaries' | 'biologist';

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
    isLoading,
    isSyncing,
    syncMessage,
    triggerDailySync,
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

  // What-If Sandbox multiplier
  const [customMultiplier, setCustomMultiplier] = useState<number>(1.0);

  // Display Units: Tyee Index points vs Estimated Adult Steelhead
  const [isMetricInAdults, setIsMetricInAdults] = useState<boolean>(false);

  // 5 Main Mobile-First Tabs
  const [activeTab, setActiveTab] = useState<MainTabType>('overview');

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isDFOSyncOpen, setIsDFOSyncOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Select year presets
  const handleSelectYearPreset = (preset: 'all' | 'recent' | 'extremes' | 'currentOnly') => {
    if (preset === 'all') {
      setSelectedYears(effectiveAllYears.map((y) => y.year));
    } else if (preset === 'recent') {
      setSelectedYears(effectiveAllYears.filter((y) => y.year >= 2022).map((y) => y.year));
    } else if (preset === 'extremes') {
      setSelectedYears([2016, 2018, 2021, 2025, 2026]);
    } else if (preset === 'currentOnly') {
      setSelectedYears([CURRENT_YEAR]);
    }
  };

  // Derived calculations
  const selectedDay = SEASON_DAYS[currentDayIndex] || SEASON_DAYS[0];
  const selectedMonthDay = selectedDay.monthDay;
  const isToday = currentDayIndex === TODAY_DAY_INDEX;

  const projection = useMemo(
    () => calculateProjection(currentDayIndex, customMultiplier, undefined, effectiveAllYears),
    [currentDayIndex, customMultiplier, effectiveAllYears]
  );

  const tributaries = useMemo(
    () =>
      getTributaryBreakdown(
        projection.projectedBaselineAdults,
        Math.round(projection.currentCumulative * ADULT_EXPANSION_FACTOR)
      ),
    [projection]
  );

  const comparisonMetrics = useMemo(
    () => getComparisonMetricsOnDate(currentDayIndex, effectiveAllYears),
    [currentDayIndex, effectiveAllYears]
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
      colors: ['#06b6d4', '#6366f1', '#10b981'],
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

      csv += `${idx + 1},${sDay.monthDay},2026-${sDay.month < 10 ? '0' + sDay.month : sDay.month}-${sDay.day < 10 ? '0' + sDay.day : sDay.day},${hist?.avgCumulative || 0},`;

      effectiveAllYears.forEach((y) => {
        csv += `${y.data[idx]?.cumulativeIndex || 0},`;
      });

      const projCum = pItem ? pItem.projectedCumulative : '';
      const projLow = pItem ? pItem.projectedCumulativeLow : '';
      const projHigh = pItem ? pItem.projectedCumulativeHigh : '';

      csv += `${projCum},${projLow},${projHigh}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skeena_Steelhead_DFO_Dataset_${selectedMonthDay.replace(' ', '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tab definitions
  const tabs = [
    {
      id: 'overview' as MainTabType,
      label: 'Overview',
      shortLabel: 'Overview',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: 'Live',
    },
    {
      id: 'forecast' as MainTabType,
      label: 'Forecast & Projections',
      shortLabel: 'Forecast',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'compare' as MainTabType,
      label: 'Historical Comparison',
      shortLabel: 'Compare',
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
    {
      id: 'tributaries' as MainTabType,
      label: 'Tributaries & Rivers',
      shortLabel: 'Rivers',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'biologist' as MainTabType,
      label: 'AI Biologist & DFO',
      shortLabel: 'Biologist',
      icon: <Bot className="w-4 h-4" />,
    },
  ];

  // Auth Protection Gate: Block application until user is signed in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="relative p-4 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
          <Waves className="w-8 h-8 animate-pulse text-cyan-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-white tracking-wide">SKEENA STEELHEAD TRACKER</p>
          <p className="text-xs text-slate-400">Verifying authorized river profile &amp; security clearance...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthGate />
        <AuthModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 pb-16 sm:pb-0">
      {/* Top Header */}
      <Header
        selectedMonthDay={selectedMonthDay}
        isToday={isToday}
        onResetToToday={handleResetToToday}
        onOpenAI={() => setActiveTab('biologist')}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenDFOSync={() => setIsDFOSyncOpen(true)}
        onToggleSandbox={() => setIsSandboxOpen(!isSandboxOpen)}
        isSandboxOpen={isSandboxOpen}
        onExportCSV={handleExportCSV}
        conservationTier={projection.conservationTier}
        onLoadScenario={(m) => {
          setCustomMultiplier(m);
          setIsSandboxOpen(true);
        }}
      />

      {/* Pinned Timeline & Navigation Dock (Sticky Under Header) */}
      <div className="sticky top-[61px] sm:top-[69px] z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 space-y-2.5">
          {/* Pinned Date Slider Control */}
          <DateSliderControl
            currentDayIndex={currentDayIndex}
            onDayChange={handleDayChange}
            percentElapsed={projection.percentElapsedHistorical}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            playSpeed={playSpeed}
            onChangeSpeed={(spd) => setPlaySpeed(spd)}
            latestRecordedDayIndex={latestRecordedDayIndex}
          />

          {/* Sticky Segmented Pill Navigation Tab Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-950/50 font-extrabold'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-cyan-400'}>
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        isActive
                          ? 'bg-slate-950/30 text-slate-950'
                          : 'bg-cyan-500/20 text-cyan-300'
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* What-If Sandbox Alert Banner (if multiplier != 1.0) */}
        {customMultiplier !== 1.0 && (
          <div className="bg-purple-950/60 border border-purple-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-lg text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-purple-300" />
              <span>
                <strong>What-If Sandbox Active:</strong> Simulating run scaled to{' '}
                <strong className="text-purple-300">{(customMultiplier * 100).toFixed(0)}%</strong> of live pace.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomMultiplier(1.0)}
                className="px-2.5 py-1 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600 transition font-bold"
              >
                Reset to Live
              </button>
              <button
                onClick={() => setIsSandboxOpen(true)}
                className="text-purple-300 hover:text-white underline font-medium"
              >
                Adjust Sandbox
              </button>
            </div>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
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
            />

            {/* Primary Cumulative Run Line Chart */}
            <CumulativeRunChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onSelectPreset={handleSelectYearPreset}
              allYears={effectiveAllYears}
            />

            {/* Daily Drift Net Sets & Migration Pulses */}
            <DailyRunPulseChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
            />
          </div>
        )}

        {/* 2. FORECAST & PROJECTIONS TAB */}
        {activeTab === 'forecast' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Statistical Projection & Multi-Scenario Models */}
            <ProjectionDetailsCard
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
            />

            {/* Trajectory comparison on cumulative chart */}
            <CumulativeRunChart
              currentDayIndex={currentDayIndex}
              projection={projection}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onSelectPreset={handleSelectYearPreset}
              allYears={effectiveAllYears}
            />

            {/* Interactive Sandbox Trigger Card */}
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Interactive Run Simulation Sandbox</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust simulated run velocity, delay factors, or river temperatures to project end-of-season outcomes.
                </p>
              </div>
              <button
                onClick={() => setIsSandboxOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-950 flex items-center gap-2 shrink-0"
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
            {/* Head-to-Head Benchmark Matchup */}
            <HeadToHeadCompareCard
              currentDayIndex={currentDayIndex}
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onSelectYears={setSelectedYears}
              allYears={effectiveAllYears}
            />

            {/* Multi-Decade Archive Search & Picker */}
            <HistoricalYearArchiveSearch
              availableArchiveYears={dataset?.availableArchiveYears || [1998, 1999, 2000, 2004, 2006, 2010, 2012, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]}
              allYearsData={effectiveAllYears}
              selectedYears={selectedYears}
              onSelectYear={addHistoricalYearToSelection}
              currentYear={CURRENT_YEAR}
            />

            {/* Annual 11-Year Ranking Chart */}
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
            {/* Watershed Share Breakdown & River Profiles */}
            <TributaryForecastCard
              tributaries={tributaries}
              selectedMonthDay={selectedMonthDay}
            />

            {/* River Run Context & Comparison */}
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

        {/* 5. AI BIOLOGIST & DFO TELEMETRY TAB */}
        {activeTab === 'biologist' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Status Hero */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    DFO In-Season Fisheries Biologist AI
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Real-time ecological assessment powered by Gemini. Analyzes migration velocity, Skeena discharge, water temperatures, and historical analog runs.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Full Biologist Modal</span>
                </button>
                <button
                  onClick={() => setIsDFOSyncOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>DFO Sync Hub</span>
                </button>
              </div>
            </div>

            {/* Projection & Escapement Overview */}
            <ProjectionDetailsCard
              projection={projection}
              selectedMonthDay={selectedMonthDay}
              isMetricInAdults={isMetricInAdults}
            />

            {/* Historical Reference Table */}
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
      </main>

      {/* Mobile Bottom Quick Tab Bar (Sticky at bottom on small screens) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 shadow-2xl flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-[11px] font-bold ${
                isActive
                  ? 'text-cyan-300 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-md transition ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                {tab.icon}
              </div>
              <span className="mt-0.5 leading-none">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Application Footer with Build Timestamp & Metadata */}
      <Footer
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenDFOSync={() => setIsDFOSyncOpen(true)}
        onOpenAI={() => setIsAIModalOpen(true)}
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

      {/* DFO Live Synchronization & Table Importer Modal */}
      <DFODataSyncModal
        isOpen={isDFOSyncOpen}
        onClose={() => setIsDFOSyncOpen(false)}
        onSyncTrigger={triggerDailySync}
        isSyncingParent={isSyncing}
        syncMessageParent={syncMessage}
        activeSeasonMetadata={dataset?.activeSeasonMetadata}
        lastUpdated={dataset?.lastUpdated}
      />

      {/* User Authentication & Profile Modal */}
      <AuthModal />

      {/* Admin Userbase Directory & RBAC Permissions Modal */}
      <AdminUserbaseModal />
    </div>
  );
}

