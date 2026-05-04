'use client';
import Sidebar from './Sidebar';

export default function AdminLayout({ children, title, action }: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 w-full" suppressHydrationWarning>
      <Sidebar />
      <div className="lg:ml-60">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-30">
          <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate pl-12 lg:pl-0">{title}</h1>
          {action && <div className="w-full sm:w-auto flex-shrink-0 pl-12 lg:pl-0 sm:pl-0">{action}</div>}
        </div>
        {/* Content */}
        <main className="p-3 sm:p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
