'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/users',
    label: 'Users',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/appointments',
    label: 'Appointments',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/banners',
    label: 'Banners',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const logout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const isHospitalActive = pathname === '/hospitals';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2B3EE6' }}>
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="11" r="6" fill="white" />
              <path d="M6 31c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-800">Doctor List</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">

        {/* Regular items */}
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={active ? { background: '#2B3EE6' } : {}}
            >
              <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Ambulance */}
        <Link
          href="/ambulances"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/ambulances' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/ambulances' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/ambulances' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </span>
          Ambulance
        </Link>

        {/* Ambulance Users */}
        <Link
          href="/ambulance-users"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/ambulance-users' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/ambulance-users' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/ambulance-users' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          Hospital Ambulance User
        </Link>

        {/* Doctor by Disease */}
        <Link
          href="/doctors-by-disease"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/doctors-by-disease' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/doctors-by-disease' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/doctors-by-disease' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          Doctor by Disease
        </Link>

        {/* Doctor List */}
        <Link
          href="/doctors"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/doctors' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/doctors' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/doctors' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Doctor List
        </Link>

        {/* Departments */}
        <Link
          href="/departments"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/departments' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/departments' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/departments' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          Departments
        </Link>

        {/* Hospital */}
        <Link
          href="/hospitals"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isHospitalActive ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={isHospitalActive ? { background: '#2B3EE6' } : {}}
        >
          <span className={isHospitalActive ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          Hospital
        </Link>

        {/* Blood Bank */}
        <Link
          href="/blood-bank"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/blood-bank' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/blood-bank' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/blood-bank' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
          Blood Bank
        </Link>

        {/* Physiotherapy Centers */}
        <Link
          href="/physiotherapy-centers"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/physiotherapy-centers' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/physiotherapy-centers' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/physiotherapy-centers' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </span>
          Physiotherapy
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/notifications' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/notifications' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/notifications' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </span>
          Notifications
        </Link>

        {/* Eye Care Centers */}
        <Link
          href="/eye-care-centers"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/eye-care-centers' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/eye-care-centers' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/eye-care-centers' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </span>
          Eye Care Center
        </Link>

        {/* Hearing Aid Centers */}
        <Link
          href="/hearing-aid-centers"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/hearing-aid-centers' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/hearing-aid-centers' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/hearing-aid-centers' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </span>
          Hearing Aid Center
        </Link>

        {/* Dental Clinics */}
        <Link
          href="/dental-clinics"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/dental-clinics' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/dental-clinics' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/dental-clinics' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Dental Clinic
        </Link>

        {/* Drug Rehabilitation Centers */}
        <Link
          href="/drug-rehabilitation-centers"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/drug-rehabilitation-centers' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/drug-rehabilitation-centers' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/drug-rehabilitation-centers' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </span>
          Drug Rehab Center
        </Link>
      </nav>

      {/* Logout */}
      <div suppressHydrationWarning className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link
          href="/settings"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/settings' ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          style={pathname === '/settings' ? { background: '#2B3EE6' } : {}}
        >
          <span className={pathname === '/settings' ? 'text-white' : 'text-gray-400'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          Settings
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}
