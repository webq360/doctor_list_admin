'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Doctor, Hospital } from '@/types';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptyForm = {
  name: '', phone: '', bmdcNumber: '',
  experience: '', fees: '', bio: '',
  hospitalIds: [] as string[],
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
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState({ division: '', district: '', upazila: '', search: '' });
  const [doctorFilter, setDoctorFilter] = useState({ 
    search: '', 
    division: '', 
    district: '', 
    upazila: '', 
    hospital: '', 
    specialization: '', 
    status: '' 
  });

  useEffect(() => {
    api.get('/doctors/all').then((r) => setDoctors(r.data)).catch(() =>
      api.get('/doctors').then((r) => setDoctors(r.data)).catch(() => {}));
    api.get('/hospitals').then((r) => setHospitals(r.data)).catch(() => {});
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const addSpec = () => {
    const v = specInput.trim();
    if (v && !specializations.includes(v)) setSpecializations((p) => [...p, v]);
    setSpecInput('');
  };

  // Filter hospitals based on location and search
  const filteredHospitals = hospitals?.filter(h => {
    if (hospitalFilter.division && h.division !== hospitalFilter.division) return false;
    if (hospitalFilter.district && h.district !== hospitalFilter.district) return false;
    if (hospitalFilter.upazila && h.upazila !== hospitalFilter.upazila) return false;
    if (hospitalFilter.search && !h.name.toLowerCase().includes(hospitalFilter.search.toLowerCase())) return false;
    return true;
  }) || [];

  // Filter doctors based on advanced search
  const filteredDoctors = doctors.filter(d => {
    // Search in doctor name
    if (doctorFilter.search && !d.userId?.name?.toLowerCase().includes(doctorFilter.search.toLowerCase())) return false;
    
    // Filter by location
    if (doctorFilter.division && d.location?.division !== doctorFilter.division) return false;
    if (doctorFilter.district && d.location?.district !== doctorFilter.district) return false;
    if (doctorFilter.upazila && d.location?.upazila !== doctorFilter.upazila) return false;
    
    // Filter by hospital
    if (doctorFilter.hospital) {
      const hasHospital = d.hospitalIds?.some(h => h._id === doctorFilter.hospital) || 
                         d.hospitalId?._id === doctorFilter.hospital;
      if (!hasHospital) return false;
    }
    
    // Filter by specialization
    if (doctorFilter.specialization) {
      const hasSpecialization = d.specializations?.some(s => 
        s.toLowerCase().includes(doctorFilter.specialization.toLowerCase())
      ) || d.specialization?.toLowerCase().includes(doctorFilter.specialization.toLowerCase());
      if (!hasSpecialization) return false;
    }
    
    // Filter by status
    if (doctorFilter.status === 'approved' && !d.isApproved) return false;
    if (doctorFilter.status === 'pending' && d.isApproved) return false;
    if (doctorFilter.status === 'active' && !d.userId?.isActive) return false;
    if (doctorFilter.status === 'banned' && d.userId?.isActive) return false;
    
    return true;
  });

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

      const { data } = await api.post('/doctors/admin/create', {
        name: form.name,
        phone: form.phone,
        bmdcNumber: form.bmdcNumber,
        experience: Number(form.experience) || 0,
        fees: Number(form.fees),
        hospitalIds: form.hospitalIds,
        specializations,
        profileImage: profileImageUrl,
        bio: form.bio,
      });
      setDoctors((prev) => [...prev, data]);
      setShowModal(false);
      setForm(emptyForm); setSpecializations([]); setSpecInput('');
      setProfileImage(null); setProfilePreview('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create doctor');
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Handle profile image upload if changed
      let profileImageUrl = editDoctor.profileImage;
      if (profileImage) {
        try {
          const fd = new FormData(); fd.append('image', profileImage);
          const { data } = await api.post('/upload/doctor', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          profileImageUrl = data.url;
        } catch {}
      }

      const { data } = await api.put(`/doctors/${editDoctor._id}`, {
        bmdcNumber: editDoctor.bmdcNumber,
        specializations: editDoctor.specializations,
        experience: Number(editDoctor.experience) || 0,
        fees: Number(editDoctor.fees),
        bio: editDoctor.bio,
        profileImage: profileImageUrl,
        hospitalIds: editDoctor.hospitalIds || [],
        userName: editDoctor.userId?.name,
        userPhone: editDoctor.userId?.phone,
        newPassword: editDoctor.newPassword || undefined,
      });
      setDoctors((prev) => prev.map((d) => d._id === data._id ? data : d));
      setEditDoctor(null);
      setProfileImage(null); setProfilePreview('');
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
    setProfileImage(null); setProfilePreview('');
    setHospitalFilter({ division: '', district: '', upazila: '', search: '' });
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
          { label: 'Total Doctors', value: filteredDoctors.length, color: 'bg-blue-50 text-blue-600', icon: '👨‍⚕️' },
          { label: 'Approved', value: filteredDoctors.filter((d) => d.isApproved).length, color: 'bg-green-50 text-green-600', icon: '✅' },
          { label: 'Pending', value: filteredDoctors.filter((d) => !d.isApproved).length, color: 'bg-amber-50 text-amber-600', icon: '⏳' },
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

      {/* Advanced Search Bar */}
      <div className="mb-4 p-4 bg-white rounded-2xl border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter Doctors</p>
        
        {/* Search Box */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search doctors by name..."
              value={doctorFilter.search}
              onChange={(e) => setDoctorFilter(p => ({ ...p, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {doctorFilter.search && (
              <button
                onClick={() => setDoctorFilter(p => ({ ...p, search: '' }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Location Filters */}
          <select 
            value={doctorFilter.division} 
            onChange={(e) => setDoctorFilter(p => ({ ...p, division: e.target.value, district: '', upazila: '' }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          >
            <option value="">All Divisions</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select 
            value={doctorFilter.district} 
            onChange={(e) => setDoctorFilter(p => ({ ...p, district: e.target.value, upazila: '' }))}
            disabled={!doctorFilter.division}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 disabled:opacity-40"
          >
            <option value="">All Districts</option>
            {getDistricts(doctorFilter.division).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select 
            value={doctorFilter.upazila} 
            onChange={(e) => setDoctorFilter(p => ({ ...p, upazila: e.target.value }))}
            disabled={!doctorFilter.district}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 disabled:opacity-40"
          >
            <option value="">All Upazilas</option>
            {getUpazilas(doctorFilter.division, doctorFilter.district).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Hospital Filter */}
          <select 
            value={doctorFilter.hospital} 
            onChange={(e) => setDoctorFilter(p => ({ ...p, hospital: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          >
            <option value="">All Hospitals</option>
            {hospitals?.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>

          {/* Specialization Filter */}
          <input
            type="text"
            placeholder="Specialization..."
            value={doctorFilter.specialization}
            onChange={(e) => setDoctorFilter(p => ({ ...p, specialization: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          />

          {/* Status Filter */}
          <select 
            value={doctorFilter.status} 
            onChange={(e) => setDoctorFilter(p => ({ ...p, status: e.target.value }))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>

          {/* Clear Filters Button */}
          <button
            onClick={() => setDoctorFilter({ search: '', division: '', district: '', upazila: '', hospital: '', specialization: '', status: '' })}
            className="text-sm px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p>
          {(doctorFilter.search || doctorFilter.division || doctorFilter.district || doctorFilter.upazila || 
            doctorFilter.hospital || doctorFilter.specialization || doctorFilter.status) && (
            <p className="text-xs text-blue-600">
              Filters applied
            </p>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['', 'Name', 'BMDC', 'Specialization', 'Exp', 'Fees', 'Hospitals', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-300 text-sm">
                {(doctorFilter.search || doctorFilter.division || doctorFilter.hospital || doctorFilter.specialization || doctorFilter.status) 
                  ? 'No doctors found matching your filters' 
                  : 'No doctors found'}
              </td></tr>
            )}
            {filteredDoctors.map((d) => (
              <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  {d.profileImage
                    ? <img src={d.profileImage} alt={d.userId?.name} className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 text-sm font-bold">{d.userId?.name?.[0]}</div>}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{d.userId?.name}</td>
                <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{d.bmdcNumber || '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {(d.specializations?.length ? d.specializations : [d.specialization]).filter(Boolean).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{d.experience} yrs</td>
                <td className="px-5 py-3.5 text-gray-500">৳{d.fees}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {d.hospitalIds?.length ? d.hospitalIds.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-xs">{h.name}</span>
                    )) : (d.hospitalId?.name ? (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-xs">{d.hospitalId.name}</span>
                    ) : '—')}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${d.isApproved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {d.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewDoctor(d)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      View
                    </button>
                    <button onClick={() => setEditDoctor({ ...d, specializations: d.specializations || [] })}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => toggleBan(d)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        d.userId?.isActive ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}>
                      {d.userId?.isActive ? 'Ban' : 'Unban'}
                    </button>
                    {!d.isApproved && (
                      <button onClick={() => approve(d._id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                        Approve
                      </button>
                    )}
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
                    <div><label className={labelCls}>Phone<span className="text-red-400 ml-0.5">*</span></label>
                      <input placeholder="Phone number" value={form.phone} onChange={set('phone')} required className={inputCls} /></div>
                    <div className="col-span-2"><label className={labelCls}>BMDC Number <span className="text-gray-400">(optional)</span></label>
                      <input placeholder="BMDC Registration Number" value={form.bmdcNumber} onChange={set('bmdcNumber')} className={inputCls} /></div>
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
                  </div>
                </div>

                {/* Hospital Selection */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hospital Selection</p>
                  
                  {/* Hospital Filter */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-2">Filter Hospitals</p>
                    
                    {/* Search Box */}
                    <div className="mb-2">
                      <input 
                        type="text"
                        placeholder="Search hospital by name..."
                        value={hospitalFilter.search}
                        onChange={(e) => setHospitalFilter(p => ({ ...p, search: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                      />
                    </div>

                    {/* Location Filters */}
                    <div className="grid grid-cols-3 gap-2">
                      <select 
                        value={hospitalFilter.division} 
                        onChange={(e) => setHospitalFilter(p => ({ ...p, division: e.target.value, district: '', upazila: '' }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                      >
                        <option value="">All Divisions</option>
                        {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={hospitalFilter.district} 
                        onChange={(e) => setHospitalFilter(p => ({ ...p, district: e.target.value, upazila: '' }))}
                        disabled={!hospitalFilter.division}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40"
                      >
                        <option value="">All Districts</option>
                        {getDistricts(hospitalFilter.division).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={hospitalFilter.upazila} 
                        onChange={(e) => setHospitalFilter(p => ({ ...p, upazila: e.target.value }))}
                        disabled={!hospitalFilter.district}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40"
                      >
                        <option value="">All Upazilas</option>
                        {getUpazilas(hospitalFilter.division, hospitalFilter.district).map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        Showing {filteredHospitals.length} of {hospitals?.length || 0} hospitals
                      </p>
                      {(hospitalFilter.search || hospitalFilter.division || hospitalFilter.district || hospitalFilter.upazila) && (
                        <button 
                          type="button"
                          onClick={() => setHospitalFilter({ division: '', district: '', upazila: '', search: '' })}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hospital List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {filteredHospitals.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        {hospitalFilter.division || hospitalFilter.district || hospitalFilter.upazila 
                          ? 'No hospitals found in selected location' 
                          : 'No hospitals available'}
                      </p>
                    ) : (
                      filteredHospitals.map((h) => (
                        <label key={h._id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={form.hospitalIds.includes(h._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm(p => ({ ...p, hospitalIds: [...p.hospitalIds, h._id] }));
                              } else {
                                setForm(p => ({ ...p, hospitalIds: p.hospitalIds.filter(id => id !== h._id) }));
                              }
                            }}
                            className="w-4 h-4 rounded accent-blue-600 mt-0.5" 
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 font-medium">{h.name}</span>
                            <p className="text-xs text-gray-400">{h.address}</p>
                            {(h.division || h.district || h.upazila) && (
                              <p className="text-xs text-gray-400">
                                {[h.division, h.district, h.upazila].filter(Boolean).join(' › ')}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  
                  {/* Selected Hospitals */}
                  {form.hospitalIds.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Selected Hospitals ({form.hospitalIds.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {form.hospitalIds.map(id => {
                          const hospital = hospitals?.find(h => h._id === id);
                          return hospital ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                              {hospital.name}
                              <button 
                                type="button"
                                onClick={() => setForm(p => ({ ...p, hospitalIds: p.hospitalIds.filter(hId => hId !== id) }))}
                                className="hover:text-red-500 ml-1"
                              >×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* About */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About Doctor</p>
                  <textarea placeholder="Short bio about the doctor..." value={form.bio} onChange={set('bio')} rows={3}
                    className={`${inputCls} resize-none`} />
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
              {[['BMDC Number', viewDoctor.bmdcNumber],
                ['Experience', `${viewDoctor.experience} years`], 
                ['Consultation Fee', `৳${viewDoctor.fees}`],
                ['Hospitals', viewDoctor.hospitalIds?.map(h => h.name).join(', ') || viewDoctor.hospitalId?.name],
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
                      {profilePreview || editDoctor.profileImage
                        ? <img src={profilePreview || editDoctor.profileImage} alt="profile" className="w-full h-full object-cover" />
                        : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    </div>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setProfileImage(f); setProfilePreview(URL.createObjectURL(f)); } }} />
                  </label>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Profile Image</p>
                    <p className="text-xs text-gray-400">Click to change doctor photo</p>
                  </div>
                </div>

                {/* Account Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Full Name<span className="text-red-400 ml-0.5">*</span></label>
                      <input value={editDoctor.userId?.name || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, userId: { ...p.userId, name: e.target.value } }))} required className={inputCls} /></div>
                    <div><label className={labelCls}>Phone<span className="text-red-400 ml-0.5">*</span></label>
                      <input value={editDoctor.userId?.phone || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, userId: { ...p.userId, phone: e.target.value } }))} required className={inputCls} /></div>
                    <div className="col-span-2"><label className={labelCls}>BMDC Number <span className="text-gray-400">(optional)</span></label>
                      <input placeholder="BMDC Registration Number" value={editDoctor.bmdcNumber || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, bmdcNumber: e.target.value }))} className={inputCls} /></div>
                    <div className="col-span-2"><label className={labelCls}>New Password <span className="text-gray-400">(optional)</span></label>
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
                    {editDoctor.specializations?.map((s: string) => (
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
                    <div><label className={labelCls}>Consultation Fee (৳)<span className="text-red-400 ml-0.5">*</span></label>
                      <input type="number" value={editDoctor.fees} onChange={(e) => setEditDoctor((p: any) => ({ ...p, fees: e.target.value }))} required min="0" className={inputCls} /></div>
                  </div>
                </div>

                {/* Hospital Selection */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hospital Selection</p>
                  
                  {/* Hospital Filter */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-2">Filter Hospitals</p>
                    
                    {/* Search Box */}
                    <div className="mb-2">
                      <input 
                        type="text"
                        placeholder="Search hospital by name..."
                        value={hospitalFilter.search}
                        onChange={(e) => setHospitalFilter(p => ({ ...p, search: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                      />
                    </div>

                    {/* Location Filters */}
                    <div className="grid grid-cols-3 gap-2">
                      <select 
                        value={hospitalFilter.division} 
                        onChange={(e) => setHospitalFilter(p => ({ ...p, division: e.target.value, district: '', upazila: '' }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                      >
                        <option value="">All Divisions</option>
                        {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={hospitalFilter.district} 
                        onChange={(e) => setHospitalFilter(p => ({ ...p, district: e.target.value, upazila: '' }))}
                        disabled={!hospitalFilter.division}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40"
                      >
                        <option value="">All Districts</option>
                        {getDistricts(hospitalFilter.division).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={hospitalFilter.upazila} 
                        onChange={(e) => setHospitalFilter(p => ({ ...p, upazila: e.target.value }))}
                        disabled={!hospitalFilter.district}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40"
                      >
                        <option value="">All Upazilas</option>
                        {getUpazilas(hospitalFilter.division, hospitalFilter.district).map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        Showing {filteredHospitals.length} of {hospitals?.length || 0} hospitals
                      </p>
                      {(hospitalFilter.search || hospitalFilter.division || hospitalFilter.district || hospitalFilter.upazila) && (
                        <button 
                          type="button"
                          onClick={() => setHospitalFilter({ division: '', district: '', upazila: '', search: '' })}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hospital List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {filteredHospitals.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        {hospitalFilter.division || hospitalFilter.district || hospitalFilter.upazila 
                          ? 'No hospitals found in selected location' 
                          : 'No hospitals available'}
                      </p>
                    ) : (
                      filteredHospitals.map((h) => (
                        <label key={h._id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={(editDoctor.hospitalIds || []).some((hId: any) => (typeof hId === 'string' ? hId : hId._id) === h._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditDoctor((p: any) => ({ ...p, hospitalIds: [...(p.hospitalIds || []), h._id] }));
                              } else {
                                setEditDoctor((p: any) => ({ ...p, hospitalIds: (p.hospitalIds || []).filter((hId: any) => (typeof hId === 'string' ? hId : hId._id) !== h._id) }));
                              }
                            }}
                            className="w-4 h-4 rounded accent-blue-600 mt-0.5" 
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 font-medium">{h.name}</span>
                            <p className="text-xs text-gray-400">{h.address}</p>
                            {(h.division || h.district || h.upazila) && (
                              <p className="text-xs text-gray-400">
                                {[h.division, h.district, h.upazila].filter(Boolean).join(' › ')}
                              </p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  
                  {/* Selected Hospitals */}
                  {(editDoctor.hospitalIds || []).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Selected Hospitals ({(editDoctor.hospitalIds || []).length})</p>
                      <div className="flex flex-wrap gap-1">
                        {(editDoctor.hospitalIds || []).map((hId: any) => {
                          const hospitalId = typeof hId === 'string' ? hId : hId._id;
                          const hospital = hospitals?.find(h => h._id === hospitalId);
                          return hospital ? (
                            <span key={hospitalId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                              {hospital.name}
                              <button 
                                type="button"
                                onClick={() => setEditDoctor((p: any) => ({ ...p, hospitalIds: (p.hospitalIds || []).filter((id: any) => (typeof id === 'string' ? id : id._id) !== hospitalId) }))}
                                className="hover:text-red-500 ml-1"
                              >×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* About */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About Doctor</p>
                  <textarea placeholder="Short bio about the doctor..." value={editDoctor.bio || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, bio: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
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