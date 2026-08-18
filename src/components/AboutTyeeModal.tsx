import React from 'react';
import {
  X,
  Fish,
  Compass,
  ShieldCheck,
  Waves,
  MapPin,
  Clock,
} from 'lucide-react';
import { ADULT_EXPANSION_FACTOR } from '../data/historicalData';
import { APP_VERSION, BUILD_INFO } from '../version';

interface AboutTyeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutTyeeModal: React.FC<AboutTyeeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-[var(--accent-amber-light)] text-[var(--accent-amber)] font-mono text-xs border border-[var(--accent-amber-border)]">BKLYNFLY</span>
                <span>Skeena Steelhead Escapement Statistics</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Methodology, Tyee Index Expansion, and Escapement Conservation Framework
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[var(--accent-amber)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <MapPin className="w-4 h-4 text-[var(--accent-amber)]" />
              1. The Tyee Test Fishery
            </h4>
            <p>
              Operated annually since <strong>1955</strong> by Fisheries and Oceans Canada (DFO) near the mouth of the Skeena River (downstream of Terrace and Prince Rupert), the <strong>Tyee Test Fishery</strong> uses standardized 1-hour drift gillnet sets to measure the daily in-season abundance and run timing of migrating salmon and wild summer steelhead (<em>Oncorhynchus mykiss</em>).
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 bg-[var(--bg-card)] border border-[var(--border-main)] p-4 rounded-xl">
            <h4 className="text-sm font-bold text-[var(--accent-teal)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Compass className="w-4 h-4 text-[var(--accent-teal)]" />
              2. Index Conversion & Expansion Factor
            </h4>
            <p>
              The daily Tyee index is a standardized <strong>Catch-Per-Unit-Effort (CPUE)</strong> measurement. Based on long-term radio-telemetry, acoustic tag tracking, and counting weirs on the Babine and Sustut rivers:
            </p>
            <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-center font-mono font-bold text-[var(--text-main)] text-xs sm:text-sm my-1">
              1.0 Cumulative Tyee Index Point &approx; {ADULT_EXPANSION_FACTOR} Adult Wild Steelhead
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              For example, a cumulative index of 110 corresponds to approximately 24,200 adult wild steelhead entering the Skeena River system.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[var(--accent-spruce)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-spruce)]" />
              3. Provincial Conservation Reference Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                <span className="text-rose-700 dark:text-rose-300 font-bold block">Critical Concern (&lt;40 pts)</span>
                <span className="text-[var(--text-main)]">&lt; 8,800 Adult Steelhead</span>
                <p className="text-[11px] text-[var(--text-muted)] font-sans mt-1">Triggers emergency recreational closures (e.g. 2021 crisis at 22.3 pts).</p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
                <span className="text-amber-700 dark:text-amber-300 font-bold block">Precautionary Zone (40–75 pts)</span>
                <span className="text-[var(--text-main)]">8,800 – 16,500 Adult Fish</span>
                <p className="text-[11px] text-[var(--text-muted)] font-sans mt-1">Heightened monitoring and strict gear/season restrictions.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800">
                <span className="text-teal-700 dark:text-teal-300 font-bold block">Target Escapement (75–110 pts)</span>
                <span className="text-[var(--text-main)]">16,500 – 24,200 Adult Fish</span>
                <p className="text-[11px] text-[var(--text-muted)] font-sans mt-1">Meets full biodiversity and spawning capacity targets.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                <span className="text-emerald-700 dark:text-emerald-300 font-bold block">Abundant Run (&gt;140 pts)</span>
                <span className="text-[var(--text-main)]">&gt; 30,000+ Adult Wild Steelhead</span>
                <p className="text-[11px] text-[var(--text-muted)] font-sans mt-1">Exceptional year-class return (e.g. 2016 at 189.7, 2018 at 182.8, and 2026 at 161.9+).</p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[var(--accent-amber)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Waves className="w-4 h-4 text-[var(--accent-amber)]" />
              4. Run Timing & Tributary Destinations
            </h4>
            <p>
              Skeena summer steelhead enter freshwater between June and September, peaking in mid-August (Aug 10–20). Unlike salmon which spawn and die in autumn, summer steelhead hold in deep winter river pools and lake systems across the watershed before spawning in May and June of the following spring.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
            <span>Field Release: <strong className="text-[var(--text-main)]">{BUILD_INFO.formattedTimestamp}</strong> (v{APP_VERSION})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--accent-amber)] text-white font-bold text-xs transition shrink-0 hover:opacity-90"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
