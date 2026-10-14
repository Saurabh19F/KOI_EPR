'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Search, Command, Bell, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInitials } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { NotificationPanel } from './notification-panel';
import { CommandPalette } from './global-search/command-palette';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e5dfd4] bg-[#fbfaf6]/90 px-4 backdrop-blur-sm sm:px-6">
        {/* Left side - Search & Title */}
        <div className="flex items-center gap-6">
          {/* Search Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex w-56 items-center gap-3 rounded-lg border border-[#ded4c6] bg-white px-3 py-2 transition-all hover:border-[#c7b79f] hover:bg-[#fbfaf6] sm:w-72"
          >
            <Search className="h-4 w-4 text-[#9a6b36]" />
            <span className="flex-1 text-left text-sm font-medium text-slate-500">Quick search...</span>
            <kbd className="flex items-center gap-1 rounded bg-[#efe8dc] px-2 py-0.5 font-mono text-xs text-slate-500">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          {/* Greeting */}
          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-slate-600">
              {greeting()}, <span className="font-bold text-slate-950">{user?.name || 'there'}</span>
            </h2>
            <p className="text-xs font-medium text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationPanel />

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-[#efe8dc] hover:text-slate-950"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#efe8dc]"
            >
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-[#0f2f29] text-sm font-bold text-white shadow-sm">
                <span>{getInitials(user?.name || 'U')}</span>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="absolute h-9 w-9 rounded-lg object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold leading-tight text-slate-900">{user?.name || 'User'}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{user?.roles?.[0]?.roleName || user?.role || 'Staff'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#ded4c6] bg-white shadow-xl">
                  {/* User Info */}
                  <div className="border-b border-[#eee8de] px-4 py-3">
                    <p className="font-bold text-slate-950">{user?.name || 'User'}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#efe8dc] px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-[#7a4f24]">
                      {user?.roles?.[0]?.roleName || user?.role || 'Staff'}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#fbfaf6]"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#fbfaf6]"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[#eee8de] py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
