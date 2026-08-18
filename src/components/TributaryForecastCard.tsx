import React, { useState } from 'react';
import { TributaryEscapement } from '../types/steelhead';
import { MapPin, Waves, Fish, ChevronRight, Info } from 'lucide-react';

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
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Fair':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Concern':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Skeena Watershed Tributary Escapement Distribution
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Genetic Stock Identification (GSI) & tagging distribution across major river systems based on projected run.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          As of {selectedMonthDay}
        </span>
      </div>

      {/* Watershed Share Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Tributary Stock Proportions:</span>
          <span>100% Skeena Watershed Total</span>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner">
          {tributaries.map((t, idx) => {
            const colors = ['bg-indigo-500', 'bg-cyan-500', 'bg-teal-500', 'bg-amber-500', 'bg-purple-500', 'bg-blue-500', 'bg-slate-500'];
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
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">{t.name}</h4>
                    <span className="text-[10px] text-slate-400">{t.region}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-end justify-between border-t border-slate-800/60 pt-2 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stock Share</span>
                    <span className="font-bold text-cyan-300">{t.sharePct}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Projected Adult Return</span>
                    <span className="font-black text-white">{t.projectedAdults.toLocaleString()}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tributary Spotlight */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                Tributary Profile
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(selected.status)}`}>
                {selected.status} Status
              </span>
            </div>

            <h4 className="text-base font-extrabold text-white mt-2 mb-1">{selected.name}</h4>
            <p className="text-xs text-cyan-300/90 font-medium">{selected.region}</p>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">{selected.description}</p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Est. Passed by {selectedMonthDay}:</span>
              <strong className="text-slate-200">{selected.estimatedAdults.toLocaleString()} fish</strong>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Projected Season Return:</span>
              <strong className="text-cyan-300 text-sm font-black">{selected.projectedAdults.toLocaleString()} adults</strong>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Main River Peak:</span>
              <strong className="text-slate-200">{selected.peakWindow}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
