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
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#0d9488',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
