'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { User } from '@/types';

export default function AmbulanceUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users?role=ambulance_user').then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', { ...form, role: 'ambulance_user' });
      setUsers((prev) => [...prev, { ...data.user, _id: data.user.id }]);
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', password: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/users/${id}`, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !isActive } : u)));
    } catch {
      alert('Failed to update user status. Please try again.');
    }
  };

  const addBtn = (
    <button onClick={() => setShowForm(!showForm)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Ambulance User
    </button>
  );

  return (
    <AdminLayout title="Ambulance Users" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: users.filter((u) => u.isActive).length, color: 'bg-green-50 text-green-600' },
          { label: 'Inactive', value: users.filter((u) => !u.isActive).length, color: 'bg-red-50 text-red-500' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">New Ambulance User</h3>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="grid grid-cols-4 gap-4">
            {([
              ['name', 'Full Name', 'text'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone', 'text'],
              ['password', 'Password', 'password'],
            ] as [keyof typeof form, string, string][]).map(([key, label, type]) => (
              <input key={key} type={type} placeholder={label} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
                required />
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#2B3EE6' }}>Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Name', 'Email', 'Phone', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 text-sm">No ambulance users found</td></tr>
            )}
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{u.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.phone}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggleActive(u._id, u.isActive)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
