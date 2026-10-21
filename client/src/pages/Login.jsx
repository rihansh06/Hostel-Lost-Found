import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to sign in. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-indigo-950/5 overflow-hidden">
        {/* Left Column: Visual Brand & Feature Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-black uppercase tracking-widest mb-6">
              <span className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md">🏷️</span>
              <span>Hostel Lost & Found</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white mb-3">
              Recover belongings effortlessly.
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Automated AI candidate matching, location time-decay scoring, and private verification handshakes for university hostels.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Semantic AI Matching</div>
                  <div className="text-[11px] text-indigo-200">Pairs items even with contrasting descriptions</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Zero-Knowledge Verification</div>
                  <div className="text-[11px] text-indigo-200">Hidden details prevent false opportunistic claims</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Hostel-Scoped Isolation</div>
                  <div className="text-[11px] text-indigo-200">Strict boundaries protect student living privacy</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-indigo-700/50 relative z-10 text-[11px] text-indigo-300 flex items-center justify-between">
            <span>Cauvery Boys Hostel</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">CODE: HOSTEL2026</span>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your hostel resident or warden credentials below
              </p>
            </div>

            {successMessage && (
              <div className="flex items-start p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs mb-5">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start p-3.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs mb-5">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold">{error}</p>
                  {error.toLowerCase().includes('pending') && (
                    <p className="text-[11px] mt-1 text-rose-700 leading-normal">
                      Your registration is awaiting warden approval. Contact your hostel office to approve your account.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Hostel Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@student.edu or warden@hostel.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm font-medium transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick-fill demo pills */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                ⚡ Quick Demo One-Click Sign In:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('aarav@student.edu', 'Password123!')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
                >
                  🎓 Aarav (Resident)
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('warden@hostel.edu', 'Password123!')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 transition-colors cursor-pointer"
                >
                  🛡️ Dr. Ramesh (Warden)
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('kunal@student.edu', 'Password123!')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 transition-colors cursor-pointer"
                >
                  ⏳ Kunal (Pending Approval)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              Join your hostel here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
