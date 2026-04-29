'use client';
import Sidebar from './Sidebar';

export default function AdminLayout({ children, title, action }: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden" suppressHydrationWarning>
      <Sidebar />
      <div className="lg:ml-60 w-full lg:w-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{title}</h1>
          {action && <div className="w-full sm:w-auto flex-shrink-0">{action}</div>}
        </div>
        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
