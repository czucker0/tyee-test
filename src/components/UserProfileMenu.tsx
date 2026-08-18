import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Settings, 
  Sliders, 
  ShieldCheck, 
  ChevronDown, 
  HardDrive, 
  Globe, 
  MapPin, 
  Bell, 
  Sparkles,
  Trash2,
  Check,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RiverRole } from '../types/auth';

const TRIBUTARY_OPTIONS = [
  'All Watershed (General)',
  'Babine River',
  'Bulkley River',
  'Morice River',
  'Kispiox River',
  'Sustut River',
  'Zymoetz (Copper) River',
  'Kalum River',
  'Kitwanga River',
  'Kispiox & Bulkley System',
  'Skeena Lower Mainstem',
  'Skeena Middle Canyon',
  'Skeena Upper Watershed'
];

const ROLE_LABELS: Record<RiverRole, { label: string; icon: string; badgeColor: string }> = {
  angler: { label: 'Angler', icon: '🎣', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  guide: { label: 'River Guide', icon: '🛶', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  biologist: { label: 'Biologist', icon: '🔬', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  conservationist: { label: 'Conservationist', icon: '🌲', badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30' },
  resident: { label: 'Resident', icon: '🏡', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  guest: { label: 'Visitor', icon: '🌊', badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
};

interface UserProfileMenuProps {
  onLoadScenario?: (multiplier: number, timingShiftDays: number) => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onLoadScenario }) => {
  const { 
    user, 
    isAdmin,
    openAdminModal,
    openAuthModal, 
    signOutUser, 
    updateUserProfile, 
    savedScenarios, 
    deleteScenario 
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'scenarios'>('profile');

  // Edit form state
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editRole, setEditRole] = useState<RiverRole>(user?.riverRole || 'angler');
  const [editTributary, setEditTributary] = useState(user?.preferredTributary || TRIBUTARY_OPTIONS[0]);
  const [editThreshold, setEditThreshold] = useState<number>(user?.alertThreshold || 20000);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setEditName(user.displayName);
      setEditRole(user.riverRole);
      setEditTributary(user.preferredTributary);
      setEditThreshold(user.alertThreshold);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => openAuthModal('social')}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition shadow-sm"
      >
        <User className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  const roleInfo = ROLE_LABELS[user.riverRole] || ROLE_LABELS.angler;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      displayName: editName.trim() || user.displayName,
      riverRole: editRole,
      preferredTributary: editTributary,
      alertThreshold: Number(editThreshold) || 20000
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 1200);
  };

  const getProviderIcon = () => {
    switch (user.provider) {
      case 'google':
        return (
          <span title="Google Cloud Account" className="flex items-center text-xs text-cyan-400">
            <Globe className="w-3 h-3 mr-1" /> Google
          </span>
        );
      case 'apple':
        return (
          <span title="Apple ID" className="flex items-center text-xs text-slate-300">
            <Globe className="w-3 h-3 mr-1" /> Apple
          </span>
        );
      case 'facebook':
        return (
          <span title="Facebook Account" className="flex items-center text-xs text-blue-400">
            <Globe className="w-3 h-3 mr-1" /> Facebook
          </span>
        );
      default:
        return (
          <span title="Local Storage Profile" className="flex items-center text-xs text-emerald-400">
            <HardDrive className="w-3 h-3 mr-1" /> Local
          </span>
        );
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Account trigger pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition shadow-sm max-w-[170px] sm:max-w-[210px]"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-5 h-5 rounded-full object-cover shrink-0 border border-cyan-400/40"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex flex-col min-w-0 flex-1 text-left leading-none">
          <span className="text-[11px] sm:text-xs font-bold text-white truncate">
            {user.displayName}
          </span>
          <span className="text-[9px] text-cyan-300 truncate">
            {roleInfo.icon} {roleInfo.label}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/80 overflow-hidden z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Card */}
          <div className="p-4 bg-gradient-to-b from-slate-800/80 to-slate-900 border-b border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-cyan-500 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-md shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{user.displayName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleInfo.badgeColor}`}>
                      <span>{roleInfo.icon}</span>
                      <span>{roleInfo.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center">
                      {getProviderIcon()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                title="Edit River Profile"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shrink-0"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Preferred watershed badge */}
            <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Focus Watershed:
              </span>
              <span className="font-semibold text-cyan-300">{user.preferredTributary}</span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800 px-3 bg-slate-950/40 text-xs">
            <button
              onClick={() => { setIsEditing(false); setActiveTab('profile'); }}
              className={`py-2 px-3 font-semibold border-b-2 transition ${
                activeTab === 'profile' && !isEditing
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Account Details
            </button>
            <button
              onClick={() => { setIsEditing(false); setActiveTab('scenarios'); }}
              className={`py-2 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Saved Runs ({savedScenarios.length})</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">River Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RiverRole)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="angler">🎣 Steelhead Angler</option>
                    <option value="guide">🛶 River Guide / Outfitter</option>
                    <option value="biologist">🔬 Fisheries Biologist</option>
                    <option value="conservationist">🌲 Watershed Conservationist</option>
                    <option value="resident">🏡 Skeena Resident</option>
                    <option value="guest">🌊 Visitor / Explorer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Primary Watershed</label>
                  <select
                    value={editTributary}
                    onChange={(e) => setEditTributary(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {TRIBUTARY_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-1"
                  >
                    {saveSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{saveSuccess ? 'Saved!' : 'Update Profile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : activeTab === 'scenarios' ? (
              <div className="space-y-2.5">
                {savedScenarios.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 space-y-1">
                    <Sliders className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">No saved simulation runs yet</p>
                    <p className="text-[11px] text-slate-500">
                      Open the "What-If Sandbox" and click "Save Scenario" to store custom run curves.
                    </p>
                  </div>
                ) : (
                  savedScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{sc.title}</p>
                        <p className="text-[10px] text-slate-400">
                          Multiplier: <span className="text-cyan-400 font-semibold">{sc.multiplier}x</span> &bull; Shift: <span className="text-purple-400 font-semibold">{sc.timingShiftDays > 0 ? `+${sc.timingShiftDays}d` : `${sc.timingShiftDays}d`}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onLoadScenario && (
                          <button
                            onClick={() => {
                              onLoadScenario(sc.multiplier, sc.timingShiftDays);
                              setIsOpen(false);
                            }}
                            className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 rounded-lg text-[10px] font-bold transition"
                          >
                            Load
                          </button>
                        )}
                        <button
                          onClick={() => deleteScenario(sc.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Delete saved scenario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Account Storage:</span>
                    <span className="font-semibold text-white">
                      {user.isLocalOnly ? 'Browser Local Storage' : 'Firebase Cloud Firestore'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Authentication:</span>
                    <span className="font-semibold text-cyan-300 capitalize">{user.provider}</span>
                  </div>
                  {user.email && (
                    <div className="flex justify-between text-slate-400">
                      <span>Linked Email:</span>
                      <span className="font-semibold text-slate-300 truncate max-w-[180px]">{user.email}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Role Level:</span>
                      <span className="font-bold text-amber-300">Application Admin</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openAdminModal();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Open Admin Userbase Directory</span>
                  </button>
                )}

                {user.isLocalOnly && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 space-y-2">
                    <p className="text-[11px] text-cyan-200">
                      Want to access your saved scenarios across other devices?
                    </p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        openAuthModal('social');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Upgrade to Cloud Sync (Google / Apple / FB)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                openAuthModal('social');
              }}
              className="text-xs text-slate-400 hover:text-cyan-300 transition flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>

            <button
              onClick={async () => {
                setIsOpen(false);
                await signOutUser();
              }}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
