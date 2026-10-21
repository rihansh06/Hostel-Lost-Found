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
} from 'lucide-react';

export default function MyClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/claims/mine');
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Ownership Claims</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track claims submitted on found items and view handover contact details upon approval
          </p>
        </div>

        {/* Strikes Warning if strikes > 0 */}
        {user?.claimStrikes > 0 && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold self-start sm:self-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Strikes: {user.claimStrikes} / 3 {user.claimStrikes >= 3 && '(Claiming Suspended)'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Loading claims...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No claims submitted yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            If you see an item in the feed that belongs to you, open its page and click "Claim This Item" to answer the verification questions.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Browse Found Items
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const p = claim.post;
            return (
              <div
                key={claim._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(claim.status)}
                    <span className="text-xs text-slate-400">
                      Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {p && (
                    <Link
                      to={`/posts/${p._id}`}
                      className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800"
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
                      <span className="inline-flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {p.spot}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{p.category}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Item post no longer available</p>
                )}

                {/* APPROVED HANDOVER DETAILS */}
                {claim.status === 'approved' && p?.postedBy && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-950 space-y-1">
                      <div className="font-bold text-sm text-emerald-900">
                        Handover Arranged: Contact Information
                      </div>
                      <p>
                        Your claim has been approved! Please meet with the finder to collect your item:
                      </p>
                      <div className="pt-1 flex flex-wrap gap-4 font-mono font-medium text-emerald-900">
                        <span>👤 Finder: {p.postedBy.name}</span>
                        <span>🚪 Room: {p.postedBy.room || 'Inquired with warden'}</span>
                        {p.postedBy.email && <span>✉️ {p.postedBy.email}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* REJECTED NOTICE */}
                {claim.status === 'rejected' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Claim was rejected.</span>{' '}
                      {claim.reviewNote && <span className="italic">Note: "{claim.reviewNote}"</span>}
                    </div>
                  </div>
                )}

                {/* Submitted Answers Accordion/Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Your Submitted Verification Answers:
                  </div>
                  <div className="space-y-1.5 divide-y divide-slate-100">
                    {claim.answers.map((ans, idx) => (
                      <div key={idx} className="pt-1.5 first:pt-0">
                        <div className="font-medium text-slate-800">Q: {ans.question}</div>
                        <div className="text-slate-600 font-mono pl-3 text-[11px] mt-0.5">
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
