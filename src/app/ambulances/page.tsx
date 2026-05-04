'use client';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Ambulance } from '@/types';

const statusStyle: Record<string, string> = {
  available: 'bg-green-50 text-green-600',
  busy: 'bg-red-50 text-red-500',
  inactive: 'bg-gray-100 text-gray-400',
};

const emptyForm = {
  ambulanceName: '', driverName: '', phone: '', email: '',
  vehicleNumber: '', ambulanceType: 'Non-AC', address: '', password: '',
};

function FileInput({ label, name }: { label: string; name: string }) {
  const [fileName, setFileName] = useState('');
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-2.5 cursor-pointer hover:border-blue-400 transition-colors">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className="text-xs text-gray-400 truncate">{fileName || 'Choose file'}</span>
        <input type="file" name={name} className="hidden" accept="image/*,.pdf"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
      </label>
    </div>
  );
}

// Icon components
const IconView = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconDelete = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconToggle = ({ active }: { active: boolean }) => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    {active
      ? <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
  </svg>
);

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewAmbulance, setViewAmbulance] = useState<Ambulance | null>(null);
  const [editAmbulance, setEditAmbulance] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    api.get('/ambulance').then((r) => setAmbulances(r.data)).catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const fd = new FormData(formRef.current!);
      Object.entries(form).forEach(([k, v]) => fd.set(k, v));
      const { data } = await api.post('/ambulance', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAmbulances((prev) => [...prev, data.ambulance]);
      setShowModal(false); setForm(emptyForm);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/ambulance/${editAmbulance._id}`, {
        ambulanceName: editAmbulance.ambulanceName,
        driverName: editAmbulance.driverName,
        phone: editAmbulance.phone,
        vehicleNumber: editAmbulance.vehicleNumber,
        ambulanceType: editAmbulance.ambulanceType,
        address: editAmbulance.address,
        status: editAmbulance.status,
      });
      setAmbulances((prev) => prev.map((a) => a._id === data._id ? data : a));
      setEditAmbulance(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ambulance?')) return;
    try {
      await api.delete(`/ambulance/${id}`);
      setAmbulances((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert('Failed to delete. Please try again.');
    }
  };

  const toggleStatus = async (a: Ambulance) => {
    const newStatus = a.status === 'inactive' ? 'available' : 'inactive';
    try {
      await api.patch(`/ambulance/${a._id}/status`, { status: newStatus });
      setAmbulances((prev) => prev.map((x) => x._id === a._id ? { ...x, status: newStatus as Ambulance['status'] } : x));
    } catch {
      alert('Failed to update status. Please try again.');
    }
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';

  const statCards = [
    { label: 'Total', value: ambulances.length, color: 'bg-blue-50 text-blue-600', icon: '🚑' },
    { label: 'Available', value: ambulances.filter((a) => a.status === 'available').length, color: 'bg-green-50 text-green-600', icon: '✅' },
    { label: 'Busy', value: ambulances.filter((a) => a.status === 'busy').length, color: 'bg-red-50 text-red-500', icon: '🔴' },
    { label: 'Inactive', value: ambulances.filter((a) => a.status === 'inactive').length, color: 'bg-gray-100 text-gray-400', icon: '⏸️' },
  ];

  const addBtn = (
    <button onClick={() => setShowModal(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Ambulance
    </button>
  );

  return (
    <AdminLayout title="Ambulances" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${s.color}`}>
            <span className="text-xl sm:text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div
          className="overflow-x-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100vh - 260px)',
            overflowY: 'auto',
          }}
        >
        <table className="w-full text-sm" style={{ minWidth: '700px' }}>
          <thead>
            <tr className="border-b border-gray-100 bg-white sticky top-0 z-10">
              {['Ambulance', 'Driver', 'Phone', 'Vehicle', 'Type', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ambulances.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-300 text-sm">No ambulances found</td></tr>
            )}
            {ambulances.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-gray-800">{a.ambulanceName}</td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{a.driverName || '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.phone}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.vehicleNumber || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${a.ambulanceType === 'AC' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {a.ambulanceType || '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusStyle[a.status]}`}>{a.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    {/* View */}
                    <button onClick={() => setViewAmbulance(a)} title="View"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <IconView />
                    </button>
                    {/* Edit */}
                    <button onClick={() => setEditAmbulance({ ...a })} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      <IconEdit />
                    </button>
                    {/* Toggle Active/Inactive */}
                    <button onClick={() => toggleStatus(a)} title={a.status === 'inactive' ? 'Activate' : 'Deactivate'}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${a.status === 'inactive' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      <IconToggle active={a.status !== 'inactive'} />
                    </button>
                    {/* Delete */}
                    <button onClick={() => handleDelete(a._id)} title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <IconDelete />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* View Modal */}
      {viewAmbulance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Ambulance Details</h2>
              <button onClick={() => setViewAmbulance(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {(viewAmbulance as any).ambulanceImage && (
                <img src={(viewAmbulance as any).ambulanceImage} alt="ambulance" className="w-full h-36 object-cover rounded-xl mb-2" />
              )}
              <div className="flex items-center gap-3 mb-2">
                {(viewAmbulance as any).driverImage
                  ? <img src={(viewAmbulance as any).driverImage} alt="driver" className="w-12 h-12 rounded-xl object-cover" />
                  : <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 font-bold text-lg">{viewAmbulance.driverName?.[0] || '?'}</div>}
                <div>
                  <p className="font-semibold text-gray-800">{viewAmbulance.ambulanceName}</p>
                  <p className="text-xs text-gray-400">{viewAmbulance.driverName || 'No driver'}</p>
                </div>
              </div>
              {[
                ['Phone', viewAmbulance.phone],
                ['Vehicle', viewAmbulance.vehicleNumber],
                ['Type', viewAmbulance.ambulanceType],
                ['Address', (viewAmbulance as any).address],
                ['Status', viewAmbulance.status],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-700 capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editAmbulance && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-base font-semibold text-gray-800">Edit Ambulance</h2>
                <button onClick={() => setEditAmbulance(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-5">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                {/* Basic Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([['ambulanceName', 'Ambulance Name'], ['driverName', 'Driver Name'], ['phone', 'Phone Number'], ['email', 'Email (optional)'], ['vehicleNumber', 'Vehicle Number']] as [string, string][]).map(([k, label]) => (
                      <div key={k}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                        <input value={editAmbulance[k] || ''} onChange={(e) => setEditAmbulance((p: any) => ({ ...p, [k]: e.target.value }))} placeholder={label} className={inputCls} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Ambulance Type</label>
                      <select value={editAmbulance.ambulanceType || 'Non-AC'} onChange={(e) => setEditAmbulance((p: any) => ({ ...p, ambulanceType: e.target.value }))} className={`${inputCls} text-gray-700`}>
                        <option value="Non-AC">Non-AC</option>
                        <option value="AC">AC</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</p>
                  <select value={editAmbulance.status} onChange={(e) => setEditAmbulance((p: any) => ({ ...p, status: e.target.value }))} className={`${inputCls} text-gray-700`}>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Address</p>
                  <textarea value={editAmbulance.address || ''} onChange={(e) => setEditAmbulance((p: any) => ({ ...p, address: e.target.value }))} rows={2} placeholder="Full address" className={`${inputCls} resize-none`} />
                </div>

                {/* Images */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Images</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[['driverImage', 'Driver Image'], ['ambulanceImage', 'Ambulance Image']].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden" style={{ minHeight: 80 }}>
                          {editAmbulance[key]
                            ? <img src={editAmbulance[key]} alt={label} className="w-full h-24 object-cover" />
                            : <div className="flex flex-col items-center gap-1 py-4">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <span className="text-xs text-gray-400">Upload {label}</span>
                              </div>}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0]; if (!f) return;
                              const fd = new FormData(); fd.append('image', f);
                              try {
                                const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                setEditAmbulance((p: any) => ({ ...p, [key]: data.url }));
                              } catch { setEditAmbulance((p: any) => ({ ...p, [key]: URL.createObjectURL(f) })); }
                            }} />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[['documents.drivingLicence', 'Driving Licence'], ['documents.nid', 'NID'], ['documents.carDocument', 'Car Document']].map(([key, label]) => {
                      const val = key.startsWith('documents.') ? editAmbulance.documents?.[key.split('.')[1]] : editAmbulance[key];
                      const docKey = key.split('.')[1];
                      return (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                          <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:border-blue-400 transition-colors">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="text-xs text-gray-400 truncate">{val ? '✓ Uploaded' : 'Choose file'}</span>
                            <input type="file" accept="image/*,.pdf" className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0]; if (!f) return;
                                const fd = new FormData(); fd.append('image', f);
                                try {
                                  const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                  setEditAmbulance((p: any) => ({ ...p, documents: { ...p.documents, [docKey]: data.url } }));
                                } catch { setEditAmbulance((p: any) => ({ ...p, documents: { ...p.documents, [docKey]: URL.createObjectURL(f) } })); }
                              }} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reset Password</p>
                  <input type="password" placeholder="New password (leave blank to keep current)" minLength={6}
                    onChange={(e) => setEditAmbulance((p: any) => ({ ...p, newPassword: e.target.value }))}
                    className={inputCls} />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditAmbulance(null)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-base font-semibold text-gray-800">Add New Ambulance</h2>
                <button onClick={() => { setShowModal(false); setError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form ref={formRef} onSubmit={handleAdd} className="px-6 py-5 space-y-5">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([['ambulanceName', 'Ambulance Name', true], ['driverName', 'Driver Name', false], ['phone', 'Phone Number', true], ['email', 'Email (optional)', false], ['vehicleNumber', 'Vehicle Number', false]] as [keyof typeof emptyForm, string, boolean][]).map(([key, label, req]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{label}{req && <span className="text-red-400 ml-0.5">*</span>}</label>
                        <input placeholder={label} value={form[key]} onChange={set(key)} required={req} className={inputCls} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Ambulance Type</label>
                      <select value={form.ambulanceType} onChange={set('ambulanceType')} className={`${inputCls} text-gray-700`}>
                        <option value="Non-AC">Non-AC</option>
                        <option value="AC">AC</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Address</p>
                  <textarea placeholder="Full address" value={form.address} onChange={set('address')} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Images</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FileInput label="Driver Image" name="driverImage" />
                    <FileInput label="Ambulance Image" name="ambulanceImage" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FileInput label="Driving Licence" name="drivingLicence" />
                    <FileInput label="NID" name="nid" />
                    <FileInput label="Car Document" name="carDocument" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Password</p>
                  <input type="password" placeholder="Set password (optional)" value={form.password} onChange={set('password')} minLength={6} className={inputCls} />
                  <p className="text-xs text-gray-400 mt-1.5">This will be used to login to the ambulance app</p>
                </div>
                <div className="flex gap-3 pt-1 pb-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Creating...' : 'Create Ambulance'}
                  </button>
                  <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
