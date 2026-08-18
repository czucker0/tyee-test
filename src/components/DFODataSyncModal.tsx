import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  FileSpreadsheet,
  HardDrive,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Sparkles,
  Search,
  Code,
  Terminal,
  Activity,
  Check,
  AlertTriangle,
  Play,
  ArrowDownCircle,
  Eye,
} from 'lucide-react';
import { TODAY_DATE_STR, TODAY_MONTH_DAY } from '../data/historicalData';
import { APP_VERSION, BUILD_INFO } from '../version';

interface ScrapeAuditLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR' | 'DRY_RUN' | 'MANUAL_IMPORT';
  source: string;
  recordsUpdated: number;
  latestRecordedDate?: string;
  latestRecordedIndex?: number;
  message: string;
  details?: string;
}

interface ParsedScrapeRow {
  dayIndex?: number;
  dateStr: string;
  monthDay: string;
  dailyIndex: number;
  cumulativeIndex: number;
  driftSets?: number;
  waterTempC?: number;
  dischargeM3s?: number;
  sockeyeDaily?: number;
  isRecorded: boolean;
  status?: 'NEW' | 'MATCH' | 'UPDATED' | 'OUT_OF_RANGE';
  diffVsCurrent?: string;
}

interface ScrapePreviewData {
  success: boolean;
  message: string;
  source: string;
  formatDetected: string;
  tablesFound: number;
  totalRowsParsed: number;
  matchedCalendarRows: number;
  latestExtractedDate?: string;
  latestExtractedCumulative?: number;
  parsedRows: ParsedScrapeRow[];
  diagnostics: string[];
  rawSnippet?: string;
}

interface IntegrityReport {
  isValid: boolean;
  issues: string[];
  metrics: {
    year: number;
    recordedDaysCount: number;
    dailySum: number;
    cumulativeTarget: number;
    difference: number;
    highestDaily: { date: string; value: number };
  };
}

interface DFODataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTrigger?: () => Promise<void>;
  isSyncingParent?: boolean;
  syncMessageParent?: string | null;
  lastUpdated?: string;
  activeSeasonMetadata?: {
    year: number;
    lastRecordedDate: string;
    lastRecordedIndex: number;
    isLive: boolean;
  };
}

const DEFAULT_DFO_URL = 'https://www-ops2.pac.dfo-mpo.gc.ca/fos2_Internet/Testfish/rptDTFDTyeeParm.cfm?fsub_id=585';

