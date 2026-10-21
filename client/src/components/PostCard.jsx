import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

const categoryLabels = {
  electronics: '📱 Electronics',
  clothing: '👕 Clothing',
  keys: '🔑 Keys',
  bottle: '🍶 Bottle',
  documents: '📄 Documents',
  other: '📦 Other',
};

export default function PostCard({ post }) {
  const isFound = post.type === 'found';

  const statusStyles = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    matched: 'bg-blue-50 text-blue-700 border-blue-200',
    claim_pending: 'bg-amber-50 text-amber-700 border-amber-200',
    returned: 'bg-slate-100 text-slate-700 border-slate-300',
    expired: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const statusLabels = {
    open: 'Open',
    matched: 'Matched',
    claim_pending: 'Claim Pending',
    returned: 'Returned',
    expired: 'Expired',
  };

  const formattedDate = new Date(post.happenedAt || post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      to={`/posts/${post._id}`}
      className="group block bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Optional image thumbnail */}
      {post.images && post.images.length > 0 && (
        <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {post.images.length > 1 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-semibold bg-black/60 text-white backdrop-blur-xs">
              +{post.images.length - 1} more
            </span>
          )}
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                isFound
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {isFound ? 'Found Item' : 'Lost Item'}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                statusStyles[post.status] || 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {statusLabels[post.status] || post.status}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5">
            {post.title}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {post.description}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              {categoryLabels[post.category] || post.category}
            </span>

            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {post.spot}
            </span>
          </div>

          {isFound && post.verificationQuestions?.length > 0 && (
            <div className="mb-3 flex items-center text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/60">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Owner claim verification required</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">
              Posted by {post.postedBy?.name ? post.postedBy.name.split(' ')[0] : 'Resident'}
              {post.postedBy?.room ? ` (Rm ${post.postedBy.room})` : ''}
            </span>
            <span className="inline-flex items-center shrink-0">
              <Clock className="w-3 h-3 mr-1" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
