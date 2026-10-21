import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  AlertCircle,
  KeyRound,
  Sparkles,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Mail,
  Home,
  CheckCircle2,
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    room: '',
    inviteCode: 'HOSTEL2026',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/login', {
        state: {
          message:
            'Registration submitted successfully! Your account is now pending warden approval before you can log in.',
        },
      });
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Registration failed. Please check your information.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-indigo-950/5 overflow-hidden">
        {/* Left Column: Perks & Hostel Verification Note */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-black uppercase tracking-widest mb-6">
              <span className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md">🏷️</span>
              <span>Hostel Lost & Found</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white mb-3">
              Join your hostel network.
            </h2>
            <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Create an account using your hostel's invite code. To ensure security, new registrations are vetted by your hostel warden.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Verified Residents Only</div>
                  <div className="text-[11px] text-indigo-200">Keeps external noise out of your residence</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Handover Handshake</div>
                  <div className="text-[11px] text-indigo-200">Room numbers are only revealed after claim approval</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Warden Supervision</div>
                  <div className="text-[11px] text-indigo-200">Dispute resolution and strike reset oversight</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-indigo-700/50 relative z-10 text-[11px] text-indigo-300 flex items-center justify-between">
            <span>Demo Hostel</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">CODE: HOSTEL2026</span>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register Account</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fill out your resident profile details to join
              </p>
            </div>

            {error && (
              <div className="flex items-start p-3.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs mb-5">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600 mt-0.5" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="room"
                    required
                    value={formData.room}
                    onChange={handleChange}
                    placeholder="e.g. B-204"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  College / Hostel Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul@student.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Hostel Invite Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, inviteCode: 'HOSTEL2026' }))}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Use Demo Code: HOSTEL2026
                  </button>
                </div>
                <input
                  type="text"
                  name="inviteCode"
                  required
                  value={formData.inviteCode}
                  onChange={handleChange}
                  placeholder="e.g. HOSTEL2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-mono uppercase font-bold text-indigo-900 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-4"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Resident Registration</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
