import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

const CATEGORY_META = {
  electronics: { label: 'Electronics', icon: '📱', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  clothing: { label: 'Clothing', icon: '👕', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  keys: { label: 'Keys', icon: '🔑', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  bottle: { label: 'Bottle', icon: '🍶', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  documents: { label: 'Documents', icon: '📄', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  other: { label: 'Other Item', icon: '📦', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const STATUS_BADGES = {
  open: { label: 'Active', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  matched: { label: 'AI Matched', bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  claim_pending: { label: 'Claim In Review', bg: 'bg-amber-500/10 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  returned: { label: 'Returned', bg: 'bg-slate-500/10 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  expired: { label: 'Expired', bg: 'bg-rose-500/10 text-rose-700 border-rose-200', dot: 'bg-rose-400' },
};

export default function PostCard({ post }) {
  const isFound = post.type === 'found';
  const categoryInfo = CATEGORY_META[post.category] || CATEGORY_META.other;
  const statusInfo = STATUS_BADGES[post.status] || STATUS_BADGES.open;

  const formattedDate = new Date(post.happenedAt || post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      to={`/posts/${post._id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Card Header Image / Graphic */}
        <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
          {post.images && post.images.length > 0 ? (
            <>
              <img
                src={post.images[0]}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/80 text-slate-400 p-4">
              <span className="text-4xl mb-1 filter drop-shadow-xs">{categoryInfo.icon}</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                No Photo Provided
              </span>
            </div>
          )}

          {/* Top badges floating over image */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs backdrop-blur-md ${
                isFound
                  ? 'bg-emerald-600/90 text-white shadow-emerald-900/20'
                  : 'bg-rose-600/90 text-white shadow-rose-900/20'
              }`}
            >
              {isFound ? '✨ Found' : '🔍 Lost'}
            </span>

            {/* Status chip */}
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md bg-white/95 shadow-xs ${statusInfo.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              <span>{statusInfo.label}</span>
            </span>
          </div>

          {post.images && post.images.length > 1 && (
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
              +{post.images.length - 1} photos
            </span>
          )}
        </div>

        {/* Post Content */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2 text-xs mb-2">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${categoryInfo.color}`}
            >
              <span>{categoryInfo.icon}</span>
              <span>{categoryInfo.label}</span>
            </span>

            <span className="inline-flex items-center text-slate-500 font-medium text-xs">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              <span className="truncate max-w-[130px]">{post.spot}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mt-1 mb-1.5 flex items-center justify-between">
            <span>{post.title}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-1" />
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {post.description}
          </p>

          {/* Verification Challenge Notice */}
          {isFound && post.verificationQuestions?.length > 0 && (
            <div className="mb-3 flex items-center text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
              <span className="truncate">Requires answer verification to claim</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate font-medium">
          By {post.postedBy?.name ? post.postedBy.name.split(' ')[0] : 'Resident'}
          {post.postedBy?.room ? ` (Rm ${post.postedBy.room})` : ''}
        </span>
        <span className="inline-flex items-center shrink-0 font-medium text-slate-400 ml-2">
          <Clock className="w-3 h-3 mr-1" />
          {formattedDate}
        </span>
      </div>
    </Link>
  );
}
