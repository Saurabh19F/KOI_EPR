'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-50 flex items-center justify-center min-h-screen font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg border max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
          <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded text-left font-mono text-xs overflow-auto max-h-28">
            {error.message || 'An error occurred'}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Refresh &amp; Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
