import type { Metadata } from 'next';
import { Providers } from '@/components/providers/auth-provider';
import './globals.css';

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
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
