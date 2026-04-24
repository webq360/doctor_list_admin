'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptyForm = { name: '', contact: '', address: '', division: '', district: '', upazila: '', lat: '', lng: '' };

interface BloodBank {
  _id: string;
  name: string;
  contact: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  availableGroups: string[];
  isActive: boolean;
}

export default function BloodBankPage() {
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editBank, setEditBank] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/blood-banks').then((r) => setBanks(r.data)).catch(() => {});
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => {
        const next = { ...p, [k]: e.target.value };
        if (k === 'division') { next.district = ''; next.upazila = ''; }
        if (k === 'district') { next.upazila = ''; }
        return next;
      });

  const toggleGroup = (g: string) =>
    setSelectedGroups((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/blood-banks', {
        ...form,
        location: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
        availableGroups: selectedGroups,
      });
      setBanks((p) => [data, ...p]);
      setShowModal(false); setForm(emptyForm); setSelectedGroups([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add');
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/blood-banks/${editBank._id}`, editBank);
      setBanks((p) => p.map((b) => b._id === data._id ? data : b));
      setEditBank(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blood bank?')) return;
    await api.delete(`/blood-banks/${id}`);
    setBanks((p) => p.filter((b) => b._id !== id));
  };

  const toggleActive = async (b: BloodBank) => {
    const { data } = await api.put(`/blood-banks/${b._id}`, { isActive: !b.isActive });
    setBanks((p) => p.map((x) => x._id === b._id ? data : x));
  };

  const addBtn = (
    <button onClick={() => { setShowModal(true); setError(''); setForm(emptyForm); setSelectedGroups([]); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Blood Bank
    </button>
  );

  const BloodGroupBadge = ({ group }: { group: string }) => (
    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-600">{group}</span>
  );

  return (
    <AdminLayout title="Blood Bank" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: banks.length, color: 'bg-red-50 text-red-600', icon: '🩸' },
          { label: 'Active', value: banks.filter((b) => b.isActive).length, color: 'bg-green-50 text-green-600', icon: '✅' },
          { label: 'Inactive', value: banks.filter((b) => !b.isActive).length, color: 'bg-gray-100 text-gray-400', icon: '⏸️' },
          { label: 'Blood Groups', value: [...new Set(banks.flatMap((b) => b.availableGroups))].length, color: 'bg-blue-50 text-blue-600', icon: '💉' },
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

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Name', 'Contact', 'Location', 'Blood Groups', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {banks.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 text-sm">No blood banks found</td></tr>
            )}
            {banks.map((b) => (
              <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{b.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{b.contact}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{[b.division, b.district, b.upazila].filter(Boolean).join(' › ') || b.address}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {b.availableGroups.map((g) => <BloodGroupBadge key={g} group={g} />)}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${b.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button onClick={() => setEditBank({ ...b })} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {/* Toggle Active */}
                    <button onClick={() => toggleActive(b)} title={b.isActive ? 'Deactivate' : 'Activate'}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${b.isActive ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {b.isActive
                        ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    </button>
                    {/* Delete */}
                    <button onClick={() => handleDelete(b._id)} title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-base font-semibold text-gray-800">Add Blood Bank</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Blood Bank Name<span className="text-red-400 ml-0.5">*</span></label>
                    <input placeholder="Name" value={form.name} onChange={set('name')} required className={inputCls} /></div>
                  <div><label className={labelCls}>Contact<span className="text-red-400 ml-0.5">*</span></label>
                    <input placeholder="Phone / Email" value={form.contact} onChange={set('contact')} required className={inputCls} /></div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Division</label>
                    <select value={form.division} onChange={set('division')} className={`${inputCls} text-gray-700`}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>District</label>
                    <select value={form.district} onChange={set('district')} disabled={!form.division} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select District</option>
                      {getDistricts(form.division).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Upazila</label>
                    <select value={form.upazila} onChange={set('upazila')} disabled={!form.district} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select Upazila</option>
                      {getUpazilas(form.division, form.district).map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div><label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
                  <textarea placeholder="Full address" value={form.address} onChange={set('address')} required rows={2} className={`${inputCls} resize-none`} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Latitude (optional)</label>
                    <input placeholder="Latitude" value={form.lat} onChange={set('lat')} type="number" step="any" className={inputCls} /></div>
                  <div><label className={labelCls}>Longitude (optional)</label>
                    <input placeholder="Longitude" value={form.lng} onChange={set('lng')} type="number" step="any" className={inputCls} /></div>
                </div>

                <div>
                  <label className={labelCls}>Available Blood Groups</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {BLOOD_GROUPS.map((g) => (
                      <button key={g} type="button" onClick={() => toggleGroup(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${selectedGroups.includes(g) ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Blood Bank'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editBank && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-base font-semibold text-gray-800">Edit Blood Bank</h2>
                <button onClick={() => setEditBank(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Name</label>
                    <input value={editBank.name} onChange={(e) => setEditBank((p: any) => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Contact</label>
                    <input value={editBank.contact} onChange={(e) => setEditBank((p: any) => ({ ...p, contact: e.target.value }))} className={inputCls} /></div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Division</label>
                    <select value={editBank.division || ''} onChange={(e) => setEditBank((p: any) => ({ ...p, division: e.target.value, district: '', upazila: '' }))} className={`${inputCls} text-gray-700`}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>District</label>
                    <select value={editBank.district || ''} disabled={!editBank.division} onChange={(e) => setEditBank((p: any) => ({ ...p, district: e.target.value, upazila: '' }))} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select District</option>
                      {getDistricts(editBank.division || '').map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Upazila</label>
                    <select value={editBank.upazila || ''} disabled={!editBank.district} onChange={(e) => setEditBank((p: any) => ({ ...p, upazila: e.target.value }))} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select Upazila</option>
                      {getUpazilas(editBank.division || '', editBank.district || '').map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div><label className={labelCls}>Address</label>
                  <textarea value={editBank.address} onChange={(e) => setEditBank((p: any) => ({ ...p, address: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                </div>

                <div>
                  <label className={labelCls}>Available Blood Groups</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {BLOOD_GROUPS.map((g) => (
                      <button key={g} type="button"
                        onClick={() => setEditBank((p: any) => ({ ...p, availableGroups: p.availableGroups.includes(g) ? p.availableGroups.filter((x: string) => x !== g) : [...p.availableGroups, g] }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${editBank.availableGroups.includes(g) ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditBank(null)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
