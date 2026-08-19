import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Search, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Mail, 
  MapPin, 
  Globe, 
  Sliders,
  Calendar,
  Lock,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
import { UserAccount } from '../types/auth';

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

  const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      setIsLoading(true);
      fetchAllUsersForAdmin().finally(() => setIsLoading(false));
    }
  }, [isAdminModalOpen, isAdmin]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const handleRefresh = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      await fetchAllUsersForAdmin();
      setStatusMsg({ type: 'success', text: 'Userbase data refreshed from Firestore.' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to refresh users.' });
    } finally {
      setIsLoading(false);
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

  // Analytics breakdown
  const totalUsers = allUsers.length;
  const biologistCount = allUsers.filter(u => u.riverRole === 'biologist').length;
  const guideCount = allUsers.filter(u => u.riverRole === 'guide').length;
  const anglerCount = allUsers.filter(u => u.riverRole === 'angler').length;
  const conservationCount = allUsers.filter(u => u.riverRole === 'conservationist').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">Admin User Directory</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
                  Admin: {user?.email || user?.displayName}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono">View registered accounts, demographics, and manage app access</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition disabled:opacity-50"
              title="Refresh User Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeAdminModal}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-light)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-main)] bg-[var(--bg-subtle)] px-6 justify-between items-center text-xs font-mono">
          <div className="flex gap-2">
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

        {/* Status notification */}
        {statusMsg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-mono ${
            statusMsg.type === 'success' 
              ? 'bg-[var(--accent-spruce-light)] border-[var(--accent-spruce-border)] text-[var(--accent-spruce)]'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'users' ? (
            <div className="space-y-4 font-mono">
              {/* Metrics Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Total Registered</span>
                  <p className="text-xl font-bold text-[var(--text-main)]">{totalUsers}</p>
                  <span className="text-[10px] text-[var(--accent-amber)]">Profiles Synced</span>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Biologists &amp; Science</span>
                  <p className="text-xl font-bold text-[var(--accent-teal)]">{biologistCount}</p>
                  <span className="text-[10px] text-[var(--text-muted)]">{totalUsers > 0 ? ((biologistCount / totalUsers) * 100).toFixed(0) : 0}% of total</span>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Guides &amp; Outfitters</span>
                  <p className="text-xl font-bold text-[var(--accent-spruce)]">{guideCount}</p>
                  <span className="text-[10px] text-[var(--text-muted)]">{totalUsers > 0 ? ((guideCount / totalUsers) * 100).toFixed(0) : 0}% of total</span>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Anglers &amp; Advocates</span>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">{anglerCount + conservationCount}</p>
                  <span className="text-[10px] text-[var(--text-muted)]">{totalUsers > 0 ? (((anglerCount + conservationCount) / totalUsers) * 100).toFixed(0) : 0}% of total</span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  >
                    <option value="all">All Roles</option>
                    <option value="angler">🎣 Anglers</option>
                    <option value="guide">🛶 Guides</option>
                    <option value="biologist">🔬 Biologists</option>
                    <option value="conservationist">🌲 Conservation</option>
                    <option value="resident">🏡 Residents</option>
                    <option value="guest">🌊 Guests</option>
                  </select>

                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  >
                    <option value="all">All Auth Providers</option>
                    <option value="google">Google</option>
                    <option value="apple">Apple</option>
                    <option value="facebook">Facebook</option>
                    <option value="email">Email</option>
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
                    <div key={adm.id} className="p-3 flex items-center justify-between">
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
                          onClick={() => handleRemoveAdmin(adm.id, adm.email)}
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
