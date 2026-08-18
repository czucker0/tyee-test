import React from 'react';
import {
  HelpCircle,
  X,
  Fish,
  Compass,
  ShieldCheck,
  Calendar,
  Waves,
  MapPin,
  Clock,
  Code2,
} from 'lucide-react';
import { ESCAPEMENT_THRESHOLDS, ADULT_EXPANSION_FACTOR } from '../data/historicalData';
import { APP_VERSION, BUILD_INFO } from '../version';

interface AboutTyeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutTyeeModal: React.FC<AboutTyeeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                About the Skeena Steelhead Run & Tyee Test Fishery
              </h3>
              <p className="text-xs text-slate-400">
                Methodology, Tyee Index Expansion, and Escapement Conservation Framework
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              1. The Tyee Test Fishery
            </h4>
            <p>
              Operated annually since <strong>1955</strong> by Fisheries and Oceans Canada (DFO) near the mouth of the Skeena River (downstream of Terrace and Prince Rupert), the <strong>Tyee Test Fishery</strong> uses standardized 1-hour drift gillnet sets to measure the daily in-season abundance and run timing of migrating salmon and wild summer steelhead (<em>Oncorhynchus mykiss</em>).
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              2. Index Conversion & Expansion Factor
            </h4>
            <p>
              The daily Tyee index is a standardized <strong>Catch-Per-Unit-Effort (CPUE)</strong> measurement. Based on long-term radio-telemetry, acoustic tag tracking, and counting weirs on the Babine and Sustut rivers:
            </p>
            <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-lg text-center font-mono font-bold text-white text-xs sm:text-sm my-1">
              1.0 Cumulative Tyee Index Point ≈ {ADULT_EXPANSION_FACTOR} Adult Wild Steelhead
            </div>
            <p className="text-xs text-slate-400">
              For example, a cumulative index of 900 corresponds to approximately 45,000 adult wild steelhead entering the Skeena River system.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Provincial Conservation Reference Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30">
                <span className="text-red-400 font-bold block">Critical Concern (&lt;40 pts)</span>
                <span className="text-slate-300">&lt; 8,800 Adult Steelhead</span>
                <p className="text-[11px] text-slate-400 font-sans mt-1">Triggers emergency recreational closures (e.g. 2021 crisis at 22.3 pts).</p>
              </div>

              <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-500/30">
                <span className="text-orange-400 font-bold block">Precautionary Zone (40–75 pts)</span>
                <span className="text-slate-300">8,800 – 16,500 Adult Fish</span>
                <p className="text-[11px] text-slate-400 font-sans mt-1">Heightened monitoring and strict gear/season restrictions (e.g. 2019, 2020, 2022, 2025).</p>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-500/30">
                <span className="text-teal-400 font-bold block">Target Escapement (75–110 pts)</span>
                <span className="text-slate-300">16,500 – 24,200 Adult Fish</span>
                <p className="text-[11px] text-slate-400 font-sans mt-1">Meets full biodiversity and spawning capacity targets.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-emerald-400 font-bold block">Abundant Run (&gt;140 pts)</span>
                <span className="text-slate-300">&gt; 30,000+ Adult Wild Steelhead</span>
                <p className="text-[11px] text-slate-400 font-sans mt-1">Exceptional year-class return (e.g. 2016 at 189.7, 2018 at 182.8, and 2026 at 161.9+).</p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-amber-400" />
              4. Run Timing & Tributary Destinations
            </h4>
            <p>
              Skeena summer steelhead enter freshwater between June and September, peaking in mid-August (Aug 10–20). Unlike salmon which spawn and die in autumn, summer steelhead hold in deep winter river pools and lake systems across the watershed before spawning in May and June of the following spring.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Last Built / Modified: <strong className="text-cyan-300">{BUILD_INFO.formattedTimestamp}</strong> (v{APP_VERSION})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shrink-0"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
