import React, { useState } from 'react';
import { 
  X, 
  User, 
  Fish, 
  CheckCircle, 
  AlertCircle,
  HardDrive,
  Globe,
  Lock,
  ArrowRight,
  Info,
  Mail,
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
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

const RIVER_ROLES: { key: RiverRole; label: string; desc: string; icon: string }[] = [
  { key: 'angler', label: 'Steelhead Angler', desc: 'Passionate fly & river angler monitoring seasonal run timings', icon: '🎣' },
  { key: 'guide', label: 'River Guide / Outfitter', desc: 'Guiding Skeena & tributary systems, tracking weekly pulses', icon: '🛶' },
  { key: 'biologist', label: 'Fisheries Biologist', desc: 'Scientific escapement modeling, DFO index & run reconstruction', icon: '🔬' },
  { key: 'conservationist', label: 'Watershed Conservationist', desc: 'Wild steelhead advocacy, sustainability & spawning metrics', icon: '🌲' },
  { key: 'resident', label: 'Skeena Resident / Community', desc: 'Living within Gitxsan, Wet\'suwet\'en or Skeena-Bulkley region', icon: '🏡' },
  { key: 'guest', label: 'Visitor / Explorer', desc: 'Exploring BC steelhead migration dynamics and run historicals', icon: '🌊' }
];

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalInitialTab,
    signInWithGoogle, 
    signInWithApple, 
    signInWithFacebook, 
    signInWithEmail,
    signUpWithEmail,
    signInLocal,
    authNotice,
    setAuthNotice,
    loading 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'social' | 'email' | 'local'>(authModalInitialTab || 'social');
  
  // Email Auth state
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailDisplayName, setEmailDisplayName] = useState('');
  const [emailRole, setEmailRole] = useState<RiverRole>('angler');
  const [emailTributary, setEmailTributary] = useState(TRIBUTARY_OPTIONS[0]);

  // Local form state
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [localRole, setLocalRole] = useState<RiverRole>('angler');
  const [localTributary, setLocalTributary] = useState(TRIBUTARY_OPTIONS[0]);
  const [localEmail, setLocalEmail] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setActionError(null);
    try {
      await signInWithGoogle();
    } catch {
      // Handled in context
    }
  };

  const handleAppleLogin = async () => {
    setActionError(null);
    try {
      await signInWithApple();
    } catch {
      // Handled in context
    }
  };

  const handleFacebookLogin = async () => {
    setActionError(null);
    try {
      await signInWithFacebook();
    } catch {
      // Handled in context
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!emailInput.trim() || !passwordInput) {
      setActionError('Please enter both email and password.');
      return;
    }

    try {
      if (isSignUpMode) {
        if (!emailDisplayName.trim()) {
          setActionError('Please enter a display name or angler handle.');
          return;
        }
        await signUpWithEmail({
          email: emailInput.trim(),
          pass: passwordInput,
          displayName: emailDisplayName.trim(),
          riverRole: emailRole,
          preferredTributary: emailTributary
        });
      } else {
        await signInWithEmail(emailInput.trim(), passwordInput);
      }
    } catch {
      // Handled in context & setAuthNotice
    }
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localDisplayName.trim()) {
      setActionError('Please enter a display name or nickname.');
      return;
    }
    signInLocal({
      displayName: localDisplayName.trim(),
      riverRole: localRole,
      preferredTributary: localTributary,
      email: localEmail.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">Skeena Steelhead Portal</h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">Create an account or sign in to access live runs and simulations</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: 3 Methods */}
        <div className="grid grid-cols-3 p-1.5 m-4 mb-2 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)] text-xs font-mono font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('social'); setAuthNotice(null); setActionError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
              activeTab === 'social'
                ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Social</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('email'); setAuthNotice(null); setActionError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
              activeTab === 'email'
                ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('local'); setAuthNotice(null); setActionError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition ${
              activeTab === 'local'
                ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local</span>
          </button>
        </div>

        {/* Body content */}
        <div className="px-6 py-3 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
          {authNotice && (
            <div className="p-3.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--text-main)] space-y-2">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[var(--accent-amber)]">Notice</p>
                  <p className="leading-relaxed text-[var(--text-secondary)]">{authNotice}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className="px-2.5 py-1 bg-[var(--bg-surface)] text-[var(--accent-amber)] rounded-lg font-semibold text-[11px] border border-[var(--accent-amber-border)] transition"
                >
                  Use Email / Password
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('local')}
                  className="px-2.5 py-1 bg-[var(--accent-amber)] text-white rounded-lg font-semibold text-[11px] transition"
                >
                  Use Fast Local Profile
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-3 py-1">
              <p className="text-xs text-[var(--text-muted)] font-sans">
                1-click sign in with your verified identity provider:
              </p>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-amber)] transition" />
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
                  </svg>
                  <span>Continue with Apple</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-amber)] transition" />
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Continue with Facebook</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-amber)] transition" />
              </button>
            </div>
          )}

          {/* Email / Password Tab */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3.5 py-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-main)] font-semibold">
                  {isSignUpMode ? 'Create New Direct Account' : 'Sign In with Email & Password'}
                </span>
                <button
                  type="button"
                  onClick={() => { setIsSignUpMode(!isSignUpMode); setActionError(null); }}
                  className="text-xs text-[var(--accent-amber)] hover:underline font-semibold"
                >
                  {isSignUpMode ? 'Already registered? Sign In' : 'Need an account? Register'}
                </button>
              </div>

              {isSignUpMode && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Your Name or Angler Handle <span className="text-[var(--accent-amber)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulkley Steelheader"
                    value={emailDisplayName}
                    onChange={(e) => setEmailDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Email Address <span className="text-[var(--accent-amber)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@skeenafisheries.ca"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Password <span className="text-[var(--accent-amber)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                  <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {isSignUpMode && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">River Role</label>
                    <select
                      value={emailRole}
                      onChange={(e) => setEmailRole(e.target.value as RiverRole)}
                      className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    >
                      <option value="angler">🎣 Steelhead Angler</option>
                      <option value="guide">🛶 River Guide</option>
                      <option value="biologist">🔬 Biologist</option>
                      <option value="conservationist">🌲 Conservationist</option>
                      <option value="resident">🏡 Resident</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Focus Tributary</label>
                    <select
                      value={emailTributary}
                      onChange={(e) => setEmailTributary(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] truncate"
                    >
                      {TRIBUTARY_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSignUpMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUpMode ? 'Register Account' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* Local Tab */}
          {activeTab === 'local' && (
            <form onSubmit={handleLocalSubmit} className="space-y-3.5 py-1">
              <p className="text-xs text-[var(--text-muted)] font-sans">
                Setup a quick profile stored directly in your browser. No passwords needed:
              </p>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Biologist or Angler Nickname <span className="text-[var(--accent-amber)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skeena Spey Caster, Babine Watch"
                    value={localDisplayName}
                    onChange={(e) => setLocalDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--accent-amber)] transition"
                  />
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Select Your Role / Affiliation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RIVER_ROLES.map((role) => {
                    const isSelected = localRole === role.key;
                    return (
                      <button
                        type="button"
                        key={role.key}
                        onClick={() => setLocalRole(role.key)}
                        className={`flex flex-col text-left p-2 rounded-xl border transition ${
                          isSelected
                            ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber)] text-[var(--text-main)] shadow-sm'
                            : 'bg-[var(--bg-subtle)] border-[var(--border-main)] text-[var(--text-secondary)] hover:border-[var(--border-highlight)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{role.icon}</span>
                          <span className="text-xs font-bold text-[var(--text-main)]">{role.label}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-tight">
                          {role.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Primary Watershed Focus
                </label>
                <div className="relative">
                  <select
                    value={localTributary}
                    onChange={(e) => setLocalTributary(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  >
                    {TRIBUTARY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Email (Optional reference)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={localEmail}
                  onChange={(e) => setLocalEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--accent-amber)] font-bold text-sm rounded-xl border border-[var(--border-main)] shadow-sm transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-[var(--accent-amber)]" />
                <span>Enter with Local Profile</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span>Escapement Portal Security</span>
          </div>
          <span>Root Admin: {BOOTSTRAP_ADMIN_EMAIL}</span>
        </div>
      </div>
    </div>
  );
};
