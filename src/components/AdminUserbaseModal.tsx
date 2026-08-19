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
  RotateCcw,
  Ban,
  UserCheck,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Cpu,
  Compass,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  FileSpreadsheet,
  Layers,
  Sparkles,
  KeyRound,
  Waves,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
import { 
  fetchUsageMetricsSummaries, 
  exportTelemetryToCSV, 
  clearTelemetryData, 
  aggregateUserTelemetryStats,
  exportUserStatsToCSV,
  TelemetryEvent, 
  UsageMetricsSummary,
  UserTelemetryStats
} from '../utils/analytics';

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

interface ConfirmModalState {
  type: 'ban' | 'unban' | 'delete' | 'revokeAdmin';
  targetUser?: any;
  targetAdminId?: string;
  targetAdminEmail?: string;
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
    removeAdmin,
    banUser,
    unbanUser,
    deleteUserRecord
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'metrics' | 'admins' | 'scraper'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [banStatusFilter, setBanStatusFilter] = useState<string>('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // In-App Modal Dialog State (replacing prompt() and confirm() to work inside AI Studio preview iframes)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('Violation of Skeena Telemetry Terms of Service');
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

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
  const [setIsValidating] = useState(false);

  // Usage Metrics & Telemetry State
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsSummaries, setMetricsSummaries] = useState<UsageMetricsSummary[]>([]);
  const [recentEvents, setRecentEvents] = useState<TelemetryEvent[]>([]);
  const [overallKPIs, setOverallKPIs] = useState<{
    totalVisitsAllTime: number;
    totalTyeeQueriesAllTime: number;
    totalSimulatorRunsAllTime: number;
    totalDossierDecryptionsAllTime: number;
    totalReportsExportedAllTime: number;
    totalFieldLogsAllTime: number;
    activeUsersToday: number;
    peakActivityHour: number;
  }>({
    totalVisitsAllTime: 0,
    totalTyeeQueriesAllTime: 0,
    totalSimulatorRunsAllTime: 0,
    totalDossierDecryptionsAllTime: 0,
    totalReportsExportedAllTime: 0,
    totalFieldLogsAllTime: 0,
    activeUsersToday: 0,
    peakActivityHour: 9
  });
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [userStatsSearchTerm, setUserStatsSearchTerm] = useState('');
  const [selectedUserFilterId, setSelectedUserFilterId] = useState<string | null>(null);
  const [userStatsSortBy, setUserStatsSortBy] = useState<'score' | 'events' | 'queries' | 'lastActive'>('score');

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

