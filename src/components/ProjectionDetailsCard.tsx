import React from 'react';
import {
  TrendingUp,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  GitFork,
} from 'lucide-react';
import { ProjectionModelResult } from '../types/steelhead';
import { ESCAPEMENT_THRESHOLDS, ADULT_EXPANSION_FACTOR, ALL_YEARS_DATA } from '../data/historicalData';

interface ProjectionDetailsCardProps {
  projection: ProjectionModelResult;
  selectedMonthDay: string;
  isMetricInAdults: boolean;
}

export const ProjectionDetailsCard: React.FC<ProjectionDetailsCardProps> = ({
  projection,
  selectedMonthDay,
  isMetricInAdults,
}) => {
  const mult = isMetricInAdults ? ADULT_EXPANSION_FACTOR : 1.0;
  const unit = isMetricInAdults ? 'adults' : 'pts';

  const formatNum = (val: number) => {
    return isMetricInAdults
      ? Math.round(val * ADULT_EXPANSION_FACTOR).toLocaleString() + ' fish'
      : val.toFixed(1) + ' pts';
  };

  const scenarios = [
    {
      key: 'early',
      title: 'Early Migration Timing',
      offset: '-6 Days',
      desc: 'Assumes run arrived earlier than average. Higher % already passed Tyee, so remaining pulses will be modest.',
      index: projection.scenarios.earlyPeak.projectedIndex,
      adults: projection.scenarios.earlyPeak.projectedAdults,
      color: 'border-orange-500/40 bg-orange-950/20 text-orange-300',
      badge: 'Conservative Scenario',
    },
    {
      key: 'avg',
      title: 'Normal 10-Yr Run Timing',
      offset: '0 Days (Baseline)',
      desc: 'Standard 10-year empirical migration curve based on long-term Tyee test fishery historical records.',
      index: projection.scenarios.averageTiming.projectedIndex,
      adults: projection.scenarios.averageTiming.projectedAdults,
      color: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500/40',
      badge: 'Most Likely (Baseline)',
      isPrimary: true,
    },
    {
      key: 'late',
      title: 'Late Run / Cool Freshet',
      offset: '+6 Days',
      desc: 'Assumes cool mainstem water or high July discharge delayed migration. Significant late-August/September pulses.',
      index: projection.scenarios.lateRunSurge.projectedIndex,
      adults: projection.scenarios.lateRunSurge.projectedAdults,
      color: 'border-teal-500/40 bg-teal-950/20 text-teal-300',
      badge: 'Optimistic Scenario',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Title & Engine info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              In-Season Statistical Run Projection Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-model forecasting as of {selectedMonthDay} ({projection.percentElapsedHistorical}% historical run completion).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">Model Confidence:</span>
          <span className="text-cyan-300 font-bold">{projection.confidenceLevel}%</span>
        </div>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {scenarios.map((sc) => (
          <div
            key={sc.key}
            className={`p-4 rounded-xl border flex flex-col justify-between transition relative overflow-hidden ${sc.color}`}
          >
            {sc.isPrimary && (
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-bl-lg tracking-wider">
                Primary
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {sc.badge}
                </span>
                <span className="text-[11px] font-mono opacity-70">{sc.offset}</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">{sc.title}</h4>
              <p className="text-xs text-slate-300/80 leading-relaxed mb-4">{sc.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Projected Escapement</span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-xl font-black text-white">
                    {sc.index.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    (~{Math.round(sc.adults).toLocaleString()} fish)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Historical Analog & Confidence Envelope Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Analog Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Nearest Historical Analog Match
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
              Year {projection.bestFitAnalogYear}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Based on Root-Mean-Square Error (RMSE) trajectory curve fitting from Day 1 to Day {projection.dayIndex + 1}, the current 2026 steelhead run is tracking with strongest statistical resemblance to the <strong>{projection.bestFitAnalogYear} Skeena return</strong>.
          </p>

          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between font-mono">
            <span>{projection.bestFitAnalogYear} Total Season Index:</span>
            <strong className="text-slate-200">
              {formatNum(ALL_YEARS_DATA.find((y) => y.year === projection.bestFitAnalogYear)?.totalIndex || 182.78)}
            </strong>
          </div>
        </div>

        {/* Statistical Bounds Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              80% Confidence Interval Envelope
            </span>
            <span className="text-xs font-mono text-indigo-300 font-semibold">
              P10 – P90 Bounds
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex-1 text-center">
              <span className="text-[10px] text-slate-400 block">Lower 10th %ile</span>
              <span className="text-sm font-bold text-orange-300">
                {formatNum(projection.projectedLowCI)}
              </span>
            </div>
            <div className="p-2 rounded bg-indigo-950/60 border border-indigo-500/40 flex-1 text-center">
              <span className="text-[10px] text-indigo-300 block">Baseline Median</span>
              <span className="text-sm font-bold text-white">
                {formatNum(projection.projectedBaselineIndex)}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex-1 text-center">
              <span className="text-[10px] text-slate-400 block">Upper 90th %ile</span>
              <span className="text-sm font-bold text-teal-300">
                {formatNum(projection.projectedHighCI)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            As the season progresses past the August 10–20 peak window, variance narrows rapidly as cumulative recorded counts account for greater run certainty.
          </p>
        </div>
      </div>
    </div>
  );
};
