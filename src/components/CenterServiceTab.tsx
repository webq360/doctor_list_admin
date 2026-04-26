'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptyServiceForm = { name: '', about: '' };
const emptyEditForm = { id: '', name: '', about: '' };

interface Props {
  centerId: string;
  apiBase: string; // e.g. '/physiotherapy-centers'
}

export default function CenterServiceTab({ centerId, apiBase }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [ourServicesText, setOurServicesText] = useState('');
  const [ourServicesSaving, setOurServicesSaving] = useState(false);
  const [ourServicesSaved, setOurServicesSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [svcForm, setSvcForm] = useState(emptyServiceForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [svcSaving, setSvcSaving] = useState(false);
  const [svcError, setSvcError] = useState('');
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchServices = () =>
    api.get(`${apiBase}/${centerId}/services`).then((r) => {
      setItems(r.data);
    }).catch(() => setItems([]));

  // Load ourServices text from the center itself
  const fetchCenter = () =>
    api.get(`${apiBase}/${centerId}`).then((r) => {
      if (r.data?.ourServices) setOurServicesText(r.data.ourServices);
    }).catch(() => {});

  useEffect(() => {
    fetchServices();
    fetchCenter();
  }, [centerId]);

  const handleSaveOurServices = async () => {
    if (!ourServicesText.trim()) return;
    setOurServicesSaving(true);
    try {
      // Save directly to the center record — no dependency on services
      await api.put(`${apiBase}/${centerId}`, { ourServices: ourServicesText });
      setOurServicesSaved(true);
      setTimeout(() => setOurServicesSaved(false), 2500);
    } catch { /* silent */ }
    finally { setOurServicesSaving(false); }
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url as string;
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.name.trim()) return setSvcError('Service title is required');
    setSvcError(''); setSvcSaving(true);
    try {
      let serviceImageUrl;
      if (imageFile) serviceImageUrl = await uploadImage(imageFile);
      await api.post(`${apiBase}/${centerId}/services`, {
        name: svcForm.name,
        about: svcForm.about || undefined,
        ourService: ourServicesText || undefined,
        serviceImageUrl,
      });
      setSvcForm(emptyServiceForm); setImageFile(null); setImagePreview('');
      setShowForm(false);
      fetchServices();
    } catch { setSvcError('Failed to save service'); }
    finally { setSvcSaving(false); }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setEditError('Service title is required');
    setEditError(''); setEditSaving(true);
    try {
      let serviceImageUrl = editItem.serviceImageUrl;
      if (editImageFile) serviceImageUrl = await uploadImage(editImageFile);
      await api.put(`${apiBase}/${centerId}/services/${editItem._id}`, {
        name: editForm.name,
        about: editForm.about || undefined,
        ourService: ourServicesText || editItem.ourService || undefined,
        serviceImageUrl,
      });
      setEditItem(null); setEditForm(emptyEditForm);
      setEditImageFile(null); setEditImagePreview('');
      fetchServices();
    } catch { setEditError('Failed to update service'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    await api.delete(`${apiBase}/${centerId}/services/${id}`);
    fetchServices();
  };

  return (
    <div className="space-y-5">
      {/* Our Services Text */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-blue-500" />
          <p className="text-sm font-semibold text-gray-800">Our Services</p>
        </div>
        <textarea rows={4} placeholder="Write about services here. This text will appear in the app under 'Our Services'..."
          value={ourServicesText}
          onChange={(e) => { setOurServicesText(e.target.value); setOurServicesSaved(false); }}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors resize-none text-gray-700 placeholder-gray-300" />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Shows at the top of the Services section in the app</p>
          <button onClick={handleSaveOurServices}
            disabled={ourServicesSaving || !ourServicesText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: ourServicesSaved ? '#22c55e' : '#2B3EE6' }}>
            {ourServicesSaving ? 'Saving...' : ourServicesSaved
              ? <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Saved</>
              : <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save</>}
          </button>
        </div>
      </div>

      {/* Add / Edit Form Toggle */}
      {!showForm && !editItem ? (
        <button onClick={() => { setShowForm(true); setSvcError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: '#2B3EE6' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Service
        </button>
      ) : showForm ? (
        /* Add Form */
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">New Service</p>
            <button type="button" onClick={() => { setShowForm(false); setSvcForm(emptyServiceForm); setImageFile(null); setImagePreview(''); setSvcError(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 text-lg">✕</button>
          </div>
          <form onSubmit={handleAddService} className="p-5 space-y-4">
            {svcError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{svcError}</p>}
            <div>
              <label className={labelCls}>Service Title <span className="text-red-400">*</span></label>
              <input placeholder="e.g. X-Ray, Physiotherapy..." value={svcForm.name}
                onChange={(e) => setSvcForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Service Description</label>
              <textarea placeholder="Describe this service. Longer than 7 lines → 'Read More' in app..."
                value={svcForm.about} rows={5}
                onChange={(e) => setSvcForm((p) => ({ ...p, about: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Service Image</label>
              <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 110 }}>
                {imagePreview ? (
                  <div className="relative w-full">
                    <img src={imagePreview} alt="preview" className="w-full object-cover" style={{ maxHeight: 160 }} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500">Click to upload image</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={svcSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                style={{ background: '#2B3EE6' }}>
                {svcSaving ? 'Saving...' : 'Save Service'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setSvcForm(emptyServiceForm); setImageFile(null); setImagePreview(''); setSvcError(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : editItem ? (
        /* Edit Form */
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-blue-50">
            <p className="text-sm font-semibold text-gray-800">Edit Service</p>
            <button type="button" onClick={() => { setEditItem(null); setEditForm(emptyEditForm); setEditImageFile(null); setEditImagePreview(''); setEditError(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 text-lg">✕</button>
          </div>
          <form onSubmit={handleUpdateService} className="p-5 space-y-4">
            {editError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{editError}</p>}
            <div>
              <label className={labelCls}>Service Title <span className="text-red-400">*</span></label>
              <input placeholder="Service title..." value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Service Description</label>
              <textarea placeholder="Describe this service..."
                value={editForm.about} rows={5}
                onChange={(e) => setEditForm((p) => ({ ...p, about: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Service Image</label>
              <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 110 }}>
                {(editImagePreview || editItem.serviceImageUrl) ? (
                  <div className="relative w-full">
                    <img src={editImagePreview || editItem.serviceImageUrl} alt="preview" className="w-full object-cover" style={{ maxHeight: 160 }} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-lg">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500">Click to upload image</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditImageFile(f); setEditImagePreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                style={{ background: '#2B3EE6' }}>
                {editSaving ? 'Updating...' : 'Update Service'}
              </button>
              <button type="button" onClick={() => { setEditItem(null); setEditForm(emptyEditForm); setEditImageFile(null); setEditImagePreview(''); setEditError(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Service List */}
      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            {items.length} Service{items.length > 1 ? 's' : ''} Added
          </p>
          {items.map((item) => (
            <div key={item._id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditItem(item); setEditForm({ id: item._id, name: item.name, about: item.about || '' }); setEditImageFile(null); setEditImagePreview(''); setEditError(''); setShowForm(false); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 font-medium">Edit</button>
                  <button onClick={() => handleDelete(item._id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">Delete</button>
                </div>
              </div>
              {(item.about || item.ourService) && (
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.ourService || item.about}</p>
                </div>
              )}
              {item.serviceImageUrl && (
                <img src={item.serviceImageUrl} alt={item.name} className="w-full object-cover" style={{ maxHeight: 140 }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !showForm && !editItem && (
        <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2B3EE6" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-600">No services yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add New Service" to get started</p>
        </div>
      )}
    </div>
  );
}
