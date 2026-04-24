'use client';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

type BannerCategory = 'home_slider' | 'doctor_list' | 'ambulance';

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
  { key: 'home_slider', label: 'Home Slider', icon: '🏠' },
  { key: 'doctor_list', label: 'Doctor List', icon: '🩺' },
  { key: 'ambulance', label: 'Ambulance', icon: '🚑' },
];

const emptyForm = { title: '', order: '0', division: '', district: '', upazila: '' };

export default function BannersPage() {
  const [activeTab, setActiveTab] = useState<BannerCategory>('home_slider');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanners = () =>
    api.get('/banners/admin').then((r) => setBanners(r.data)).catch(() => {});

  useEffect(() => { fetchBanners(); }, []);

  const filtered = banners.filter((b) => b.category === activeTab);

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => {
      const next = { ...p, [k]: e.target.value };
      if (k === 'division') { next.district = ''; next.upazila = ''; }
      if (k === 'district') { next.upazila = ''; }
      return next;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!imageFile) return setError('Please select an image');
    if (activeTab === 'doctor_list' && !form.division) return setError('Please select a Division');
    setAdding(true);
    try {
      // Upload image first
      const fd = new FormData();
      fd.append('image', imageFile);
      const { data: uploadData } = await api.post('/upload/banner', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.post('/banners', {
        imageUrl: uploadData.url,
        title: form.title,
        order: Number(form.order),
        category: activeTab,
        ...(activeTab === 'doctor_list' && {
          division: form.division,
          district: form.district || undefined,
          upazila: form.upazila || undefined,
        }),
      });
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
      setShowModal(false);
      fetchBanners();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add banner');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/banners/${id}`);
    setBanners((p) => p.filter((b) => b._id !== id));
  };

  const toggleActive = async (b: Banner) => {
    await api.patch(`/banners/${b._id}`, { isActive: !b.isActive });
    setBanners((p) => p.map((x) => (x._id === b._id ? { ...x, isActive: !b.isActive } : x)));
  };

  const districts = getDistricts(form.division);
  const upazilas = getUpazilas(form.division, form.district);

  const addBtn = (
    <button onClick={() => { setShowModal(true); setError(''); setForm(emptyForm); setImageFile(null); setImagePreview(''); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Banner
    </button>
  );

  return (
    <AdminLayout title="Banners" action={addBtn}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.key ? 'text-white' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}
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
            <div key={b._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <img src={b.imageUrl} alt={b.title || 'banner'} className="w-full h-40 object-cover"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x200?text=Invalid+URL'; }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{b.title || 'No title'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Order: {b.order}</p>
                    {b.location?.division && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        📍 {[b.location.division, b.location.district, b.location.upazila].filter(Boolean).join(' › ')}
                      </p>
                    )}
                  </div>
                  <button onClick={() => toggleActive(b)}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium ${b.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <button onClick={() => handleDelete(b._id)}
                  className="w-full text-xs py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                Add {TABS.find((t) => t.key === activeTab)?.label} Banner
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Image<span className="text-red-400 ml-0.5">*</span></label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-400 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-xs text-gray-400">Click to upload image</span>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {/* Title & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title (optional)</label>
                  <input placeholder="Banner title" value={form.title} onChange={set('title')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Order</label>
                  <input type="number" value={form.order} onChange={set('order')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors" />
                </div>
              </div>

              {/* Location — only for doctor_list */}
              {activeTab === 'doctor_list' && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Division<span className="text-red-400 ml-0.5">*</span></label>
                      <select value={form.division} onChange={set('division')} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700">
                        <option value="">Select Division</option>
                        {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {form.division && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">District (optional)</label>
                        <select value={form.district} onChange={set('district')}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700">
                          <option value="">All Districts</option>
                          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    )}
                    {form.district && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Upazila (optional)</label>
                        <select value={form.upazila} onChange={set('upazila')}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700">
                          <option value="">All Upazilas</option>
                          {upazilas.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={adding}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: '#2B3EE6' }}>
                  {adding ? 'Adding...' : 'Add Banner'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
