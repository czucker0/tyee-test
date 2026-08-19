import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Search, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Trash2, 
  UserPlus,
  Activity,
  Clock,
  Database,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw
} from 'lucide-react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';

interface ScraperAuditLog {
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

interface ScraperStatusData {
  scheduler: {
    intervalMs: number;
    intervalDescription: string;
    lastExecutionTime: string | null;
    nextScheduledTime: string | null;
    lastStatus: 'SUCCESS' | 'ERROR' | 'PARTIAL' | 'IDLE';
    lastMessage: string;
    recordsUpdated: number;
  };
  activeSeasonMetadata: {
    year: number;
    lastRecordedDate: string;
    lastRecordedIndex: number;
    isLive: boolean;
  };
  lastUpdated: string;
  recentAuditLogs: ScraperAuditLog[];
}

export const AdminUserbaseModal: React.FC = () => {
  const { 
    isAdminModalOpen, 
    closeAdminModal, 
    isAdmin, 
    user, 
    adminList, 
    allUsers, 
    fetchAllUsersForAdmin, 
    addAdminByEmail, 
    removeAdmin 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'scraper'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scraper Tab State
  const [scraperData, setScraperData] = useState<ScraperStatusData | null>(null);
  const [isScraperLoading, setIsScraperLoading] = useState(false);
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Dry run sandbox state
  const [dryRunUrl, setDryRunUrl] = useState('');
  const [dryRunRawText, setDryRunRawText] = useState('');
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunPreview, setDryRunPreview] = useState<any | null>(null);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  // Maintenance actions state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const fetchScraperStatus = useCallback(async () => {
    setIsScraperLoading(true);
    try {
      const res = await fetch('/api/tyee/scraper/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setScraperData(json);
        }
      }
    } catch (err) {
      console.warn('Could not query /api/tyee/scraper/status:', err);
    } finally {
      setIsScraperLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      setIsLoading(true);
      fetchAllUsersForAdmin().finally(() => setIsLoading(false));
      fetchScraperStatus();
    }
  }, [isAdminModalOpen, isAdmin, fetchScraperStatus]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const handleRefresh = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'scraper') {
        await fetchScraperStatus();
        setStatusMsg({ type: 'success', text: 'Scraper diagnostics and audit logs refreshed.' });
      } else {
        await fetchAllUsersForAdmin();
        setStatusMsg({ type: 'success', text: 'Userbase data refreshed from Firestore.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to refresh data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerScrapeNow = async () => {
    setIsScrapingNow(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/tyee/sync-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2026 }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: data.message || `Scraped DFO: ${data.updatedRecordsCount || 0} records processed.`,
        });
        window.dispatchEvent(new CustomEvent('skeena-dataset-refreshed'));
      } else {
        setStatusMsg({
          type: 'error',
          text: `Scrape failed: ${data.message}`,
        });
      }
      await fetchScraperStatus();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Network error triggering scrape: ${err.message}`,
      });
    } finally {
      setIsScrapingNow(false);
    }
  };

  const handleRunDryRun = async () => {
    setIsDryRunning(true);
    setDryRunPreview(null);
    try {
      const res = await fetch('/api/tyee/scraper/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: dryRunUrl.trim() || undefined,
          rawPayload: dryRunRawText.trim() || undefined,
          year: 2026,
        }),
      });
      const data = await res.json();
      setDryRunPreview(data);
    } catch (err: any) {
      setDryRunPreview({
        success: false,
        message: `Dry run error: ${err.message}`,
        diagnostics: [err.message],
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleRecalculate = async () => {
    if (!confirm('Recalculate season cumulative curves and indices?')) return;
    setIsRecalculating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/tyee/scraper/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2026 }),
      });
      const data = await res.json();
      setStatusMsg({
        type: data.success ? 'success' : 'error',
        text: data.message || 'Recalculation complete.',
      });
      await fetchScraperStatus();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Recalculate failed: ${err.message}` });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/tyee/scraper/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2026 }),
      });
      const data = await res.json();
      setStatusMsg({
        type: data.valid ? 'success' : 'error',
        text: data.valid ? 'Dataset validated: All cumulative curves and dates are strictly monotonic and healthy.' : `Integrity anomalies: ${data.issues?.join(', ')}`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Validation failed: ${err.message}` });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setStatusMsg(null);
    try {
      await addAdminByEmail(newAdminEmail.trim());
      setNewAdminEmail('');
      setStatusMsg({ type: 'success', text: `Administrator privileges granted to ${newAdminEmail.trim()}` });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to grant admin privileges.' });
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    if (adminEmail.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      setStatusMsg({ type: 'error', text: 'Cannot revoke root bootstrap administrator.' });
      return;
    }
    if (confirm(`Revoke admin privileges from ${adminEmail}?`)) {
      try {
        await removeAdmin(adminId);
        setStatusMsg({ type: 'success', text: `Admin access revoked from ${adminEmail}.` });
      } catch (e: any) {
        setStatusMsg({ type: 'error', text: e.message || 'Failed to revoke admin.' });
      }
    }
  };

  // Export Userbase to CSV
  const handleExportCSV = () => {
    if (!allUsers.length) return;
    const headers = ['UID', 'DisplayName', 'Email', 'Provider', 'RiverRole', 'PreferredTributary', 'AlertThreshold', 'IsAdmin', 'CreatedAt', 'UpdatedAt'];
    const rows = allUsers.map(u => [
      `"${u.uid}"`,
      `"${u.displayName.replace(/"/g, '""')}"`,
      `"${u.email || 'N/A'}"`,
      `"${u.provider}"`,
      `"${u.riverRole}"`,
      `"${u.preferredTributary || 'N/A'}"`,
      u.alertThreshold,
      u.isAdmin ? 'true' : 'false',
      `"${u.createdAt}"`,
      `"${u.updatedAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `skeena_steelhead_userbase_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.riverRole === roleFilter;
    const matchesProvider = providerFilter === 'all' || u.provider === providerFilter;

    return matchesSearch && matchesRole && matchesProvider;
  });

  // Filtered audit logs
  const logs = scraperData?.recentAuditLogs || [];
  const filteredLogs = logs.filter(l => {
    if (logStatusFilter === 'all') return true;
    return l.status === logStatusFilter;
  });

  // Analytics breakdown
  const totalUsers = allUsers.length;
  const biologistCount = allUsers.filter(u => u.riverRole === 'biologist').length;
  const guideCount = allUsers.filter(u => u.riverRole === 'guide').length;
  const anglerCount = allUsers.filter(u => u.riverRole === 'angler').length;
  const conservationCount = allUsers.filter(u => u.riverRole === 'conservationist').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">Skeena Admin Console</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] truncate max-w-[150px] sm:max-w-none">
                  {user?.email || user?.displayName}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono truncate hidden sm:block">Automated DFO Scraper, audit logs, and account access controls</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isLoading || isScraperLoading}
              className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition disabled:opacity-50 shadow-sm flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isScraperLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeAdminModal}
              className="p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 border border-[var(--border-main)] transition shadow-sm flex items-center justify-center"
              title="Close Admin Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-main)] bg-[var(--bg-subtle)] px-4 sm:px-6 justify-between items-center text-xs font-mono overflow-x-auto scrollbar-none gap-2">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Directory ({allUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('scraper')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'scraper'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>DFO Scraper &amp; Diagnostics</span>
              {scraperData?.scheduler?.lastStatus === 'ERROR' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'admins'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Privileges</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={handleExportCSV}
              disabled={!allUsers.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition disabled:opacity-50 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b font-mono transition-all ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'scraper' ? (
            /* DFO Scraper Operations Tab */
            <div className="space-y-6 font-mono">
              {/* 1. Scheduler Status & Live Action Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Card */}
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Automation Engine</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>ACTIVE HOURLY CRON</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Clock className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />
                    <span>Interval: <strong>Every 60 minutes</strong></span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Next Run: {scraperData?.scheduler?.nextScheduledTime ? new Date(scraperData.scheduler.nextScheduledTime).toLocaleTimeString() : 'In ~45 mins'}
                  </div>
                </div>

                {/* Latest Telemetry Card */}
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Latest Scraped Record</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-secondary)]">
                      {scraperData?.activeSeasonMetadata?.year || 2026} Season
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Date:</span>
                    <span className="font-bold text-[var(--text-main)]">{scraperData?.activeSeasonMetadata?.lastRecordedDate || '2026-08-17'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Cumulative Index:</span>
                    <span className="font-bold text-[var(--accent-amber)]">
                      {scraperData?.activeSeasonMetadata?.lastRecordedIndex ? scraperData.activeSeasonMetadata.lastRecordedIndex.toFixed(2) : '164.32'} pts
                    </span>
                  </div>
                </div>

                {/* Manual Trigger & Maintenance */}
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Manual Trigger</span>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Force instant DFO portal fetch &amp; database sync</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTriggerScrapeNow}
                      disabled={isScrapingNow}
                      className="flex-1 py-2 px-3 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScrapingNow ? 'animate-spin' : ''}`} />
                      <span>{isScrapingNow ? 'Scraping DFO...' : 'Scrape DFO Now'}</span>
                    </button>
                    <button
                      onClick={handleRecalculate}
                      disabled={isRecalculating}
                      className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] border border-[var(--border-main)] rounded-xl transition text-xs"
                      title="Recalculate Cumulative Curve"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Last Execution Report Banner */}
              {scraperData?.scheduler && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  scraperData.scheduler.lastStatus === 'ERROR'
                    ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                    : scraperData.scheduler.lastStatus === 'PARTIAL'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {scraperData.scheduler.lastStatus === 'ERROR' ? (
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : scraperData.scheduler.lastStatus === 'PARTIAL' ? (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[11px]">
                        Last Run Status: {scraperData.scheduler.lastStatus} ({scraperData.scheduler.recordsUpdated} rows updated)
                      </span>
                      <span className="text-[10px] opacity-75">
                        {scraperData.scheduler.lastExecutionTime ? new Date(scraperData.scheduler.lastExecutionTime).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <p className="opacity-90">{scraperData.scheduler.lastMessage}</p>
                  </div>
                </div>
              )}

              {/* 3. Scrape Audit Logs & History */}
              <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-subtle)] space-y-0">
                <div className="p-3.5 bg-[var(--bg-surface)] border-b border-[var(--border-main)] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[var(--accent-amber)]" />
                    <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                      Scraper Execution Audit Logs ({logs.length})
                    </h3>
                  </div>

                  {/* Filter Status */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--text-muted)] text-[10px]">Filter Status:</span>
                    <select
                      value={logStatusFilter}
                      onChange={(e) => setLogStatusFilter(e.target.value)}
                      className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none"
                    >
                      <option value="all">All ({logs.length})</option>
                      <option value="SUCCESS">Success ({logs.filter(l => l.status === 'SUCCESS').length})</option>
                      <option value="PARTIAL">Partial/No-Op ({logs.filter(l => l.status === 'PARTIAL').length})</option>
                      <option value="ERROR">Errors ({logs.filter(l => l.status === 'ERROR').length})</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                      No audit log records match the filter.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-main)] text-xs">
                      {filteredLogs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        return (
                          <div key={log.id} className="p-3 hover:bg-[var(--border-light)] transition">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                                  log.status === 'SUCCESS'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : log.status === 'ERROR'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}>
                                  {log.status}
                                </span>
                                <div className="space-y-0.5 min-w-0">
                                  <p className="font-semibold text-[var(--text-main)] break-words">{log.message}</p>
                                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] flex-wrap">
                                    <span>Updated: <strong>{log.recordsUpdated} rows</strong></span>
                                    {log.latestRecordedDate && <span>Latest Date: <strong>{log.latestRecordedDate}</strong></span>}
                                    {log.latestRecordedIndex && <span>Latest Cum: <strong>{log.latestRecordedIndex.toFixed(2)}</strong></span>}
                                    <span className="truncate max-w-[200px]" title={log.source}>Src: {log.source.split('?')[0]}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {log.details && (
                                  <button
                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                    className="p-1 rounded hover:bg-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                                    title="Toggle Diagnostic Details"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expanded Diagnostics */}
                            {isExpanded && log.details && (
                              <div className="mt-2.5 p-2.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-[11px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap break-all">
                                <div className="font-bold text-[10px] text-[var(--text-muted)] uppercase mb-1">Diagnostic Details:</div>
                                {log.details}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Scraper Test & Dry-Run Sandbox */}
              <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-subtle)]">
                <button
                  onClick={() => setIsSandboxOpen(!isSandboxOpen)}
                  className="w-full p-3.5 bg-[var(--bg-surface)] hover:bg-[var(--border-light)] transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[var(--accent-amber)]" />
                    <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                      Scraper Dry-Run Sandbox &amp; Parser Inspector
                    </h3>
                  </div>
                  {isSandboxOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                </button>

                {isSandboxOpen && (
                  <div className="p-4 space-y-3 border-t border-[var(--border-main)]">
                    <p className="text-xs text-[var(--text-muted)]">
                      Test any custom DFO URL or paste raw bulletin HTML/CSV to dry-run the parser without modifying the persistent database:
                    </p>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Optional DFO URL (e.g. https://www-ops2.pac.dfo-mpo.gc.ca/...)"
                        value={dryRunUrl}
                        onChange={(e) => setDryRunUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                      />
                      <textarea
                        rows={3}
                        placeholder="Or paste raw DFO Table HTML / CSV text here..."
                        value={dryRunRawText}
                        onChange={(e) => setDryRunRawText(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] border border-[var(--border-main)] rounded-lg text-xs transition"
                      >
                        {isValidating ? 'Validating...' : 'Validate Dataset Integrity'}
                      </button>
                      <button
                        onClick={handleRunDryRun}
                        disabled={isDryRunning}
                        className="px-4 py-2 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Play className={`w-3.5 h-3.5 ${isDryRunning ? 'animate-spin' : ''}`} />
                        <span>{isDryRunning ? 'Testing Parser...' : 'Run Dry-Run Preview'}</span>
                      </button>
                    </div>

                    {/* Dry Run Preview Result */}
                    {dryRunPreview && (
                      <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className={dryRunPreview.success ? 'text-emerald-500' : 'text-rose-500'}>
                            {dryRunPreview.message}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            Format: {dryRunPreview.formatDetected} ({dryRunPreview.totalRowsParsed} rows found)
                          </span>
                        </div>
                        {dryRunPreview.parsedRows && dryRunPreview.parsedRows.length > 0 && (
                          <div className="max-h-[160px] overflow-y-auto border border-[var(--border-main)] rounded-lg">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] sticky top-0 border-b border-[var(--border-main)]">
                                <tr>
                                  <th className="p-1.5">Date</th>
                                  <th className="p-1.5">Daily Index</th>
                                  <th className="p-1.5">Cum Index</th>
                                  <th className="p-1.5">Status</th>
                                  <th className="p-1.5">Diff</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-main)]">
                                {dryRunPreview.parsedRows.slice(0, 15).map((r: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="p-1.5 font-bold">{r.monthDay}</td>
                                    <td className="p-1.5">{r.dailyIndex}</td>
                                    <td className="p-1.5 font-semibold text-[var(--accent-amber)]">{r.cumulativeIndex}</td>
                                    <td className="p-1.5">
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                                        {r.status}
                                      </span>
                                    </td>
                                    <td className="p-1.5 text-[10px] text-[var(--text-muted)]">{r.diffVsCurrent}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            /* User Directory Tab */
            <div className="space-y-4 font-mono">
              {/* Analytics summary chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl">
                  <span className="text-[var(--text-muted)]">Total Accounts</span>
                  <p className="text-lg font-bold text-[var(--text-main)]">{totalUsers}</p>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl">
                  <span className="text-[var(--text-muted)]">Biologists</span>
                  <p className="text-lg font-bold text-[var(--accent-teal)]">{biologistCount}</p>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl">
                  <span className="text-[var(--text-muted)]">Guides &amp; Anglers</span>
                  <p className="text-lg font-bold text-[var(--accent-amber)]">{guideCount + anglerCount}</p>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl">
                  <span className="text-[var(--text-muted)]">Conservationists</span>
                  <p className="text-lg font-bold text-[var(--accent-spruce)]">{conservationCount}</p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or UID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="angler">Anglers</option>
                    <option value="guide">River Guides</option>
                    <option value="biologist">Biologists</option>
                    <option value="conservationist">Conservationists</option>
                    <option value="resident">Residents</option>
                  </select>

                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none"
                  >
                    <option value="all">All Auth Providers</option>
                    <option value="google">Google</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-subtle)]">
                <div className="max-h-[340px] overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-muted)] text-xs">
                      No user records match the specified filters.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border-main)] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">User Profile</th>
                          <th className="py-2.5 px-3">Role &amp; Affiliation</th>
                          <th className="py-2.5 px-3">Focus Watershed</th>
                          <th className="py-2.5 px-3">Auth / Storage</th>
                          <th className="py-2.5 px-3">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-main)]">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-[var(--border-light)] transition">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[var(--accent-amber)] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                  {u.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[var(--text-main)] truncate max-w-[140px]">{u.displayName}</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[140px]">{u.email || u.uid.slice(0, 10)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-secondary)]">
                                {u.riverRole}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[var(--text-secondary)] truncate max-w-[130px]">
                              {u.preferredTributary || 'General'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="capitalize font-medium text-[var(--accent-amber)]">
                                {u.provider}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[var(--text-muted)] text-[10px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Admin Tab */
            <div className="space-y-4 font-mono">
              <form onSubmit={handleAddAdmin} className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Grant Admin Access</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Add an email address to grant administrative permissions:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="colleague@domain.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Admin</span>
                  </button>
                </div>
              </form>

              {/* Admin List */}
              <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-subtle)]">
                <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border-main)] text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Current Administrators ({adminList.length})
                </div>
                <div className="divide-y divide-[var(--border-main)]">
                  {adminList.map((adm) => (
                    <div key={adm.adminId || adm.id || adm.email} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--accent-amber)]" />
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-main)]">{adm.email}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {adm.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'Root Bootstrap Admin' : 'Granted Admin'}
                          </p>
                        </div>
                      </div>
                      {adm.email.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && (
                        <button
                          onClick={() => handleRemoveAdmin(adm.adminId || adm.id || '', adm.email)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition"
                          title="Revoke Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span>Skeena Admin Authority</span>
          </div>
          <span>Root: {BOOTSTRAP_ADMIN_EMAIL}</span>
        </div>
      </div>
    </div>
  );
};
