'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Search, Command, Bell, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';
import { NotificationPanel } from './notification-panel';
import { MobileNavigation } from './sidebar';
import Link from 'next/link';
import { Magnetic } from '@/components/ui/magnetic';
import { GradientText } from '@/components/ui/text-animation';

export function Header({ onSearch }: { onSearch: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
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
      <header className="erp-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#fcfeff]/20 px-4 sm:px-6">
        {/* Left side - Search & Title */}
        <div className="flex items-center gap-1 md:gap-6">
          <MobileNavigation />
          {/* Search Bar */}
          <button
            onClick={onSearch}
            aria-label="Quick search"
            className="group flex w-auto items-center gap-3 rounded-full border border-[#fcfeff]/40 bg-white/80 px-4 py-2.5 transition-all duration-200 hover:border-[#2563eb] hover:bg-white hover:shadow-sm sm:w-72"
          >
            <Search className="h-4 w-4 text-[#2563eb] transition-transform group-hover:scale-110" />
            <span className="hidden sm:block flex-1 text-left text-sm font-medium text-plum-700">Quick search...</span>
            <kbd className="hidden sm:flex items-center gap-1 rounded-full bg-[#fcfeff]/20 px-2 py-0.5 font-mono text-xs text-slate-400">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          {/* Greeting */}
          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-slate-600">
              {greeting()}, <GradientText className="font-bold">{user?.name || 'there'}</GradientText>
            </h2>
            <p className="text-xs font-medium text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Magnetic strength={0.2} radius={50}>
            <NotificationPanel />
          </Magnetic>

          {/* Settings */}
          <Magnetic strength={0.2} radius={50}>
            <Link
              href="/dashboard/settings"
              className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-[#fcfeff]/20 hover:text-[#2563eb] hover:scale-110"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </Magnetic>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 rounded-full p-2 transition-colors hover:bg-[#fcfeff]/20"
            >
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#2563eb] text-sm font-bold text-white shadow-sm">
                <span>{getInitials(user?.name || 'U')}</span>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="absolute h-9 w-9 rounded-full object-cover"
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
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#fcfeff]/20 bg-white shadow-xl">
                  {/* User Info */}
                  <div className="border-b border-[#fcfeff]/30 px-4 py-3">
                    <p className="font-bold text-slate-950">{user?.name || 'User'}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#fcfeff]/20 px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-[#2563eb]">
                      {user?.roles?.[0]?.roleName || user?.role || 'Staff'}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#fcfeff]"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-[#fcfeff]"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[#fcfeff]/30 py-1">
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

    </>
  );
}
