import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doctor List Admin',
  description: 'Admin Dashboard for Doctor List Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
