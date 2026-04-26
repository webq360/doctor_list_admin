'use client';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

type BannerCategory =
  | 'home_slider'
  | 'doctor_list'
  | 'ambulance'
  | 'hospital'
  | 'blood_bank'
  | 'physiotherapy'
  | 'eye_care'
  | 'dental_clinic'
  | 'drug_rehabilitation'
  | 'hearing_aid';

interface Banner {
  _id: string;
  imageUrl: string;
  title?: string;
  order: number;
  isActive: boolean;
  category: BannerCategory;
  location?: { division?: string; district?: string; upazila?: string };
}

const TABS: { key: BannerCategory; label: string; icon: string }[] = [
  { key: 'home_slider',        label: 'Home Slider',    icon: '🏠' },
  { key: 'doctor_list',        label: 'Doctor List',    icon: '🩺' },
  { key: 'ambulance',          label: 'Ambulance',      icon: '🚑' },
  { key: 'hospital',           label: 'Hospital',       icon: '🏥' },
  { key: 'blood_bank',         label: 'Blood Bank',     icon: '🩸' },
  { key: 'physiotherapy',      label: 'Physiotherapy',  icon: '🦴' },
  { key: 'eye_care',           label: 'Eye Care',       icon: '👁️' },
  { key: 'dental_clinic',      label: 'Dental Clinic',  icon: '🦷' },
  { key: 'drug_rehabilitation',label: 'Drug Rehab',     icon: '💊' },
  { key: 'hearing_aid',        label: 'Hearing Aid',    icon: '👂' },
];

const emptyForm = { title: '', order: '0', division: '', district: '', upazila: '' };
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

