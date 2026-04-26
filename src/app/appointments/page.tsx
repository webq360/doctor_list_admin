'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Appointment } from '@/types';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-500',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get('/appointments/all').then((r) => setAppointments(r.data)).catch(() => {});
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/appointments/${id}/status`, { status });
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: status as Appointment['status'] } : a)));
  };

  return (
    <AdminLayout title="Appointments">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Patient', 'Doctor', 'Hospital', 'Date', 'Time', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-300 text-sm">No appointments found</td></tr>
            )}
            {appointments.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{a.patientId?.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.doctorId?.userId?.name}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{(a as any).hospitalId?.name || '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.date}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.time}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusStyle[a.status]}`}>{a.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  <select value={a.status} onChange={(e) => updateStatus(a._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none text-gray-500">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
