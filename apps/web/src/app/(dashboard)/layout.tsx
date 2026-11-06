'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar, ModuleNavigation } from '@/components/sidebar';
import { WorkspaceDataView } from '@/components/workspace-data-view';
import { Header } from '@/components/header';
import { getPageAccent, moduleAccents } from '@/lib/workspace-colors';
import { CommandPalette, useCommandPalette } from '@/components/global-search/command-palette';

const publicPaths = ['/login', '/'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCommandPalette();
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
      <div className="erp-entry" role="status">Loading workspace…</div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const isCompact = user?.preferences?.compactMode === true;

  return (
    <>
      <div data-icon-accent={moduleAccents[pathname.split('/')[2]] ?? 'plum'} className={`erp-shell flex min-h-screen ${isCompact ? 'compact' : ''}`}>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onSearch={() => setIsOpen(true)} />
          <main data-icon-accent={getPageAccent(pathname)} className="workspace-main min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
            <ModuleNavigation />
            <WorkspaceDataView key={pathname}>{children}</WorkspaceDataView>
          </main>
        </div>
      </div>
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
