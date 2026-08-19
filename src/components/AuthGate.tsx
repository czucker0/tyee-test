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
  Mail, 
  UserPlus, 
  LogIn, 
  KeyRound,
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
    signInWithEmail, 
    signUpWithEmail, 
    loading, 
    authNotice 
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<RiverRole>('angler');
  const [tributary, setTributary] = useState(TRIBUTARY_OPTIONS[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setFormError(null);
    try {
      await signInWithGoogle();
    } catch {
      // handled in context
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
          setFormError('Please provide an angler name or handle.');
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
              <div className="flex flex-col">
                <span className="font-heading font-black text-sm text-[var(--text-main)] uppercase tracking-wider">
                  BKLYNFLY
                </span>
                <span className="font-mono font-bold text-xs text-[var(--accent-amber)] uppercase tracking-wider">
                  Skeena Steelhead Run Tracker
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">DFO Tyee Test Fishery In-Season Telemetry, Percentiles &amp; Statistics (1956–2026)</p>
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
            <span>Sign in to access real-time run models &amp; escapement analytics</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[var(--accent-amber)] uppercase bg-[var(--accent-amber-light)] px-2.5 py-1 rounded border border-[var(--accent-amber-border)]">
                BKLYNFLY Analytics
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-[var(--text-main)] uppercase tracking-tight leading-tight">
              BKLYNFLY <br />
              <span className="text-[var(--accent-amber)] font-mono text-2xl sm:text-3xl lg:text-4xl block mt-1">
                SKEENA STEELHEAD RUN TRACKER
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl font-sans">
              Access real-time daily Tyee test fishery indices, probabilistic escapement models, multi-decade historical percentiles (1956–2026), and our AI Escapement Biologist.
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
              <h3 className="text-xl font-heading font-extrabold text-[var(--text-main)]">Sign in to the tracker</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">Sign in with Google or email to access live run data</p>
            </div>

            {/* Notifications */}
            {authNotice && (
              <div className="p-3.5 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--text-main)] text-xs space-y-2 font-mono">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authNotice}</span>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Google 1-Click Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-main)] rounded-xl border border-[var(--border-main)] transition font-medium group shadow-sm disabled:opacity-50 text-xs sm:text-sm font-mono"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span className="font-heading font-bold">Continue with Google</span>
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

            {/* Direct Email / Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3 font-mono">
              {/* Sign In vs Register Toggle */}
              <div className="grid grid-cols-2 p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)] text-xs font-mono font-semibold">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setFormError(null); }}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    !isSignUp
                      ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setFormError(null); }}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    isSignUp
                      ? 'bg-[var(--accent-amber)] text-white shadow-sm font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Angler Name or Handle <span className="text-[var(--accent-amber)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulkley Steelheader"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
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
                    placeholder="name@skeenafisheries.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                  <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5 pointer-events-none" />
                </div>
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
                <span>{isSignUp ? 'Create Direct Account' : 'Sign In to Tracker'}</span>
              </button>
            </form>

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
