'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import CenterServiceTab from '@/components/CenterServiceTab';
import api from '@/lib/api';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const emptyForm = { name: '', contact: '', address: '', division: '', district: '', upazila: '', lat: '', lng: '' };
const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

// ── Gallery Tab ──
const emptyGalleryForm = { title: '', description: '' };

function GalleryTab({ centerId }: { centerId: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState(emptyGalleryForm);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchGallery = () => api.get(`/dental-clinics/${centerId}/gallery`).then((r) => setImages(r.data)).catch(() => {});
  useEffect(() => { fetchGallery(); }, [centerId]);

  const uploadImage = async (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url as string;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return setUploadError('Please select an image');
    setUploadError(''); setUploading(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      await api.post(`/dental-clinics/${centerId}/gallery`, {
        imageUrl,
        title: galleryForm.title || undefined,
        description: galleryForm.description || undefined,
      });
      setGalleryForm(emptyGalleryForm); setImageFile(null); setImagePreview('');
      setShowForm(false);
      fetchGallery();
    } catch { setUploadError('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      let imageUrl = editItem.imageUrl;
      if (editImageFile) imageUrl = await uploadImage(editImageFile);
      await api.put(`/dental-clinics/${centerId}/gallery/${editItem._id}`, {
        imageUrl,
        title: editForm.title || undefined,
        description: editForm.description || undefined,
      });
      setEditItem(null); setEditForm(emptyGalleryForm); setEditImageFile(null); setEditImagePreview('');
      fetchGallery();
    } catch { /* silent */ }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    await api.delete(`/dental-clinics/${centerId}/gallery/${id}`);
    fetchGallery();
  };

  const openEdit = (img: any) => {
    setEditItem(img);
    setEditForm({ title: img.title || '', description: img.description || '' });
    setEditImageFile(null); setEditImagePreview('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {!showForm && !editItem && (
        <button onClick={() => { setShowForm(true); setUploadError(''); setGalleryForm(emptyGalleryForm); setImageFile(null); setImagePreview(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: '#2B3EE6' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Photo
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">New Gallery Photo</p>
            <button type="button" onClick={() => { setShowForm(false); setUploadError(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 text-lg">✕</button>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4">
            {uploadError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{uploadError}</p>}
            <div>
              <label className={labelCls}>Photo <span className="text-red-400">*</span></label>
              <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 120 }}>
                {imagePreview ? (
                  <div className="relative w-full">
                    <img src={imagePreview} alt="preview" className="w-full object-cover" style={{ maxHeight: 160 }} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500">Click to upload photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <div>
              <label className={labelCls}>Title (optional)</label>
              <input placeholder="e.g. Dental Chair, Equipment..." value={galleryForm.title}
                onChange={(e) => setGalleryForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <textarea placeholder="Brief description of this photo..." value={galleryForm.description} rows={3}
                onChange={(e) => setGalleryForm((p) => ({ ...p, description: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                style={{ background: '#2B3EE6' }}>
                {uploading ? 'Uploading...' : 'Add Photo'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setUploadError(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editItem && (
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-blue-50">
            <p className="text-sm font-semibold text-gray-800">Edit Photo</p>
            <button type="button" onClick={() => { setEditItem(null); setEditForm(emptyGalleryForm); setEditImageFile(null); setEditImagePreview(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 text-lg">✕</button>
          </div>
          <form onSubmit={handleUpdate} className="p-5 space-y-4">
            <div>
              <label className={labelCls}>Photo</label>
              <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 120 }}>
                {(editImagePreview || editItem.imageUrl) ? (
                  <div className="relative w-full">
                    <img src={editImagePreview || editItem.imageUrl} alt="preview" className="w-full object-cover" style={{ maxHeight: 160 }} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <span className="text-xs font-medium text-gray-500">Click to upload photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditImageFile(f); setEditImagePreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <div>
              <label className={labelCls}>Title (optional)</label>
              <input placeholder="Photo title..." value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <textarea placeholder="Brief description..." value={editForm.description} rows={3}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                style={{ background: '#2B3EE6' }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => { setEditItem(null); setEditForm(emptyGalleryForm); setEditImageFile(null); setEditImagePreview(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length === 0 && !showForm && !editItem ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No gallery photos yet</p>
          <p className="text-xs text-gray-300 mt-1">Click "Add Photo" to upload</p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img) => (
            <div key={img._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative">
                <img src={img.imageUrl} alt={img.title || ''} className="w-full object-cover" style={{ maxHeight: 180 }} />
              </div>
              {(img.title || img.description) && (
                <div className="px-4 py-3 border-t border-gray-50">
                  {img.title && <p className="text-sm font-semibold text-gray-800">{img.title}</p>}
                  {img.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{img.description}</p>}
                </div>
              )}
              <div className="flex gap-2 px-4 py-3 border-t border-gray-50">
                <button onClick={() => openEdit(img)}
                  className="flex-1 text-xs py-2 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 font-medium transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(img._id)}
                  className="flex-1 text-xs py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dentist Tab ──
const emptyDentist = { name: '', specialization: '', bio: '' };

function DentistTab({ centerId }: { centerId: string }) {
  const [dentists, setDentists] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDentist);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const fetch = () => api.get(`/dental-clinics/${centerId}/dentists`).then((r) => setDentists(r.data)).catch(() => {});
  useEffect(() => { fetch(); }, [centerId]);

  const uploadImage = async (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url as string;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.specialization.trim()) return;
    setSaving(true);
    try {
      let imageUrl;
      if (imageFile) imageUrl = await uploadImage(imageFile);
      if (editItem) {
        await api.put(`/dental-clinics/${centerId}/dentists/${editItem._id}`, {
          ...form, imageUrl: imageUrl || editItem.imageUrl,
        });
      } else {
        await api.post(`/dental-clinics/${centerId}/dentists`, {
          ...form, imageUrl,
        });
      }
      setForm(emptyDentist); setImageFile(null); setImagePreview('');
      setShowForm(false); setEditItem(null);
      fetch();
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dentist?')) return;
    await api.delete(`/dental-clinics/${centerId}/dentists/${id}`);
    fetch();
  };

  const openEdit = (t: any) => {
    setEditItem(t);
    setForm({ name: t.name, specialization: t.specialization, bio: t.bio || '' });
    setImageFile(null); setImagePreview('');
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button onClick={() => { setShowForm(true); setForm(emptyDentist); setEditItem(null); setImageFile(null); setImagePreview(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: '#2B3EE6' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Dentist
        </button>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">{editItem ? 'Edit Dentist' : 'New Dentist'}</p>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 text-lg">✕</button>
          </div>
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <label className="cursor-pointer">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors">
                  {(imagePreview || editItem?.imageUrl) ? (
                    <img src={imagePreview || editItem?.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
              </label>
              <div className="flex-1 space-y-3">
                <div>
                  <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                  <input placeholder="Dentist name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Specialization <span className="text-red-400">*</span></label>
                  <input placeholder="e.g. Orthodontist, Endodontist" value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} required className={inputCls} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea placeholder="Brief description..." value={form.bio} rows={3} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                {saving ? 'Saving...' : editItem ? 'Update' : 'Add Dentist'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Dentist List */}
      {dentists.length === 0 && !showForm ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No dentists added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dentists.map((t) => (
            <div key={t._id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-cyan-50 shrink-0">
                {t.imageUrl ? <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-cyan-500 text-xl font-bold">{t.name?.[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                <p className="text-xs text-cyan-600">{t.specialization}</p>
                {t.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.bio}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(t)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(t._id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── View Modal 3-Tab Component ──
function ViewModalTabs({ centerId }: { centerId: string }) {
  const [tab, setTab] = useState<'services' | 'gallery' | 'dentists'>('services');
  const tabs = [
    { key: 'services', label: 'Services' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'dentists', label: 'Dentists' },
  ] as const;

  return (
    <>
      {/* Tab Bar */}
      <div className="flex gap-1 px-6 pt-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              tab === t.key ? 'text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={tab === t.key ? { background: '#2B3EE6' } : {}}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-6 py-4">
        <div style={{ display: tab === 'services' ? 'block' : 'none' }}>
          <CenterServiceTab centerId={centerId} apiBase="/dental-clinics" />
        </div>
        <div style={{ display: tab === 'gallery' ? 'block' : 'none' }}>
          <GalleryTab centerId={centerId} />
        </div>
        <div style={{ display: tab === 'dentists' ? 'block' : 'none' }}>
          <DentistTab centerId={centerId} />
        </div>
      </div>
    </>
  );
}

interface Center { _id: string; name: string; contact: string; address: string; division?: string; district?: string; upazila?: string; logo?: string; coverImage?: string; }

function ImageUpload({ label, preview, onChange }: { label: string; preview: string; onChange: (f: File, p: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden" style={{ minHeight: 80 }}>
        {preview ? <img src={preview} alt={label} className="w-full h-24 object-cover" /> : (
          <div className="flex flex-col items-center gap-1 py-4">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs text-gray-400">Upload {label}</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f, URL.createObjectURL(f)); }} />
      </label>
    </div>
  );
}

// ── FormBody defined OUTSIDE page component to prevent remount on every keystroke ──
interface FormBodyProps {
  isEdit: boolean;
  form: typeof emptyForm;
  editCenter: any;
  logoPreview: string;
  coverPreview: string;
  editLogoPreview: string;
  editCoverPreview: string;
  onFormChange: (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onEditChange: (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onLogoChange: (f: File, p: string) => void;
  onCoverChange: (f: File, p: string) => void;
  onEditLogoChange: (f: File, p: string) => void;
  onEditCoverChange: (f: File, p: string) => void;
}

function FormBody({ isEdit, form, editCenter, logoPreview, coverPreview, editLogoPreview, editCoverPreview, onFormChange, onEditChange, onLogoChange, onCoverChange, onEditLogoChange, onEditCoverChange }: FormBodyProps) {
  const v = isEdit ? editCenter : form;
  const ch = isEdit ? onEditChange : onFormChange;
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <ImageUpload label="Logo" preview={isEdit ? editLogoPreview || editCenter?.logo || '' : logoPreview}
          onChange={isEdit ? onEditLogoChange : onLogoChange} />
        <ImageUpload label="Cover Image" preview={isEdit ? editCoverPreview || editCenter?.coverImage || '' : coverPreview}
          onChange={isEdit ? onEditCoverChange : onCoverChange} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Clinic Name<span className="text-red-400 ml-0.5">*</span></label>
          <input placeholder="Name" value={v.name} onChange={ch('name')} required className={inputCls} /></div>
        <div><label className={labelCls}>Contact<span className="text-red-400 ml-0.5">*</span></label>
          <input placeholder="Phone / Email" value={v.contact} onChange={ch('contact')} required className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={labelCls}>Division</label>
          <select value={v.division || ''} onChange={ch('division')} className={`${inputCls} text-gray-700`}>
            <option value="">Select Division</option>{DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select></div>
        <div><label className={labelCls}>District</label>
          <select value={v.district || ''} disabled={!v.division} onChange={ch('district')} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
            <option value="">Select District</option>{getDistricts(v.division || '').map((d) => <option key={d} value={d}>{d}</option>)}
          </select></div>
        <div><label className={labelCls}>Upazila</label>
          <select value={v.upazila || ''} disabled={!v.district} onChange={ch('upazila')} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
            <option value="">Select Upazila</option>{getUpazilas(v.division || '', v.district || '').map((u) => <option key={u} value={u}>{u}</option>)}
          </select></div>
      </div>
      <div><label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
        <textarea placeholder="Full address" value={v.address} onChange={ch('address')} required rows={2} className={`${inputCls} resize-none`} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Latitude (optional)</label>
          <input placeholder="Latitude" value={v.lat || ''} onChange={ch('lat')} type="number" step="any" className={inputCls} /></div>
        <div><label className={labelCls}>Longitude (optional)</label>
          <input placeholder="Longitude" value={v.lng || ''} onChange={ch('lng')} type="number" step="any" className={inputCls} /></div>
      </div>
    </>
  );
}

export default function DentalClinicsPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCenter, setEditCenter] = useState<any>(null);
  const [viewCenter, setViewCenter] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState('');

  useEffect(() => { api.get('/dental-clinics').then((r) => setCenters(r.data)).catch(() => {}); }, []);

  const handleFormChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => { const n = { ...p, [k]: e.target.value }; if (k === 'division') { n.district = ''; n.upazila = ''; } if (k === 'district') n.upazila = ''; return n; });

  const handleEditChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setEditCenter((p: any) => { const n = { ...p, [k]: e.target.value }; if (k === 'division') { n.district = ''; n.upazila = ''; } if (k === 'district') n.upazila = ''; return n; });

  const uploadFile = async (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url as string;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      let logo, coverImage;
      if (logoFile) logo = await uploadFile(logoFile);
      if (coverFile) coverImage = await uploadFile(coverFile);
      const { data } = await api.post('/dental-clinics', {
        name: form.name, contact: form.contact, address: form.address,
        division: form.division || undefined, district: form.district || undefined, upazila: form.upazila || undefined,
        location: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
        logo, coverImage,
      });
      setCenters((p) => [data, ...p]);
      setShowModal(false); setForm(emptyForm); setLogoFile(null); setLogoPreview(''); setCoverFile(null); setCoverPreview('');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      let logo = editCenter.logo, coverImage = editCenter.coverImage;
      if (editLogoFile) logo = await uploadFile(editLogoFile);
      if (editCoverFile) coverImage = await uploadFile(editCoverFile);
      const { data } = await api.put(`/dental-clinics/${editCenter._id}`, { ...editCenter, logo, coverImage });
      setCenters((p) => p.map((c) => c._id === data._id ? data : c));
      setEditCenter(null); setEditLogoFile(null); setEditLogoPreview(''); setEditCoverFile(null); setEditCoverPreview('');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this center?')) return;
    await api.delete(`/dental-clinics/${id}`);
    setCenters((p) => p.filter((c) => c._id !== id));
  };

  const addBtn = (
    <button onClick={() => { setShowModal(true); setError(''); setForm(emptyForm); setLogoFile(null); setLogoPreview(''); setCoverFile(null); setCoverPreview(''); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Add Dental Clinic
    </button>
  );

  const iconBtn = 'w-8 h-8 flex items-center justify-center rounded-lg transition-colors';

  return (
    <AdminLayout title="Dental Clinics" action={addBtn}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[{ label: 'Total Clinics', value: centers.length, color: 'bg-cyan-50 text-cyan-600', icon: '🦷' },
          { label: 'With Logo', value: centers.filter((c) => c.logo).length, color: 'bg-blue-50 text-blue-600', icon: '🖼️' },
          { label: 'With Cover', value: centers.filter((c) => c.coverImage).length, color: 'bg-purple-50 text-purple-600', icon: '📸' }]
          .map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 flex items-center gap-4 ${s.color}`}>
              <span className="text-2xl">{s.icon}</span>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p></div>
            </div>
          ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-sm" style={{ minWidth: '550px' }}>
          <thead><tr className="border-b border-gray-100">
            {['', 'Name', 'Contact', 'Location', 'Action'].map((h) => (
              <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {centers.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 text-sm">No dental clinics found</td></tr>}
            {centers.map((c) => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  {c.logo ? <img src={c.logo} alt={c.name} className="w-9 h-9 rounded-lg object-cover" />
                    : <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500 text-sm font-bold">{c.name?.[0]}</div>}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.contact}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{[c.division, c.district, c.upazila].filter(Boolean).join(' › ') || c.address}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewCenter(c)} className={`${iconBtn} bg-blue-50 text-blue-600 hover:bg-blue-100`}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button onClick={() => { setEditCenter({ ...c }); setEditLogoFile(null); setEditLogoPreview(''); setEditCoverFile(null); setEditCoverPreview(''); }} className={`${iconBtn} bg-yellow-50 text-yellow-600 hover:bg-yellow-100`}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(c._id)} className={`${iconBtn} bg-red-50 text-red-500 hover:bg-red-100`}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewCenter && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {viewCenter.logo ? <img src={viewCenter.logo} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
                    : <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-500 font-bold">{viewCenter.name?.[0]}</div>}
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">{viewCenter.name}</h2>
                    <p className="text-xs text-gray-400">{[viewCenter.division, viewCenter.district, viewCenter.upazila].filter(Boolean).join(' › ')}</p>
                  </div>
                </div>
                <button onClick={() => setViewCenter(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* 3 Tabs */}
              <ViewModalTabs centerId={String(viewCenter._id)} />
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
                <h2 className="text-base font-semibold text-gray-800">Add Dental Clinic</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                <FormBody isEdit={false} form={form} editCenter={editCenter} logoPreview={logoPreview} coverPreview={coverPreview} editLogoPreview={editLogoPreview} editCoverPreview={editCoverPreview} onFormChange={handleFormChange} onEditChange={handleEditChange} onLogoChange={(f, p) => { setLogoFile(f); setLogoPreview(p); }} onCoverChange={(f, p) => { setCoverFile(f); setCoverPreview(p); }} onEditLogoChange={(f, p) => { setEditLogoFile(f); setEditLogoPreview(p); }} onEditCoverChange={(f, p) => { setEditCoverFile(f); setEditCoverPreview(p); }} />
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>{loading ? 'Saving...' : 'Save Clinic'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editCenter && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-base font-semibold text-gray-800">Edit Dental Clinic</h2>
                <button onClick={() => setEditCenter(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                <FormBody isEdit={true} form={form} editCenter={editCenter} logoPreview={logoPreview} coverPreview={coverPreview} editLogoPreview={editLogoPreview} editCoverPreview={editCoverPreview} onFormChange={handleFormChange} onEditChange={handleEditChange} onLogoChange={(f, p) => { setLogoFile(f); setLogoPreview(p); }} onCoverChange={(f, p) => { setCoverFile(f); setCoverPreview(p); }} onEditLogoChange={(f, p) => { setEditLogoFile(f); setEditLogoPreview(p); }} onEditCoverChange={(f, p) => { setEditCoverFile(f); setEditCoverPreview(p); }} />
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditCenter(null)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
