import React, { useState } from 'react';
import { 
  X, 
  Fish, 
  AlertCircle,
  ArrowRight,
  Info,
  Mail,
  KeyRound,
  UserPlus,
  LogIn
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

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    authNotice,
    loading 
  } = useAuth();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailDisplayName, setEmailDisplayName] = useState('');
  const [emailRole, setEmailRole] = useState<RiverRole>('angler');
  const [emailTributary, setEmailTributary] = useState(TRIBUTARY_OPTIONS[0]);
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
      // Handled in context & authNotice
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">Sign in to the tracker</h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">Real-time Tyee telemetry &amp; escapement models</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
          {/* Notifications */}
          {authNotice && (
            <div className="p-3.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--text-main)] space-y-1">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[var(--text-secondary)] text-[11px]">{authNotice}</p>
              </div>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* 1-Click Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span className="font-heading font-bold text-sm">Continue with Google</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-amber)] transition" />
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[var(--border-main)]"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono font-bold">
              or with email
            </span>
            <div className="flex-grow border-t border-[var(--border-main)]"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)] text-xs font-mono font-semibold">
              <button
                type="button"
                onClick={() => { setIsSignUpMode(false); setActionError(null); }}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  !isSignUpMode
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsSignUpMode(true); setActionError(null); }}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  isSignUpMode
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {isSignUpMode && (
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Angler Name / Handle <span className="text-[var(--accent-amber)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skeena Steelheader"
                  value={emailDisplayName}
                  onChange={(e) => setEmailDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Email Address <span className="text-[var(--accent-amber)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="angler@skeena.org"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Password <span className="text-[var(--accent-amber)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                />
                <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {isSignUpMode && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">River Role</label>
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
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Focus Tributary</label>
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
              className="w-full mt-2 py-2.5 px-4 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSignUpMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isSignUpMode ? 'Register Account' : 'Sign In'}</span>
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] text-[11px] text-[var(--text-muted)] flex items-center justify-between font-mono">
          <span>BKLYNFLY &bull; Skeena Steelhead Run Tracker</span>
          <span className="text-[10px] text-[var(--accent-amber)]">🔒 Secure Auth</span>
        </div>
      </div>
    </div>
  );
};
