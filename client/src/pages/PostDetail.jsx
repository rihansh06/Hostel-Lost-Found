import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Clock,
  User,
  ShieldAlert,
  Lock,
  CheckCircle,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

const categoryLabels = {
  electronics: '📱 Electronics',
  clothing: '👕 Clothing',
  keys: '🔑 Keys',
  bottle: '🍶 Bottle / Flask',
  documents: '📄 Documents',
  other: '📦 Other',
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isWarden } = useAuth();

  const [post, setPost] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/posts/${id}`);
        setPost(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load post details');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const res = await api.get(`/api/posts/${id}/matches`);
        setMatches(res.data.data || []);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    };

    if (id) {
      fetchMatches();
    }
  }, [id]);

  const isOwner =
    user && post && (post.postedBy?._id === user.id || post.postedBy === user.id);
  const canManage = isOwner || isWarden;

  const handleMarkReturned = async () => {
    if (!window.confirm('Are you sure you want to mark this item as returned to its owner?')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.patch(`/api/posts/${id}/returned`);
      setPost(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/api/posts/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500 mb-2" />
          <h2 className="text-lg font-bold">Post Unavailable</h2>
          <p className="text-sm mt-1">{error || 'Post could not be found in your hostel.'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const isFound = post.type === 'found';
  const formattedDate = new Date(post.happenedAt || post.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'High':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </div>

      {/* Main Post Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Row: Type, Status, Manage actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                  isFound
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {isFound ? '🎁 Found Item' : '🔍 Lost Item'}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  post.status === 'open'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : post.status === 'returned'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                Status: {post.status.toUpperCase()}
              </span>
            </div>

            {canManage && (
              <div className="flex items-center space-x-2">
                {post.status !== 'returned' && (
                  <button
                    onClick={handleMarkReturned}
                    disabled={actionLoading}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Mark Returned
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Title and metadata */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500">
              <span className="inline-flex items-center font-medium text-slate-700">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                {post.spot}
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <Clock className="w-4 h-4 mr-1 text-slate-400" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                {categoryLabels[post.category] || post.category}
              </span>
            </div>
          </div>

          {/* Image Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-96 flex items-center justify-center">
                <img
                  src={post.images[activeImageIndex]}
                  alt={post.title}
                  className="w-full h-96 object-contain bg-slate-950/5"
                />
              </div>

              {post.images.length > 1 && (
                <div className="flex gap-2">
                  {post.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Item Details
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">
              {post.description}
            </div>
          </div>

          {/* SENSITIVE VERIFICATION DETAILS */}
          {post.hiddenDetails && (
            <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200">
              <div className="flex items-center text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                <Lock className="w-4 h-4 mr-1.5 text-purple-700" />
                <span>Confidential Hidden Details (Visible only to you & warden)</span>
              </div>
              <p className="text-sm text-purple-950 mt-1 font-mono bg-white p-3 rounded-lg border border-purple-100">
                {post.hiddenDetails}
              </p>
            </div>
          )}

          {isFound && post.verificationQuestions && post.verificationQuestions.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="flex items-start mb-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 mr-2 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Owner Verification Questions
                  </h4>
                  <p className="text-xs text-amber-700">
                    To claim this item, the owner must be able to answer these specific questions:
                  </p>
                </div>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-sm text-amber-950 font-medium pl-1">
                {post.verificationQuestions.map((q, idx) => (
                  <li key={idx} className="leading-snug">
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Posted By Information */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                {post.postedBy?.name ? post.postedBy.name.charAt(0) : 'U'}
              </div>
              <div>
                <div className="font-semibold text-slate-800">
                  {post.postedBy?.name || 'Resident'}
                  {isOwner && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                      You
                    </span>
                  )}
                </div>
                <div className="text-slate-400">
                  {post.postedBy?.room ? `Room ${post.postedBy.room}` : 'Hostel Resident'}
                </div>
              </div>
            </div>

            <span className="text-slate-400">Hostel Scoped</span>
          </div>
        </div>
      </div>

      {/* PHASE 2: POSSIBLE MATCHES SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Possible Matches</h2>
              <p className="text-xs text-slate-500">
                AI text similarity and location-time compatibility analysis
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {matches.length} Suggestion{matches.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingMatches ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Scanning hostel database for matching items...</span>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm font-semibold text-slate-700">No matches found yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We check every new report in real-time. If a resident posts an item with similar description and location, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const opp = match.oppositePost;
              if (!opp) return null;

              return (
                <div
                  key={match.matchId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${getConfidenceBadge(
                          match.confidence
                        )}`}
                      >
                        {match.confidence} Confidence ({Math.round(match.finalScore * 100)}%)
                      </span>

                      <span className="text-xs font-medium text-slate-500">
                        {match.reason}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{opp.title}</h3>

                    <p className="text-xs text-slate-600 line-clamp-1">{opp.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="inline-flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {opp.spot}
                      </span>
                      <span>•</span>
                      <span>
                        Posted by {opp.postedBy?.name ? opp.postedBy.name.split(' ')[0] : 'Resident'}
                        {opp.postedBy?.room ? ` (Rm ${opp.postedBy.room})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      to={`/posts/${opp._id}`}
                      className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <span>View Item</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
