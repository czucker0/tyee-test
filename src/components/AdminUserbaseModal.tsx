import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Trash2, 
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
  UserCheck
} from 'lucide-react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
import { UserAccount, RiverRole } from '../types/auth';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Admin Userbase Directory</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Authorized Admin: {user?.email || user?.displayName}
                </span>
              </div>
              <p className="text-xs text-slate-400">View registered users, watershed demographics, and manage app administrators</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Refresh User Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeAdminModal}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 justify-between items-center text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Directory ({allUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'admins'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Access &amp; Permissions</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={handleExportCSV}
              disabled={!allUsers.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-50 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'users' ? (
            <div className="space-y-4">
              {/* Metrics Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Total Registered</span>
                  <p className="text-xl font-bold text-white">{totalUsers}</p>
                  <span className="text-[10px] text-cyan-400 font-mono">Synced Profiles</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Biologists &amp; Science</span>
                  <p className="text-xl font-bold text-purple-300">{biologistCount}</p>
                  <span className="text-[10px] text-purple-400 font-mono">{totalUsers > 0 ? ((biologistCount / totalUsers) * 100).toFixed(0) : 0}% of base</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Guides &amp; Outfitters</span>
                  <p className="text-xl font-bold text-emerald-300">{guideCount}</p>
                  <span className="text-[10px] text-emerald-400 font-mono">{totalUsers > 0 ? ((guideCount / totalUsers) * 100).toFixed(0) : 0}% of base</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Anglers &amp; Advocates</span>
                  <p className="text-xl font-bold text-cyan-300">{anglerCount + conservationCount}</p>
                  <span className="text-[10px] text-slate-400 font-mono">{totalUsers > 0 ? (((anglerCount + conservationCount) / totalUsers) * 100).toFixed(0) : 0}% of base</span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, email, or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                </div>

                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="biologist">Biologist</option>
                    <option value="guide">Guide</option>
                    <option value="angler">Angler</option>
                    <option value="conservationist">Conservationist</option>
                    <option value="resident">Resident</option>
                    <option value="guest">Guest</option>
                  </select>

                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Providers</option>
                    <option value="google">Google</option>
                    <option value="apple">Apple</option>
                    <option value="facebook">Facebook</option>
                    <option value="password">Email / Pass</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-3 py-3">Provider</th>
                        <th className="px-3 py-3">River Role</th>
                        <th className="px-3 py-3">Focus Tributary</th>
                        <th className="px-3 py-3">Escapement Alert</th>
                        <th className="px-3 py-3">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            {isLoading ? 'Loading user database...' : 'No users found matching your criteria.'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-900/60 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt={u.displayName} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs border border-slate-700">
                                    {u.displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-white truncate">{u.displayName}</span>
                                    {u.isAdmin && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 block truncate">{u.email || 'No email (Local)'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                                {u.provider}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-medium capitalize text-slate-200">{u.riverRole}</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-cyan-300 flex items-center gap-1 text-[11px]">
                                <MapPin className="w-3 h-3 text-cyan-500" />
                                {u.preferredTributary || 'All Watershed'}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                              {u.alertThreshold ? `${u.alertThreshold.toLocaleString()} fish` : '20,000 fish'}
                            </td>
                            <td className="px-3 py-3 text-slate-400 text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grant Admin Form */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Add New Administrator</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Enter an email address to grant administrator rights. Designated admins can view user analytics, manage accounts, and assign privileges.
                </p>

                <form onSubmit={handleAddAdmin} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      placeholder="e.g. colleague.biologist@skeenafisheries.ca"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Grant Admin</span>
                  </button>
                </form>
              </div>

              {/* Current Admins List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Administrators ({adminList.length + 1})
                </h3>

                <div className="space-y-2">
                  {/* Root Admin Card */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{BOOTSTRAP_ADMIN_EMAIL}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-amber-500/30 text-amber-200 border border-amber-500/50">
                            Root SuperAdmin
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">Primary application owner &amp; bootstrapped administrator</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Permanent</span>
                  </div>

                  {/* Other Admins */}
                  {adminList
                    .filter((a) => a.email.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL.toLowerCase())
                    .map((adm) => (
                      <div
                        key={adm.adminId}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            <UserCheck className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{adm.email}</span>
                            <span className="text-[11px] text-slate-400">
                              Added by: {adm.addedBy || 'System Admin'} &bull; {new Date(adm.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveAdmin(adm.adminId, adm.email)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span>Skeena Steelhead Analytics RBAC Security Gate</span>
          <button
            onClick={closeAdminModal}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
