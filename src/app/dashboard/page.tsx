'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Stats {
  users: number;
  doctors: number;
  pendingDoctors: number;
  hospitals: number;
  appointments: number;
  ambulances: number;
  bloodBanks: number;
  physiotherapyCenters: number;
  eyeCareCenters: number;
  dentalClinics: number;
  hearingAidCenters: number;
  drugRehabCenters: number;
}

const statCards = [
  { key: 'users',               label: 'Total Users',         color: '#2B3EE6', bg: '#EEF0FF',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { key: 'doctors',             label: 'Total Doctors',       color: '#10B981', bg: '#D1FAE5',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { key: 'pendingDoctors',      label: 'Pending Approval',    color: '#F59E0B', bg: '#FEF3C7',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'hospitals',           label: 'Hospitals',           color: '#8B5CF6', bg: '#EDE9FE',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { key: 'appointments',        label: 'Appointments',        color: '#EC4899', bg: '#FCE7F3',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { key: 'ambulances',          label: 'Ambulances',          color: '#EF4444', bg: '#FEE2E2',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg> },
  { key: 'bloodBanks',          label: 'Blood Banks',         color: '#DC2626', bg: '#FEE2E2',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { key: 'physiotherapyCenters',label: 'Physiotherapy',       color: '#0EA5E9', bg: '#E0F2FE',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { key: 'eyeCareCenters',      label: 'Eye Care Centers',    color: '#6366F1', bg: '#EEF2FF',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
  { key: 'dentalClinics',       label: 'Dental Clinics',      color: '#14B8A6', bg: '#CCFBF1',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'hearingAidCenters',   label: 'Hearing Aid Centers', color: '#7C3AED', bg: '#EDE9FE',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
  { key: 'drugRehabCenters',    label: 'Drug Rehab Centers',  color: '#D97706', bg: '#FEF3C7',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    users: 0, doctors: 0, pendingDoctors: 0, hospitals: 0,
    appointments: 0, ambulances: 0, bloodBanks: 0,
    physiotherapyCenters: 0, eyeCareCenters: 0, dentalClinics: 0,
    hearingAidCenters: 0, drugRehabCenters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/users'),
          api.get('/doctors'),
          api.get('/hospitals'),
          api.get('/appointments/all'),
          api.get('/ambulance'),
          api.get('/blood-banks'),
          api.get('/physiotherapy-centers'),
          api.get('/eye-care-centers'),
          api.get('/dental-clinics'),
          api.get('/hearing-aid-centers'),
          api.get('/drug-rehabilitation-centers'),
        ]);

        const get = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? (Array.isArray(r.value.data) ? r.value.data : []) : [];

        const [users, doctors, hospitals, appointments, ambulances,
          bloodBanks, physio, eyeCare, dental, hearing, drugRehab] = results.map(get);

        setStats({
          users: users.length,
          doctors: doctors.length,
          pendingDoctors: doctors.filter((d: any) => !d.isApproved).length,
          hospitals: hospitals.length,
          appointments: appointments.length,
          ambulances: ambulances.length,
          bloodBanks: bloodBanks.length,
          physiotherapyCenters: physio.length,
          eyeCareCenters: eyeCare.length,
          dentalClinics: dental.length,
          hearingAidCenters: hearing.length,
          drugRehabCenters: drugRehab.length,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100 mb-4" />
              <div className="h-7 w-16 bg-gray-100 rounded-lg mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((c) => (
            <div key={c.key} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.bg, color: c.color }}>
                  {c.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats[c.key as keyof Stats]}</p>
              <p className="text-sm text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
