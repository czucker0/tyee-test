import React from 'react';
import {
  Fish,
  Sparkles,
  Sliders,
  HelpCircle,
  Download,
  RotateCcw,
  Waves,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { TODAY_MONTH_DAY, CURRENT_YEAR } from '../data/historicalData';

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
}) => {
  const getStatusBadge = () => {
    switch (conservationTier) {
      case 'Abundant':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'Abundant Run',
        };
      case 'Healthy':
        return {
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />,
          label: 'Healthy Escapement',
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
          label: 'Moderate Escapement',
        };
      case 'Precautionary':
        return {
          bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          icon: <AlertCircle className="w-4 h-4 text-orange-400" />,
          label: 'Precautionary Zone',
        };
      default:
        return {
          bg: 'bg-red-500/15 text-red-300 border-red-500/30',
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          label: 'Conservation Concern',
        };
    }
  };

  const status = getStatusBadge();

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 shrink-0">
              <Fish className="w-5 h-5 sm:w-6 sm:h-6 transform -rotate-12" />
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Skeena Steelhead</span>
                <span className="hidden xs:inline text-cyan-400 font-bold">Tracker</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline">Tyee Test Fishery Telemetry &amp; Escapement</span>
                <span className="sm:hidden">DFO Tyee Fishery &bull; 2026</span>
              </p>
            </div>
          </div>

          {/* Controls & Quick Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Status badge */}
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-bold ${status.bg}`}
            >
              {status.icon}
              <span>{status.label}</span>
            </div>

            {/* DFO Sync Station Button */}
            {onOpenDFOSync && (
              <button
                onClick={onOpenDFOSync}
                title="DFO Test Fishery Live Sync Hub"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-800 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-950/40 hover:border-cyan-500 transition shadow-sm"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">DFO Sync</span>
              </button>
            )}

            {/* Sandbox Button */}
            <button
              onClick={onToggleSandbox}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium border transition shadow-sm ${
                isSandboxOpen
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-900/30'
                  : 'bg-slate-800 text-purple-300 border-purple-800/40 hover:bg-purple-950/40 hover:border-purple-600'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">What-If Sandbox</span>
              <span className="md:hidden">Sandbox</span>
            </button>

            {/* AI Biologist Button */}
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-indigo-950/50 border border-cyan-400/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">AI Biologist</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              title="Download 10-Year Dataset (CSV)"
              className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* About / Guide */}
            <button
              onClick={onOpenAbout}
              title="About Tyee Test Fishery & Methodology"
              className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
