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
      const res = await api.get('/api/warden/pending-users');
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
      const res = await api.get('/api/warden/posts');
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
      await api.patch(`/api/warden/users/${userId}/approve`);
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      setFeedback({
        type: 'success',
        message: `Resident ${userName} has been approved and can now log in!`,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-2 border border-purple-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Hostel Administration</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Warden Control Panel
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Hostel: <span className="font-semibold text-slate-800">{user?.hostel?.name}</span> • Invite Code:{' '}
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {user?.hostel?.inviteCode || 'HOSTEL2026'}
            </span>
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5" />
            <span>Pending Approvals ({pendingUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'posts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            <span>All Hostel Reports</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-sm mb-6 flex items-start border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: PENDING RESIDENT APPROVALS */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Residents Awaiting Approval
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify resident identity and room number before granting access to post and claim items.
              </p>
            </div>
            <button
              onClick={fetchPendingUsers}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Refresh
            </button>
          </div>

          {loadingPending ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Checking for pending registrations...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">All caught up!</h3>
              <p className="text-xs text-slate-500 mt-1">
                There are no pending resident registration requests in {user?.hostel?.name}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingUsers.map((pUser) => (
                <div
                  key={pUser._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100">
                      {pUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{pUser.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">Room {pUser.room}</span>
                        <span>•</span>
                        <span>{pUser.email}</span>
                        <span>•</span>
                        <span className="inline-flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Registered {new Date(pUser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleApprove(pUser._id, pUser.name)}
                      disabled={actionLoading === pUser._id}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50"
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

      {/* TAB 2: ALL HOSTEL REPORTS (WITH HIDDEN DETAILS VISIBLE TO WARDEN) */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Comprehensive Hostel Lost & Found Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Wardens have administrative authority to inspect confidential item details to resolve disputes.
              </p>
            </div>
            <button
              onClick={fetchWardenPosts}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Refresh Log
            </button>
          </div>

          {loadingPosts ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading all hostel records...</p>
            </div>
          ) : wardenPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm">No items posted yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {wardenPosts.map((p) => (
                <div key={p._id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          p.type === 'found'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {p.type}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        Spot: <span className="font-medium text-slate-800">{p.spot}</span>
                      </span>
                    </div>

                    <Link
                      to={`/posts/${p._id}`}
                      className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View Full Details <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{p.description}</p>
                  </div>

                  {/* Warden privileged view of hidden details */}
                  {p.hiddenDetails && (
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-xs">
                      <span className="font-bold flex items-center mb-0.5">
                        <Lock className="w-3 h-3 mr-1 text-purple-700" />
                        Confidential Hidden Details:
                      </span>
                      <span className="font-mono">{p.hiddenDetails}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>
                      Posted by: {p.postedBy?.name} (Rm {p.postedBy?.room}) • {p.postedBy?.email}
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
