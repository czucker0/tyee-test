import React from 'react';
import {
  TrendingUp,
  Clock,
  Sparkles,
  GitFork,
} from 'lucide-react';
import { ProjectionModelResult } from '../types/steelhead';
import { ADULT_EXPANSION_FACTOR, ALL_YEARS_DATA } from '../data/historicalData';

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
      color: 'border-orange-300 dark:border-orange-600/40 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200',
      badge: 'Conservative Scenario',
    },
    {
      key: 'avg',
      title: 'Normal 10-Yr Run Timing',
      offset: '0 Days (Baseline)',
      desc: 'Standard 10-year empirical migration curve based on long-term Tyee test fishery historical records.',
      index: projection.scenarios.averageTiming.projectedIndex,
      adults: projection.scenarios.averageTiming.projectedAdults,
      color: 'border-[var(--accent-amber-border)] bg-[var(--accent-amber-light)] text-[var(--text-main)] shadow-sm',
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
      color: 'border-[var(--accent-teal-border)] bg-[var(--accent-teal-light)] text-[var(--text-main)]',
      badge: 'Optimistic Scenario',
    },
  ];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
      {/* Title & Engine info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-[var(--accent-amber)]" />
            <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              In-Season Statistical Run Projection Engine
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Real-time multi-model forecasting as of {selectedMonthDay} ({projection.percentElapsedHistorical}% historical run completion).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] px-3 py-1.5 rounded-lg text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span className="text-[var(--text-secondary)]">Model Confidence:</span>
          <span className="text-[var(--accent-amber)] font-bold">{projection.confidenceLevel}%</span>
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
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-[var(--accent-amber)] text-white text-[10px] font-mono font-bold uppercase rounded-bl-lg tracking-wider">
                Primary
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)]">
                  {sc.badge}
                </span>
                <span className="text-[11px] opacity-75">{sc.offset}</span>
              </div>
              <h4 className="text-base font-bold text-[var(--text-main)] mb-2 font-mono">{sc.title}</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">{sc.desc}</p>
            </div>

            <div className="pt-3 border-t border-[var(--border-main)] flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono tracking-wider">Projected Escapement</span>
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-xl font-extrabold text-[var(--text-main)]">
                    {sc.index.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
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
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              Nearest Historical Analog Match
            </span>
            <span className="stamp-badge stamp-amber">
              Season {projection.bestFitAnalogYear}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Based on Root-Mean-Square Error (RMSE) trajectory curve fitting from Day 1 to Day {projection.dayIndex + 1}, the current 2026 steelhead run is tracking with strongest statistical resemblance to the <strong>{projection.bestFitAnalogYear} Skeena return</strong>.
          </p>

          <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-main)] flex items-center justify-between font-mono">
            <span>{projection.bestFitAnalogYear} Total Season Index:</span>
            <strong className="text-[var(--accent-amber)]">
              {formatNum(ALL_YEARS_DATA.find((y) => y.year === projection.bestFitAnalogYear)?.totalIndex || 182.78)}
            </strong>
          </div>
        </div>

        {/* Statistical Bounds Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              80% Confidence Interval Envelope
            </span>
            <span className="text-xs font-mono text-[var(--accent-amber)] font-semibold">
              P10 – P90 Bounds
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
            <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-main)] flex-1 text-center">
              <span className="text-[10px] text-[var(--text-muted)] block">Lower 10th %ile</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-300">
                {formatNum(projection.projectedLowCI)}
              </span>
            </div>
            <div className="p-2 rounded bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] flex-1 text-center">
              <span className="text-[10px] text-[var(--accent-amber)] block font-bold">Baseline Median</span>
              <span className="text-sm font-bold text-[var(--text-main)]">
                {formatNum(projection.projectedBaselineIndex)}
              </span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-main)] flex-1 text-center">
              <span className="text-[10px] text-[var(--text-muted)] block">Upper 90th %ile</span>
              <span className="text-sm font-bold text-[var(--accent-teal)]">
                {formatNum(projection.projectedHighCI)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1 font-mono">
            As the season progresses past the August 10–20 peak window, variance narrows rapidly as cumulative recorded counts account for greater run certainty.
          </p>
        </div>
      </div>
    </div>
  );
};
