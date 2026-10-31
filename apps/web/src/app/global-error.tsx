'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626', fontWeight: 'bold', fontSize: 20 }}>
            !
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 }}>Application Error</h2>
          <p style={{ fontSize: 12, color: '#475569', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 6, textAlign: 'left', fontFamily: 'monospace', overflow: 'auto', maxHeight: 112, marginBottom: 16 }}>
            {error?.message || 'An error occurred'}
          </p>
          <button
            onClick={() => reset()}
            style={{ width: '100%', padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: 8, fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            Refresh &amp; Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
