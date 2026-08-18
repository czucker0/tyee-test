import React from 'react';
import { Clock, Calendar, Database, FileSpreadsheet, Sparkles, HelpCircle, ShieldCheck, Waves } from 'lucide-react';
import { APP_VERSION, BUILD_INFO, getFormattedBuildTimestamp } from '../version';
import { CURRENT_YEAR } from '../data/historicalData';

interface FooterProps {
  onOpenAbout: () => void;
  onOpenDFOSync?: () => void;
  onOpenAI: () => void;
  onExportCSV: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAbout,
  onOpenDFOSync,
  onOpenAI,
  onExportCSV,
}) => {
  const formattedBuildTime = getFormattedBuildTimestamp();

  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950/90 backdrop-blur text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left Column: Project Name and Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
                BKLYNFLY
              </span>
              <span className="font-bold text-slate-200 tracking-tight text-sm">
                Skeena River Wild Steelhead Escapement Statistics
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono text-[11px] font-semibold border border-cyan-500/30">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Fisheries & Oceans Canada (DFO) Tyee Test Fishery Escapement Telemetry</span>
            </p>
          </div>

          {/* Center Column: Build Date & Timestamp Card */}
          <div className="flex flex-col items-start md:items-center justify-center">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm hover:border-cyan-500/50 transition">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <span>Last Build / Edited Timestamp</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="font-mono text-cyan-300 font-semibold text-xs tracking-tight">
                  {formattedBuildTime}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Links & Actions */}
          <div className="flex items-center md:justify-end gap-2 flex-wrap text-xs">
            <button
              onClick={onOpenAbout}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Methodology</span>
            </button>
            {onOpenDFOSync && (
              <button
                onClick={onOpenDFOSync}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Data Sync</span>
              </button>
            )}
            <button
              onClick={onExportCSV}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            Built with Vite &bull; React &bull; Tailwind CSS &bull; Local DFO Cache DB &bull; {CURRENT_YEAR}
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>Build Date: <strong className="text-slate-300">{BUILD_INFO.buildDate}</strong></span>
            <span>&bull;</span>
            <span>Version: <strong className="text-cyan-300">v{APP_VERSION}</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
