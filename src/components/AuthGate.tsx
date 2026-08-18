import React, { useState } from 'react';
import { 
  Fish, 
  Shield, 
  Lock, 
  Sliders, 
  Bot, 
  TrendingUp, 
  Database, 
  ArrowRight, 
  Globe, 
  Mail, 
  UserPlus, 
  LogIn, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
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
  'Skeena Lower Mainstem',
  'Skeena Upper Watershed'
];

export const AuthGate: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithApple, 
    signInWithFacebook, 
    signInWithEmail, 
    signUpWithEmail, 
    signInLocal, 
    loading, 
    authNotice, 
    setAuthNotice 
  } = useAuth();

  const [activeMode, setActiveMode] = useState<'social' | 'email' | 'local'>('social');
  
  // Email Form
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<RiverRole>('angler');
  const [tributary, setTributary] = useState(TRIBUTARY_OPTIONS[0]);

  // Local Form
  const [localName, setLocalName] = useState('');
  const [localRole, setLocalRole] = useState<RiverRole>('angler');
  const [localTributary, setLocalTributary] = useState(TRIBUTARY_OPTIONS[0]);
  const [localEmail, setLocalEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch {
      // handled
    }
  };

  const handleApple = async () => {
    setFormError(null);
    try {
      await signInWithApple();
    } catch {
      // handled
    }
  };

  const handleFacebook = async () => {
    setFormError(null);
    try {
      await signInWithFacebook();
    } catch {
      // handled
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setFormError('Please provide a name or handle.');
          return;
        }
        await signUpWithEmail({
          email: email.trim(),
          pass: password,
          displayName: displayName.trim(),
          riverRole: role,
          preferredTributary: tributary
        });
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch {
      // handled in context
    }
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim()) {
      setFormError('Please enter your name or handle.');
      return;
    }
    signInLocal({
      displayName: localName.trim(),
      riverRole: localRole,
      preferredTributary: localTributary,
      email: localEmail.trim() || undefined
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-main)] flex flex-col justify-between selection:bg-[var(--accent-amber)] selection:text-white">
      {/* Top Banner */}
      <header className="relative z-10 border-b border-[var(--border-main)] bg-[var(--bg-surface)] backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-sm border border-amber-500/30">
              <Fish className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-surface)] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-badge stamp-amber">
                  BKLYNFLY
                </span>
                <h1 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">Skeena River Wild Steelhead Escapement</h1>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)]">
                  Portal
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono">DFO Tyee Test Fishery In-Season Telemetry, Percentiles &amp; Statistics (1956–2025)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            <Shield className="w-4 h-4 text-[var(--accent-amber)]" />
            <span className="hidden sm:inline">Protected Portal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left Side: Briefing & Teaser */}
        <div className="flex-1 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
            <span>Sign-in required to access live run models &amp; escapement analytics</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[var(--accent-amber)] uppercase bg-[var(--accent-amber-light)] px-2.5 py-1 rounded border border-[var(--accent-amber-border)]">
                BKLYNFLY Analytics
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[var(--text-main)] tracking-tight leading-tight">
              Skeena River Wild Steelhead <br />
              <span className="text-[var(--accent-amber)]">
                Escapement Statistics &amp; Run Models
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl font-sans">
              Access real-time daily Tyee test fishery indices, probabilistic escapement models, multi-decade historical percentiles (1956–2025), and our AI Escapement Biologist.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start gap-3 shadow-sm">
              <div className="p-2 rounded-lg bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-[var(--text-main)]">Daily Tyee Escapement Index</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Live index updates &amp; cumulative run timing curve tracker.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start gap-3 shadow-sm">
              <div className="p-2 rounded-lg bg-[var(--accent-spruce-light)] text-[var(--accent-spruce)] border border-[var(--accent-spruce-border)] shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-[var(--text-main)]">What-If Run Sandbox</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Simulate run timing shifts, late surges, and save scenario runs.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start gap-3 shadow-sm">
              <div className="p-2 rounded-lg bg-[var(--accent-teal-light)] text-[var(--accent-teal)] border border-[var(--accent-teal-border)] shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-[var(--text-main)]">1956–2025 Historical Baseline</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">69-year data archive for percentile benchmarking.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start gap-3 shadow-sm">
              <div className="p-2 rounded-lg bg-[var(--accent-spruce-light)] text-[var(--accent-spruce)] border border-[var(--accent-spruce-border)] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-[var(--text-main)]">AI Fisheries Analyst</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">On-demand escapement briefings, conservation tiers &amp; risk analysis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Sign-In / Sign-Up Gate Box */}
        <div className="w-full lg:max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-7 shadow-xl relative">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-heading font-extrabold text-[var(--text-main)]">Sign In to Enter Portal</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">Choose your preferred sign-in or registration method:</p>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)] text-xs font-mono font-semibold">
              <button
                type="button"
                onClick={() => { setActiveMode('social'); setFormError(null); setAuthNotice(null); }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeMode === 'social'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Social</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveMode('email'); setFormError(null); setAuthNotice(null); }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeMode === 'email'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveMode('local'); setFormError(null); setAuthNotice(null); }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeMode === 'local'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Local</span>
              </button>
            </div>

            {/* Notifications */}
            {authNotice && (
              <div className="p-3.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--text-main)] text-xs space-y-2 font-mono">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authNotice}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveMode('email')}
                    className="px-2.5 py-1 bg-[var(--bg-surface)] text-[var(--accent-amber)] rounded-lg font-semibold text-[11px] border border-[var(--accent-amber-border)] transition"
                  >
                    Switch to Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('local')}
                    className="px-2.5 py-1 bg-[var(--accent-amber)] text-white rounded-lg font-semibold text-[11px] transition"
                  >
                    Fast Local Setup
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Mode 1: Social Buttons */}
            {activeMode === 'social' && (
              <div className="space-y-3 pt-1 font-mono">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Sign In with Google</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-amber)] transition" />
                </button>

                <button
                  type="button"
                  onClick={handleApple}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
                    </svg>
                    <span>Sign In with Apple</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition" />
                </button>

                <button
                  type="button"
                  onClick={handleFacebook}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Sign In with Facebook</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition" />
                </button>
              </div>
            )}

            {/* Mode 2: Direct Email / Password */}
            {activeMode === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-main)]">
                    {isSignUp ? 'Create Direct Account' : 'Direct Email Sign In'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setFormError(null); }}
                    className="text-xs text-[var(--accent-amber)] hover:underline font-semibold"
                  >
                    {isSignUp ? 'Already registered? Sign in' : 'Create new account'}
                  </button>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Your Name or Angler Handle
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bulkley Angler"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@skeenafisheries.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">River Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as RiverRole)}
                        className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                      >
                        <option value="angler">🎣 Angler</option>
                        <option value="guide">🛶 Guide</option>
                        <option value="biologist">🔬 Biologist</option>
                        <option value="conservationist">🌲 Conservation</option>
                        <option value="resident">🏡 Resident</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Focus Tributary</label>
                      <select
                        value={tributary}
                        onChange={(e) => setTributary(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] truncate"
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
                  className="w-full py-2.5 px-4 bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
                </button>
              </form>
            )}

            {/* Mode 3: Local Fast Setup */}
            {activeMode === 'local' && (
              <form onSubmit={handleLocalSubmit} className="space-y-3 pt-1 font-mono">
                <p className="text-xs text-[var(--text-muted)] font-sans">
                  Instant profile stored locally in your browser. No social logins or passwords required:
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Your Name or Handle <span className="text-[var(--accent-amber)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sustut Watcher, Skeena Angler"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">River Role</label>
                    <select
                      value={localRole}
                      onChange={(e) => setLocalRole(e.target.value as RiverRole)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    >
                      <option value="angler">🎣 Angler</option>
                      <option value="guide">🛶 Guide</option>
                      <option value="biologist">🔬 Biologist</option>
                      <option value="conservationist">🌲 Conservation</option>
                      <option value="resident">🏡 Resident</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Focus Tributary</label>
                    <select
                      value={localTributary}
                      onChange={(e) => setLocalTributary(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] truncate"
                    >
                      {TRIBUTARY_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--accent-amber)] font-bold text-xs sm:text-sm rounded-xl border border-[var(--border-main)] shadow-sm transition flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-amber)]" />
                  <span>Enter with Local Profile</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1 font-mono">
                <Shield className="w-3 h-3 text-[var(--text-muted)]" />
                Root Administrator: <span className="text-[var(--text-main)] font-mono">{BOOTSTRAP_ADMIN_EMAIL}</span>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-main)] bg-[var(--bg-surface)] px-6 py-4 text-center text-xs text-[var(--text-muted)] font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Fisheries and Oceans Canada (DFO) &bull; Skeena River Tyee Test Fishery Project</span>
          <span className="text-[11px]">Skeena Watershed &bull; Gitxsan, Wet'suwet'en &amp; Ts'msyen Territories</span>
        </div>
      </footer>
    </div>
  );
};
