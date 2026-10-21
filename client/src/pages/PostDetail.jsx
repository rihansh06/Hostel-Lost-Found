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
  ChevronRight,
  X,
  Sliders,
  HandMetal,
  Check,
  FileCheck,
  AlertTriangle,
  UserCheck,
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
  const [claimsData, setClaimsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Warden Debug Modal State
  const [debugMatchId, setDebugMatchId] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(false);

  // Claim Modal State (for claimant)
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimAnswers, setClaimAnswers] = useState([]);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  // Claim Review State (for finder or warden)
  const [reviewingClaimId, setReviewingClaimId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

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

  useEffect(() => {
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
  const isFound = post?.type === 'found';

  // Fetch claims on this post if user is finder or warden
  const fetchClaims = async () => {
    if (!canManage || !isFound) return;
    setLoadingClaims(true);
    try {
      const res = await api.get(`/api/posts/${id}/claims`);
      setClaimsData(res.data.data);
    } catch (err) {
      console.warn('Could not load claims:', err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    if (post && isFound && canManage) {
      fetchClaims();
    }
  }, [post, isFound, canManage]);

  const handleOpenClaimModal = () => {
    setClaimError('');
    setClaimSuccess('');
    // Initialize answers array based on verification questions
    const initialAnswers = (post.verificationQuestions || []).map((q) => ({
      question: q,
      answer: '',
    }));
    setClaimAnswers(initialAnswers);
    setClaimModalOpen(true);
  };

  const handleAnswerChange = (idx, text) => {
    const updated = [...claimAnswers];
    updated[idx].answer = text;
    setClaimAnswers(updated);
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setClaimError('');
    setSubmittingClaim(true);

    try {
      await api.post(`/api/posts/${id}/claims`, {
        answers: claimAnswers,
      });
      setClaimSuccess('Claim submitted successfully! The finder will review your verification answers.');
      setTimeout(() => {
        setClaimModalOpen(false);
        fetchPost();
      }, 1500);
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleReviewClaim = async (claimId, status) => {
    setProcessingReview(true);
    try {
      await api.patch(`/api/claims/${claimId}`, {
        status,
        reviewNote,
      });
      alert(`Claim marked as ${status}!`);
      setReviewingClaimId(null);
      setReviewNote('');
      fetchClaims();
      fetchPost();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${status} claim`);
    } finally {
      setProcessingReview(false);
    }
  };

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

  const openDebugModal = async (matchId) => {
    setDebugMatchId(matchId);
    setLoadingDebug(true);
    setDebugData(null);
    try {
      const res = await api.get(`/api/warden/matches/${matchId}/breakdown`);
      setDebugData(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load match breakdown');
      setDebugMatchId(null);
    } finally {
      setLoadingDebug(false);
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
          {/* Header Row: Type, Status, Manage / Claim actions */}
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

            <div className="flex items-center space-x-2">
              {/* Claim Button for Other Residents on Found Items */}
              {isFound && !isOwner && post.status !== 'returned' && post.status !== 'expired' && (
                <button
                  onClick={handleOpenClaimModal}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  <HandMetal className="w-4 h-4 mr-1.5" />
                  Claim This Item
                </button>
              )}

              {canManage && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Returned & Handover Success Banner */}
          {post.status === 'returned' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start space-x-3.5 shadow-xs">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-emerald-950">Item Recovered & Returned</h3>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  This item has been successfully verified and returned to its rightful owner.
                  {claimsData?.claims?.some((c) => c.status === 'approved') && (
                    <span className="block mt-1 font-semibold text-emerald-900">
                      Handover completed via verified challenge handshake.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

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

      {/* PHASE 4: CLAIMS REVIEW PANEL (For Finder or Warden) */}
      {canManage && isFound && claimsData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Submitted Ownership Claims</h2>
                <p className="text-xs text-slate-500">
                  Cross-examine submitted claimant answers next to the secret hidden details
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {claimsData.claims?.length || 0} Claim{(claimsData.claims?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {claimsData.claims?.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No claims submitted for this item yet.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {claimsData.claims.map((claim) => (
                <div
                  key={claim._id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{claim.claimant?.name}</span>
                      <span className="text-xs text-slate-500">• Room {claim.claimant?.room}</span>
                      {claim.claimant?.claimStrikes > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {claim.claimant.claimStrikes} Strike{claim.claimant.claimStrikes > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        claim.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>

                  {/* Answers side-by-side with hidden details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Claimant's Submitted Answers:
                      </div>
                      {claim.answers.map((ans, aIdx) => (
                        <div key={aIdx} className="space-y-0.5">
                          <span className="font-semibold text-slate-800">Q: {ans.question}</span>
                          <p className="font-mono text-slate-600 pl-2">A: {ans.answer}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 space-y-1">
                      <div className="font-bold text-purple-900 uppercase tracking-wider text-[10px]">
                        Secret Hidden Details (For Verification):
                      </div>
                      <p className="font-mono text-purple-950 whitespace-pre-wrap">
                        {claimsData.hiddenDetails || 'No hidden details provided'}
                      </p>
                    </div>
                  </div>

                  {/* Claim Review Actions if pending */}
                  {claim.status === 'pending' && (
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200">
                      <input
                        type="text"
                        placeholder="Optional review note (e.g. Verified brand engraving)..."
                        value={reviewingClaimId === claim._id ? reviewNote : ''}
                        onChange={(e) => {
                          setReviewingClaimId(claim._id);
                          setReviewNote(e.target.value);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <div className="flex space-x-2 shrink-0">
                        <button
                          onClick={() => handleReviewClaim(claim._id, 'approved')}
                          disabled={processingReview}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          Approve Claim
                        </button>
                        <button
                          onClick={() => handleReviewClaim(claim._id, 'rejected')}
                          disabled={processingReview}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                        >
                          Reject Claim
                        </button>
                      </div>
                    </div>
                  )}

                  {claim.reviewNote && claim.status !== 'pending' && (
                    <div className="text-xs text-slate-500 italic">
                      Review Note: "{claim.reviewNote}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PHASE 2 & 3: POSSIBLE MATCHES SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Possible Matches</h2>
              <p className="text-xs text-slate-500">
                Automated similarity scoring via MiniLM text embeddings, CLIP visual features, and location-time compatibility
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

                      {match.imageScore > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          🖼️ Visual Match: {Math.round(match.imageScore * 100)}%
                        </span>
                      )}

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

                  <div className="flex items-center space-x-2 shrink-0">
                    {isWarden && (
                      <button
                        onClick={() => openDebugModal(match.matchId)}
                        title="Inspect Score Breakdown (Warden Only)"
                        className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1 text-purple-600" />
                        <span>Score Math</span>
                      </button>
                    )}

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

      {/* CLAIM SUBMISSION MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <HandMetal className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Claim Item: {post.title}</h3>
              </div>
              <button
                onClick={() => setClaimModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              To verify that you are the rightful owner, please answer the questions set by the finder. False claims increase your claim strikes (3 strikes suspends claiming).
            </p>

            {claimError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-start">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 mt-0.5" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-start">
                <Check className="w-4 h-4 mr-1.5 shrink-0 mt-0.5" />
                <span>{claimSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              {claimAnswers.map((ans, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Question {idx + 1}: {ans.question}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={ans.answer}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Enter your detailed answer..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingClaim ? 'Submitting Claim...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WARDEN DEBUG / SCORE BREAKDOWN MODAL */}
      {debugMatchId && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900">Match Score Breakdown</h3>
              </div>
              <button
                onClick={() => setDebugMatchId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDebug || !debugData ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Computing score breakdown components...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Composite Score Banner */}
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <div>
                    <div className="text-purple-700 font-bold uppercase tracking-wider text-[10px]">
                      Final Combined Match Score
                    </div>
                    <div className="text-2xl font-black text-purple-950">
                      {(debugData.scoringBreakdown.finalScore * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${getConfidenceBadge(
                        debugData.scoringBreakdown.confidenceBadge
                      )}`}
                    >
                      {debugData.scoringBreakdown.confidenceBadge} Confidence
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Threshold: {(debugData.scoringBreakdown.threshold * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Score Components breakdown table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Dense Text Similarity</div>
                      <div className="text-slate-500 text-[10px]">
                        all-MiniLM-L6-v2 cosine similarity
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {(debugData.scoringBreakdown.textScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Weight: {(debugData.scoringBreakdown.weightsApplied.text * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Visual Feature Similarity</div>
                      <div className="text-slate-500 text-[10px]">
                        clip-vit-base-patch32 embedding
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {debugData.scoringBreakdown.hasBothImages
                          ? `${(debugData.scoringBreakdown.imageScore * 100).toFixed(1)}%`
                          : 'N/A (No Photos)'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {debugData.scoringBreakdown.weightsApplied.redistributed
                          ? 'Weight redistributed to Text & Location'
                          : `Weight: ${(debugData.scoringBreakdown.weightsApplied.image * 100).toFixed(1)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Location & Time Compatibility</div>
                      <div className="text-slate-500 text-[10px]">
                        {debugData.scoringBreakdown.locationTimeScore.spotRelation} spot •{' '}
                        {Math.abs(debugData.scoringBreakdown.locationTimeScore.diffDays)} days difference
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {(debugData.scoringBreakdown.locationTimeScore.score * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Weight: {(debugData.scoringBreakdown.weightsApplied.locationTime * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Final = ({debugData.scoringBreakdown.textScore.toFixed(3)} ×{' '}
                  {debugData.scoringBreakdown.weightsApplied.text.toFixed(3)}) + (
                  {debugData.scoringBreakdown.locationTimeScore.score.toFixed(3)} ×{' '}
                  {debugData.scoringBreakdown.weightsApplied.locationTime.toFixed(3)})
                  {debugData.scoringBreakdown.hasBothImages &&
                    ` + (${debugData.scoringBreakdown.imageScore.toFixed(3)} × ${debugData.scoringBreakdown.weightsApplied.image.toFixed(3)})`}{' '}
                  = <span className="font-bold text-slate-900">{debugData.scoringBreakdown.finalScore}</span>
                </div>
              </div>
            )}

            <div className="text-right pt-2">
              <button
                onClick={() => setDebugMatchId(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
