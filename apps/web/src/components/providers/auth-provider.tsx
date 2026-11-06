'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [isClient, setIsClient] = useState(false);
  const { checkAuth, user } = useAuthStore();
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.userId || null;
    if (prevUserIdRef.current && prevUserIdRef.current !== currentUserId) {
      queryClient.clear();
    }
    prevUserIdRef.current = currentUserId;
  }, [user?.userId, queryClient]);

  useEffect(() => {
    setIsClient(true);
    checkAuth();
  }, []);

  // Don't render children until client-side hydration is complete
  if (!isClient) {
    return <div className="erp-entry" role="status">Loading workspace…</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#2563eb',
            color: '#fcfeff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#2563eb',
              secondary: '#fcfeff',
            },
          },
          error: {
            iconTheme: {
              primary: '#2563eb',
              secondary: '#fcfeff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
