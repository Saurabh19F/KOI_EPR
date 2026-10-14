'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { CommandPalette, useCommandPalette } from '@/components/global-search/command-palette';

const publicPaths = ['/login', '/'];

function CommandPaletteWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useCommandPalette();
  return (
    <>
      {children}
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Get user from auth store
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only check auth if we haven't checked yet
    if (!hasCheckedAuth) {
      checkAuth().finally(() => setHasCheckedAuth(true));
    }
  }, [hasCheckedAuth, checkAuth]);

  useEffect(() => {
    // Redirect to login if not authenticated after auth check
    const isPublicPath = publicPaths.some((p) => {
      if (p === '/') return pathname === '/';
      return pathname.startsWith(p);
    });

    if (hasCheckedAuth && !isLoading && !isAuthenticated && !isPublicPath) {
      router.push('/login');
    }
  }, [hasCheckedAuth, isAuthenticated, isLoading, pathname, router]);

  // Show loading while checking auth
  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#0f2f29] border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <CommandPaletteWrapper>
      <div className="flex min-h-screen bg-[#f6f3ec]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </CommandPaletteWrapper>
  );
}
