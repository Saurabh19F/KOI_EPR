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
      <head><style>{'@media screen { html { --erp-screen-scale: 0.8; zoom: var(--erp-screen-scale); } }'}</style></head>
      <body style={{ backgroundColor: '#eff3f7', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh / var(--erp-screen-scale, 1))', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#fcfeff', padding: 32, borderRadius: 12, boxShadow: '0 4px 6px rgba(37, 99, 235, 0.1)', border: '1px solid #dce4ed', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#b90f1c', fontWeight: 'bold', fontSize: 20 }}>
            !
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#182652', marginBottom: 12 }}>Application Error</h2>
          <p style={{ fontSize: 12, color: '#506075', backgroundColor: '#f6f8fb', padding: 12, borderRadius: 6, textAlign: 'left', fontFamily: 'monospace', overflow: 'auto', maxHeight: 112, marginBottom: 16 }}>
            {error?.message || 'An error occurred'}
          </p>
          <button
            onClick={() => reset()}
            style={{ width: '100%', padding: '8px 16px', backgroundColor: '#2563eb', color: '#fcfeff', borderRadius: 8, fontWeight: 500, border: 'none', cursor: 'pointer' }}
          >
            Refresh &amp; Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
