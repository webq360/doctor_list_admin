'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Doctor } from '@/types';

/* ─── Types ─────────────────────────────────────────────── */
interface Disease {
  _id: string;
  name: string;
  description: string;
  assignedDoctorIds: string[];
}

/* ─── Page ───────────────────────────────────────────────── */
export default function DoctorsByDiseasePage() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loadingDiseases, setLoadingDiseases] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // UI state
  const [activeDisease, setActiveDisease] = useState<Disease | null>(null);
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [editDisease, setEditDisease] = useState<Disease | null>(null);
  const [diseaseForm, setDiseaseForm] = useState({ name: '', description: '' });
  const [savingDisease, setSavingDisease] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Disease | null>(null);
  const [savingAssign, setSavingAssign] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Disease | null>(null);
  const [deletingId, setDeletingId] = useState('');

  /* ── Load data ── */
  const fetchDiseases = () => {
    setLoadingDiseases(true);
    api.get('/diseases')
      .then((r) => setDiseases(r.data))
      .catch(() => setDiseases([]))
      .finally(() => setLoadingDiseases(false));
  };

  useEffect(() => {
    fetchDiseases();
    setLoadingDoctors(true);
    api.get('/doctors/all')
      .then((r) => setAllDoctors(r.data))
      .catch(() => api.get('/doctors').then((r) => setAllDoctors(r.data)).catch(() => {}))
      .finally(() => setLoadingDoctors(false));
  }, []);

  /* ── Disease CRUD ── */
  const openAdd = () => {
    setEditDisease(null);
    setDiseaseForm({ name: '', description: '' });
    setShowDiseaseModal(true);
  };

  const openEdit = (d: Disease) => {
    setEditDisease(d);
    setDiseaseForm({ name: d.name, description: d.description });
    setShowDiseaseModal(true);
  };

  const saveDisease = async () => {
    const name = diseaseForm.name.trim();
    if (!name) return;
    setSavingDisease(true);
    try {
      if (editDisease) {
        const { data } = await api.put(`/diseases/${editDisease._id}`, { name, description: diseaseForm.description.trim() });
        setDiseases((p) => p.map((d) => d._id === editDisease._id ? data : d));
        if (activeDisease?._id === editDisease._id) setActiveDisease(data);
      } else {
        const { data } = await api.post('/diseases', { name, description: diseaseForm.description.trim() });
        setDiseases((p) => [...p, data]);
      }
      setShowDiseaseModal(false);
    } catch {
      // silent — could add toast here
    } finally {
      setSavingDisease(false);
    }
  };

  const deleteDisease = async (d: Disease) => {
    setDeletingId(d._id);
    try {
      await api.delete(`/diseases/${d._id}`);
      setDiseases((p) => p.filter((x) => x._id !== d._id));
      if (activeDisease?._id === d._id) setActiveDisease(null);
    } catch {
      // silent
    } finally {
      setDeletingId('');
      setDeleteConfirm(null);
    }
  };

  /* ── Assign doctors ── */
  const openAssign = (d: Disease) => {
    setAssignTarget({ ...d, assignedDoctorIds: [...d.assignedDoctorIds] });
    setDoctorSearch('');
    setShowAssignModal(true);
  };

  const toggleAssign = (doctorId: string) => {
    if (!assignTarget) return;
    const ids = assignTarget.assignedDoctorIds.includes(doctorId)
      ? assignTarget.assignedDoctorIds.filter((x) => x !== doctorId)
      : [...assignTarget.assignedDoctorIds, doctorId];
    setAssignTarget({ ...assignTarget, assignedDoctorIds: ids });
  };

  const saveAssign = async () => {
    if (!assignTarget) return;
    setSavingAssign(true);
    try {
      const { data } = await api.put(`/diseases/${assignTarget._id}`, {
        assignedDoctorIds: assignTarget.assignedDoctorIds,
      });
      setDiseases((p) => p.map((d) => d._id === assignTarget._id ? data : d));
      if (activeDisease?._id === assignTarget._id) setActiveDisease(data);
      setShowAssignModal(false);
    } catch {
      // silent
    } finally {
      setSavingAssign(false);
    }
  };

  /* ── Remove single doctor from disease ── */
  const removeDoctor = async (disease: Disease, doctorId: string) => {
    const newIds = disease.assignedDoctorIds.filter((x) => x !== doctorId);
    try {
      const { data } = await api.put(`/diseases/${disease._id}`, { assignedDoctorIds: newIds });
      setDiseases((p) => p.map((d) => d._id === disease._id ? data : d));
      if (activeDisease?._id === disease._id) setActiveDisease(data);
    } catch {
      // silent
    }
  };

  const getDoctorsForDisease = (d: Disease) =>
    allDoctors.filter((doc) => d.assignedDoctorIds.includes(doc._id));

  const filteredForAssign = allDoctors.filter((doc) => {
    const q = doctorSearch.toLowerCase();
    return !q || doc.userId?.name?.toLowerCase().includes(q) ||
      doc.specializations?.join(' ').toLowerCase().includes(q);
  });

  return (
    <AdminLayout
      title="Doctors by Disease"
      action={
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#2B3EE6' }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Disease
        </button>
      }
    >
      <div className="flex gap-6 min-h-[70vh]">
        {/* ── Left: Disease list ── */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {loadingDiseases ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 p-4 animate-pulse bg-white">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : diseases.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              <svg className="mx-auto mb-3 text-gray-300" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              No diseases yet.<br />Click "Add Disease" to start.
            </div>
          ) : diseases.map((d) => {
            const isActive = activeDisease?._id === d._id;
            return (
              <div
                key={d._id}
                onClick={() => setActiveDisease(isActive ? null : d)}
                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                  isActive ? 'border-blue-200 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
                style={isActive ? { background: '#EEF0FF', borderColor: '#2B3EE6' } : {}}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>{d.name}</p>
                    {d.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{d.description}</p>
                    )}
                    <p className="text-xs mt-1.5 font-medium" style={{ color: '#2B3EE6' }}>
                      {d.assignedDoctorIds.length} doctor{d.assignedDoctorIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(d)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(d)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right: Disease detail ── */}
        <div className="flex-1 min-w-0">
          {!activeDisease ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-3">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              Select a disease from the left to view assigned doctors.
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{activeDisease.name}</h2>
                  {activeDisease.description && (
                    <p className="text-sm text-gray-400 mt-0.5">{activeDisease.description}</p>
                  )}
                </div>
                <button
                  onClick={() => openAssign(activeDisease)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: '#2B3EE6' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Assign Doctors
                </button>
              </div>

              {/* Doctors grid */}
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : getDoctorsForDisease(activeDisease).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm gap-2">
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  No doctors assigned yet. Click "Assign Doctors" to add.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getDoctorsForDisease(activeDisease).map((doc) => (
                    <DoctorCard
                      key={doc._id}
                      doctor={doc}
                      onRemove={() => removeDoctor(activeDisease, doc._id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ Disease Modal ══ */}
      {showDiseaseModal && (
        <Modal onClose={() => setShowDiseaseModal(false)} title={editDisease ? 'Edit Disease' : 'Add Disease'}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Disease / Specialization Name *</label>
              <input
                autoFocus
                type="text"
                value={diseaseForm.name}
                onChange={(e) => setDiseaseForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && saveDisease()}
                placeholder="e.g. Cardiology"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
              <textarea
                value={diseaseForm.description}
                onChange={(e) => setDiseaseForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowDiseaseModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={saveDisease}
                disabled={!diseaseForm.name.trim() || savingDisease}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: '#2B3EE6' }}
              >
                {savingDisease ? 'Saving...' : editDisease ? 'Save Changes' : 'Add Disease'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ Assign Doctors Modal ══ */}
      {showAssignModal && assignTarget && (
        <Modal onClose={() => setShowAssignModal(false)} title={`Assign Doctors — ${assignTarget.name}`} wide>
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search doctor..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-400 mb-3">{assignTarget.assignedDoctorIds.length} selected</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loadingDoctors ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredForAssign.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No doctors found.</p>
            ) : filteredForAssign.map((doc) => {
              const checked = assignTarget.assignedDoctorIds.includes(doc._id);
              return (
                <div
                  key={doc._id}
                  onClick={() => toggleAssign(doc._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    checked ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'border-blue-600' : 'border-gray-300'}`} style={checked ? { background: '#2B3EE6' } : {}}>
                    {checked && <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {doc.profileImage
                      ? <img src={doc.profileImage} alt="" className="w-full h-full object-cover" />
                      : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.userId?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400 truncate">{doc.specializations?.slice(0, 2).join(', ') || 'No specialization'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${doc.isApproved ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {doc.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
            <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={saveAssign} disabled={savingAssign} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ background: '#2B3EE6' }}>
              {savingAssign ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ Delete Confirm ══ */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title="Delete Disease">
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to delete <span className="font-semibold text-gray-800">"{deleteConfirm.name}"</span>? This will remove all doctor assignments for this disease.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={() => deleteDisease(deleteConfirm)}
              disabled={deletingId === deleteConfirm._id}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {deletingId === deleteConfirm._id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

/* ─── Doctor Card ────────────────────────────────────────── */
function DoctorCard({ doctor, onRemove }: { doctor: Doctor; onRemove: () => void }) {
  const name = doctor.userId?.name ?? 'Unknown';
  const specs = doctor.specializations ?? [];
  const hospital = (doctor.hospitalId as any)?.name ?? '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
          {doctor.profileImage
            ? <img src={doctor.profileImage} alt={name} className="w-full h-full object-cover" />
            : <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">{hospital || 'No hospital'}</p>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
          title="Remove"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {specs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {specs.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{s}</span>
          ))}
          {specs.length > 3 && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">+{specs.length - 3}</span>}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
        <span>{doctor.experience ?? 0} yrs exp</span>
        <span className="font-medium text-gray-600">৳{doctor.fees ?? 0}</span>
        <span className={`px-2 py-0.5 rounded-full font-medium ${doctor.isApproved ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
          {doctor.isApproved ? 'Approved' : 'Pending'}
        </span>
      </div>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────── */
function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
