import React, { useState } from 'react';
import { TributaryEscapement } from '../types/steelhead';
import { MapPin } from 'lucide-react';

interface TributaryForecastCardProps {
  tributaries: TributaryEscapement[];
  selectedMonthDay: string;
}

export const TributaryForecastCard: React.FC<TributaryForecastCardProps> = ({
  tributaries,
  selectedMonthDay,
}) => {
  const [activeTrib, setActiveTrib] = useState<string>(tributaries[0]?.name || '');

  const selected = tributaries.find((t) => t.name === activeTrib) || tributaries[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Strong':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700';
      case 'Fair':
        return 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700';
      case 'Concern':
        return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700';
      default:
        return 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700';
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--border-main)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent-amber)]" />
            <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
              Skeena Watershed Tributary Escapement Distribution
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            Genetic Stock Identification (GSI) &amp; tagging distribution across major river systems based on projected run.
          </p>
        </div>
        <span className="text-xs text-[var(--accent-amber)] font-mono font-semibold">
          As of {selectedMonthDay}
        </span>
      </div>

      {/* Watershed Share Bar */}
      <div className="space-y-1.5 font-mono">
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Tributary Stock Proportions:</span>
          <span>100% Skeena Watershed Total</span>
        </div>
        <div className="w-full bg-[var(--bg-subtle)] h-3.5 rounded-full overflow-hidden flex shadow-inner border border-[var(--border-main)]">
          {tributaries.map((t, idx) => {
            const colors = ['bg-amber-600', 'bg-teal-600', 'bg-amber-500', 'bg-teal-700', 'bg-amber-700', 'bg-teal-500', 'bg-stone-500'];
            const color = colors[idx % colors.length];
            return (
              <div
                key={t.name}
                className={`${color} h-full transition-all hover:opacity-80 cursor-pointer`}
                style={{ width: `${t.sharePct}%` }}
                title={`${t.name}: ${t.sharePct}% (~${t.projectedAdults.toLocaleString()} fish)`}
                onClick={() => setActiveTrib(t.name)}
              />
            );
          })}
        </div>
      </div>

      {/* Grid of Tributary Cards + Selected Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* Tributary List */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {tributaries.map((t) => {
            const isSelected = t.name === selected.name;
            return (
              <button
                key={t.name}
                onClick={() => setActiveTrib(t.name)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)] font-mono leading-snug">{t.name}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{t.region}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-semibold ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-end justify-between border-t border-[var(--border-main)] pt-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Stock Share</span>
                    <span className="font-bold text-[var(--accent-amber)]">{t.sharePct}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--text-muted)] block">Projected Return</span>
                    <span className="font-bold text-[var(--text-main)]">{t.projectedAdults.toLocaleString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tributary Spotlight */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-2 font-mono">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-amber)]">
                Tributary Profile
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(selected.status)}`}>
                {selected.status} Status
              </span>
            </div>

            <h4 className="text-base font-heading font-extrabold text-[var(--text-main)] mt-2 mb-1">{selected.name}</h4>
            <p className="text-xs text-[var(--accent-amber)] font-mono font-medium">{selected.region}</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">{selected.description}</p>
          </div>

          <div className="space-y-2 pt-3 border-t border-[var(--border-main)]">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Est. Passed by {selectedMonthDay}:</span>
              <strong className="text-[var(--text-main)]">{selected.estimatedAdults.toLocaleString()} fish</strong>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Projected Season Return:</span>
              <strong className="text-[var(--accent-amber)] text-sm font-bold">{selected.projectedAdults.toLocaleString()} adults</strong>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Main River Peak:</span>
              <strong className="text-[var(--text-secondary)]">{selected.peakWindow}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
