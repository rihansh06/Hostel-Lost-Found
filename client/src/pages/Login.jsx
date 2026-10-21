import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
            <span className="text-3xl">🏷️</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to Your Hostel
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Lost or found something? Sign in to search or post items.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-start p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 mr-2 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">{error}</p>
              {error.toLowerCase().includes('pending') && (
                <p className="text-xs mt-1 text-rose-700">
                  Your registration is awaiting confirmation by the warden. Once approved, you can sign in.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hostel Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. resident@student.edu"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Helper */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 mr-1" />
            <span>Quick Test Logins</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('warden@hostel.edu', 'Password123!')}
              className="p-2 text-left rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex justify-between"
            >
              <span className="font-semibold">🏛️ Warden</span>
              <span>warden@hostel.edu</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('aarav@student.edu', 'Password123!')}
              className="p-2 text-left rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex justify-between"
            >
              <span className="font-semibold">🧑‍🎓 Resident (Approved)</span>
              <span>aarav@student.edu</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('kunal@student.edu', 'Password123!')}
              className="p-2 text-left rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex justify-between"
            >
              <span className="font-semibold">⏳ Resident (Pending)</span>
              <span>kunal@student.edu</span>
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-slate-600">
          New resident?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Register with Hostel Invite Code
          </Link>
        </div>
      </div>
    </div>
  );
}
