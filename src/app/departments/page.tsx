'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Department } from '@/types';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptyForm = {
  title: '',
  description: '',
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/admin/all');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/departments', {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
      });
      setDepartments((prev) => [...prev, data]);
      setShowModal(false);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDepartment || !form.title.trim()) {
      setError('Title is required');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.put(`/departments/${editDepartment._id}`, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
      });
      setDepartments((prev) => prev.map((d) => d._id === data._id ? data : d));
      setEditDepartment(null);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update department');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (department: Department) => {
    try {
      const { data } = await api.patch(`/departments/${department._id}/toggle-status`);
      setDepartments((prev) => prev.map((d) => d._id === department._id ? data : d));
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      alert('Failed to toggle status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await api.delete(`/departments/${id}`);
      setDepartments((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      console.error('Failed to delete department:', err);
      alert('Failed to delete department');
    }
  };

  const openAddModal = () => {
    setShowModal(true);
    setEditDepartment(null);
    setForm(emptyForm);
    setError('');
  };

  const openEditModal = (department: Department) => {
    setEditDepartment(department);
    setForm({
      title: department.title,
      description: department.description || '',
    });
    setShowModal(false);
    setError('');
  };

  const filteredDepartments = departments.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addBtn = (
    <button onClick={openAddModal}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Department
    </button>
  );

  return (
    <AdminLayout title="Departments" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Departments', value: filteredDepartments.length, color: 'bg-blue-50 text-blue-600', icon: '🏥' },
          { label: 'Active', value: filteredDepartments.filter((d) => d.isActive).length, color: 'bg-green-50 text-green-600', icon: '✅' },
          { label: 'Inactive', value: filteredDepartments.filter((d) => !d.isActive).length, color: 'bg-red-50 text-red-600', icon: '❌' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4 p-4 bg-white rounded-2xl border border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search departments by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing {filteredDepartments.length} of {departments.length} departments
          </p>
          {searchTerm && (
            <p className="text-xs text-blue-600">
              Search applied
            </p>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div
          className="overflow-x-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
          }}
        >
        <table className="w-full text-sm" style={{ minWidth: '550px' }}>
          <thead>
            <tr className="border-b border-gray-100 bg-white sticky top-0 z-10">
              {['Title', 'Description', 'Status', 'Created', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 text-sm">
                {searchTerm ? 'No departments found matching your search' : 'No departments found'}
              </td></tr>
            )}
            {filteredDepartments.map((d) => (
              <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{d.title}</td>
                <td className="px-5 py-3.5 text-gray-500 max-w-xs">
                  <div className="truncate">
                    {d.description || '—'}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                    d.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">
                  {new Date(d.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(d)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => toggleStatus(d)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        d.isActive ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}>
                      {d.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(d._id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Add Department</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                <div>
                  <label className={labelCls}>Title<span className="text-red-400 ml-0.5">*</span></label>
                  <input 
                    placeholder="Department title" 
                    value={form.title} 
                    onChange={set('title')} 
                    required 
                    className={inputCls} 
                  />
                </div>

                <div>
                  <label className={labelCls}>Description <span className="text-gray-400">(optional)</span></label>
                  <textarea 
                    placeholder="Department description..." 
                    value={form.description} 
                    onChange={set('description')} 
                    rows={3}
                    className={`${inputCls} resize-none`} 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading} 
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" 
                    style={{ background: '#2B3EE6' }}>
                    {loading ? 'Creating...' : 'Create Department'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} 
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDepartment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Edit Department</h2>
                <button onClick={() => setEditDepartment(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                <div>
                  <label className={labelCls}>Title<span className="text-red-400 ml-0.5">*</span></label>
                  <input 
                    placeholder="Department title" 
                    value={form.title} 
                    onChange={set('title')} 
                    required 
                    className={inputCls} 
                  />
                </div>

                <div>
                  <label className={labelCls}>Description <span className="text-gray-400">(optional)</span></label>
                  <textarea 
                    placeholder="Department description..." 
                    value={form.description} 
                    onChange={set('description')} 
                    rows={3}
                    className={`${inputCls} resize-none`} 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading} 
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" 
                    style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditDepartment(null)} 
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}