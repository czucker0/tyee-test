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
  angler: { label: 'Angler', icon: '🎣', badgeColor: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber-border)]' },
  guide: { label: 'River Guide', icon: '🛶', badgeColor: 'bg-[var(--accent-spruce-light)] text-[var(--accent-spruce)] border-[var(--accent-spruce-border)]' },
  biologist: { label: 'Biologist', icon: '🔬', badgeColor: 'bg-[var(--accent-teal-light)] text-[var(--accent-teal)] border-[var(--accent-teal-border)]' },
  conservationist: { label: 'Conservationist', icon: '🌲', badgeColor: 'bg-[var(--accent-spruce-light)] text-[var(--accent-spruce)] border-[var(--accent-spruce-border)]' },
  resident: { label: 'Resident', icon: '🏡', badgeColor: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber-border)]' },
  guest: { label: 'Visitor', icon: '🌊', badgeColor: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-main)]' }
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
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-amber)] hover:opacity-90 text-white transition shadow-sm"
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
          <span title="Google Account" className="flex items-center text-xs text-[var(--accent-teal)]">
            <Globe className="w-3 h-3 mr-1" /> Google
          </span>
        );
      case 'apple':
        return (
          <span title="Apple ID" className="flex items-center text-xs text-[var(--text-secondary)]">
            <Globe className="w-3 h-3 mr-1" /> Apple
          </span>
        );
      case 'facebook':
        return (
          <span title="Facebook Account" className="flex items-center text-xs text-blue-500">
            <Globe className="w-3 h-3 mr-1" /> Facebook
          </span>
        );
      default:
        return (
          <span title="Local Storage Profile" className="flex items-center text-xs text-[var(--accent-spruce)]">
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
        className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-left transition shadow-sm max-w-[170px] sm:max-w-[210px]"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-5 h-5 rounded-full object-cover shrink-0 border border-[var(--accent-amber-border)]"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[var(--accent-amber)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex flex-col min-w-0 flex-1 text-left leading-none">
          <span className="text-[11px] sm:text-xs font-bold text-[var(--text-main)] truncate">
            {user.displayName}
          </span>
          <span className="text-[9px] text-[var(--accent-amber)] truncate font-mono mt-0.5">
            {roleInfo.icon} {roleInfo.label}
          </span>
        </div>

        <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden z-50 text-[var(--text-main)] animate-in fade-in zoom-in-95 duration-150">
          {/* Header Card */}
          <div className="p-4 bg-[var(--bg-subtle)] border-b border-[var(--border-main)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[var(--accent-amber)] shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[var(--accent-amber)] flex items-center justify-center text-white text-base font-bold shadow-sm shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{user.displayName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleInfo.badgeColor}`}>
                      <span>{roleInfo.icon}</span>
                      <span>{roleInfo.label}</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center font-mono">
                      {getProviderIcon()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                title="Edit River Profile"
                className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition shrink-0"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Preferred watershed badge */}
            <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs font-mono">
              <span className="text-[var(--text-muted)] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                Focus Watershed:
              </span>
              <span className="font-semibold text-[var(--text-main)]">{user.preferredTributary}</span>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-[var(--border-main)] px-3 bg-[var(--bg-surface)] text-xs font-mono">
            <button
              onClick={() => { setIsEditing(false); setActiveTab('profile'); }}
              className={`py-2 px-3 font-semibold border-b-2 transition ${
                activeTab === 'profile' && !isEditing
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Account Details
            </button>
            <button
              onClick={() => { setIsEditing(false); setActiveTab('scenarios'); }}
              className={`py-2 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
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
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">River Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RiverRole)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
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
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1">Primary Watershed</label>
                  <select
                    value={editTributary}
                    onChange={(e) => setEditTributary(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  >
                    {TRIBUTARY_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1 font-mono">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-3 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>{saveSuccess ? 'Saved!' : 'Update Profile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-1.5 px-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] rounded-lg border border-[var(--border-main)] transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : activeTab === 'scenarios' ? (
              <div className="space-y-2.5">
                {savedScenarios.length === 0 ? (
                  <div className="text-center py-6 text-[var(--text-muted)] space-y-1">
                    <Sliders className="w-7 h-7 text-[var(--text-muted)] mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-[var(--text-main)]">No saved simulation runs yet</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Open the "What-If Sandbox" and click "Save Scenario" to store custom run curves.
                    </p>
                  </div>
                ) : (
                  savedScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 font-mono">
                        <p className="text-xs font-bold text-[var(--text-main)] truncate">{sc.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Multiplier: <span className="text-[var(--accent-amber)] font-semibold">{sc.multiplier}x</span> &bull; Shift: <span className="text-[var(--accent-spruce)] font-semibold">{sc.timingShiftDays > 0 ? `+${sc.timingShiftDays}d` : `${sc.timingShiftDays}d`}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono">
                        {onLoadScenario && (
                          <button
                            onClick={() => {
                              onLoadScenario(sc.multiplier, sc.timingShiftDays);
                              setIsOpen(false);
                            }}
                            className="px-2 py-1 bg-[var(--accent-amber-light)] hover:bg-[var(--accent-amber)] text-[var(--accent-amber)] hover:text-white border border-[var(--accent-amber-border)] rounded-lg text-[10px] font-bold transition"
                          >
                            Load
                          </button>
                        )}
                        <button
                          onClick={() => deleteScenario(sc.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-red-500 transition"
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
              <div className="space-y-3 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1.5">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Account Storage:</span>
                    <span className="font-semibold text-[var(--text-main)]">
                      {user.isLocalOnly ? 'Local Storage' : 'Cloud Firestore'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Authentication:</span>
                    <span className="font-semibold text-[var(--accent-amber)] capitalize">{user.provider}</span>
                  </div>
                  {user.email && (
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>Linked Email:</span>
                      <span className="font-semibold text-[var(--text-main)] truncate max-w-[180px]">{user.email}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex justify-between text-[var(--text-muted)] pt-1 border-t border-[var(--border-main)]">
                      <span>Role Level:</span>
                      <span className="font-bold text-[var(--accent-amber)]">Admin</span>
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
                    className="w-full py-2 px-3 rounded-lg bg-[var(--accent-amber-light)] hover:bg-[var(--accent-amber)] text-[var(--accent-amber)] hover:text-white border border-[var(--accent-amber-border)] font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin User Directory</span>
                  </button>
                )}

                {user.isLocalOnly && (
                  <div className="p-2.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] space-y-2">
                    <p className="text-[11px] text-[var(--text-main)] font-sans">
                      Want to access your saved scenarios across other devices?
                    </p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        openAuthModal('social');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-[var(--accent-amber)] hover:opacity-90 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Upgrade to Cloud Sync</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-3 bg-[var(--bg-subtle)] border-t border-[var(--border-main)] flex items-center justify-between font-mono">
            <button
              onClick={() => {
                setIsOpen(false);
                openAuthModal('social');
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>

            <button
              onClick={async () => {
                setIsOpen(false);
                await signOutUser();
              }}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:opacity-80 transition flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
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
