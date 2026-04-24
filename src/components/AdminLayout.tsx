'use client';
import Sidebar from './Sidebar';

export default function AdminLayout({ children, title, action }: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <Sidebar />
      <div className="ml-60">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          {action && <div>{action}</div>}
        </div>
        {/* Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
