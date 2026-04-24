'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const emptyForm = { name: '', contact: '', address: '', division: '', district: '', upazila: '', lat: '', lng: '' };
const emptyService = { name: '', shortTitle: '', about: '', offerInput: '', offers: [] as string[] };

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

function ImageUpload({ label, preview, onChange }: { label: string; preview: string; onChange: (f: File, p: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden" style={{ minHeight: 80 }}>
        {preview ? (
          <img src={preview} alt={label} className="w-full h-24 object-cover" />
        ) : (
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

function FormFields({ values, onChange }: { values: any; onChange: (k: string, v: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Center Name<span className="text-red-400 ml-0.5">*</span></label>
          <input placeholder="Name" value={values.name} onChange={(e) => onChange('name', e.target.value)} required className={inputCls} /></div>
        <div><label className={labelCls}>Contact<span className="text-red-400 ml-0.5">*</span></label>
          <input placeholder="Phone / Email" value={values.contact} onChange={(e) => onChange('contact', e.target.value)} required className={inputCls} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className={labelCls}>Division</label>
          <select value={values.division || ''} onChange={(e) => onChange('division', e.target.value)} className={`${inputCls} text-gray-700`}>
            <option value="">Select Division</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select></div>
        <div><label className={labelCls}>District</label>
          <select value={values.district || ''} disabled={!values.division} onChange={(e) => onChange('district', e.target.value)} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
            <option value="">Select District</option>
            {getDistricts(values.division || '').map((d) => <option key={d} value={d}>{d}</option>)}
          </select></div>
        <div><label className={labelCls}>Upazila</label>
          <select value={values.upazila || ''} disabled={!values.district} onChange={(e) => onChange('upazila', e.target.value)} className={`${inputCls} text-gray-700 disabled:opacity-40`}>
            <option value="">Select Upazila</option>
            {getUpazilas(values.division || '', values.district || '').map((u) => <option key={u} value={u}>{u}</option>)}
          </select></div>
      </div>
      <div><label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
        <textarea placeholder="Full address" value={values.address} onChange={(e) => onChange('address', e.target.value)} required rows={2} className={`${inputCls} resize-none`} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Latitude (optional)</label>
          <input placeholder="Latitude" value={values.lat || ''} onChange={(e) => onChange('lat', e.target.value)} type="number" step="any" className={inputCls} /></div>
        <div><label className={labelCls}>Longitude (optional)</label>
          <input placeholder="Longitude" value={values.lng || ''} onChange={(e) => onChange('lng', e.target.value)} type="number" step="any" className={inputCls} /></div>
      </div>
    </>
  );
}

interface PhysiotherapyCenter {
  _id: string;
  name: string;
  contact: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  logo?: string;
  coverImage?: string;
}

interface Service {
  _id: string;
  name: string;
  shortTitle?: string;
  about?: string;
  whatWeOffer: string[];
  availableDoctors: any[];
}

export default function PhysiotherapyCentersPage() {
  const [centers, setCenters] = useState<PhysiotherapyCenter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCenter, setEditCenter] = useState<any>(null);
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
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceForm, setServiceForm] = useState(emptyService);

  useEffect(() => {
    api.get('/physiotherapy-centers').then((r) => setCenters(r.data)).catch(() => {});
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => {
        const next = { ...p, [k]: e.target.value };
        if (k === 'division') { next.district = ''; next.upazila = ''; }
        if (k === 'district') { next.upazila = ''; }
        return next;
      });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post(`/upload/${folder}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let logo: string | undefined;
      let coverImage: string | undefined;
      if (logoFile) logo = await uploadFile(logoFile, 'general');
      if (coverFile) coverImage = await uploadFile(coverFile, 'general');
      const { data } = await api.post('/physiotherapy-centers', {
        name: form.name,
        contact: form.contact,
        address: form.address,
        division: form.division || undefined,
        district: form.district || undefined,
        upazila: form.upazila || undefined,
        location: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
        logo,
        coverImage,
      });
      setCenters((p) => [data, ...p]);
      setShowModal(false); setForm(emptyForm); setLogoFile(null); setLogoPreview(''); setCoverFile(null); setCoverPreview('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors || err.message || 'Failed to add';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let logo = editCenter.logo;
      let coverImage = editCenter.coverImage;
      if (editLogoFile) logo = await uploadFile(editLogoFile, 'general');
      if (editCoverFile) coverImage = await uploadFile(editCoverFile, 'general');
      const { data } = await api.put(`/physiotherapy-centers/${editCenter._id}`, { ...editCenter, logo, coverImage });
      setCenters((p) => p.map((c) => c._id === data._id ? data : c));
      setEditCenter(null); setEditLogoFile(null); setEditLogoPreview(''); setEditCoverFile(null); setEditCoverPreview('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this physiotherapy center?')) return;
    await api.delete(`/physiotherapy-centers/${id}`);
    setCenters((p) => p.filter((c) => c._id !== id));
  };

  const loadServices = async (centerId: string) => {
    try {
      const { data } = await api.get(`/physiotherapy-centers/${centerId}/services`);
      setServices(data);
    } catch (err) {
      setServices([]);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post(`/physiotherapy-centers/${selectedCenter}/services`, {
        name: serviceForm.name,
        shortTitle: serviceForm.shortTitle,
        about: serviceForm.about,
        whatWeOffer: serviceForm.offers,
      });
      setServices((p) => [data, ...p]);
      setServiceForm(emptyService);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add service');
    } finally { setLoading(false); }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!selectedCenter || !confirm('Delete this service?')) return;
    await api.delete(`/physiotherapy-centers/${selectedCenter}/services/${serviceId}`);
    setServices((p) => p.filter((s) => s._id !== serviceId));
  };

  const addBtn = (
    <button onClick={() => { setShowModal(true); setError(''); setForm(emptyForm); setLogoFile(null); setLogoPreview(''); setCoverFile(null); setCoverPreview(''); }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Center
    </button>
  );

  return (
    <AdminLayout title="Physiotherapy Centers" action={addBtn}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Centers', value: centers.length, color: 'bg-blue-50 text-blue-600' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 flex items-center gap-4 ${s.color}`}>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Name', 'Contact', 'Location', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {centers.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-300 text-sm">No physiotherapy centers found</td></tr>
            )}
            {centers.map((c) => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.contact}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{[c.division, c.district, c.upazila].filter(Boolean).join(' › ') || c.address}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setSelectedCenter(c._id); loadServices(c._id); setShowServiceModal(true); setServiceForm(emptyService); setError(''); }} title="Services"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </button>
                    <button onClick={() => { setEditCenter({ ...c }); setEditLogoFile(null); setEditLogoPreview(c.logo || ''); setEditCoverFile(null); setEditCoverPreview(c.coverImage || ''); }} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(c._id)} title="Delete"
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
                <h2 className="text-base font-semibold text-gray-800">Add Physiotherapy Center</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <ImageUpload label="Logo" preview={logoPreview} onChange={(f, p) => { setLogoFile(f); setLogoPreview(p); }} />
                  <ImageUpload label="Cover Image" preview={coverPreview} onChange={(f, p) => { setCoverFile(f); setCoverPreview(p); }} />
                </div>
                <FormFields values={form} onChange={(k, v) => set(k as keyof typeof emptyForm)({ target: { value: v } } as any)} />
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Center'}
                  </button>
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
                <h2 className="text-base font-semibold text-gray-800">Edit Physiotherapy Center</h2>
                <button onClick={() => setEditCenter(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <ImageUpload label="Logo" preview={editLogoPreview} onChange={(f, p) => { setEditLogoFile(f); setEditLogoPreview(p); }} />
                  <ImageUpload label="Cover Image" preview={editCoverPreview} onChange={(f, p) => { setEditCoverFile(f); setEditCoverPreview(p); }} />
                </div>
                <FormFields
                  values={editCenter}
                  onChange={(k, v) => setEditCenter((p: any) => {
                    const next = { ...p, [k]: v };
                    if (k === 'division') { next.district = ''; next.upazila = ''; }
                    if (k === 'district') { next.upazila = ''; }
                    return next;
                  })}
                />
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditCenter(null)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && selectedCenter && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Manage Services</h2>
                <button onClick={() => { setShowServiceModal(false); setSelectedCenter(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 py-5">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mb-4">{error}</p>}
                <form onSubmit={handleAddService} className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Service Name<span className="text-red-400 ml-0.5">*</span></label>
                      <input placeholder="Service name" value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} /></div>
                    <div><label className={labelCls}>Short Title</label>
                      <input placeholder="Short title" value={serviceForm.shortTitle} onChange={(e) => setServiceForm((p) => ({ ...p, shortTitle: e.target.value }))} className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>About</label>
                    <textarea placeholder="About this service" value={serviceForm.about} onChange={(e) => setServiceForm((p) => ({ ...p, about: e.target.value }))} rows={2} className={`${inputCls} resize-none`} /></div>
                  <div>
                    <label className={labelCls}>What We Offer</label>
                    <div className="flex gap-2">
                      <input placeholder="Add offer" value={serviceForm.offerInput} onChange={(e) => setServiceForm((p) => ({ ...p, offerInput: e.target.value }))} className={inputCls} />
                      <button type="button" onClick={() => { if (serviceForm.offerInput.trim()) { setServiceForm((p) => ({ ...p, offers: [...p.offers, p.offerInput.trim()], offerInput: '' })); } }} className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {serviceForm.offers.map((o, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg text-xs bg-blue-100 text-blue-700 flex items-center gap-1">
                          {o}
                          <button type="button" onClick={() => setServiceForm((p) => ({ ...p, offers: p.offers.filter((_, idx) => idx !== i) }))} className="text-blue-500 hover:text-blue-700">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90" style={{ background: '#2B3EE6' }}>
                    {loading ? 'Adding...' : 'Add Service'}
                  </button>
                </form>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Services</h3>
                  {services.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No services added yet</p>}
                  {services.map((s) => (
                    <div key={s._id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{s.name}</h4>
                          {s.shortTitle && <p className="text-xs text-gray-500 mt-0.5">{s.shortTitle}</p>}
                          {s.about && <p className="text-xs text-gray-600 mt-2">{s.about}</p>}
                          {s.whatWeOffer.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {s.whatWeOffer.map((o, i) => <span key={i} className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">{o}</span>)}
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleDeleteService(s._id)} className="ml-3 w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
