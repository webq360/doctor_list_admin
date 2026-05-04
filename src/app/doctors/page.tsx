'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DoctorViewModal from '@/components/DoctorViewModal';
import api from '@/lib/api';
import { Doctor, Hospital, Department } from '@/types';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptyForm = {
  name: '', phone: '', bmdcNumber: '',
  specialization: '',
  experience: '', fees: '', bio: '',
  hospitalIds: [] as string[],
  departmentIds: [] as string[],
  locations: [] as Array<{ division: string; district: string; upazila: string }>,
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [editDoctor, setEditDoctor] = useState<any>(null);
  const [editTab, setEditTab] = useState(0); // 0=Details, 1=Diseases, 2=Education/Experience
  const [form, setForm] = useState(emptyForm);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState({ division: '', district: '', upazila: '', search: '' });
  const [doctorFilter, setDoctorFilter] = useState({ 
    search: '', 
    bmdcNumber: '',
    division: '', 
    district: '', 
    upazila: '', 
    hospital: '', 
    specialization: '', 
    status: '' 
  });
  const [addLocationForm, setAddLocationForm] = useState({ division: '', district: '', upazila: '' });
  const [editLocationForm, setEditLocationForm] = useState({ division: '', district: '', upazila: '' });

  useEffect(() => {
    api.get('/doctors/all').then((r) => setDoctors(r.data)).catch(() =>
      api.get('/doctors').then((r) => setDoctors(r.data)).catch(() => {}));
    api.get('/hospitals').then((r) => setHospitals(r.data)).catch(() => {});
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

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
    
    // Search in BMDC number
    if (doctorFilter.bmdcNumber && !d.bmdcNumber?.toLowerCase().includes(doctorFilter.bmdcNumber.toLowerCase())) return false;
    
    // Filter by location - check both legacy location and locations array
    if (doctorFilter.division || doctorFilter.district || doctorFilter.upazila) {
      const hasMatchInLocations = (d as any).locations?.some((loc: any) => {
        if (doctorFilter.division && loc.division !== doctorFilter.division) return false;
        if (doctorFilter.district && loc.district !== doctorFilter.district) return false;
        if (doctorFilter.upazila && loc.upazila !== doctorFilter.upazila) return false;
        return true;
      });
      
      const hasMatchInLegacyLocation = (() => {
        if (doctorFilter.division && d.location?.division !== doctorFilter.division) return false;
        if (doctorFilter.district && d.location?.district !== doctorFilter.district) return false;
        if (doctorFilter.upazila && d.location?.upazila !== doctorFilter.upazila) return false;
        return true;
      })();
      
      if (!hasMatchInLocations && !hasMatchInLegacyLocation) return false;
    }
    
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
        departments: form.departmentIds,
        specializations: form.specialization ? [form.specialization] : [],
        profileImage: profileImageUrl,
        bio: form.bio,
        locations: form.locations,  // Multiple locations array
      });
      setDoctors((prev) => [...prev, data]);
      setShowModal(false);
      setForm(emptyForm);
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
        bmdcNumber: editDoctor.bmdcNumber?.trim() || undefined,
        specializations: editDoctor.specializations,
        departments: editDoctor.departmentIds || [],
        experience: Number(editDoctor.experience) || 0,
        fees: Number(editDoctor.fees),
        bio: editDoctor.bio,
        profileImage: profileImageUrl,
        hospitalIds: editDoctor.hospitalIds || [],
        userName: editDoctor.userId?.name,
        userPhone: editDoctor.userId?.phone,
        newPassword: editDoctor.newPassword || undefined,
        diseasesTitle: editDoctor.diseasesTitle || '',
        diseasesDescription: editDoctor.diseasesDescription || '',
        educationExperience: editDoctor.educationExperience || [],
        locations: editDoctor.locations || [],  // Multiple locations array
      });
      setDoctors((prev) => prev.map((d) => d._id === data._id ? data : d));
      setEditDoctor(null);
      setEditTab(0);
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
    const doctor = doctors.find(d => d._id === id);
    if (!doctor) return;
    
    const newStatus = !doctor.isApproved;
    await api.patch(`/doctors/${id}/approve`, { isApproved: newStatus });
    setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, isApproved: newStatus } : d));
  };

  const togglePopular = async (d: Doctor) => {
    try {
      await api.patch(`/doctors/${d._id}/popular`, { isPopular: !d.isPopular });
      setDoctors((prev) => prev.map((x) => x._id === d._id ? { ...x, isPopular: !d.isPopular } : x));
    } catch (err) {
      console.error('Failed to toggle popular:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doctor?')) return;
    await api.delete(`/doctors/${id}`);
    setDoctors((prev) => prev.filter((d) => d._id !== id));
  };

  const openModal = () => {
    setShowModal(true); setError(''); setForm(emptyForm);
    setProfileImage(null); setProfilePreview('');
    setHospitalFilter({ division: '', district: '', upazila: '', search: '' });
    setAddLocationForm({ division: '', district: '', upazila: '' });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        
        {/* Search Boxes - Name and BMDC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Name Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by doctor name..."
              value={doctorFilter.search}
              onChange={(e) => setDoctorFilter(p => ({ ...p, search: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
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

          {/* BMDC Number Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by BMDC number..."
              value={doctorFilter.bmdcNumber || ''}
              onChange={(e) => setDoctorFilter(p => ({ ...p, bmdcNumber: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors font-mono"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            {doctorFilter.bmdcNumber && (
              <button
                onClick={() => setDoctorFilter(p => ({ ...p, bmdcNumber: '' }))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
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
            placeholder="Specialist..."
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
            onClick={() => setDoctorFilter({ search: '', bmdcNumber: '', division: '', district: '', upazila: '', hospital: '', specialization: '', status: '' })}
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
          {(doctorFilter.search || doctorFilter.bmdcNumber || doctorFilter.division || doctorFilter.district || doctorFilter.upazila || 
            doctorFilter.hospital || doctorFilter.specialization || doctorFilter.status) && (
            <p className="text-xs text-blue-600">
              Filters applied
            </p>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 w-full">
        <div
          className="w-full overflow-x-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
          }}
        >
          <table className="w-full text-sm table-auto" style={{ minWidth: '1000px' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-100">
                {['', 'Name', 'BMDC', 'Specialization', 'Departments', 'Address', 'Hospitals', 'Status', 'Popular', 'Action'].map((h) => (
                  <th key={h} className="px-3 sm:px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
          <tbody>
            {filteredDoctors.length === 0 && (
              <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-300 text-sm">
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
                <td className="px-5 py-3.5 text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {d.departments?.length ? d.departments.map((dept, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-xs">{dept.title}</span>
                    )) : '—'}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  <div className="text-xs">
                    {((d as any).locations && (d as any).locations.length > 0) ? (
                      <div className="space-y-1">
                        {(d as any).locations.map((loc: any, i: number) => (
                          <div key={i} className="flex flex-wrap gap-1">
                            {loc.upazila && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{loc.upazila}</span>}
                            {loc.district && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-xs">{loc.district}</span>}
                            {loc.division && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{loc.division}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (d.location?.division || d.location?.district || d.location?.upazila) ? (
                      <>
                        {d.location?.upazila && <div>{d.location.upazila}</div>}
                        {d.location?.district && <div>{d.location.district}</div>}
                        {d.location?.division && <div className="text-gray-400">{d.location.division}</div>}
                      </>
                    ) : '—'}
                  </div>
                </td>
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
                  <button
                    onClick={() => approve(d._id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      d.isApproved
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                  >
                    {d.isApproved ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Approved
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Pending
                      </>
                    )}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => togglePopular(d)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      d.isPopular
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="14" height="14" fill={d.isPopular ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {d.isPopular ? 'Popular' : 'Not Popular'}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setViewDoctor(d)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      View
                    </button>
                    <button onClick={() => setEditDoctor({ ...d, specializations: d.specializations || [], departmentIds: d.departments?.map((dept: any) => typeof dept === 'string' ? dept : dept._id) || [], locations: (d as any).locations || [] })}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      Edit
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col" style={{ minWidth: '320px', maxHeight: '90vh' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-800">Add Doctor</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleAdd} className="px-4 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1" style={{ minWidth: '280px' }}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Full Name<span className="text-red-400 ml-0.5">*</span></label>
                      <input placeholder="Dr. Full Name" value={form.name} onChange={set('name')} required className={inputCls} /></div>
                    <div><label className={labelCls}>Phone <span className="text-gray-400">(optional)</span></label>
                      <input placeholder="Phone number" value={form.phone} onChange={set('phone')} className={inputCls} /></div>
                    <div className="col-span-1 sm:col-span-2"><label className={labelCls}>BMDC Number <span className="text-gray-400">(optional)</span></label>
                      <input placeholder="BMDC Registration Number" value={form.bmdcNumber} onChange={set('bmdcNumber')} className={inputCls} /></div>
                  </div>
                </div>

                {/* Specialist */}
                <div>
                  <label className={labelCls}>Specialist</label>
                  <input placeholder="e.g. Cardiologist, Neurologist" value={form.specialization} onChange={set('specialization')} className={inputCls} />
                </div>

                {/* About Doctor/Degree */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About Doctor/Degree</p>
                  <textarea placeholder="Short bio about the doctor or degree information..." value={form.bio} onChange={set('bio')} rows={3}
                    className={`${inputCls} resize-none`} />
                </div>

                {/* Professional Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Professional Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Experience (years)</label>
                      <input type="number" placeholder="0" value={form.experience} onChange={set('experience')} min="0" className={inputCls} /></div>
                    <div><label className={labelCls}>Consultation Fee (৳)<span className="text-red-400 ml-0.5">*</span></label>
                      <input type="number" placeholder="500" value={form.fees} onChange={set('fees')} required min="0" className={inputCls} /></div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Locations</p>
                  
                  {/* Location List */}
                  {form.locations.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {form.locations.map((loc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 text-xs text-gray-700">
                            {[loc.division, loc.district, loc.upazila].filter(Boolean).join(' › ')}
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, locations: p.locations.filter((_, idx) => idx !== i) }))}
                            className="text-red-500 hover:text-red-700 text-lg font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Location */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Add Location</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <select 
                          value={addLocationForm.division}
                          onChange={(e) => setAddLocationForm({ division: e.target.value, district: '', upazila: '' })}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                        >
                          <option value="">Select Division</option>
                          {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <select 
                          value={addLocationForm.district}
                          onChange={(e) => setAddLocationForm(p => ({ ...p, district: e.target.value, upazila: '' }))}
                          disabled={!addLocationForm.division}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">Select District</option>
                          {addLocationForm.division && getDistricts(addLocationForm.division).map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <select 
                          value={addLocationForm.upazila}
                          onChange={(e) => setAddLocationForm(p => ({ ...p, upazila: e.target.value }))}
                          disabled={!addLocationForm.district}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Upazila</option>
                          {addLocationForm.district && getUpazilas(addLocationForm.division, addLocationForm.district).map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (addLocationForm.division || addLocationForm.district || addLocationForm.upazila) {
                          setForm(p => ({ 
                            ...p, 
                            locations: [...p.locations, { ...addLocationForm }] 
                          }));
                          setAddLocationForm({ division: '', district: '', upazila: '' });
                        }
                      }}
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" 
                      style={{ background: '#2B3EE6' }}
                    >
                      Add Location
                    </button>
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

                {/* Department Selection */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Department Assignment</p>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {departments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No departments available</p>
                    ) : (
                      departments.map((dept) => (
                        <label key={dept._id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={form.departmentIds.includes(dept._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm(p => ({ ...p, departmentIds: [...p.departmentIds, dept._id] }));
                              } else {
                                setForm(p => ({ ...p, departmentIds: p.departmentIds.filter(id => id !== dept._id) }));
                              }
                            }}
                            className="w-4 h-4 rounded accent-blue-600 mt-0.5" 
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 font-medium">{dept.title}</span>
                            {dept.description && (
                              <p className="text-xs text-gray-400">{dept.description}</p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  
                  {/* Selected Departments */}
                  {form.departmentIds.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Selected Departments ({form.departmentIds.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {form.departmentIds.map(id => {
                          const department = departments?.find(d => d._id === id);
                          return department ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">
                              {department.title}
                              <button 
                                type="button"
                                onClick={() => setForm(p => ({ ...p, departmentIds: p.departmentIds.filter(dId => dId !== id) }))}
                                className="hover:text-red-500 ml-1"
                              >×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
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
      )}

      {/* View Modal */}
      {viewDoctor && (
        <DoctorViewModal 
          doctor={viewDoctor} 
          onClose={() => setViewDoctor(null)} 
          onEdit={(d) => { 
            setViewDoctor(null); 
            setEditDoctor({ 
              ...d, 
              specializations: d.specializations || [], 
              departmentIds: d.departments?.map((dept: any) => typeof dept === 'string' ? dept : dept._id) || [],
              diseasesTitle: (d as any).diseasesTitle || '',
              diseasesDescription: (d as any).diseasesDescription || '',
              educationExperience: (d as any).educationExperience || [],
              locations: (d as any).locations || [],
            }); 
          }} 
        />
      )}
      {/* Edit Modal */}
      {editDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col" style={{ minWidth: '320px', maxHeight: '90vh' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-800">Edit Doctor</h2>
                <button onClick={() => { setEditDoctor(null); setEditTab(0); setEditLocationForm({ division: '', district: '', upazila: '' }); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Tab Bar */}
              <div className="px-6 pt-4 pb-3 flex-shrink-0">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditTab(0)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      editTab === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTab(1)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      editTab === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Diseases
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTab(2)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      editTab === 2 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Education/Experience
                  </button>
                </div>
              </div>

              <form onSubmit={handleEdit} className="px-4 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1" style={{ minWidth: '280px' }}>
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                {/* Details Tab */}
                {editTab === 0 && (
                  <>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Full Name<span className="text-red-400 ml-0.5">*</span></label>
                      <input value={editDoctor.userId?.name || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, userId: { ...p.userId, name: e.target.value } }))} required className={inputCls} /></div>
                    <div><label className={labelCls}>Phone <span className="text-gray-400">(optional)</span></label>
                      <input value={editDoctor.userId?.phone || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, userId: { ...p.userId, phone: e.target.value } }))} className={inputCls} /></div>
                    <div className="col-span-1 sm:col-span-2"><label className={labelCls}>BMDC Number <span className="text-gray-400">(optional)</span></label>
                      <input placeholder="BMDC Registration Number" value={editDoctor.bmdcNumber || ''} onChange={(e) => setEditDoctor((p: any) => ({ ...p, bmdcNumber: e.target.value }))} className={inputCls} /></div>
                  </div>
                </div>

                {/* Specialist */}
                <div>
                  <label className={labelCls}>Specialist</label>
                  <input 
                    placeholder="e.g. Cardiologist, Neurologist" 
                    value={editDoctor.specializations?.[0] || ''} 
                    onChange={(e) => setEditDoctor((p: any) => ({ ...p, specializations: e.target.value ? [e.target.value] : [] }))} 
                    className={inputCls} 
                  />
                </div>

                {/* About Doctor/Degree */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">About Doctor/Degree</p>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('edit-bio') as HTMLTextAreaElement;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = textarea.value.substring(start, end);
                        if (selectedText) {
                          const newText = textarea.value.substring(0, start) + `<b>${selectedText}</b>` + textarea.value.substring(end);
                          setEditDoctor((p: any) => ({ ...p, bio: newText }));
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start, end + 7);
                          }, 0);
                        }
                      }}
                      className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg"
                      title="Select text and click to make it bold"
                    >
                      <b>B</b>
                    </button>
                  </div>
                  <textarea 
                    id="edit-bio"
                    placeholder="Short bio about the doctor or degree information. Select text and click B to make it bold." 
                    value={editDoctor.bio || ''} 
                    onChange={(e) => setEditDoctor((p: any) => ({ ...p, bio: e.target.value }))} 
                    rows={3}
                    className={`${inputCls} resize-none font-mono text-xs`} 
                  />
                  <p className="text-xs text-gray-400 mt-1">Tip: Select text and click the B button to make it bold</p>
                </div>

                {/* Professional Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Professional Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Experience (years)</label>
                      <input type="number" value={editDoctor.experience} onChange={(e) => setEditDoctor((p: any) => ({ ...p, experience: e.target.value }))} min="0" className={inputCls} /></div>
                    <div><label className={labelCls}>Consultation Fee (৳)<span className="text-red-400 ml-0.5">*</span></label>
                      <input type="number" value={editDoctor.fees} onChange={(e) => setEditDoctor((p: any) => ({ ...p, fees: e.target.value }))} required min="0" className={inputCls} /></div>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Locations</p>
                  
                  {/* Location List */}
                  {editDoctor.locations && editDoctor.locations.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {editDoctor.locations.map((loc: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 text-xs text-gray-700">
                            {[loc.division, loc.district, loc.upazila].filter(Boolean).join(' › ')}
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditDoctor((p: any) => ({ 
                              ...p, 
                              locations: p.locations.filter((_: any, idx: number) => idx !== i) 
                            }))}
                            className="text-red-500 hover:text-red-700 text-lg font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Location */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Add Location</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <div>
                        <select 
                          value={editLocationForm.division}
                          onChange={(e) => setEditLocationForm({ division: e.target.value, district: '', upazila: '' })}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                        >
                          <option value="">Select Division</option>
                          {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <select 
                          value={editLocationForm.district}
                          onChange={(e) => setEditLocationForm(p => ({ ...p, district: e.target.value, upazila: '' }))}
                          disabled={!editLocationForm.division}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">Select District</option>
                          {editLocationForm.division && getDistricts(editLocationForm.division).map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <select 
                          value={editLocationForm.upazila}
                          onChange={(e) => setEditLocationForm(p => ({ ...p, upazila: e.target.value }))}
                          disabled={!editLocationForm.district}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Upazila</option>
                          {editLocationForm.district && getUpazilas(editLocationForm.division, editLocationForm.district).map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (editLocationForm.division || editLocationForm.district || editLocationForm.upazila) {
                          setEditDoctor((p: any) => ({ 
                            ...p, 
                            locations: [...(p.locations || []), { ...editLocationForm }] 
                          }));
                          setEditLocationForm({ division: '', district: '', upazila: '' });
                        }
                      }}
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" 
                      style={{ background: '#2B3EE6' }}
                    >
                      Add Location
                    </button>
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

                {/* Department Selection */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Department Assignment</p>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {departments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No departments available</p>
                    ) : (
                      departments.map((dept) => (
                        <label key={dept._id} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                          <input 
                            type="checkbox" 
                            checked={(editDoctor.departmentIds || []).some((dId: any) => (typeof dId === 'string' ? dId : dId._id) === dept._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditDoctor((p: any) => ({ ...p, departmentIds: [...(p.departmentIds || []), dept._id] }));
                              } else {
                                setEditDoctor((p: any) => ({ ...p, departmentIds: (p.departmentIds || []).filter((dId: any) => (typeof dId === 'string' ? dId : dId._id) !== dept._id) }));
                              }
                            }}
                            className="w-4 h-4 rounded accent-blue-600 mt-0.5" 
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 font-medium">{dept.title}</span>
                            {dept.description && (
                              <p className="text-xs text-gray-400">{dept.description}</p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  
                  {/* Selected Departments */}
                  {(editDoctor.departmentIds || []).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Selected Departments ({(editDoctor.departmentIds || []).length})</p>
                      <div className="flex flex-wrap gap-1">
                        {(editDoctor.departmentIds || []).map((dId: any) => {
                          const departmentId = typeof dId === 'string' ? dId : dId._id;
                          const department = departments?.find(d => d._id === departmentId);
                          return department ? (
                            <span key={departmentId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">
                              {department.title}
                              <button 
                                type="button"
                                onClick={() => setEditDoctor((p: any) => ({ ...p, departmentIds: (p.departmentIds || []).filter((id: any) => (typeof id === 'string' ? id : id._id) !== departmentId) }))}
                                className="hover:text-red-500 ml-1"
                              >×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                  </>
                )}

                {/* Diseases Tab */}
                {editTab === 1 && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Diseases Information</p>
                      
                      {/* Title */}
                      <div className="mb-3">
                        <label className={labelCls}>Title</label>
                        <input 
                          type="text"
                          placeholder="e.g., Diseases I Treat"
                          value={editDoctor.diseasesTitle || ''} 
                          onChange={(e) => setEditDoctor((p: any) => ({ ...p, diseasesTitle: e.target.value }))} 
                          className={inputCls} 
                        />
                      </div>

                      {/* Description with Bold Button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={labelCls}>Description</label>
                          <button
                            type="button"
                            onClick={() => {
                              const textarea = document.getElementById('diseases-desc') as HTMLTextAreaElement;
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = textarea.value.substring(start, end);
                              if (selectedText) {
                                const newText = textarea.value.substring(0, start) + `<b>${selectedText}</b>` + textarea.value.substring(end);
                                setEditDoctor((p: any) => ({ ...p, diseasesDescription: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start, end + 7);
                                }, 0);
                              }
                            }}
                            className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg"
                            title="Select text and click to make it bold"
                          >
                            <b>B</b>
                          </button>
                        </div>
                        <textarea 
                          id="diseases-desc"
                          placeholder="Describe the diseases you treat. Select text and click B to make it bold."
                          value={editDoctor.diseasesDescription || ''} 
                          onChange={(e) => setEditDoctor((p: any) => ({ ...p, diseasesDescription: e.target.value }))} 
                          rows={8} 
                          className={`${inputCls} resize-none font-mono text-xs`} 
                        />
                        <p className="text-xs text-gray-400 mt-1">Tip: Select text and click the B button to make it bold</p>
                      </div>

                      {/* Preview */}
                      {editDoctor.diseasesDescription && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
                          <div 
                            className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: editDoctor.diseasesDescription }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Education/Experience Tab */}
                {editTab === 2 && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Education/Experience Information</p>
                      
                      {/* Education/Experience List */}
                      {editDoctor.educationExperience && editDoctor.educationExperience.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {editDoctor.educationExperience.map((edu: any, i: number) => (
                            <div key={i} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-gray-800">{edu.title}</p>
                                  <div 
                                    className="text-xs text-gray-600 mt-1 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: edu.description }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditDoctor((p: any) => ({
                                      ...p,
                                      educationExperience: p.educationExperience.filter((_: any, idx: number) => idx !== i)
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Education/Experience Entry */}
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-medium text-gray-500 mb-3">Add Education/Experience Entry</p>
                        
                        {/* Title */}
                        <div className="mb-3">
                          <label className={labelCls}>Title</label>
                          <input 
                            type="text"
                            id="edu-exp-title"
                            placeholder="e.g., My Education & Experience"
                            className={inputCls} 
                          />
                        </div>

                        {/* Description with Bold Button */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className={labelCls}>Description</label>
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.getElementById('edu-exp-desc') as HTMLTextAreaElement;
                                if (!textarea) return;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const selectedText = textarea.value.substring(start, end);
                                if (selectedText) {
                                  const newText = textarea.value.substring(0, start) + `<b>${selectedText}</b>` + textarea.value.substring(end);
                                  textarea.value = newText;
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(start, end + 7);
                                  }, 0);
                                }
                              }}
                              className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg"
                              title="Select text and click to make it bold"
                            >
                              <b>B</b>
                            </button>
                          </div>
                          <textarea 
                            id="edu-exp-desc"
                            placeholder="Describe education and experience. Select text and click B to make it bold."
                            rows={6} 
                            className={`${inputCls} resize-none font-mono text-xs`} 
                          />
                          <p className="text-xs text-gray-400 mt-1">Tip: Select text and click the B button to make it bold</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const title = (document.getElementById('edu-exp-title') as HTMLInputElement).value.trim();
                            const description = (document.getElementById('edu-exp-desc') as HTMLTextAreaElement).value.trim();
                            
                            if (title && description) {
                              setEditDoctor((p: any) => ({
                                ...p,
                                educationExperience: [...(p.educationExperience || []), { title, description }]
                              }));
                              (document.getElementById('edu-exp-title') as HTMLInputElement).value = '';
                              (document.getElementById('edu-exp-desc') as HTMLTextAreaElement).value = '';
                            }
                          }}
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" 
                          style={{ background: '#2B3EE6' }}
                        >
                          Add Entry
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => { setEditDoctor(null); setEditLocationForm({ division: '', district: '', upazila: '' }); }} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
        </div>
      )}
    </AdminLayout>
  );
}