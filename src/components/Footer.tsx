import React from 'react';
import { Clock, Database, FileSpreadsheet, HelpCircle, Compass } from 'lucide-react';
import { APP_VERSION, BUILD_INFO, getFormattedBuildTimestamp } from '../version';
import { CURRENT_YEAR } from '../data/historicalData';

interface FooterProps {
  onOpenAbout: () => void;
  onOpenAI: () => void;
  onExportCSV: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAbout,
  onExportCSV,
}) => {
  const formattedBuildTime = getFormattedBuildTimestamp();

  return (
    <footer className="mt-12 border-t border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left Column: Project Name and Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-sm text-[var(--text-main)] uppercase tracking-wider">
                BKLYNFLY
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-mono text-[10px] font-semibold border border-[var(--border-main)]">
                v{APP_VERSION}
              </span>
            </div>
            <div className="font-mono font-bold text-xs text-[var(--accent-amber)] uppercase tracking-wider">
              Skeena Steelhead Run Tracker
            </div>
            <p className="text-[var(--text-muted)] text-[11px] flex items-center gap-1.5 font-mono pt-0.5">
              <Compass className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
              <span>Fisheries &amp; Oceans Canada (DFO) Tyee Test Fishery Telemetry</span>
            </p>
          </div>

          {/* Center Column: Build Date & Timestamp Card */}
          <div className="flex flex-col items-start md:items-center justify-center">
            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm hover:border-[var(--accent-amber)] transition">
              <div className="p-1.5 rounded-lg bg-[var(--accent-amber-light)] text-[var(--accent-amber)]">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center gap-1">
                  <span>Last Build / Field Release</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)] animate-pulse" />
                </div>
                <div className="text-[var(--accent-amber)] font-semibold text-xs tracking-tight">
                  {formattedBuildTime}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Links & Actions */}
          <div className="flex items-center md:justify-end gap-2 flex-wrap text-xs font-mono">
            <button
              onClick={onOpenAbout}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>Methodology</span>
            </button>
            <button
              onClick={onExportCSV}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold text-[var(--text-main)] uppercase tracking-wider">BKLYNFLY</span>
            <span className="hidden sm:inline text-[var(--border-highlight)]">|</span>
            <span className="text-[var(--accent-amber)] uppercase font-semibold">SKEENA STEELHEAD RUN TRACKER</span>
            <span className="hidden sm:inline text-[var(--border-highlight)]">|</span>
            <span>{CURRENT_YEAR}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Build Date: <strong className="text-[var(--text-main)]">{BUILD_INFO.buildDate}</strong></span>
            <span>&bull;</span>
            <span>Version: <strong className="text-[var(--accent-amber)]">v{APP_VERSION}</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
