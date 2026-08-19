import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  HelpCircle,
  Download,
  ShieldCheck,
  Compass,
  Sun,
  Moon,
  Menu,
  X,
  TrendingUp,
  Waves,
  ArrowRightLeft,
  MapPin,
  Bot,
  Lock,
  Fish,
} from 'lucide-react';
import { UserProfileMenu } from './UserProfileMenu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MainTabType } from '../types/steelhead';
import { ClassicSalmonFlyIcon } from './ClassicSalmonFlyIcon';

interface HeaderProps {
  onOpenAI: () => void;
  onOpenAbout: () => void;
  onOpenUserGuide?: () => void;
  onOpenTourModal?: () => void;
  onToggleSandbox: () => void;
  isSandboxOpen: boolean;
  onExportCSV: () => void;
  onLoadScenario?: (multiplier: number, timingShiftDays: number) => void;
  activeTab?: MainTabType;
  onSelectTab?: (tab: MainTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAI,
  onOpenAbout,
  onOpenUserGuide,
  onOpenTourModal,
  onToggleSandbox,
  isSandboxOpen,
  onExportCSV,
  onLoadScenario,
  activeTab = 'overview',
  onSelectTab,
}) => {
  const { isAdmin, openAdminModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isSidePanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidePanelOpen]);

  const navLinks = [
    { id: 'overview' as MainTabType, label: 'Overview & Telemetry', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'forecast' as MainTabType, label: 'Forecast & Projections', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'compare' as MainTabType, label: 'Historical Comparison', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'tributaries' as MainTabType, label: 'Tributary Escapement', icon: <MapPin className="w-4 h-4" /> },
    { id: 'field-notes' as MainTabType, label: 'Field Notes 🔒', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] backdrop-blur-md relative sm:sticky sm:top-0 z-30 shadow-sm transition-colors duration-200 w-full">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* Left Section: Mobile Hamburger + Brand Fly Illustration + Brand Logo/Title */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsSidePanelOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] transition shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Classic Salmon Fly Illustration Badge */}
              <div 
                className="relative shrink-0 flex items-center justify-center p-1 sm:p-1.5 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] shadow-xs transition-colors duration-200"
                title="BKLYNFLY Heritage Salmon & Steelhead Fly"
              >
                <ClassicSalmonFlyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-amber)]" />
              </div>

              {/* Title & Subtitle in two lines, all caps */}
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="font-heading text-sm sm:text-base lg:text-lg font-black tracking-wider text-[var(--text-main)] uppercase leading-tight truncate">
                  BKLYNFLY
                </h1>
                <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-amber)] leading-tight truncate">
                  Skeena Steelhead Run Tracker
                </p>
              </div>
            </div>

            {/* Right Action Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Theme Toggle (☀️ Day / 🌙 Night) */}
                <button
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'light' ? 'Night Mode' : 'Day Mode'}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] hover:bg-[var(--bg-card)] transition shrink-0 font-bold"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span className="hidden xl:inline">Night</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span className="hidden xl:inline">Day</span>
                    </>
                  )}
                </button>

                {/* Admin Userbase */}
                {isAdmin && (
                  <button
                    onClick={openAdminModal}
                    title="Open Admin Userbase & Permissions Directory"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] transition shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                    <span>Admin</span>
                  </button>
                )}

                {/* Sandbox */}
                <button
                  onClick={onToggleSandbox}
                  title="What-If Run Multiplier Sandbox"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono uppercase tracking-wider border transition shrink-0 ${
                    isSandboxOpen
                      ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber-border)] font-bold shadow-sm'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                  <span className="hidden xl:inline">Sandbox</span>
                </button>

                {/* Ask Steelie Dan AI */}
                <button
                  onClick={onOpenAI}
                  title="Ask Steelie Dan - The AI Wild Steelhead"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent-amber)] hover:opacity-95 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm border border-[var(--accent-amber-border)] transition shrink-0"
                >
                  <Fish className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="hidden xl:inline">Steelie Dan AI</span>
                  <span className="xl:hidden">Steelie</span>
                </button>

                {/* Export CSV */}
                <button
                  onClick={onExportCSV}
                  title="Download 10-Year Dataset (CSV)"
                  className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] transition shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* What's New & Tour Modal Trigger */}
                {onOpenTourModal && (
                  <button
                    onClick={onOpenTourModal}
                    title="What's New in v3.0 & Quick Feature Tour"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--accent-amber-light)] hover:bg-[var(--accent-amber)] text-[var(--accent-amber)] hover:text-white border border-[var(--accent-amber-border)] text-xs font-mono font-bold transition shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">What&apos;s New</span>
                  </button>
                )}

                {/* Field Guide & Manual */}
                {onOpenUserGuide && (
                  <button
                    onClick={onOpenUserGuide}
                    title="Open Skeena Field Manual & Master Reference"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] text-xs font-mono font-bold transition shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                    <span className="hidden xl:inline">Field Manual</span>
                  </button>
                )}

                {/* About */}
                <button
                  onClick={onOpenAbout}
                  title="About Tyee Test Fishery & Methodology"
                  className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] transition shrink-0"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="lg:hidden p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)]"
                title={`Switch to ${theme === 'light' ? 'Night Mode' : 'Day Mode'}`}
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-stone-600 dark:text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              {/* User Account / Profile - Desktop Only */}
              <div className="hidden lg:block border-l border-[var(--border-main)] pl-1.5 sm:pl-2 ml-0.5">
                <UserProfileMenu onLoadScenario={onLoadScenario} onOpenTourModal={onOpenTourModal} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OUT SIDE PANEL DRAWER */}
      {isSidePanelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidePanelOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[var(--bg-surface)] text-[var(--text-main)] h-full shadow-2xl flex flex-col border-r border-[var(--border-main)] z-10 animate-in slide-in-from-left duration-200">
            {/* Header of Drawer */}
            <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] shrink-0">
                  <ClassicSalmonFlyIcon className="w-5 h-5 text-[var(--accent-amber)]" />
                </div>
                <div>
                  <span className="font-heading font-black text-xs text-[var(--text-main)] block uppercase tracking-wider">
                    BKLYNFLY
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)] block uppercase tracking-wider">
                    Skeena Steelhead Run Tracker
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Tracker Views
              </div>

              {navLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      if (onSelectTab) onSelectTab(link.id);
                      setIsSidePanelOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold font-mono transition text-left ${
                      isActive
                        ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-[var(--accent-amber)]'}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </button>
                );
              })}

              <div className="pt-3 border-t border-[var(--border-main)] my-2">
                <div className="px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Field Tools &amp; Actions
                </div>

                {/* Day / Night Theme Button */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition font-mono mt-1"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'light' ? <Moon className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                    <span>Theme: {theme === 'light' ? 'Night Mode' : 'Day Mode'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-main)] font-bold text-[var(--accent-amber)]">
                    Toggle
                  </span>
                </button>

                {/* What-If Sandbox */}
                <button
                  onClick={() => {
                    onToggleSandbox();
                    setIsSidePanelOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition font-mono"
                >
                  <Sliders className="w-4 h-4 text-[var(--accent-amber)]" />
                  <span>Run What-If Sandbox</span>
                </button>

                {/* Ask Steelie Dan AI */}
                <button
                  onClick={() => {
                    onOpenAI();
                    setIsSidePanelOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition font-mono"
                >
                  <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
                  <span>Ask Steelie Dan (AI Modal)</span>
                </button>

                {/* CSV Export */}
                <button
                  onClick={() => {
                    onExportCSV();
                    setIsSidePanelOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition font-mono"
                >
                  <Download className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Export 10-Yr CSV</span>
                </button>

                {/* Field Guide & Manual */}
                {onOpenUserGuide && (
                  <button
                    onClick={() => {
                      onOpenUserGuide();
                      setIsSidePanelOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-main)] font-bold hover:bg-[var(--bg-subtle)] transition font-mono"
                  >
                    <Compass className="w-4 h-4 text-[var(--accent-amber)]" />
                    <span>Field Manual &amp; Reference</span>
                  </button>
                )}

                {/* What's New & Tour Trigger */}
                {onOpenTourModal && (
                  <button
                    onClick={() => {
                      onOpenTourModal();
                      setIsSidePanelOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--accent-amber)] font-bold hover:bg-[var(--bg-subtle)] transition font-mono"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>What&apos;s New &amp; Quick Tour</span>
                  </button>
                )}

                {/* About Tyee */}
                <button
                  onClick={() => {
                    onOpenAbout();
                    setIsSidePanelOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition font-mono"
                >
                  <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>About Tyee Methodology</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      openAdminModal();
                      setIsSidePanelOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--accent-amber)] hover:bg-[var(--bg-subtle)] transition font-mono"
                  >
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-amber)]" />
                    <span>Admin Directory</span>
                  </button>
                )}
              </div>

              {/* User Profile / Account Section at bottom of drawer */}
              <div className="pt-3 border-t border-[var(--border-main)] mt-2">
                <div className="px-2 pb-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Account &amp; Workspace
                </div>
                <div className="p-1">
                  <UserProfileMenu onLoadScenario={onLoadScenario} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
              <span>DFO Tyee Test Fishery</span>
              <span className="text-[var(--accent-amber)] font-bold">1956–2026</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
