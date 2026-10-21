import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/stats');
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hostel analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Calculating hostel statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800">Unable to Load Statistics</h3>
          <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
            <BarChart3 className="w-4 h-4" />
            <span>Warden Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Hostel Lost & Found Metrics</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Operational recovery rate, post resolution velocity, and AI match performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/warden"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <span>Warden Approvals & Posts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {/* Total Items Posted */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Posted</span>
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.itemsPosted || 0}</span>
            <span className="text-xs text-slate-500 font-medium">all-time items</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500 space-x-3">
            <span>
              <strong className="text-slate-700">{stats?.itemsLost || 0}</strong> Lost
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-700">{stats?.itemsFound || 0}</strong> Found
            </span>
          </div>
        </div>

        {/* Total Items Returned */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Returned</span>
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600">{stats?.itemsReturned || 0}</span>
            <span className="text-xs text-slate-500 font-medium">successfully returned</span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified owner handovers completed</span>
          </div>
        </div>

        {/* Return Rate */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Rate</span>
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-indigo-600">{stats?.returnRate || 0}%</span>
            <span className="text-xs text-slate-500 font-medium">recovery ratio</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, stats?.returnRate || 0))}%` }}
            />
          </div>
        </div>

        {/* Average Time to Return */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Time to Return</span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600">
              {stats?.averageTimeToReturn?.formatted || 'N/A'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {stats?.averageTimeToReturn?.hours > 0 ? (
              <span>~{stats.averageTimeToReturn.hours} hours from post to handover</span>
            ) : (
              <span>Calculated on item return</span>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Metric Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Post Pipeline Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <span>Current Item Pipeline</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-slate-700">Open Items</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{stats?.itemsOpen || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-amber-900">Claim Pending</span>
              </div>
              <span className="text-sm font-bold text-amber-900">{stats?.itemsClaimPending || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-900">Returned</span>
              </div>
              <span className="text-sm font-bold text-emerald-900">{stats?.itemsReturned || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm font-medium text-slate-600">Expired (&gt;30d)</span>
              </div>
              <span className="text-sm font-bold text-slate-700">{stats?.itemsExpired || 0}</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Items by Category</span>
            <span className="text-xs font-normal text-slate-500">
              {stats?.categories?.length || 0} active categories
            </span>
          </h3>

          {stats?.categories && stats.categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.categories.map((c) => {
                const pct = stats.itemsPosted > 0 ? Math.round((c.count / stats.itemsPosted) * 100) : 0;
                return (
                  <div key={c.category} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-semibold text-slate-800 capitalize">{c.category}</span>
                      <span className="text-xs font-bold text-indigo-600">
                        {c.count} items ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No item categories recorded yet.</p>
          )}

          {/* AI Match Overview Banner */}
          <div className="mt-5 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <div className="text-sm font-bold text-indigo-950">AI Match Engine Performance</div>
                <div className="text-xs text-indigo-700">
                  {stats?.totalMatches || 0} similarity matches generated automatically across opposite items
                </div>
              </div>
            </div>
            <span className="text-xl font-extrabold text-indigo-700">{stats?.totalMatches || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
