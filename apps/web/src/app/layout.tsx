import type { Metadata } from 'next';
import { Providers } from '@/components/providers/auth-provider';
import './globals.css';
import './workspace-glass.css';

export const metadata: Metadata = {
  title: 'ERP Platform',
  description: 'Centralized ERP Platform',
  icons: {
    icon: '/koi-logo-square.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {/* Convert the original brand artwork to the interface palette by luminance. */}
        <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
          <defs>
            <filter id="koi-plum-logo" colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="discrete" tableValues="0.145098 0.988235" />
                <feFuncG type="discrete" tableValues="0.388235 0.996078" />
                <feFuncB type="discrete" tableValues="0.921569 1" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