/* ── Reusable location fields ── */
function LocationFields({
  division, district, upazila,
  onChange,
}: {
  division: string; district: string; upazila: string;
  onChange: (k: 'division' | 'district' | 'upazila', v: string) => void;
}) {
  const districts = getDistricts(division);
  const upazilas = getUpazilas(division, district);
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Location <span className="normal-case font-normal">(optional — blank = all locations)</span>
      </p>
      <div>
        <label className={labelCls}>Division</label>
        <select value={division} onChange={(e) => onChange('division', e.target.value)} className={`${inputCls} text-gray-700`}>
          <option value="">All Divisions (Global)</option>
          {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {division && (
        <div>
          <label className={labelCls}>District</label>
          <select value={district} onChange={(e) => onChange('district', e.target.value)} className={`${inputCls} text-gray-700`}>
            <option value="">All Districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
      {district && (
        <div>
          <label className={labelCls}>Upazila</label>
          <select value={upazila} onChange={(e) => onChange('upazila', e.target.value)} className={`${inputCls} text-gray-700`}>
            <option value="">All Upazilas</option>
            {upazilas.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export default function BannersPage() {
  const [activeTab, setActiveTab] = useState<BannerCategory>('home_slider');
  const [banners, setBanners] = useState<Banner[]>([]);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const addFileRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const fetchBanners = () =>
    api.get('/banners/admin').then((r) => setBanners(r.data)).catch(() => {});

  useEffect(() => { fetchBanners(); }, []);

  const filtered = banners.filter((b) => b.category === activeTab);

  /* ── Add ── */
  const setAdd = (k: 'division' | 'district' | 'upazila', v: string) =>
    setAddForm((p) => {
      const next = { ...p, [k]: v };
      if (k === 'division') { next.district = ''; next.upazila = ''; }
      if (k === 'district') { next.upazila = ''; }
      return next;
    });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addImageFile) return setAddError('Please select an image');
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append('image', addImageFile);
      const { data: up } = await api.post('/upload/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.post('/banners', {
        imageUrl: up.url,
        title: addForm.title,
        order: Number(addForm.order),
        category: activeTab,
        ...(addForm.division && { division: addForm.division, district: addForm.district || undefined, upazila: addForm.upazila || undefined }),
      });
      setAddForm(emptyForm); setAddImageFile(null); setAddImagePreview('');
      if (addFileRef.current) addFileRef.current.value = '';
      setShowAdd(false);
      fetchBanners();
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Failed to add banner');
    } finally { setAdding(false); }
  };

  /* ── Edit ── */
  const openEdit = (b: Banner) => {
    setEditBanner(b);
    setEditForm({
      title: b.title || '',
      order: String(b.order),
      division: b.location?.division || '',
      district: b.location?.district || '',
      upazila: b.location?.upazila || '',
    });
    setEditImageFile(null);
    setEditImagePreview(b.imageUrl);
    setEditError('');
  };

  const setEdit = (k: 'division' | 'district' | 'upazila', v: string) =>
    setEditForm((p) => {
      const next = { ...p, [k]: v };
      if (k === 'division') { next.district = ''; next.upazila = ''; }
      if (k === 'district') { next.upazila = ''; }
      return next;
    });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBanner) return;
    setEditing(true); setEditError('');
    try {
      let imageUrl = editBanner.imageUrl;
      if (editImageFile) {
        const fd = new FormData();
        fd.append('image', editImageFile);
        const { data: up } = await api.post('/upload/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = up.url;
      }
      const { data } = await api.patch(`/banners/${editBanner._id}`, {
        imageUrl,
        title: editForm.title,
        order: Number(editForm.order),
        location: editForm.division
          ? { division: editForm.division, district: editForm.district || undefined, upazila: editForm.upazila || undefined }
          : undefined,
      });
      setBanners((p) => p.map((x) => x._id === data._id ? data : x));
      setEditBanner(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update');
    } finally { setEditing(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/banners/${deleteTarget._id}`);
    setBanners((p) => p.filter((b) => b._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  /* ── Pause / Resume ── */
  const togglePause = async (b: Banner) => {
    const { data } = await api.patch(`/banners/${b._id}`, { isActive: !b.isActive });
    setBanners((p) => p.map((x) => x._id === b._id ? { ...x, isActive: data.isActive } : x));
  };

  return (
    <AdminLayout
      title="Banners"
      action={
        <button
          onClick={() => { setShowAdd(true); setAddError(''); setAddForm(emptyForm); setAddImageFile(null); setAddImagePreview(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: '#2B3EE6' }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Banner
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.key ? 'text-white' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}
            style={activeTab === t.key ? { background: '#2B3EE6' } : {}}>
            <span>{t.icon}</span>{t.label}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-md ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {banners.filter((b) => b.category === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Banner Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-300 text-sm">
          No banners yet for this category
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div key={b._id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${b.isActive ? 'border-gray-100' : 'border-yellow-200 opacity-70'}`}>
              {/* Image */}
              <div className="relative">
                <img src={b.imageUrl} alt={b.title || 'banner'} className="w-full h-40 object-cover"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x200?text=Image'; }} />
                {/* Paused overlay */}
                {!b.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      Paused
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="mb-3">
                  <p className="font-medium text-gray-800 text-sm truncate">{b.title || 'No title'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Order: {b.order}</p>
                  {b.location?.division && (
                    <p className="text-xs text-blue-500 mt-0.5">
                      📍 {[b.location.division, b.location.district, b.location.upazila].filter(Boolean).join(' › ')}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Edit */}
                  <button
                    onClick={() => openEdit(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>

                  {/* Pause / Resume */}
                  <button
                    onClick={() => togglePause(b)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl font-medium transition-colors ${
                      b.isActive
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {b.isActive ? (
                      <>
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Resume
                      </>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ Add Modal ══ */}
      {showAdd && (
        <Modal title={`Add ${TABS?.find((t) => t.key === activeTab)?.label || 'Banner'} Banner`} onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            {addError && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{addError}</p>}
            <ImageUpload preview={addImagePreview} fileRef={addFileRef}
              onChange={(f, p) => { setAddImageFile(f); setAddImagePreview(p); }} />
            <TitleOrder title={addForm.title} order={addForm.order}
              onTitle={(v) => setAddForm((p) => ({ ...p, title: v }))}
              onOrder={(v) => setAddForm((p) => ({ ...p, order: v }))} />
            <LocationFields division={addForm.division} district={addForm.district} upazila={addForm.upazila} onChange={setAdd} />
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={adding}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: '#2B3EE6' }}>
                {adding ? 'Adding...' : 'Add Banner'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ Edit Modal ══ */}
      {editBanner && (
        <Modal title="Edit Banner" onClose={() => setEditBanner(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{editError}</p>}
            <ImageUpload preview={editImagePreview} fileRef={editFileRef}
              onChange={(f, p) => { setEditImageFile(f); setEditImagePreview(p); }} />
            <TitleOrder title={editForm.title} order={editForm.order}
              onTitle={(v) => setEditForm((p) => ({ ...p, title: v }))}
              onOrder={(v) => setEditForm((p) => ({ ...p, order: v }))} />
            <LocationFields division={editForm.division} district={editForm.district} upazila={editForm.upazila} onChange={setEdit} />
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={editing}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: '#2B3EE6' }}>
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditBanner(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══ Delete Confirm ══ */}
      {deleteTarget && (
        <Modal title="Delete Banner" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to delete <span className="font-semibold text-gray-800">"{deleteTarget.title || 'this banner'}"</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
              Delete
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

/* ── Shared sub-components ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ImageUpload({ preview, fileRef, onChange }: {
  preview: string;
  fileRef: React.RefObject<HTMLInputElement>;
  onChange: (file: File, preview: string) => void;
}) {
  return (
    <div>
      <label className={labelCls}>Image<span className="text-red-400 ml-0.5">*</span></label>
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 transition-colors overflow-hidden">
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
        ) : (
          <>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs text-gray-400">Click to upload image</span>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f, URL.createObjectURL(f)); }} />
      </label>
    </div>
  );
}

function TitleOrder({ title, order, onTitle, onOrder }: {
  title: string; order: string;
  onTitle: (v: string) => void; onOrder: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelCls}>Title (optional)</label>
        <input placeholder="Banner title" value={title} onChange={(e) => onTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Order</label>
        <input type="number" value={order} onChange={(e) => onOrder(e.target.value)} className={inputCls} />
      </div>
    </div>
  );
}
