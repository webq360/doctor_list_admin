'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { User } from '@/types';

export default function AmbulanceUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [viewUser, setViewUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');

  useEffect(() => {
    api.get('/hospital-ambulance-users').then((r) => {
      console.log('Hospital Ambulance Users Data:', r.data);
      setUsers(r.data);
    }).catch(() => {});
  }, []);

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url as string;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let profileImage;
      if (imageFile) profileImage = await uploadImage(imageFile);
      
      // Create hospital ambulance user
      const { data } = await api.post('/hospital-ambulance-users', { 
        name: form.name,
        phone: form.phone,
        email: `${form.phone}@ambulance.local`,
        profileImage 
      });
      
      console.log('Hospital Ambulance User created:', data);
      
      // Create ambulance record for this user
      const hospitalAmbulanceUserId = data._id;
      const vehicleNumber = `AMB-${form.phone}-${Date.now()}`;
      
      console.log('Creating ambulance with:', { hospitalAmbulanceUserId, vehicleNumber });
      
      try {
        const ambulanceRes = await api.post('/ambulance/hospital', {
          ambulanceName: form.name,
          driverName: form.name,
          phone: form.phone,
          email: `${form.phone}@ambulance.local`,
          vehicleNumber: vehicleNumber,
          ambulanceType: 'Non-AC',
          address: '',
          type: 'hospital',
          hospitalAmbulanceUserId: hospitalAmbulanceUserId,
        });
        console.log('Ambulance created:', ambulanceRes.data);
      } catch (ambulanceErr: any) {
        console.error('Ambulance creation error:', ambulanceErr.response?.data || ambulanceErr.message);
        setError(`User created but ambulance creation failed: ${ambulanceErr.response?.data?.message || ambulanceErr.message}`);
      }
      
      setUsers((prev) => [{ ...data, _id: data._id }, ...prev]);
      setShowModal(false);
      setForm({ name: '', phone: '' });
      setImageFile(null);
      setImagePreview('');
    } catch (err: any) {
      console.error('User creation error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let profileImage = editUser.profileImage;
      if (editImageFile) profileImage = await uploadImage(editImageFile);
      const { data } = await api.put(`/users/${editUser._id}`, { 
        name: editUser.name, 
        phone: editUser.phone,
        profileImage 
      });
      setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      setEditUser(null);
      setEditImageFile(null);
      setEditImagePreview('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert('Failed to delete user');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/users/${id}`, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !isActive } : u)));
    } catch {
      alert('Failed to update user status');
    }
  };

  const addBtn = (
    <button onClick={() => { setShowModal(true); setError(''); setForm({ name: '', phone: '' }); setImageFile(null); setImagePreview(''); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Hospital Ambulance User
    </button>
  );

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <AdminLayout title="Hospital Ambulance User" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'bg-blue-50 text-blue-600', icon: '👥' },
          { label: 'Approved', value: users.filter((u) => u.isActive).length, color: 'bg-green-50 text-green-600', icon: '✓' },
          { label: 'Pending', value: users.filter((u) => !u.isActive).length, color: 'bg-yellow-50 text-yellow-600', icon: '⏳' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 flex items-center gap-4 ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div
          className="overflow-x-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100vh - 260px)',
            overflowY: 'auto',
          }}
        >
        <table className="w-full text-sm" style={{ minWidth: '600px' }}>
          <thead>
            <tr className="border-b border-gray-100 bg-white sticky top-0 z-10">
              {['Full Name', 'Mobile Number', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-300 text-sm">No hospital ambulance users found</td></tr>
            )}
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-700">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{u.phone}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggleActive(u._id, u.isActive)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      u.isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                    }`}>
                    {u.isActive ? '✓ Approved' : '⏳ Pending'}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewUser(u)} title="View Details"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button onClick={() => { setEditUser({ ...u }); setError(''); setEditImageFile(null); setEditImagePreview(''); }} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(u._id)} title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Add Hospital Ambulance User</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                
                {/* Profile Image Upload */}
                <div>
                  <label className={labelCls}>Profile Image (optional)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 120 }}>
                    {imagePreview ? (
                      <div className="relative w-full">
                        <img src={imagePreview} alt="preview" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">Click to upload profile image</span>
                        <span className="text-xs text-gray-400">Optional</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setImageFile(f);
                          setImagePreview(URL.createObjectURL(f));
                        }
                      }} />
                  </label>
                </div>

                <div>
                  <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                  <input placeholder="Enter full name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mobile Number <span className="text-red-400">*</span></label>
                  <input placeholder="Enter mobile number" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required className={inputCls} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
                    style={{ background: '#2B3EE6' }}>
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Edit Hospital Ambulance User</h2>
                <button onClick={() => setEditUser(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                
                {/* Profile Image Upload */}
                <div>
                  <label className={labelCls}>Profile Image (optional)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 120 }}>
                    {(editImagePreview || editUser.profileImage) ? (
                      <div className="relative w-full">
                        <img src={editImagePreview || editUser.profileImage} alt="preview" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500">Click to upload profile image</span>
                        <span className="text-xs text-gray-400">Optional</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setEditImageFile(f);
                          setEditImagePreview(URL.createObjectURL(f));
                        }
                      }} />
                  </label>
                </div>

                <div>
                  <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                  <input placeholder="Enter full name" value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mobile Number <span className="text-red-400">*</span></label>
                  <input placeholder="Enter mobile number" value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    required className={inputCls} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
                    style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditUser(null)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">User Details</h2>
                <button onClick={() => setViewUser(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-5">
                {/* Profile Image */}
                <div className="flex justify-center">
                  {viewUser.profileImage ? (
                    <img src={viewUser.profileImage} alt={viewUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-blue-50" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-3xl border-4 border-blue-100">
                      {viewUser.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                    <p className="text-sm font-semibold text-gray-800">{viewUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Mobile Number</label>
                    <p className="text-sm font-semibold text-gray-800">{viewUser.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-sm font-medium text-gray-600">{viewUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      viewUser.isActive ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {viewUser.isActive ? '✓ Approved' : '⏳ Pending'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                    <p className="text-sm font-medium text-gray-600 capitalize">{viewUser.role?.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setViewUser(null); setEditUser({ ...viewUser }); setError(''); setEditImageFile(null); setEditImagePreview(''); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
                    style={{ background: '#2B3EE6' }}>
                    Edit User
                  </button>
                  <button onClick={() => setViewUser(null)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
