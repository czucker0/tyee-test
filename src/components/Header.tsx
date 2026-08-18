import React, { useState, useRef, useEffect } from 'react';
import {
  Fish,
  Sparkles,
  Sliders,
  HelpCircle,
  Download,
  AlertCircle,
  CheckCircle2,
  Database,
  ShieldCheck,
  MoreVertical,
  X,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { UserProfileMenu } from './UserProfileMenu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  selectedMonthDay: string;
  isToday: boolean;
  onResetToToday: () => void;
  onOpenAI: () => void;
  onOpenAbout: () => void;
  onToggleSandbox: () => void;
  isSandboxOpen: boolean;
  onExportCSV: () => void;
  conservationTier: string;
  onLoadScenario?: (multiplier: number, timingShiftDays: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAI,
  onOpenAbout,
  onToggleSandbox,
  isSandboxOpen,
  onExportCSV,
  onLoadScenario,
}) => {
  const { isAdmin, openAdminModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] backdrop-blur-md sticky top-0 z-30 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Title - Never cut off */}
          <div className="flex items-center shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-sm sm:text-base lg:text-lg font-extrabold tracking-tight text-[var(--text-main)] whitespace-nowrap">
                  BKLYNFLY Skeena Steelhead Escapement Data
                </h1>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] hidden md:flex items-center gap-1.5 font-mono mt-0.5">
                <Compass className="w-3 h-3 text-[var(--accent-amber)] shrink-0" />
                <span>DFO Tyee Escapement Telemetry</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Actions */}
            <div className="hidden xl:flex items-center gap-1.5">
              {/* Theme Toggle (☀️ Journal / 🌙 Night) */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'Night Mode' : 'Journal Light Mode'}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] transition"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-stone-600" />
                    <span>Night</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Journal</span>
                  </>
                )}
              </button>

              {/* Admin Userbase */}
              {isAdmin && (
                <button
                  onClick={openAdminModal}
                  title="Open Admin Userbase & Permissions Directory"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                  <span>Admin</span>
                </button>
              )}

              {/* Sandbox */}
              <button
                onClick={onToggleSandbox}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider border transition ${
                  isSandboxOpen
                    ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber-border)] font-bold shadow-sm'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>Sandbox</span>
              </button>

              {/* AI Biologist */}
              <button
                onClick={onOpenAI}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent-amber)] hover:opacity-90 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm border border-amber-600 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>AI Biologist</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={onExportCSV}
                title="Download 10-Year Dataset (CSV)"
                className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* About */}
              <button
                onClick={onOpenAbout}
                title="About Tyee Test Fishery & Methodology"
                className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] hover:border-[var(--border-highlight)] transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Intermediate Screen Icons & Mobile Actions Menu */}
            <div className="flex xl:hidden items-center gap-1">
              {/* Quick theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)]"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <div className="relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-1.5 rounded-lg border transition ${
                    isMobileMenuOpen
                      ? 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber-border)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-main)]'
                  }`}
                  title="Field Actions & Tools"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
                </button>

                {/* Dropdown Menu */}
                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--accent-amber)] border-b border-[var(--border-main)]">
                      Field Tools &amp; Actions
                    </div>

                    <button
                      onClick={() => {
                        onOpenAI();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[var(--text-main)] hover:bg-[var(--bg-subtle)] flex items-center gap-2.5 transition font-semibold"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" />
                      <span>AI Biologist Analyst</span>
                    </button>

                    <button
                      onClick={() => {
                        onToggleSandbox();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[var(--text-main)] hover:bg-[var(--bg-subtle)] flex items-center gap-2.5 transition font-semibold"
                    >
                      <Sliders className="w-4 h-4 text-[var(--accent-amber)]" />
                      <span>What-If Sandbox</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          openAdminModal();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[var(--accent-amber)] hover:bg-[var(--bg-subtle)] flex items-center gap-2.5 transition font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin User Directory</span>
                      </button>
                    )}

                    <div className="border-t border-[var(--border-main)] my-1"></div>

                    <button
                      onClick={() => {
                        onExportCSV();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] flex items-center gap-2.5 transition"
                    >
                      <Download className="w-4 h-4 text-[var(--text-muted)]" />
                      <span>Export 10-Yr CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenAbout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] flex items-center gap-2.5 transition"
                    >
                      <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
                      <span>About Tyee Methodology</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Account / Profile */}
            <div className="border-l border-[var(--border-main)] pl-1.5 sm:pl-2 ml-0.5">
              <UserProfileMenu onLoadScenario={onLoadScenario} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