  const loadUsageMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const data = await fetchUsageMetricsSummaries();
      setMetricsSummaries(data.summaries);
      setRecentEvents(data.recentEvents);
      setOverallKPIs(data.overallKPIs);
    } catch (err) {
      console.warn('Could not query telemetry summaries:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      setIsLoading(true);
      fetchAllUsersForAdmin().finally(() => setIsLoading(false));
      fetchScraperStatus();
      loadUsageMetrics();
    }
  }, [isAdminModalOpen, isAdmin, fetchScraperStatus, loadUsageMetrics, fetchAllUsersForAdmin]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const handleRefresh = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'scraper') {
        await fetchScraperStatus();
        setStatusMsg({ type: 'success', text: 'Scraper diagnostics and audit logs refreshed.' });
      } else if (activeTab === 'metrics') {
        await loadUsageMetrics();
        setStatusMsg({ type: 'success', text: 'Telemetry and site usage metrics refreshed.' });
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
        error: `Sandbox execution failed: ${err.message}`,
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleRecalculateStats = async () => {
    setIsRecalculating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/tyee/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2026 }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `Recalculation complete: ${data.recordsUpdated || 0} records updated.`,
        });
        window.dispatchEvent(new CustomEvent('skeena-dataset-refreshed'));
      } else {
        setStatusMsg({ type: 'error', text: `Recalculation error: ${data.message}` });
      }
      await fetchScraperStatus();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Recalculation request failed: ${err.message}` });
    } finally {
      setIsRecalculating(false);
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

  // --- Modal Confirmation Triggers ---

  const triggerBanModal = (targetUser: any) => {
    if (targetUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      setStatusMsg({ type: 'error', text: 'Root bootstrap administrator cannot be banned.' });
      return;
    }
    setBanReasonInput('Violation of Skeena Telemetry Terms of Service');
    setConfirmModal({ type: 'ban', targetUser });
  };

  const triggerUnbanModal = (targetUser: any) => {
    setConfirmModal({ type: 'unban', targetUser });
  };

  const triggerDeleteModal = (targetUser: any) => {
    if (targetUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      setStatusMsg({ type: 'error', text: 'Root bootstrap administrator cannot be deleted.' });
      return;
    }
    setDeleteConfirmInput('');
    setConfirmModal({ type: 'delete', targetUser });
  };

  const triggerRevokeAdminModal = (adminId: string, adminEmail: string) => {
    if (adminEmail.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      setStatusMsg({ type: 'error', text: 'Cannot revoke root bootstrap administrator.' });
      return;
    }
    setConfirmModal({ type: 'revokeAdmin', targetAdminId: adminId, targetAdminEmail: adminEmail });
  };

  // Execute Confirmation Action
  const handleExecuteConfirmModal = async () => {
    if (!confirmModal) return;
    setStatusMsg(null);

    try {
      if (confirmModal.type === 'ban' && confirmModal.targetUser) {
        await banUser(confirmModal.targetUser.uid, banReasonInput.trim());
        setStatusMsg({ type: 'success', text: `User ${confirmModal.targetUser.displayName} has been suspended.` });
      } else if (confirmModal.type === 'unban' && confirmModal.targetUser) {
        await unbanUser(confirmModal.targetUser.uid);
        setStatusMsg({ type: 'success', text: `User ${confirmModal.targetUser.displayName} access has been restored.` });
      } else if (confirmModal.type === 'delete' && confirmModal.targetUser) {
        if (deleteConfirmInput !== 'DELETE') {
          setStatusMsg({ type: 'error', text: 'Deletion aborted: You must type "DELETE" exactly to confirm.' });
          return;
        }
        await deleteUserRecord(confirmModal.targetUser.uid);
        setStatusMsg({ type: 'success', text: `User ${confirmModal.targetUser.displayName} permanently deleted.` });
      } else if (confirmModal.type === 'revokeAdmin' && confirmModal.targetAdminId) {
        await removeAdmin(confirmModal.targetAdminId);
        setStatusMsg({ type: 'success', text: `Admin privileges revoked for ${confirmModal.targetAdminEmail}.` });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setConfirmModal(null);
    }
  };

  // Export Userbase to CSV
  const handleExportCSV = () => {
    if (!allUsers.length) return;
    const headers = ['UID', 'DisplayName', 'Email', 'Provider', 'RiverRole', 'PreferredTributary', 'AlertThreshold', 'IsAdmin', 'IsBanned', 'CreatedAt', 'UpdatedAt'];
    const rows = allUsers.map(u => [
      `"${u.uid}"`,
      `"${u.displayName.replace(/"/g, '""')}"`,
      `"${u.email || 'N/A'}"`,
      `"${u.provider}"`,
      `"${u.riverRole}"`,
      `"${u.preferredTributary || 'N/A'}"`,
      u.alertThreshold,
      u.isAdmin ? 'true' : 'false',
      u.isBanned ? 'true' : 'false',
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

  const handleClearTelemetry = async () => {
    if (window.confirm('Reset local telemetry logs and regenerate clean baseline counters?')) {
      await clearTelemetryData();
      await loadUsageMetrics();
      setStatusMsg({ type: 'success', text: 'Telemetry buffers reset.' });
    }
  };

  // Filtered users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.riverRole === roleFilter;
    const matchesProvider = providerFilter === 'all' || u.provider === providerFilter;
    const matchesBan = 
      banStatusFilter === 'all' || 
      (banStatusFilter === 'banned' && u.isBanned) || 
      (banStatusFilter === 'active' && !u.isBanned);

    return matchesSearch && matchesRole && matchesProvider && matchesBan;
  });

  // Filtered audit logs
  const logs = scraperData?.recentAuditLogs || [];
  const filteredLogs = logs.filter(l => {
    if (logStatusFilter === 'all') return true;
    return l.status === logStatusFilter;
  });

  // Filtered telemetry events
  const filteredTelemetryEvents = recentEvents.filter(e => {
    const matchesCat = eventCategoryFilter === 'all' || e.category === eventCategoryFilter;
    const matchesSelectedUser = !selectedUserFilterId || e.userId === selectedUserFilterId || e.userEmail === selectedUserFilterId;
    const matchesSearch = 
      e.action.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
      (e.userEmail && e.userEmail.toLowerCase().includes(eventSearchTerm.toLowerCase())) ||
      (e.tributary && e.tributary.toLowerCase().includes(eventSearchTerm.toLowerCase())) ||
      e.userRole.toLowerCase().includes(eventSearchTerm.toLowerCase());
    return matchesCat && matchesSelectedUser && matchesSearch;
  });

  // Calculate Aggregated User Stats
  const rawUserStats = aggregateUserTelemetryStats(recentEvents, allUsers);
  const filteredUserStats = rawUserStats
    .filter(u => {
      const q = userStatsSearchTerm.toLowerCase();
      return (
        u.userId.toLowerCase().includes(q) ||
        (u.userEmail && u.userEmail.toLowerCase().includes(q)) ||
        u.userRole.toLowerCase().includes(q) ||
        (u.favoriteTributary && u.favoriteTributary.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (userStatsSortBy === 'events') return b.totalEvents - a.totalEvents;
      if (userStatsSortBy === 'queries') return b.tyeeQueries - a.tyeeQueries;
      if (userStatsSortBy === 'lastActive') return b.lastActive.localeCompare(a.lastActive);
      return b.activityScore - a.activityScore;
    });

  // Calculate Sub-Basin Affinity Aggregates
  const subBasinTotals: Record<string, number> = {};
  metricsSummaries.forEach(s => {
    if (s.tributaryBreakdown) {
      Object.entries(s.tributaryBreakdown).forEach(([basin, count]) => {
        subBasinTotals[basin] = (subBasinTotals[basin] || 0) + count;
      });
    }
  });
  const sortedBasins = Object.entries(subBasinTotals).sort((a, b) => b[1] - a[1]);
  const maxBasinVal = sortedBasins.length > 0 ? Math.max(...sortedBasins.map(b => b[1])) : 1;

  // Max daily visits for bar chart scaling
  const maxDailyVisits = Math.max(...metricsSummaries.map(s => s.totalVisits || 1), 10);

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
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono truncate hidden sm:block">Site usage telemetry, automated DFO scraper, and account access controls</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isLoading || isScraperLoading || metricsLoading}
              className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition disabled:opacity-50 shadow-sm flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isScraperLoading || metricsLoading ? 'animate-spin' : ''}`} />
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
              onClick={() => setActiveTab('metrics')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'metrics'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Site Telemetry & Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('scraper')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'scraper'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Automated DFO Scraper</span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'admins'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Admin Access ({adminList.length})</span>
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div className={`px-4 sm:px-6 py-2 text-xs flex items-center justify-between border-b ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: USAGE METRICS & TELEMETRY */}
          {activeTab === 'metrics' ? (
            <div className="space-y-6 font-mono">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px]">
                    <span>Total Sessions</span>
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-heading text-[var(--text-main)]">
                    {overallKPIs.totalVisitsAllTime.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1">All-time portal visits</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px]">
                    <span>Active Today</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-heading text-[var(--text-main)]">
                    {overallKPIs.activeUsersToday}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">DAU daily active users</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px]">
                    <span>Tyee Queries</span>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-heading text-[var(--text-main)]">
                    {overallKPIs.totalTyeeQueriesAllTime.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">Test fishery index lookups</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px]">
                    <span>Simulator Runs</span>
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-heading text-[var(--text-main)]">
                    {overallKPIs.totalSimulatorRunsAllTime.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">What-If run curve shifts</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px]">
                    <span>Dossier Decryptions</span>
                    <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-heading text-[var(--text-main)]">
                    {overallKPIs.totalDossierDecryptionsAllTime.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">AES-256 vault accesses</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[var(--text-muted)] text-[11px]">
                    <span>Reports Exported</span>
                    <Download className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-heading text-[var(--text-main)]">
                    {overallKPIs.totalReportsExportedAllTime.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">CSV & PDF datasets</span>
                </div>
              </div>

              {/* 14-Day Activity Trend Bar Chart */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[var(--accent-amber)]" />
                      <span>14-Day Portal Activity Volume & Inquiries</span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Daily breakdown of user sessions, simulation runs, and Tyee test fishery queries</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportTelemetryToCSV(recentEvents)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] text-xs flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={handleClearTelemetry}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border-main)] text-xs flex items-center gap-1.5 transition"
                      title="Reset Telemetry Data"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <div className="h-36 flex items-end gap-1 sm:gap-2 justify-between border-b border-[var(--border-main)] pb-2 px-1">
                    {metricsSummaries.map((day) => {
                      const heightPercent = Math.max(12, Math.round((day.totalVisits / maxDailyVisits) * 100));
                      const dateShort = day.date.slice(5); // MM-DD
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div 
                            className="w-full rounded-t-md bg-gradient-to-t from-[var(--accent-amber)] to-amber-300 dark:to-amber-500 opacity-85 group-hover:opacity-100 transition shadow-xs"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-mono">{dateShort}</span>

                          {/* Hover tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 bg-black/90 text-white rounded-lg shadow-xl text-[10px] z-30 pointer-events-none whitespace-nowrap min-w-[130px]">
                            <span className="font-bold text-amber-300">{day.date}</span>
                            <span>Visits: {day.totalVisits}</span>
                            <span>Tyee Queries: {day.tyeeQueries}</span>
                            <span>Simulator: {day.simulatorRuns}</span>
                            <span>Dossier Views: {day.dossierDecryptions}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-Basin Affinity & Platform Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basin Affinity */}
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                    <Waves className="w-4 h-4 text-sky-500" />
                    <span>Watershed Sub-Basin Research Affinity</span>
                  </h3>
                  <div className="space-y-2 pt-1">
                    {sortedBasins.map(([basin, count]) => {
                      const pct = Math.round((count / maxBasinVal) * 100);
                      return (
                        <div key={basin} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-[var(--text-main)] font-semibold truncate max-w-[240px]">{basin}</span>
                            <span className="text-[var(--text-muted)] font-mono">{count} queries</span>
                          </div>
                          <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--border-main)]">
                            <div 
                              className="h-full bg-gradient-to-r from-sky-500 to-teal-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Device & Role Split */}
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-4">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Audience Composition & Access Form Factors</span>
                  </h3>

                  {/* Device Form Factor */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-col items-center text-center">
                      <Monitor className="w-4 h-4 text-sky-500 mb-1" />
                      <span className="text-[11px] font-bold text-[var(--text-main)]">Desktop</span>
                      <span className="text-[10px] text-[var(--text-muted)]">62% of traffic</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-col items-center text-center">
                      <Smartphone className="w-4 h-4 text-emerald-500 mb-1" />
                      <span className="text-[11px] font-bold text-[var(--text-main)]">Mobile</span>
                      <span className="text-[10px] text-[var(--text-muted)]">31% river field</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-col items-center text-center">
                      <Tablet className="w-4 h-4 text-purple-500 mb-1" />
                      <span className="text-[11px] font-bold text-[var(--text-main)]">Tablet</span>
                      <span className="text-[10px] text-[var(--text-muted)]">7% lodge access</span>
                    </div>
                  </div>

                  {/* Peak Research Window */}
                  <div className="p-3 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-xs text-[var(--accent-amber)] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Peak Activity Windows: 08:00 - 10:00 & 18:00 - 20:00 PST</span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      Anglers and river guides check run escapement curves prior to departure and log observations during evening debriefs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-User Usage & Activity Breakdown Table */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-500" />
                        <span>Individual Per-User Usage Statistics ({filteredUserStats.length})</span>
                      </h3>
                      {selectedUserFilterId && (
                        <button
                          onClick={() => setSelectedUserFilterId(null)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] flex items-center gap-1 font-mono hover:opacity-80"
                        >
                          <span>Filtered: {selectedUserFilterId}</span>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Detailed feature engagement, simulation runs, dossier lookups, and sub-basin affinity per researcher
                    </p>
                  </div>

                  {/* Filter & Sorting Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search user or email..."
                        value={userStatsSearchTerm}
                        onChange={(e) => setUserStatsSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)] w-36 sm:w-44"
                      />
                    </div>

                    <select
                      value={userStatsSortBy}
                      onChange={(e) => setUserStatsSortBy(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                    >
                      <option value="score">Sort: Activity Score</option>
                      <option value="events">Sort: Total Events</option>
                      <option value="queries">Sort: Tyee Queries</option>
                      <option value="lastActive">Sort: Most Recent</option>
                    </select>

                    <button
                      onClick={() => exportUserStatsToCSV(filteredUserStats)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] text-xs flex items-center gap-1 transition"
                      title="Export Per-User Stats CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span className="hidden sm:inline">Export User CSV</span>
                    </button>
                  </div>
                </div>

                <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-surface)] max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                        <th className="py-2.5 px-3">User / Identity</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3 text-center">Score</th>
                        <th className="py-2.5 px-3">Feature Activity Breakdown</th>
                        <th className="py-2.5 px-3">Top Sub-Basin</th>
                        <th className="py-2.5 px-3">Device</th>
                        <th className="py-2.5 px-3">Last Active</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)] text-[11px]">
                      {filteredUserStats.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                            No user activity records matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUserStats.map((stat) => {
                          const isSelected = selectedUserFilterId === stat.userId || selectedUserFilterId === stat.userEmail;
                          return (
                            <tr 
                              key={stat.userId} 
                              className={`transition ${isSelected ? 'bg-[var(--accent-amber-light)]/40 border-l-2 border-[var(--accent-amber)]' : 'hover:bg-[var(--bg-subtle)]'}`}
                            >
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-[var(--text-main)] truncate max-w-[180px]">
                                  {stat.userId}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
                                  {stat.userEmail || 'Guest / Unlinked'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono capitalize ${
                                  stat.userRole === 'biologist' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' :
                                  stat.userRole === 'guide' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  stat.userRole === 'conservationist' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                  'bg-[var(--border-light)] text-[var(--text-secondary)]'
                                }`}>
                                  {stat.userRole}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="font-bold text-[var(--accent-amber)] bg-[var(--accent-amber-light)] px-2 py-0.5 rounded-full text-[10px] border border-[var(--accent-amber-border)] font-mono">
                                  {stat.activityScore}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {stat.tyeeQueries > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-mono" title="Tyee Queries">
                                      {stat.tyeeQueries} Tyee
                                    </span>
                                  )}
                                  {stat.simulatorRuns > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 font-mono" title="Simulator Runs">
                                      {stat.simulatorRuns} Sim
                                    </span>
                                  )}
                                  {stat.dossierDecryptions > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono" title="Dossier Decryptions">
                                      {stat.dossierDecryptions} Vault
                                    </span>
                                  )}
                                  {stat.satelliteMapViews > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono" title="Satellite Maps">
                                      {stat.satelliteMapViews} Map
                                    </span>
                                  )}
                                  {stat.observationsLogged > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 font-mono" title="Observations Logged">
                                      {stat.observationsLogged} Logs
                                    </span>
                                  )}
                                  {stat.reportsExported > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono" title="Exports">
                                      {stat.reportsExported} Export
                                    </span>
                                  )}
                                  {stat.totalEvents === 0 && (
                                    <span className="text-[10px] text-[var(--text-muted)] italic">
                                      Registered (Pending logs)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[var(--text-main)] truncate max-w-[140px]">
                                {stat.favoriteTributary ? (
                                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                    {stat.favoriteTributary.split(' ')[0]}...
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-muted)]">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] flex items-center gap-1 text-[var(--text-muted)]">
                                  {stat.primaryDevice === 'Mobile' ? <Smartphone className="w-3 h-3 text-emerald-500" /> :
                                   stat.primaryDevice === 'Tablet' ? <Tablet className="w-3 h-3 text-purple-500" /> :
                                   <Monitor className="w-3 h-3 text-sky-500" />}
                                  {stat.primaryDevice}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[var(--text-muted)] whitespace-nowrap text-[10px]">
                                {stat.lastActive ? stat.lastActive.slice(5, 16).replace('T', ' ') : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedUserFilterId(null);
                                    } else {
                                      setSelectedUserFilterId(stat.userEmail || stat.userId);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-mono transition border ${
                                    isSelected 
                                      ? 'bg-[var(--accent-amber)] text-black border-[var(--accent-amber)] font-bold' 
                                      : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] border-[var(--border-main)]'
                                  }`}
                                  title="Filter audit stream by this user"
                                >
                                  {isSelected ? 'Clear Filter' : 'Filter Stream'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Telemetry Event Audit Stream */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      <span>Live Telemetry Event Audit Stream ({filteredTelemetryEvents.length})</span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Real-time interaction feed across the Skeena watershed application</p>
                  </div>

                  {/* Event Filter & Search */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search event actions..."
                        value={eventSearchTerm}
                        onChange={(e) => setEventSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)] w-40 sm:w-48"
                      />
                    </div>
                    <select
                      value={eventCategoryFilter}
                      onChange={(e) => setEventCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                    >
                      <option value="all">All Categories</option>
                      <option value="intelligence">Intelligence / Dossier</option>
                      <option value="simulator">Simulator Run</option>
                      <option value="navigation">Maps / Navigation</option>
                      <option value="conservation">Conservation / Catch</option>
                      <option value="export">Data Exports</option>
                      <option value="admin">Admin Actions</option>
                    </select>
                  </div>
                </div>

                <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-surface)] max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Action Description</th>
                        <th className="py-2.5 px-3">Watershed Sub-Basin</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)] text-[11px]">
                      {filteredTelemetryEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                            No telemetry events matching filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTelemetryEvents.slice(0, 50).map((evt) => (
                          <tr key={evt.id} className="hover:bg-[var(--bg-subtle)] transition">
                            <td className="py-2 px-3 text-[var(--text-muted)] whitespace-nowrap">
                              {evt.timestamp.slice(11, 19)} PST
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                                evt.category === 'intelligence' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                evt.category === 'simulator' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                evt.category === 'navigation' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' :
                                evt.category === 'export' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' :
                                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              }`}>
                                {evt.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-[var(--text-main)]">
                              {evt.action}
                            </td>
                            <td className="py-2 px-3 text-[var(--text-muted)] truncate max-w-[180px]">
                              {evt.tributary || '—'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border-light)] text-[var(--text-secondary)] font-mono capitalize">
                                {evt.userRole}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[var(--text-muted)]">
                              {evt.device}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            /* TAB 2: USER DIRECTORY */
            <div className="space-y-4 font-mono">
              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by name, email, UID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                >
                  <option value="all">All River Roles</option>
                  <option value="angler">Angler</option>
                  <option value="guide">Guide</option>
                  <option value="biologist">Biologist</option>
                  <option value="conservationist">Conservationist</option>
                  <option value="resident">Resident</option>
                  <option value="guest">Guest</option>
                </select>

                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                >
                  <option value="all">All Auth Providers</option>
                  <option value="google">Google Auth</option>
                  <option value="apple">Apple ID</option>
                  <option value="local">Local Simulated</option>
                </select>

                <select
                  value={banStatusFilter}
                  onChange={(e) => setBanStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                >
                  <option value="all">All Account Statuses</option>
                  <option value="active">Active Accounts Only</option>
                  <option value="banned">Suspended / Banned</option>
                </select>
              </div>

              {/* User Directory Table */}
              <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-subtle)]">
                <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border-main)] flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Registered Anglers & Biologists ({filteredUsers.length})
                  </span>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                        <th className="py-2.5 px-3">Angler / User</th>
                        <th className="py-2.5 px-3">River Role</th>
                        <th className="py-2.5 px-3">Auth Provider</th>
                        <th className="py-2.5 px-3">Preferred Basin</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)] text-[11px]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                            No angler accounts found matching filter.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.uid} className={`hover:bg-[var(--bg-surface)] transition ${u.isBanned ? 'opacity-60 bg-rose-500/5' : ''}`}>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[var(--accent-amber-light)] text-[var(--accent-amber)] flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {u.displayName.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[var(--text-main)] truncate">{u.displayName}</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">{u.email || u.uid}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-secondary)] capitalize">
                                {u.riverRole}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-[var(--text-muted)] capitalize">
                              {u.provider}
                            </td>

                            <td className="py-2.5 px-3 text-[var(--text-secondary)] truncate max-w-[140px]">
                              {u.preferredTributary || 'All Watershed'}
                            </td>

                            <td className="py-2.5 px-3">
                              {u.isBanned ? (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                                  BANNED
                                </span>
                              ) : u.isAdmin ? (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                  ADMIN
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Ban / Unban Button */}
                                {u.isBanned ? (
                                  <button
                                    onClick={() => triggerUnbanModal(u)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition shadow-xs flex items-center gap-1"
                                    title={`Unban and restore access for ${u.displayName}`}
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span className="text-[10px]">Unban</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => triggerBanModal(u)}
                                    className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-amber-500/20 text-[var(--text-muted)] hover:text-amber-500 border border-[var(--border-main)] hover:border-amber-500/30 transition shadow-xs"
                                    title={`Suspend and ban ${u.displayName}`}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete User Button */}
                                <button
                                  onClick={() => triggerDeleteModal(u)}
                                  className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 border border-[var(--border-main)] hover:border-rose-500/30 transition shadow-xs"
                                  title={`Permanently delete ${u.displayName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'scraper' ? (
            /* TAB 3: AUTOMATED DFO SCRAPER */
            <div className="space-y-6 font-mono">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                  <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Scheduler Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-[var(--text-main)]">Active (Daily 06:00 UTC)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Automatic daily query against DFO North Coast Tyee test fishery publication</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                  <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Latest Ingestion</div>
                  <div className="text-sm font-bold text-[var(--text-main)]">
                    {scraperData?.activeSeasonMetadata?.lastRecordedDate || '2026-08-18'}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Cumulative Index: {scraperData?.activeSeasonMetadata?.lastRecordedIndex || 468.2}</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex flex-col justify-between">
                  <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Manual Sync</div>
                  <button
                    onClick={handleTriggerScrapeNow}
                    disabled={isScrapingNow}
                    className="mt-2 w-full py-2 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isScrapingNow ? 'animate-spin' : ''}`} />
                    <span>{isScrapingNow ? 'Scraping Live DFO...' : 'Trigger Live Sync Now'}</span>
                  </button>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Engine Calibration & Maintenance</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRecalculateStats}
                    disabled={isRecalculating}
                    className="px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-main)] border border-[var(--border-main)] rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                    <span>Recalculate 10-Yr Historical Norms</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 4: ADMIN ACCESS */
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
                          onClick={() => triggerRevokeAdminModal(adm.adminId || adm.id || '', adm.email)}
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

        {/* Custom In-App Modal Dialogs for Ban, Unban, Delete, and Revoke Admin */}
        {confirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div 
              className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden font-mono p-5 space-y-4 text-[var(--text-main)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  confirmModal.type === 'delete' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' :
                  confirmModal.type === 'ban' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                }`}>
                  {confirmModal.type === 'delete' ? <AlertOctagon className="w-5 h-5" /> :
                   confirmModal.type === 'ban' ? <Ban className="w-5 h-5" /> :
                   confirmModal.type === 'revokeAdmin' ? <ShieldAlert className="w-5 h-5" /> :
                   <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading">
                    {confirmModal.type === 'delete' ? 'Confirm Permanent Account Purge' :
                     confirmModal.type === 'ban' ? 'Suspend Angler Access' :
                     confirmModal.type === 'revokeAdmin' ? 'Revoke Administrator Privileges' :
                     'Restore Angler Access'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Target: <span className="text-[var(--text-main)] font-semibold">{confirmModal.targetUser?.displayName || confirmModal.targetAdminEmail}</span>
                  </p>
                </div>
              </div>

              {confirmModal.type === 'ban' && (
                <div className="space-y-2">
                  <label className="text-[11px] text-[var(--text-muted)]">Reason for account suspension:</label>
                  <input
                    type="text"
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">The angler will be blocked from saving scenarios, field observations, or logging in.</p>
                </div>
              )}

              {confirmModal.type === 'delete' && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                    ⚠️ Warning: This will permanently purge the user document, public profile, and all associated field data.
                  </div>
                  <label className="text-[11px] text-[var(--text-muted)]">Type <strong>DELETE</strong> to confirm permanent erasure:</label>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="Type DELETE..."
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-rose-500/40 rounded-xl text-xs text-[var(--text-main)] font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {confirmModal.type === 'unban' && (
                <p className="text-xs text-[var(--text-muted)]">
                  Restore active portal privileges for {confirmModal.targetUser?.displayName}? They will regain full access immediately.
                </p>
              )}

              {confirmModal.type === 'revokeAdmin' && (
                <p className="text-xs text-[var(--text-muted)]">
                  Revoke administrative permissions from {confirmModal.targetAdminEmail}? They will revert to standard angler role.
                </p>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-main)]">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteConfirmModal}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm ${
                    confirmModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' :
                    confirmModal.type === 'ban' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {confirmModal.type === 'delete' ? 'Purge Record Permanently' :
                   confirmModal.type === 'ban' ? 'Suspend Angler' :
                   confirmModal.type === 'revokeAdmin' ? 'Revoke Admin' :
                   'Restore Access'}
                </button>
              </div>
            </div>
          </div>
        )}

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

// Helper icon
function AlertOctagon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
