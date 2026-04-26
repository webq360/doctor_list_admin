'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Doctor, Hospital } from '@/types';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptySchedule = DAYS.map((day) => ({ day, startTime: '', endTime: '', active: false }));

const emptyForm = {
  name: '', email: '', phone: '', password: '',
  experience: '', fees: '', bio: '',
  hospitalId: '', division: '', district: '', upazila: '',
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [editDoctor, setEditDoctor] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState('');
  const [schedule, setSchedule] = useState(emptySchedule);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/doctors/all').then((r) => setDoctors(r.data)).catch(() =>
      api.get('/doctors').then((r) => setDoctors(r.data)).catch(() => {}));
    api.get('/hospitals').then((r) => setHospitals(r.data)).catch(() => {});
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => {
        const next = { ...p, [k]: e.target.value };
        if (k === 'division') { next.district = ''; next.upazila = ''; }
        if (k === 'district') { next.upazila = ''; }
        return next;
      });

  const addSpec = () => {
    const v = specInput.trim();
    if (v && !specializations.includes(v)) setSpecializations((p) => [...p, v]);
    setSpecInput('');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let profileImageUrl;
      if (profileImage) {
        try {
          const fd = new FormData(); fd.append('image', profileImage);
          const { data } = await api.post('/upload/doctor', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          profileImageUrl = data.url;
        } catch {}
      }
      const activeSchedule = schedule.filter((s) => s.active && s.startTime && s.endTime)
        .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }));

      const { data } = await api.post('/doctors/admin/create', {
        ...form,
        experience: Number(form.experience) || 0,
        fees: Number(form.fees),
        hospitalId: form.hospitalId || undefined,
        specializations,
        profileImage: profileImageUrl,
        location: form.division ? { division: form.division, district: form.district || undefined, upazila: form.upazila || undefined } : undefined,
        schedule: activeSchedule,
      });
      setDoctors((prev) => [...prev, data]);
      setShowModal(false);
      setForm(emptyForm); setSpecializations([]); setSpecInput('');
      setSchedule(emptySchedule); setProfileImage(null); setProfilePreview('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create doctor');
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/doctors/${editDoctor._id}`, {
        specializations: editDoctor.specializations,
        experience: Number(editDoctor.experience) || 0,
        fees: Number(editDoctor.fees),
        bio: editDoctor.bio,
        profileImage: editDoctor.profileImage,
        hospitalId: editDoctor.hospitalId?._id || editDoctor.hospitalId || undefined,
        location: editDoctor.location,
        schedule: editDoctor.schedule || [],
        userName: editDoctor.userId?.name,
        userPhone: editDoctor.userId?.phone,
        newPassword: editDoctor.newPassword || undefined,
      });
      setDoctors((prev) => prev.map((d) => d._id === data._id ? data : d));
      setEditDoctor(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const toggleBan = async (d: Doctor) => {
    const isActive = d.userId?.isActive;
    await api.put(`/users/${d.userId?._id}`, { isActive: !isActive });
    setDoctors((prev) => prev.map((x) => x._id === d._id ? { ...x, userId: { ...x.userId, isActive: !isActive } as any } : x));
  };

  const approve = async (id: string) => {
    await api.patch(`/doctors/${id}/approve`);
    setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, isApproved: true } : d));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doctor?')) return;
    await api.delete(`/doctors/${id}`);
    setDoctors((prev) => prev.filter((d) => d._id !== id));
  };

  const openModal = () => {
    setShowModal(true); setError(''); setForm(emptyForm);
    setSpecializations([]); setSpecInput('');
    setSchedule(emptySchedule); setProfileImage(null); setProfilePreview('');
  };

  const addBtn = (
    <button onClick={openModal}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Doctor
    </button>
  );

  return (
    <AdminLayout title="Doctor List" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Doctors', value: doctors.length, color: 'bg-blue-50 text-blue-600', icon: '👨‍⚕️' },
          { label: 'Approved', value: doctors.filter((d) => d.isApproved).length, color: 'bg-green-50 text-green-600', icon: '✅' },
          { label: 'Pending', value: doctors.filter((d) => !d.isApproved).length, color: 'bg-amber-50 text-amber-600', icon: '⏳' },
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
              {['', 'Name', 'Specialization', 'Exp', 'Fees', 'Hospital', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 text-sm">No doctors found</td></tr>
            )}
            {doctors.map((d) => (
              <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  {d.profileImage
                    ? <img src={d.profileImage} alt={d.userId?.name} className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 text-sm font-bold">{d.userId?.name?.[0]}</div>}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{d.userId?.name}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {(d.specializations?.length ? d.specializations : [d.specialization]).filter(Boolean).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{d.experience} yrs</td>
                <td className="px-5 py-3.5 text-gray-500">৳{d.fees}</td>
                <td className="px-5 py-3.5 text-gray-500">{d.hospitalId?.name || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${d.isApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {d.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewDoctor(d)} title="View"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button onClick={() => setEditDoctor({ ...d, specializations: d.specializations || [] })} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {/* Ban/Unban */}
                    <button onClick={() => toggleBan(d)} title={d.userId?.isActive ? 'Ban' : 'Unban'}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        d.userId?.isActive ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}>
                      {d.userId?.isActive
                        ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    </button>
                    {!d.isApproved && (
                      <button onClick={() => approve(d._id)} title="Approve"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    )}
                    <button onClick={() => handleDelete(d._id)} title="Delete"
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
                <h2 className="text-base font-semibold text-gray-800">Add Doctor</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleAdd} className="px-6 py-5 space-y-5">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                {/* Profile Image */}
                <div className="flex items-center gap-5">
                  <label className="cursor-pointer">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors overflow-hidden flex items-center justify-center bg-gray-50">
                      {profilePreview
                        ? <img src={profilePreview} alt="profile" className="w-full h-full object-cover" />
                        : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    </div>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setProfileImage(f); setProfilePreview(URL.createObjectURL(f)); } }} />
                  </label>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Profile Image</p>
                    <p className="text-xs text-gray-400">Click to upload doctor photo</p>
                  </div>
                </div>

                {/* Account Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Full Name<span className="text-red-400 ml-0.5">*</span></label>
                      <input placeholder="Dr. Full Name" value={form.name} onChange={set('name')} required className={inputCls} /></div>
                    <div><label className={labelCls}>Email<span className="text-red-400 ml-0.5">*</span></label>
                      <input type="email" placeholder="doctor@email.com" value={form.email} onChange={set('email')} required className={inputCls} /></div>
                    <div><label className={labelCls}>Phone<span className="text-red-400 ml-0.5">*</span></label>
                      <input placeholder="Phone number" value={form.phone} onChange={set('phone')} required className={inputCls} /></div>
                    <div><label className={labelCls}>Password<span className="text-red-400 ml-0.5">*</span></label>
                      <input type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} className={inputCls} /></div>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Specialization</p>
                  <div className="flex gap-2 mb-2">
                    <input placeholder="e.g. Cardiology" value={specInput} onChange={(e) => setSpecInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } }}
                      className={inputCls} />
                    <button type="button" onClick={addSpec}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white shrink-0" style={{ background: '#2B3EE6' }}>Add</button>
                  </div>
                  {specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((s) => (
                        <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                          {s}
                          <button type="button" onClick={() => setSpecializations((p) => p.filter((x) => x !== s))} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Professional Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Professional Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Experience (years)</label>
                      <input type="number" placeholder="0" value={form.experience} onChange={set('experience')} min="0" className={inputCls} /></div>
                    <div><label className={labelCls}>Consultation Fee (৳)<span className="text-red-400 ml-0.5">*</span></label>
                      <input type="number" placeholder="500" value={form.fees} onChange={set('fees')} required min="0" className={inputCls} /></div>
                    <div className="col-span-2"><label className={labelCls}>Select Hospital</label>
                      <select value={form.hospitalId} onChange={(e) => {
                        const hid = e.target.value;
                        const hospital = hospitals?.find((h) => h._id === hid);
                        setForm((p) => ({
                          ...p,
                          hospitalId: hid,
                          division: (hospital as any)?.division || p.division,
                          district: (hospital as any)?.district || p.district,
                          upazila: (hospital as any)?.upazila || p.upazila,
                        }));
                      }} className={`${inputCls} text-gray-700`}>
                        <option value="">Select Hospital</option>
                        {hospitals?.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</p>
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
                </div>

                {/* About */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About Doctor</p>
                  <textarea placeholder="Short bio about the doctor..." value={form.bio} onChange={set('bio')} rows={3}
                    className={`${inputCls} resize-none`} />
                </div>

                {/* Weekly Schedule */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Schedule</p>
                  <div className="space-y-2">
                    {schedule.map((s, i) => (
                      <div key={s.day} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 w-28 cursor-pointer">
                          <input type="checkbox" checked={s.active}
                            onChange={(e) => setSchedule((p) => p.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))}
                            className="w-4 h-4 rounded accent-blue-600" />
                          <span className="text-sm text-gray-600">{s.day}</span>
                        </label>
                        <input type="time" value={s.startTime} disabled={!s.active}
                          onChange={(e) => setSchedule((p) => p.map((x, j) => j === i ? { ...x, startTime: e.target.value } : x))}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-30 transition-colors" />
                        <span className="text-gray-300 text-xs">to</span>
                        <input type="time" value={s.endTime} disabled={!s.active}
                          onChange={(e) => setSchedule((p) => p.map((x, j) => j === i ? { ...x, endTime: e.target.value } : x))}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-30 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Creating...' : 'Create Doctor'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Doctor Details</h2>
              <button onClick={() => setViewDoctor(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {viewDoctor.profileImage
                  ? <img src={viewDoctor.profileImage} alt="profile" className="w-16 h-16 rounded-2xl object-cover" />
                  : <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400 text-2xl font-bold">{viewDoctor.userId?.name?.[0]}</div>}
                <div>
                  <p className="font-semibold text-gray-800 text-base">{viewDoctor.userId?.name}</p>
                  <p className="text-xs text-gray-400">{viewDoctor.userId?.email}</p>
                  <p className="text-xs text-gray-400">{viewDoctor.userId?.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(viewDoctor.specializations?.length ? viewDoctor.specializations : [viewDoctor.specialization]).filter(Boolean).map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">{s}</span>
                ))}
              </div>
              {[['Experience', `${viewDoctor.experience} years`], ['Consultation Fee', `৳${viewDoctor.fees}`],
                ['Hospital', viewDoctor.hospitalId?.name],
                ['Location', viewDoctor.location ? [viewDoctor.location.division, viewDoctor.location.district, viewDoctor.location.upazila].filter(Boolean).join(' › ') : null],
                ['Bio', viewDoctor.bio],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm text-gray-700">{value as string}</p>
                </div>
              ))}
              {viewDoctor.schedule?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Schedule</p>
                  <div className="space-y-1">
                    {viewDoctor.schedule.map((s) => (
                      <div key={s.day} className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">{s.day}</span>
                        <span className="text-gray-400">{s.startTime} — {s.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-base font-semibold text-gray-800">Edit Doctor</h2>
                <button onClick={() => setEditDoctor(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-5">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                {/* Profile Image */}
                <div className="flex items-center gap-5">
                  <label className="cursor-pointer">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors overflow-hidden flex items-center justify-center bg-gray-50">
                      {editDoctor.profileImage
                        ? <img src={editDoctor.profileImage} alt="profile" className="w-full h-full object-cover" />
                        : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    </div>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const preview = URL.createObjectURL(f);
                        try {
                          const fd = new FormData(); fd.append('image', f);
                          const { data } = await api.post('/upload/doctor', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          setEditDoctor((p: any) => ({ ...p, profileImage: data.url }));
                        } catch { setEditDoctor((p: any) => ({ ...p, profileImage: preview })); }
                      }} />
                  </label>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Profile Image</p>
                    <p className="text-xs text-gray-400">Click to change photo</p>
                  </div>
                </div>

                {/* Account Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Full Name</label>
                      <input value={editDoctor.userId?.name || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, userId: { ...p.userId, name: e.target.value } }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Email</label>
                      <input value={editDoctor.userId?.email || ''} className={`${inputCls} opacity-50`} disabled /></div>
                    <div><label className={labelCls}>Phone</label>
                      <input value={editDoctor.userId?.phone || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, userId: { ...p.userId, phone: e.target.value } }))} className={inputCls} /></div>
                    <div><label className={labelCls}>New Password <span className="text-gray-300">(optional)</span></label>
                      <input type="password" placeholder="Leave blank to keep current" minLength={6}
                        onChange={(e) => setEditDoctor((p: any) => ({ ...p, newPassword: e.target.value }))} className={inputCls} /></div>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Specialization</p>
                  <div className="flex gap-2 mb-2">
                    <input placeholder="Add specialization" id="edit-spec-input"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v && !editDoctor.specializations.includes(v)) { setEditDoctor((p: any) => ({ ...p, specializations: [...p.specializations, v] })); (e.target as HTMLInputElement).value = ''; } } }}
                      className={inputCls} />
                    <button type="button" onClick={() => { const el = document.getElementById('edit-spec-input') as HTMLInputElement; const v = el.value.trim(); if (v && !editDoctor.specializations.includes(v)) { setEditDoctor((p: any) => ({ ...p, specializations: [...p.specializations, v] })); el.value = ''; } }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white shrink-0" style={{ background: '#2B3EE6' }}>Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editDoctor.specializations.map((s: string) => (
                      <span key={s} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                        {s}
                        <button type="button" onClick={() => setEditDoctor((p: any) => ({ ...p, specializations: p.specializations.filter((x: string) => x !== s) }))} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Professional Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Professional Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Experience (years)</label>
                      <input type="number" value={editDoctor.experience} onChange={(e) => setEditDoctor((p: any) => ({ ...p, experience: e.target.value }))} min="0" className={inputCls} /></div>
                    <div><label className={labelCls}>Consultation Fee (৳)</label>
                      <input type="number" value={editDoctor.fees} onChange={(e) => setEditDoctor((p: any) => ({ ...p, fees: e.target.value }))} min="0" className={inputCls} /></div>
                    <div className="col-span-2"><label className={labelCls}>Hospital</label>
                      <select value={editDoctor.hospitalId?._id || editDoctor.hospitalId || ''}
                        onChange={(e) => {
                          const hid = e.target.value;
                          const hospital = hospitals?.find((h) => h._id === hid);
                          setEditDoctor((p: any) => ({ ...p, hospitalId: hid,
                            location: hospital ? { division: (hospital as any).division, district: (hospital as any).district, upazila: (hospital as any).upazila } : p.location
                          }));
                        }}
                        className={`${inputCls} text-gray-700`}>
                        <option value="">Select Hospital</option>
                        {hospitals?.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelCls}>Division</label>
                      <select value={editDoctor.location?.division || ''}
                        onChange={(e) => setEditDoctor((p: any) => ({ ...p, location: { ...p.location, division: e.target.value, district: '', upazila: '' } }))}
                        className={`${inputCls} text-gray-700`}>
                        <option value="">Select Division</option>
                        {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div><label className={labelCls}>District</label>
                      <select value={editDoctor.location?.district || ''} disabled={!editDoctor.location?.division}
                        onChange={(e) => setEditDoctor((p: any) => ({ ...p, location: { ...p.location, district: e.target.value, upazila: '' } }))}
                        className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                        <option value="">Select District</option>
                        {getDistricts(editDoctor.location?.division || '').map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div><label className={labelCls}>Upazila</label>
                      <select value={editDoctor.location?.upazila || ''} disabled={!editDoctor.location?.district}
                        onChange={(e) => setEditDoctor((p: any) => ({ ...p, location: { ...p.location, upazila: e.target.value } }))}
                        className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                        <option value="">Select Upazila</option>
                        {getUpazilas(editDoctor.location?.division || '', editDoctor.location?.district || '').map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About Doctor</p>
                  <textarea value={editDoctor.bio || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, bio: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                </div>

                {/* Schedule */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Schedule</p>
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const existing = editDoctor.schedule?.find((s: any) => s.day === day);
                      const active = !!existing;
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <label className="flex items-center gap-2 w-28 cursor-pointer">
                            <input type="checkbox" checked={active}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDoctor((p: any) => ({ ...p, schedule: [...(p.schedule || []), { day, startTime: '09:00', endTime: '17:00' }] }));
                                } else {
                                  setEditDoctor((p: any) => ({ ...p, schedule: p.schedule.filter((s: any) => s.day !== day) }));
                                }
                              }}
                              className="w-4 h-4 rounded accent-blue-600" />
                            <span className="text-sm text-gray-600">{day}</span>
                          </label>
                          <input type="time" value={existing?.startTime || ''} disabled={!active}
                            onChange={(e) => setEditDoctor((p: any) => ({ ...p, schedule: p.schedule.map((s: any) => s.day === day ? { ...s, startTime: e.target.value } : s) }))}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-30" />
                          <span className="text-gray-300 text-xs">to</span>
                          <input type="time" value={existing?.endTime || ''} disabled={!active}
                            onChange={(e) => setEditDoctor((p: any) => ({ ...p, schedule: p.schedule.map((s: any) => s.day === day ? { ...s, endTime: e.target.value } : s) }))}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-30" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditDoctor(null)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
