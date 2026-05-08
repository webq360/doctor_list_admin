'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import CenterServiceTab from '@/components/CenterServiceTab';
import api from '@/lib/api';
import { DIVISIONS_BANGLA as DIVISIONS, getDistrictsBangla as getDistricts, getUpazilasBangla as getUpazilas } from '@/lib/bd-locations';

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

  const fetchGallery = () =>
    api.get(`/eye-care-centers/${centerId}/gallery`).then((r) => setImages(r.data)).catch(() => {});

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
      await api.post(`/eye-care-centers/${centerId}/gallery`, {
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
      await api.put(`/eye-care-centers/${centerId}/gallery/${editItem._id}`, {
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
    await api.delete(`/eye-care-centers/${centerId}/gallery/${id}`);
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
      {!showForm && !editItem && (
        <button onClick={() => { setShowForm(true); setUploadError(''); setGalleryForm(emptyGalleryForm); setImageFile(null); setImagePreview(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: '#2B3EE6' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Photo
        </button>
      )}

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">New Gallery Photo</p>
            <button type="button" onClick={() => { setShowForm(false); setUploadError(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
              <input placeholder="e.g. Eye Exam Room, Equipment..." value={galleryForm.title}
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

      {editItem && (
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-blue-50">
            <p className="text-sm font-semibold text-gray-800">Edit Photo</p>
            <button type="button" onClick={() => { setEditItem(null); setEditForm(emptyGalleryForm); setEditImageFile(null); setEditImagePreview(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
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
                  className="flex-1 text-xs py-2 rounded-xl bg-yellow-50 text-yellow-600 hover:bg-yellow-100 font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(img._id)}
                  className="flex-1 text-xs py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── View Modal 2-Tab Component ──
function ViewModalTabs({ centerId }: { centerId: string }) {
  const [tab, setTab] = useState<'services' | 'gallery'>('services');
  const tabs = [
    { key: 'services', label: 'Services' },
    { key: 'gallery', label: 'Gallery' },
  ] as const;

  return (
    <>
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
          <CenterServiceTab centerId={centerId} apiBase="/eye-care-centers" />
        </div>
        <div style={{ display: tab === 'gallery' ? 'block' : 'none' }}>
          <GalleryTab centerId={centerId} />
        </div>
      </div>
    </>
  );
}

const EYE_SERVICES = ['Cataract Surgery', 'LASIK', 'Glaucoma Treatment', 'Retina Care', 'Pediatric Eye Care', 'Contact Lens', 'Eye Exam', 'Cornea Transplant', 'Squint Treatment', 'Dry Eye Treatment'];

const emptyForm = { name: '', contact: '', address: '', division: '', district: '', upazila: '' };

interface EyeCareCenter {
  _id: string;
  name: string;
  contact: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  services: string[];
  isActive: boolean;
}

// ── Add/Edit Modal (defined OUTSIDE page component to prevent remount on keystroke) ──
interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  data: any;
  setData: (v: any) => void;
  isEdit: boolean;
  form: typeof emptyForm;
  setForm: (v: any) => void;
  selectedServices: string[];
  setSelectedServices: (v: any) => void;
  loading: boolean;
  error: string;
}

function EyeCareModal({ title, onClose, onSubmit, data, setData, isEdit, form, setForm, selectedServices, setSelectedServices, loading, error }: ModalProps) {
  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p: any) => {
        const next = { ...p, [k]: e.target.value };
        if (k === 'division') { next.district = ''; next.upazila = ''; }
        if (k === 'district') { next.upazila = ''; }
        return next;
      });

  const toggleService = (s: string) =>
    setSelectedServices((p: string[]) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="min-h-full flex items-start justify-center p-6 py-10">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
            {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Center Name<span className="text-red-400 ml-0.5">*</span></label>
                <input placeholder="Eye Care Center Name" value={isEdit ? data.name : form.name}
                  onChange={(e) => isEdit ? setData((p: any) => ({ ...p, name: e.target.value })) : set('name')(e)}
                  required className={inputCls} /></div>
              <div><label className={labelCls}>Contact<span className="text-red-400 ml-0.5">*</span></label>
                <input placeholder="Phone / Email" value={isEdit ? data.contact : form.contact}
                  onChange={(e) => isEdit ? setData((p: any) => ({ ...p, contact: e.target.value })) : set('contact')(e)}
                  required className={inputCls} /></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Division</label>
                <select value={isEdit ? (data.division || '') : form.division}
                  onChange={(e) => isEdit ? setData((p: any) => ({ ...p, division: e.target.value, district: '', upazila: '' })) : set('division')(e)}
                  className={`${inputCls} text-gray-700`}>
                  <option value="">Select Division</option>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select></div>
              <div><label className={labelCls}>District</label>
                <select value={isEdit ? (data.district || '') : form.district}
                  disabled={isEdit ? !data.division : !form.division}
                  onChange={(e) => isEdit ? setData((p: any) => ({ ...p, district: e.target.value, upazila: '' })) : set('district')(e)}
                  className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                  <option value="">Select District</option>
                  {getDistricts(isEdit ? (data.division || '') : form.division).map((d) => <option key={d} value={d}>{d}</option>)}
                </select></div>
              <div><label className={labelCls}>Upazila</label>
                <select value={isEdit ? (data.upazila || '') : form.upazila}
                  disabled={isEdit ? !data.district : !form.district}
                  onChange={(e) => isEdit ? setData((p: any) => ({ ...p, upazila: e.target.value })) : set('upazila')(e)}
                  className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                  <option value="">Select Upazila</option>
                  {getUpazilas(isEdit ? (data.division || '') : form.division, isEdit ? (data.district || '') : form.district).map((u) => <option key={u} value={u}>{u}</option>)}
                </select></div>
            </div>

            <div><label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
              <textarea placeholder="Full address" value={isEdit ? data.address : form.address}
                onChange={(e) => isEdit ? setData((p: any) => ({ ...p, address: e.target.value })) : set('address')(e)}
                required rows={2} className={`${inputCls} resize-none`} /></div>

            <div>
              <label className={labelCls}>Services Offered</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {EYE_SERVICES.map((s) => {
                  const active = isEdit ? data.services?.includes(s) : selectedServices.includes(s);
                  return (
                    <button key={s} type="button"
                      onClick={() => isEdit
                        ? setData((p: any) => ({ ...p, services: p.services?.includes(s) ? p.services.filter((x: string) => x !== s) : [...(p.services || []), s] }))
                        : toggleService(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${active ? 'text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                      style={active ? { background: '#2B3EE6' } : {}}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                {loading ? 'Saving...' : 'Save Center'}
              </button>
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EyeCareCentersPage() {
  const [centers, setCenters] = useState<EyeCareCenter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCenter, setEditCenter] = useState<any>(null);
  const [viewCenter, setViewCenter] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/eye-care-centers').then((r) => setCenters(r.data)).catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/eye-care-centers', { ...form, services: selectedServices });
      setCenters((p) => [data, ...p]);
      setShowModal(false); setForm(emptyForm); setSelectedServices([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add');
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/eye-care-centers/${editCenter._id}`, editCenter);
      setCenters((p) => p.map((c) => c._id === data._id ? data : c));
      setEditCenter(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Eye Care Center?')) return;
    await api.delete(`/eye-care-centers/${id}`);
    setCenters((p) => p.filter((c) => c._id !== id));
  };

  const toggleActive = async (c: EyeCareCenter) => {
    const { data } = await api.put(`/eye-care-centers/${c._id}`, { isActive: !c.isActive });
    setCenters((p) => p.map((x) => x._id === c._id ? data : x));
  };

  const addBtn = (
    <button onClick={() => { setShowModal(true); setError(''); setForm(emptyForm); setSelectedServices([]); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Eye Care Center
    </button>
  );

  return (
    <AdminLayout title="Eye Care Centers" action={addBtn}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Centers', value: centers.length, color: 'bg-blue-50 text-blue-600', icon: '???' },
          { label: 'Active', value: centers.filter((c) => c.isActive).length, color: 'bg-green-50 text-green-600', icon: '?' },
          { label: 'Inactive', value: centers.filter((c) => !c.isActive).length, color: 'bg-gray-100 text-gray-400', icon: '??' },
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div
          className="overflow-x-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100vh - 260px)',
            overflowY: 'auto',
          }}
        >
        <table className="w-full text-sm" style={{ minWidth: '650px' }}>
          <thead>
            <tr className="border-b border-gray-100 bg-white sticky top-0 z-10">
              {['Name', 'Contact', 'Location', 'Services', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {centers.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300 text-sm">No Eye Care Centers found</td></tr>
            )}
            {centers.map((c) => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.contact}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{[c.division, c.district, c.upazila].filter(Boolean).join(' � ') || c.address}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {c.services.slice(0, 3).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600">{s}</span>
                    ))}
                    {c.services.length > 3 && <span className="px-2 py-0.5 rounded-md text-xs text-gray-400">+{c.services.length - 3}</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${c.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewCenter(c)} title="View"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button onClick={() => setEditCenter({ ...c })} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => toggleActive(c)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${c.isActive ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {c.isActive
                        ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    </button>
                    <button onClick={() => handleDelete(c._id)}
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
      </div>

      {showModal && <EyeCareModal title="Add Eye Care Center" onClose={() => setShowModal(false)} onSubmit={handleAdd} data={form} setData={setForm} isEdit={false} form={form} setForm={setForm} selectedServices={selectedServices} setSelectedServices={setSelectedServices} loading={loading} error={error} />}
      {editCenter && <EyeCareModal title="Edit Eye Care Center" onClose={() => setEditCenter(null)} onSubmit={handleEdit} data={editCenter} setData={setEditCenter} isEdit={true} form={form} setForm={setForm} selectedServices={selectedServices} setSelectedServices={setSelectedServices} loading={loading} error={error} />}

      {/* View Modal */}
      {viewCenter && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">{viewCenter.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{viewCenter.contact}</p>
                </div>
                <button onClick={() => setViewCenter(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <ViewModalTabs centerId={viewCenter._id} />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}




