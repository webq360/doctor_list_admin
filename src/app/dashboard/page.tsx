'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

const statCards = [
  { key: 'users', label: 'Total Users', icon: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ), color: '#2B3EE6', bg: '#EEF0FF' },
  { key: 'doctors', label: 'Total Doctors', icon: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ), color: '#10B981', bg: '#D1FAE5' },
  { key: 'hospitals', label: 'Hospitals', icon: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ), color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'appointments', label: 'Appointments', icon: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ), color: '#F59E0B', bg: '#FEF3C7' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, doctors: 0, hospitals: 0, appointments: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/doctors'),
      api.get('/hospitals'),
      api.get('/appointments/all'),
    ]).then(([u, d, h, a]) => {
      setStats({
        users: u.data.length,
        doctors: d.data.length,
        hospitals: h.data.length,
        appointments: a.data.length,
      });
    }).catch(() => {});
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c) => (
          <div key={c.key} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
                {c.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats[c.key as keyof typeof stats]}</p>
            <p className="text-sm text-gray-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
