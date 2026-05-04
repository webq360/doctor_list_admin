'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

const ROLES = [
  { value: 'all', label: 'All Users' },
  { value: 'patient', label: 'Patients Only' },
  { value: 'doctor', label: 'Doctors Only' },
  { value: 'ambulance_user', label: 'Ambulance Users' },
];

interface Notification {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetRole: string;
  sentBy: { name: string; email: string };
  createdAt: string;
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

function NotifForm({
  form, setForm, imagePreview, setImageFile, setImagePreview, loading, error, success, onSubmit, submitLabel,
}: {
  form: { title: string; body: string; targetRole: string };
  setForm: (f: any) => void;
  imagePreview: string;
  setImageFile: (f: File | null) => void;
  setImagePreview: (p: string) => void;
  loading: boolean;
  error: string;
  success: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      {success && <p className="text-xs text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">{success}</p>}

      <div>
        <label className={labelCls}>Title<span className="text-red-400 ml-0.5">*</span></label>
        <input placeholder="Notification title" value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))} required className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Message<span className="text-red-400 ml-0.5">*</span></label>
        <textarea placeholder="Write your message..." value={form.body} onChange={(e) => setForm((p: any) => ({ ...p, body: e.target.value }))} required rows={4} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className={labelCls}>Image (optional)</label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden" style={{ minHeight: 80 }}>
          {imagePreview ? (
            <div className="relative w-full">
              <img src={imagePreview} alt="preview" className="w-full h-32 object-cover" />
              <button type="button" onClick={(e) => { e.preventDefault(); setImageFile(null); setImagePreview(''); }}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-4">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs text-gray-400">Upload image</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
        </label>
      </div>

      <div>
        <label className={labelCls}>Target Audience</label>
        <select value={form.targetRole} onChange={(e) => setForm((p: any) => ({ ...p, targetRole: e.target.value }))} className={`${inputCls} text-gray-700`}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ background: '#2B3EE6' }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        {loading ? 'Sending...' : submitLabel}
      </button>
    </form>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'all' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editNotif, setEditNotif] = useState<Notification | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', targetRole: 'all' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    api.get('/notifications').then((r) => setNotifications(r.data)).catch(() => {});
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/upload/general', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const imageUrl = imageFile ? await uploadImage(imageFile) : undefined;
      const { data } = await api.post('/notifications', { ...form, imageUrl });
      setNotifications((p) => [data, ...p]);
      setForm({ title: '', body: '', targetRole: 'all' });
      setImageFile(null); setImagePreview('');
      setSuccess('Sent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send');
    } finally { setLoading(false); }
  };

  const openEdit = (n: Notification) => {
    setEditNotif(n);
    setEditForm({ title: n.title, body: n.body, targetRole: n.targetRole });
    setEditImageFile(null);
    setEditImagePreview(n.imageUrl || '');
    setEditError(''); setEditSuccess('');
  };

  const handleResend = async (n: Notification) => {
    setLoading(true);
    try {
      const { data } = await api.post('/notifications', { title: n.title, body: n.body, targetRole: n.targetRole, imageUrl: n.imageUrl });
      setNotifications((p) => [data, ...p]);
      setSuccess('Resent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNotif) return;
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      let imageUrl = editImageFile ? await uploadImage(editImageFile) : (editImagePreview || undefined);
      const { data } = await api.put(`/notifications/${editNotif._id}`, { ...editForm, imageUrl });
      setNotifications((p) => p.map((n) => n._id === data._id ? data : n));
      setEditSuccess('Updated successfully!');
      setTimeout(() => { setEditSuccess(''); setEditNotif(null); }, 1500);
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update');
    } finally { setEditLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    await api.delete(`/notifications/${id}`);
    setNotifications((p) => p.filter((n) => n._id !== id));
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      all: 'bg-blue-50 text-blue-600',
      patient: 'bg-green-50 text-green-600',
      doctor: 'bg-purple-50 text-purple-600',
      ambulance_user: 'bg-orange-50 text-orange-600',
    };
    return map[role] || 'bg-gray-100 text-gray-500';
  };

  return (
    <AdminLayout title="Notifications">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Send Notification</h2>
            <NotifForm
              form={form} setForm={setForm}
              imagePreview={imagePreview} setImageFile={setImageFile} setImagePreview={setImagePreview}
              loading={loading} error={error} success={success}
              onSubmit={handleSend} submitLabel="Send Notification"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total Sent</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-2xl font-bold text-blue-600">{notifications.filter((n) => n.targetRole === 'all').length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Broadcast</p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Notification History</h2>
            </div>
            {notifications.length === 0 ? (
              <div className="px-6 py-16 text-center text-gray-300 text-sm">No notifications sent yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {n.imageUrl && <img src={n.imageUrl} alt={n.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-800 truncate">{n.title}</h3>
                            <span className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-medium ${roleBadge(n.targetRole)}`}>
                              {Array.isArray(ROLES) ? ROLES.find((r) => r.value === n.targetRole)?.label || n.targetRole : n.targetRole}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>
                          <p className="text-xs text-gray-300 mt-1.5">
                            {new Date(n.createdAt).toLocaleString()} · by {n.sentBy?.name || 'Admin'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Resend */}
                        <button onClick={() => handleResend(n)} title="Resend"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(n)} title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDelete(n._id)} title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editNotif && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Edit Notification</h2>
                <button onClick={() => setEditNotif(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 py-5">
                <NotifForm
                  form={editForm} setForm={setEditForm}
                  imagePreview={editImagePreview} setImageFile={setEditImageFile} setImagePreview={setEditImagePreview}
                  loading={editLoading} error={editError} success={editSuccess}
                  onSubmit={handleUpdate} submitLabel="Update Notification"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
