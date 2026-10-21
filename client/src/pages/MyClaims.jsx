import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle,
  Clock,
  XCircle,
  HelpCircle,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Inbox,
  AlertTriangle,
  ArrowRight,
  User,
  Home,
  Mail,
  Sparkles,
} from 'lucide-react';

export default function MyClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/claims/mine');
      setClaims(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Under Review</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Ownership Verification Status</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Item Claims
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review status updates on your claims. Approved claims automatically reveal the finder's room number for handover.
          </p>
        </div>

        {/* Strikes Warning if strikes > 0 */}
        {user?.claimStrikes > 0 ? (
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold self-start sm:self-auto shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Claim Strikes: {user.claimStrikes}/3 {user.claimStrikes >= 3 && '(Privileges Suspended)'}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clean Standing (0 Strikes)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading submitted claims...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-xs max-w-lg mx-auto">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">No Claims Submitted Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto leading-relaxed">
            If someone posted an item in your hostel that belongs to you, open its page and click "Claim This Item" to answer the verification questions.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>Browse Found Items Feed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const p = claim.post;
            return (
              <div
                key={claim._id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(claim.status)}
                    <span className="text-xs text-slate-400 font-medium">
                      Submitted on {new Date(claim.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {p && (
                    <Link
                      to={`/posts/${p._id}`}
                      className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 space-x-1"
                    >
                      <span>View Original Post</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                </div>

                {p ? (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                      <span className="inline-flex items-center font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {p.spot}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-medium">{p.category}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Item post no longer available</p>
                )}

                {/* APPROVED HANDOVER DETAILS */}
                {claim.status === 'approved' && p?.postedBy && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-start space-x-3.5 shadow-xs">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-emerald-950 space-y-2 flex-1">
                      <div>
                        <div className="font-extrabold text-sm text-emerald-900">
                          🎉 Claim Approved: Handover Contact Disclosed
                        </div>
                        <p className="text-emerald-800/90 text-xs mt-0.5">
                          Your verification answers were confirmed. Coordinate the physical item return using the details below:
                        </p>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center space-x-1.5 shadow-2xs">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Finder: {p.postedBy.name}</span>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-2xs">
                          <Home className="w-3.5 h-3.5" />
                          <span>Room Number: {p.postedBy.room || 'Inquired with warden'}</span>
                        </div>

                        {p.postedBy.email && (
                          <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-emerald-200 text-emerald-900 font-medium text-xs flex items-center space-x-1.5 shadow-2xs">
                            <Mail className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{p.postedBy.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* REJECTED NOTICE */}
                {claim.status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-sm">Claim was rejected</span>
                      {claim.reviewNote ? (
                        <p className="mt-1 text-rose-800">
                          Finder note: <span className="italic">"{claim.reviewNote}"</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-rose-800">
                          The answers submitted did not match the hidden verification details.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submitted Answers Accordion/Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Your Submitted Challenge Answers:
                  </div>
                  <div className="space-y-2 divide-y divide-slate-100">
                    {claim.answers.map((ans, idx) => (
                      <div key={idx} className="pt-2 first:pt-0">
                        <div className="font-semibold text-slate-800">Q: {ans.question}</div>
                        <div className="text-slate-600 font-mono pl-3 text-xs mt-0.5">
                          A: {ans.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