export const DFODataSyncModal: React.FC<DFODataSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncTrigger,
  isSyncingParent,
  syncMessageParent,
  lastUpdated,
  activeSeasonMetadata,
}) => {
  const [activeTab, setActiveTab] = useState<'scraper' | 'preview' | 'importer' | 'integrity' | 'history' | 'methodology'>('scraper');
  const [targetUrl, setTargetUrl] = useState<string>(DEFAULT_DFO_URL);
  const [selectedScrapeYear, setSelectedScrapeYear] = useState<number>(2026);
  const [isScrapingLive, setIsScrapingLive] = useState<boolean>(false);
  const [isScrapingDecade, setIsScrapingDecade] = useState<boolean>(false);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<ScrapePreviewData | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Importer state
  const [rawTextTable, setRawTextTable] = useState<string>('');
  const [importTargetYear, setImportTargetYear] = useState<number>(2026);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Integrity audit state
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<ScrapeAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
      runIntegrityAudit();
    }
  }, [isOpen]);

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/tyee/scraper/history');
      if (res.ok) {
        const json = await res.json();
        if (json.logs) setAuditLogs(json.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const runIntegrityAudit = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/tyee/scraper/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2026 }),
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrityReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  const isSyncing = isSyncingParent ?? isScrapingLive;

  // 1. Preview Scraper Dry-Run
  const handleRunPreview = async () => {
    setIsPreviewing(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/tyee/scraper/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl.trim(),
          year: selectedScrapeYear,
        }),
      });
      const data: ScrapePreviewData = await res.json();
      setPreviewResult(data);
      setActiveTab('preview');
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message,
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: `Preview failed: ${err.message}`,
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  // 1b. Batch Scrape Past 10 Years into Local Database
  const handleScrapeDecade = async () => {
    setIsScrapingDecade(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/tyee/scraper/scrape-decade', { method: 'POST' });
      const data = await res.json();
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message || 'Past 10 years verified and cached in local database.',
      });
      if (onSyncTrigger) await onSyncTrigger();
      await fetchAuditLogs();
      await runIntegrityAudit();
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        message: `Decade batch scrape error: ${e.message}`,
      });
    } finally {
      setIsScrapingDecade(false);
    }
  };

  // 1c. Scrape single selected year
  const handleScrapeSelectedYear = async () => {
    setIsScrapingLive(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/tyee/scraper/scrape-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedScrapeYear,
          url: targetUrl.trim(),
        }),
      });
      const data = await res.json();
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message || `Year ${selectedScrapeYear} synced into local database.`,
      });
      if (onSyncTrigger) await onSyncTrigger();
      await fetchAuditLogs();
      await runIntegrityAudit();
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        message: `Scrape error: ${e.message}`,
      });
    } finally {
      setIsScrapingLive(false);
    }
  };

  // 2. Commit Previewed Data or Run Live Sync
  const handleExecuteLiveSync = async () => {
    setIsScrapingLive(true);
    setActionFeedback(null);
    try {
      if (onSyncTrigger) {
        await onSyncTrigger();
      } else {
        const res = await fetch('/api/tyee/sync-daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl.trim(),
            year: 2026,
          }),
        });
        const data = await res.json();
        setActionFeedback({
          type: data.success ? 'success' : 'error',
          message: data.message || 'Live synchronization complete.',
        });
      }
      await fetchAuditLogs();
      await runIntegrityAudit();
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        message: `Sync execution error: ${e.message}`,
      });
    } finally {
      setIsScrapingLive(false);
    }
  };

  // 3. Process Raw Ingestion
  const handleProcessImport = async () => {
    if (!rawTextTable.trim()) {
      setActionFeedback({ type: 'error', message: 'Please enter table or CSV rows to import.' });
      return;
    }

    setIsImporting(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/tyee/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableText: rawTextTable,
          year: importTargetYear,
        }),
      });
      const data = await res.json();
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message,
      });
      if (data.success) {
        setRawTextTable('');
        if (onSyncTrigger) await onSyncTrigger();
        await fetchAuditLogs();
        await runIntegrityAudit();
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: `Import error: ${err.message}` });
    } finally {
      setIsImporting(false);
    }
  };

  // 4. Recalculate Cumulative Curve
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/tyee/scraper/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2026 }),
      });
      const data = await res.json();
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message,
      });
      if (onSyncTrigger) await onSyncTrigger();
      await runIntegrityAudit();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: `Recalculate error: ${err.message}` });
    } finally {
      setIsRecalculating(false);
    }
  };

  // 5. Rollback Snapshot
  const handleRollback = async () => {
    if (!confirm('Are you sure you want to rollback the database to the prior backup snapshot?')) return;
    setIsRollingBack(true);
    try {
      const res = await fetch('/api/tyee/scraper/rollback', { method: 'POST' });
      const data = await res.json();
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message,
      });
      if (onSyncTrigger) await onSyncTrigger();
      await fetchAuditLogs();
      await runIntegrityAudit();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: `Rollback error: ${err.message}` });
    } finally {
      setIsRollingBack(false);
    }
  };

  // 6. Reset to Baseline Seed
  const handleResetToBaselineSeed = async () => {
    if (!confirm('Reset local Tyee database to the authentic baseline telemetry seed?')) return;
    try {
      const res = await fetch('/api/tyee/scraper/reset-seed', { method: 'POST' });
      const data = await res.json();
      setActionFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message,
      });
      if (onSyncTrigger) await onSyncTrigger();
      await fetchAuditLogs();
      await runIntegrityAudit();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: `Reset error: ${err.message}` });
    }
  };

  const recordedDate = activeSeasonMetadata?.lastRecordedDate || '2026-08-16';
  const recordedIndex = activeSeasonMetadata?.lastRecordedIndex || 161.93;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  DFO Tyee Fishery Scraper & Telemetry Control Center
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  LOCAL DB ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct scraping, Cheerio HTML table parsing, raw CSV ingestion, and integrity audit engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback bar */}
        {actionFeedback && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                : actionFeedback.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-200'
                : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : actionFeedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('scraper')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'scraper'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Live DFO Scraper</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Parse Preview & Diff {previewResult ? `(${previewResult.totalRowsParsed})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'importer'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Table / CSV Ingest</span>
          </button>

          <button
            onClick={() => setActiveTab('integrity')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'integrity'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Integrity & Recalculate</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit History ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'methodology'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm">
          {/* TAB 1: LIVE SCRAPER */}
          {activeTab === 'scraper' && (
            <div className="space-y-4">
              {/* Telemetry quick summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                      Active Telemetry State
                    </span>
                    <h4 className="text-base font-bold text-white">
                      DFO Skeena River Tyee Test Fishery (54°13'N, 129°58'W)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-300 font-bold">Cache Synchronized</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Latest Recorded Date:</span>
                    <strong className="text-cyan-300 font-mono text-sm">{recordedDate}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Cumulative Index:</span>
                    <strong className="text-white font-mono text-sm">{recordedIndex.toFixed(2)} pts</strong>
                    <span className="text-slate-400 text-[10px] block font-mono">~{Math.round(recordedIndex * 50).toLocaleString()} wild adults</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Rolling Baseline:</span>
                    <strong className="text-indigo-300 font-mono text-sm">2016–2025 (10-Yr)</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[11px]">Archive Depth:</span>
                    <strong className="text-emerald-300 font-mono text-sm">1998–2025 (28 Yrs)</strong>
                  </div>
                </div>
              </div>

              {/* 10-Year Local Database Architecture Callout */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h5 className="font-bold text-white text-xs sm:text-sm">
                      Zero-Hammering Local Database Architecture
                    </h5>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    tyee_cache.json ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Daily & cumulative numbers for the <strong>past 10 years (2016–2025)</strong> are stored locally in the server database. All chart calculations, historical overlays, and 10-year baselines are served instantaneously without hammering the DFO website.
                </p>
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Past Decade: <strong className="text-emerald-300">2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025</strong>
                  </span>
                  <button
                    onClick={handleScrapeDecade}
                    disabled={isScrapingDecade}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    <HardDrive className={`w-3.5 h-3.5 ${isScrapingDecade ? 'animate-spin' : ''}`} />
                    <span>{isScrapingDecade ? 'Verifying 10 Years...' : 'Re-verify & Cache Past 10 Years'}</span>
                  </button>
                </div>
              </div>

              {/* Scrape Target by Year (Matching DFO Dropdown) */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>DFO Skeena Tyee Table Scraper (Year Dropdown)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Matches the year drop-down on the official DFO portal. Select any past year or run daily incremental syncs for the active season.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Target Season Year:
                    </label>
                    <select
                      value={selectedScrapeYear}
                      onChange={(e) => {
                        const yr = Number(e.target.value);
                        setSelectedScrapeYear(yr);
                        if (yr === 2026) {
                          setTargetUrl(DEFAULT_DFO_URL);
                        } else {
                          setTargetUrl(`${DEFAULT_DFO_URL}?year=${yr}`);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={2026}>2026 (Active In-Season)</option>
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                      <option value={2022}>2022</option>
                      <option value={2021}>2021</option>
                      <option value={2020}>2020</option>
                      <option value={2019}>2019</option>
                      <option value={2018}>2018</option>
                      <option value={2017}>2017</option>
                      <option value={2016}>2016</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>DFO Endpoint URL:</span>
                      <button
                        onClick={() => {
                          setSelectedScrapeYear(2026);
                          setTargetUrl(DEFAULT_DFO_URL);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                      >
                        Reset URL
                      </button>
                    </label>
                    <input
                      type="text"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://www.pac.dfo-mpo.gc.ca/..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cheerio server-side HTML parser + auto column detector</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunPreview}
                      disabled={isPreviewing || isSyncing}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Eye className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin' : ''}`} />
                      <span>{isPreviewing ? 'Inspecting...' : `Preview ${selectedScrapeYear}`}</span>
                    </button>

                    {selectedScrapeYear === 2026 ? (
                      <button
                        onClick={handleExecuteLiveSync}
                        disabled={isSyncing || isPreviewing}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Scraping 2026...' : 'Sync Today’s Sets (Daily)'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleScrapeSelectedYear}
                        disabled={isSyncing || isPreviewing}
                        className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? `Scraping ${selectedScrapeYear}...` : `Scrape ${selectedScrapeYear} Table`}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Official Link */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span>DFO Pacific Region Tyee Test Fishery Operational Online Portal</span>
                </div>
                <a
                  href="https://www.pac.dfo-mpo.gc.ca/fm-gp/northcoast-cotenord/skeenatyee-eng.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Open Bulletin</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: PARSE PREVIEW & DIFF */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {!previewResult ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <Eye className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs">
                    No active preview run yet. Click "Test & Preview Scraper" from the Live Scraper tab or test a custom payload.
                  </p>
                  <button
                    onClick={handleRunPreview}
                    disabled={isPreviewing}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Run Test Scrape
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary of preview */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">Scraper Parse Inspection</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {previewResult.formatDetected}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Source: {previewResult.source} &bull; Tables Detected: {previewResult.tablesFound}
                      </p>
                    </div>

                    <button
                      onClick={handleExecuteLiveSync}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-950"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit Parsed Data to DB</span>
                    </button>
                  </div>

                  {/* Diagnostic logs */}
                  {previewResult.diagnostics.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                        Engine Diagnostic Logs:
                      </span>
                      {previewResult.diagnostics.map((diag, idx) => (
                        <div key={idx} className="text-xs font-mono text-slate-400 flex items-start gap-1.5">
                          <span className="text-cyan-400">&gt;</span>
                          <span>{diag}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Extracted table preview */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">
                        Parsed Drift Net Records ({previewResult.parsedRows.length} rows)
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300">
                        Latest: {previewResult.latestExtractedDate} ({previewResult.latestExtractedCumulative?.toFixed(2)} pts)
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5 text-right">Daily Index</th>
                            <th className="p-2.5 text-right">Cumulative</th>
                            <th className="p-2.5 text-right">Water Temp</th>
                            <th className="p-2.5">Status & Diff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {previewResult.parsedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition">
                              <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-cyan-400" />
                                <span>{row.monthDay}</span>
                              </td>
                              <td className="p-2.5 text-right text-cyan-300 font-bold">
                                {row.dailyIndex.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-right text-slate-200">
                                {row.cumulativeIndex.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-right text-slate-400">
                                {row.waterTempC ? `${row.waterTempC}°C` : '—'}
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      row.status === 'NEW'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : row.status === 'UPDATED'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {row.status || 'MATCH'}
                                  </span>
                                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                    {row.diffVsCurrent}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TABLE / CSV IMPORTER */}
          {activeTab === 'importer' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">DFO Table & CSV Raw Ingestion Studio</h4>
                <p className="text-xs text-slate-400">
                  Paste rows directly from a spreadsheet, PDF bulletin, or DFO web table. Supports auto-detection of comma, tab, space, or pipe separated values.
                </p>
              </div>

              {/* Sample template quick-fill buttons */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Templates:</span>
                <button
                  onClick={() =>
                    setRawTextTable(`Date, Daily Index, Cumulative Index, Water Temp\n2026-08-14, 2.45, 155.80, 15.8\n2026-08-15, 3.33, 159.13, 16.1\n2026-08-16, 2.80, 161.93, 16.2\n2026-08-17, 2.65, 164.58, 15.9`)
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-[11px]"
                >
                  Standard CSV Format
                </button>
                <button
                  onClick={() =>
                    setRawTextTable(`Aug 14\t2.45\t155.80\nAug 15\t3.33\t159.13\nAug 16\t2.80\t161.93\nAug 17\t2.65\t164.58`)
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-mono text-[11px]"
                >
                  Tab-Delimited Bulletin
                </button>
              </div>

              <textarea
                value={rawTextTable}
                onChange={(e) => setRawTextTable(e.target.value)}
                placeholder="Date, Daily Index, Cumulative Index&#10;Aug 16, 2.80, 161.93"
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Target Season:</span>
                  <select
                    value={importTargetYear}
                    onChange={(e) => setImportTargetYear(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none"
                  >
                    <option value={2026}>2026 (Active In-Season)</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                    <option value={2022}>2022</option>
                    <option value={2021}>2021</option>
                  </select>
                </div>

                <button
                  onClick={handleProcessImport}
                  disabled={isImporting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 disabled:opacity-50"
                >
                  <Upload className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Ingesting Sets...' : 'Parse & Ingest into Local DB'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: INTEGRITY & RECALCULATE */}
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Mathematical Integrity & Curve Auditor</h4>
                <p className="text-xs text-slate-400">
                  Verifies that the sum of daily drift net CPUE indices equals the cumulative total and detects anomalies.
                </p>
              </div>

              {integrityReport && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {integrityReport.isValid ? (
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-bold text-sm text-white">
                        {integrityReport.isValid ? 'Mathematical Integrity Verified' : 'Integrity Discrepancies Found'}
                      </span>
                    </div>

                    <button
                      onClick={runIntegrityAudit}
                      disabled={isValidating}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin' : ''}`} />
                      <span>Re-Audit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Recorded Sets:</span>
                      <span className="text-cyan-300 font-bold">{integrityReport.metrics.recordedDaysCount} days</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Daily Index Sum:</span>
                      <span className="text-white font-bold">{integrityReport.metrics.dailySum.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Recorded Cumulative:</span>
                      <span className="text-indigo-300 font-bold">{integrityReport.metrics.cumulativeTarget.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Peak Daily Set:</span>
                      <span className="text-emerald-300 font-bold">
                        {integrityReport.metrics.highestDaily.value.toFixed(2)} ({integrityReport.metrics.highestDaily.date})
                      </span>
                    </div>
                  </div>

                  {integrityReport.issues.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-rose-300 uppercase font-mono block">Detected Issues:</span>
                      {integrityReport.issues.map((iss, i) => (
                        <p key={i} className="text-xs text-rose-200 font-mono">&bull; {iss}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Maintenance Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recalculate Cumulative Curve</span>
                  </h5>
                  <p className="text-xs text-slate-400">
                    Recomputes cumulative totals day-by-day from individual drift net sets to eliminate arithmetic drift.
                  </p>
                  <button
                    onClick={handleRecalculate}
                    disabled={isRecalculating}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                    <span>Recalculate Curve</span>
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset to Baseline Seed</span>
                  </h5>
                  <p className="text-xs text-slate-400">
                    Restores authentic 1998–2026 Skeena Tyee fishery baseline dataset (Aug 16 = 161.93 pts).
                  </p>
                  <button
                    onClick={handleResetToBaselineSeed}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition"
                  >
                    Restore Baseline Seed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS & ROLLBACK */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-white text-sm">Scraper Audit Trail & Snapshots</h4>
                  <p className="text-xs text-slate-400">
                    Historical log of synchronization passes and database backup snapshots.
                  </p>
                </div>

                <button
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? 'animate-spin' : ''}`} />
                  <span>Rollback to Prior Snapshot</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No audit log entries recorded yet.</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 text-xs space-y-1 hover:bg-slate-900/40 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : log.status === 'MANUAL_IMPORT'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px] truncate max-w-[280px]">
                            {log.source}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 font-mono text-[11px]">{log.message}</p>
                      {log.latestRecordedIndex && (
                        <span className="text-[10px] text-cyan-400 font-mono block">
                          Recorded cumulative: {log.latestRecordedIndex} pts ({log.latestRecordedDate})
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ARCHITECTURE */}
          {activeTab === 'methodology' && (
            <div className="space-y-4 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-300 text-sm">
                  1. Local Database Caching (Zero Unnecessary DFO Server Load)
                </h4>
                <p className="text-xs text-slate-300">
                  Historical Tyee test fishery records for 2016 through 2025 are permanently stored in the local server database file (<code className="text-cyan-300 font-mono">tyee_cache.json</code>). The app serves chart queries directly from this cache in sub-millisecond response times without making repeated HTTP requests to government servers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-indigo-300 text-sm">
                  2. Relative Rolling Baseline (Current Year & Past Decade)
                </h4>
                <p className="text-xs text-slate-300">
                  The baseline automatically computes based on the active year <code className="text-indigo-300 font-mono">Y</code> and exactly the preceding 10 years <code className="text-indigo-300 font-mono">[Y-10 ... Y-1]</code>. When 2027 begins, the rolling decade baseline seamlessly transitions to 2017–2026 without manual code changes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-300 text-sm">
                  3. Multi-Decade Historical Search & Archive
                </h4>
                <p className="text-xs text-slate-300">
                  Users can search and overlay any historical year (such as 1998, 2004, or 2010) on-demand into the charts, head-to-head comparison cards, and annual ranking tables.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Local DB Cache: <strong className="text-slate-300">tyee_cache.json</strong></span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-cyan-300">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>App Build: {BUILD_INFO.formattedTimestamp}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
