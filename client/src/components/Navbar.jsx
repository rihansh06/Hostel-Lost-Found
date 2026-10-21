import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  PlusCircle,
  Search,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  CheckSquare,
  BarChart3,
  Sparkles,
  Building2,
  Tag,
} from 'lucide-react';

export default function Navbar() {
  const { user, isWarden, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Hostel Tag */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Tag className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  Hostel <span className="text-indigo-600 font-black">Lost&Found</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
                  Smart AI Recovery
                </span>
              </div>
            </Link>

            {user?.hostel?.name && (
              <div className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/90 ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[160px]">{user.hostel.name}</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-1.5">
              <Link
                to="/"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/')
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Feed</span>
              </Link>

              <Link
                to="/posts/new"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/posts/new')
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/80'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Item</span>
              </Link>

              <Link
                to="/claims"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/claims')
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>My Claims</span>
              </Link>

              {isWarden && (
                <>
                  <Link
                    to="/warden"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/warden')
                        ? 'bg-purple-100 text-purple-800 shadow-xs'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Warden Panel</span>
                  </Link>

                  <Link
                    to="/stats"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/stats')
                        ? 'bg-indigo-100 text-indigo-800 shadow-xs'
                        : 'text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Analytics</span>
                  </Link>
                </>
              )}

              {/* Notification Bell Dropdown */}
              <div className="pl-1">
                <NotificationDropdown />
              </div>

              <div className="h-6 w-px bg-slate-200 mx-2" />

              {/* User Profile Card */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {getInitials(user.name)}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {isWarden ? 'Warden' : `Room ${user.room || '—'}`}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                Join with Invite Code
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-2 md:hidden">
            {isAuthenticated && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="py-2.5 border-b border-slate-100 flex items-center space-x-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center">
                  {getInitials(user.name)}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">
                    {user.hostel?.name} • {isWarden ? 'Warden' : `Room ${user.room}`}
                  </div>
                </div>
              </div>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Feed</span>
              </Link>
              <Link
                to="/posts/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50/70"
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Post Item</span>
              </Link>
              <Link
                to="/claims"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>My Claims</span>
              </Link>
              {isWarden && (
                <>
                  <Link
                    to="/warden"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-purple-700 hover:bg-purple-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Warden Panel</span>
                  </Link>
                  <Link
                    to="/stats"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Hostel Analytics</span>
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 mt-2 border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 px-4 rounded-xl text-sm font-bold text-slate-700 border border-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600"
              >
                Join with Invite Code
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
