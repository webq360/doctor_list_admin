'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/users/${id}`, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !isActive } : u)));
    } catch {
      alert('Failed to update user status. Please try again.');
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Name', 'Email', 'Phone', 'Role', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 text-sm">No users found</td></tr>
            )}
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{u.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.phone}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                    u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                    u.role === 'doctor' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>{u.role}</span>
                </td>
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
