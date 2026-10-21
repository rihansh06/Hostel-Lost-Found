import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Lock,
  ExternalLink,
  Users,
  FileText,
  BarChart3,
  RefreshCw,
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export default function WardenDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'posts'

  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const [wardenPosts, setWardenPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Fetch pending registrations
  const fetchPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const res = await api.get('/warden/pending-users');
      setPendingUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  // Fetch all posts in warden's hostel
  const fetchWardenPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await api.get('/warden/posts');
      setWardenPosts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load hostel posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchWardenPosts();
    }
  }, [activeTab]);

  const handleApprove = async (userId, userName) => {
    setActionLoading(userId);
    setFeedback({ type: '', message: '' });

    try {
      await api.patch(`/warden/users/${userId}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      setFeedback({
        type: 'success',
        message: `Resident ${userName} has been approved and can now sign in!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve user',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetStrikes = async (userId, userName) => {
    setActionLoading(`strike-${userId}`);
    setFeedback({ type: '', message: '' });

    try {
      await api.patch(`/warden/users/${userId}/reset-strikes`);
      setFeedback({
        type: 'success',
        message: `Claim strikes for ${userName} have been reset to 0. Privileges restored.`,
      });
      // Refresh posts if we are in posts tab
      if (activeTab === 'posts') {
        fetchWardenPosts();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reset strikes',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-1 border border-purple-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Hostel Administration Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Warden Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage resident approvals, inspect secret item verification details, and oversee dispute claims for {user?.hostel?.name}.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/stats"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>View Analytics Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-slate-400 hover:text-slate-700 text-xs ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Pending Registrations</span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>All Hostel Reports Log</span>
        </button>
      </div>

      {/* TAB 1: PENDING RESIDENT APPROVALS */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Residents Awaiting Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify student room number and identity before authorizing feed access.
              </p>
            </div>
            <button
              onClick={fetchPendingUsers}
              className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingPending ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Checking for pending registrations...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">All Registrations Approved!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No students are currently waiting for approval in {user?.hostel?.name}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingUsers.map((pUser) => (
                <div
                  key={pUser._id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {pUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{pUser.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-md">
                          Room {pUser.room}
                        </span>
                        <span>•</span>
                        <span>{pUser.email}</span>
                        <span>•</span>
                        <span className="inline-flex items-center text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(pUser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleApprove(pUser._id, pUser.name)}
                      disabled={actionLoading === pUser._id}
                      className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === pUser._id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Approve Resident
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL HOSTEL REPORTS (WITH CONFIDENTIAL DETAILS VISIBLE TO WARDEN) */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Hostel Item Ledger (Admin Oversight)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Wardens have administrative privileges to view secret item details and resolve disputed claims.
              </p>
            </div>
            <button
              onClick={fetchWardenPosts}
              className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          {loadingPosts ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading all hostel records...</p>
            </div>
          ) : wardenPosts.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <p className="text-sm font-semibold">No items posted in this hostel yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {wardenPosts.map((p) => (
                <div key={p._id} className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.type === 'found'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.type}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Status: {p.status}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Spot: <strong className="text-slate-800">{p.spot}</strong>
                      </span>
                    </div>

                    <Link
                      to={`/posts/${p._id}`}
                      className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      View Details & Claims <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.description}</p>
                  </div>

                  {/* Warden privileged view of hidden details */}
                  {p.hiddenDetails && (
                    <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-900 border border-purple-200 text-xs">
                      <span className="font-extrabold flex items-center mb-1 text-purple-950">
                        <Lock className="w-3.5 h-3.5 mr-1 text-purple-700" />
                        Confidential Verification Secrets:
                      </span>
                      <span className="font-mono text-purple-900">{p.hiddenDetails}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span>
                      Posted by: <strong className="text-slate-700">{p.postedBy?.name}</strong> (Room {p.postedBy?.room}) • {p.postedBy?.email}
                    </span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
