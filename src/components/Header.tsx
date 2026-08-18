import React, { useState, useRef, useEffect } from 'react';
import {
  Fish,
  Sparkles,
  Sliders,
  HelpCircle,
  Download,
  Waves,
  AlertCircle,
  CheckCircle2,
  Database,
  ShieldCheck,
  MoreVertical,
  X
} from 'lucide-react';
import { UserProfileMenu } from './UserProfileMenu';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  selectedMonthDay: string;
  isToday: boolean;
  onResetToToday: () => void;
  onOpenAI: () => void;
  onOpenAbout: () => void;
  onOpenDFOSync?: () => void;
  onToggleSandbox: () => void;
  isSandboxOpen: boolean;
  onExportCSV: () => void;
  conservationTier: string;
  onLoadScenario?: (multiplier: number, timingShiftDays: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonthDay,
  isToday,
  onResetToToday,
  onOpenAI,
  onOpenAbout,
  onOpenDFOSync,
  onToggleSandbox,
  isSandboxOpen,
  onExportCSV,
  conservationTier,
  onLoadScenario,
}) => {
  const { isAdmin, openAdminModal } = useAuth();
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

  const getStatusBadge = () => {
    switch (conservationTier) {
      case 'Abundant':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Abundant',
        };
      case 'Healthy':
        return {
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />,
          label: 'Healthy',
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Moderate',
        };
      case 'Precautionary':
        return {
          bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-orange-400" />,
          label: 'Precautionary',
        };
      default:
        return {
          bg: 'bg-red-500/15 text-red-300 border-red-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
          label: 'Concern',
        };
    }
  };

  const status = getStatusBadge();

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="relative p-1.5 sm:p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 shrink-0">
              <Fish className="w-4 h-4 sm:w-5 sm:h-5 transform -rotate-12" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] sm:text-xs font-mono font-extrabold shrink-0">
                  BKLYNFLY
                </span>
                <span className="truncate">Skeena Steelhead Run</span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>DFO Tyee Test Fishery Telemetry &amp; Escapement Analysis</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Status badge */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold ${status.bg}`}
              title={`Conservation Status: ${status.label}`}
            >
              {status.icon}
              <span className="hidden xs:inline">{status.label}</span>
            </div>

            {/* Desktop Actions (Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-1.5">
              {/* Admin Userbase */}
              {isAdmin && (
                <button
                  onClick={openAdminModal}
                  title="Open Admin Userbase & Permissions Directory"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin</span>
                </button>
              )}

              {/* DFO Sync Station */}
              {onOpenDFOSync && (
                <button
                  onClick={onOpenDFOSync}
                  title="DFO Test Fishery Live Sync Hub"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-950/40 hover:border-cyan-500 transition shadow-sm"
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DFO Sync</span>
                </button>
              )}

              {/* Sandbox */}
              <button
                onClick={onToggleSandbox}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition shadow-sm ${
                  isSandboxOpen
                    ? 'bg-purple-600 text-white border-purple-500 shadow-purple-900/30'
                    : 'bg-slate-800 text-purple-300 border-purple-800/40 hover:bg-purple-950/40 hover:border-purple-600'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Sandbox</span>
              </button>

              {/* AI Biologist */}
              <button
                onClick={onOpenAI}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/50 border border-cyan-400/30 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>AI Biologist</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={onExportCSV}
                title="Download 10-Year Dataset (CSV)"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* About */}
              <button
                onClick={onOpenAbout}
                title="About Tyee Test Fishery & Methodology"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile "More Actions (•••)" Dropdown Trigger */}
            <div className="relative lg:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-1.5 rounded-lg border transition ${
                  isMobileMenuOpen
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="More Options"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
              </button>

              {/* Mobile Dropdown Menu */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Quick Tools &amp; Actions
                  </div>

                  <button
                    onClick={() => {
                      onOpenAI();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-cyan-300 hover:bg-slate-800/80 flex items-center gap-2.5 transition font-semibold"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI Biologist Analyst</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleSandbox();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-purple-300 hover:bg-slate-800/80 flex items-center gap-2.5 transition font-semibold"
                  >
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>What-If Sandbox</span>
                  </button>

                  {onOpenDFOSync && (
                    <button
                      onClick={() => {
                        onOpenDFOSync();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 transition font-medium"
                    >
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>DFO Live Sync Station</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        openAdminModal();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-amber-300 hover:bg-slate-800/80 flex items-center gap-2.5 transition font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Admin User Directory</span>
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      onExportCSV();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800/80 flex items-center gap-2.5 transition"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Export 10-Yr CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenAbout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800/80 flex items-center gap-2.5 transition"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>About Tyee Methodology</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Account / Profile */}
            <div className="border-l border-slate-800 pl-1.5 sm:pl-2 ml-0.5">
              <UserProfileMenu onLoadScenario={onLoadScenario} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
