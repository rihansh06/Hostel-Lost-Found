import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import { Search, Filter, PlusCircle, RefreshCw, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'electronics', label: '📱 Electronics' },
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'keys', label: '🔑 Keys' },
  { value: 'bottle', label: '🍶 Bottle' },
  { value: 'documents', label: '📄 Documents' },
  { value: 'other', label: '📦 Other' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'matched', label: 'Matched' },
  { value: 'claim_pending', label: 'Claim Pending' },
  { value: 'returned', label: 'Returned' },
];

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();

  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const spot = searchParams.get('spot') || '';
  const status = searchParams.get('status') || '';
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [posts, setPosts] = useState([]);
  const [spots, setSpots] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(q);

  // Fetch hostel spots
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await api.get('/api/hostel/spots');
        setSpots(res.data.data || []);
      } catch (err) {
        console.error('Failed to load hostel spots:', err);
      }
    };
    fetchSpots();
  }, []);

  // Fetch posts with filters
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 12,
        ...(type && { type }),
        ...(category && { category }),
        ...(spot && { spot }),
        ...(status && { status }),
        ...(q && { q }),
      };

      const res = await api.get('/api/posts', { params });
      setPosts(res.data.posts || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [type, category, spot, status, q, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const updateFilters = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        nextParams.set(key, val);
      } else {
        nextParams.delete(key);
      }
    });
    // Always reset to page 1 on filter changes unless page itself is explicitly updated
    if (!('page' in updates)) {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const activeFiltersCount = [type, category, spot, status, q].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hostel Lost & Found Feed
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse reports, search misplaced items, or post a new discovery
          </p>
        </div>

        <Link
          to="/posts/new"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors text-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Report Lost or Found
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 space-y-4">
        {/* Search row and Type tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Type Toggle Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 shrink-0">
            <button
              onClick={() => updateFilters({ type: '' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !type ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => updateFilters({ type: 'lost' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                type === 'lost' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔍 Lost
            </button>
            <button
              onClick={() => updateFilters({ type: 'found' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                type === 'found' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎁 Found
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search items by keywords (e.g. AirPods, flask, keys)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Detailed filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-medium text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1">Hostel Spot</label>
            <select
              value={spot}
              onChange={(e) => updateFilters({ spot: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Spots</option>
              {spots.map((s) => (
                <option key={s} value={s}>
                  📍 {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
            <span>
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied ({pagination.total} results)
            </span>
            <button
              onClick={clearAllFilters}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Loading items...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 max-w-lg mx-auto">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No items found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {activeFiltersCount > 0
              ? 'No lost or found items matched your current filters. Try relaxing your search criteria.'
              : 'There are currently no items reported in your hostel. Have you found or lost something?'}
          </p>
          {activeFiltersCount > 0 ? (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              to="/posts/new"
              className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Post an Item
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Post Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="inline-flex items-center px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <span className="text-sm text-slate-600">
                Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                className="inline-flex items-center px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
