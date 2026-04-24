'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Hospital } from '@/types';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const emptyForm = { name: '', contact: '', address: '', division: '', district: '', upazila: '', lat: '', lng: '' };

function ImageUpload({ label, preview, onChange }: {
  label: string; preview: string;
  onChange: (f: File, p: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
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
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f, URL.createObjectURL(f)); }} />
      </label>
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const emptyServiceForm = { name: '', shortTitle: '', about: '', offerInput: '', offers: [] as string[], doctors: [] as string[] };

function HospitalTabContent({ hospitalId, tab }: { hospitalId: string; tab: 'doctors' | 'ambulances' | 'services' }) {
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [svcForm, setSvcForm] = useState(emptyServiceForm);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState('');
  const [svcError, setSvcError] = useState('');

  const fetchItems = (hid: string, t: string) =>
    api.get(`/hospitals/${hid}/${t}`).then((r) => setItems(r.data)).catch(() => setItems([]));

  useEffect(() => {
    setItems([]); setSelected('');
    setShowServiceForm(false); setSvcForm(emptyServiceForm); setIconFile(null); setIconPreview('');
    fetchItems(hospitalId, tab);
    if (tab === 'doctors' || tab === 'services') api.get('/doctors').then((r) => setAllItems(r.data)).catch(() => {});
    else if (tab === 'ambulances') api.get('/ambulance').then((r) => setAllItems(r.data)).catch(() => {});
  }, [tab, hospitalId]);

  const handleAddOffer = () => {
    if (!svcForm.offerInput.trim()) return;
    setSvcForm((p) => ({ ...p, offers: [...p.offers, p.offerInput.trim()], offerInput: '' }));
  };

  const handleRemoveOffer = (i: number) =>
    setSvcForm((p) => ({ ...p, offers: p.offers.filter((_, idx) => idx !== i) }));

  const toggleDoctor = (id: string) =>
    setSvcForm((p) => ({
      ...p,
      doctors: p.doctors.includes(id) ? p.doctors.filter((d) => d !== id) : [...p.doctors, id],
    }));

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.name.trim()) return setSvcError('Service name is required');
    setSvcError(''); setLoading(true);
    try {
      let iconUrl;
      if (iconFile) {
        const fd = new FormData(); fd.append('image', iconFile);
        const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        iconUrl = data.url;
      }
      await api.post(`/hospitals/${hospitalId}/services`, {
        name: svcForm.name,
        shortTitle: svcForm.shortTitle || undefined,
        about: svcForm.about || undefined,
        whatWeOffer: svcForm.offers,
        availableDoctors: svcForm.doctors,
        iconUrl,
      });
      setSvcForm(emptyServiceForm); setIconFile(null); setIconPreview('');
      setShowServiceForm(false);
      fetchItems(hospitalId, tab);
    } catch { setSvcError('Failed to add service'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    const key = tab === 'doctors' ? 'doctorId' : 'ambulanceId';
    await api.post(`/hospitals/${hospitalId}/${tab}`, { [key]: selected });
    setSelected('');
    fetchItems(hospitalId, tab);
    setLoading(false);
  };

  const handleRemove = async (itemId: string) => {
    if (tab === 'services') await api.delete(`/hospitals/${hospitalId}/services/${itemId}`);
    else if (tab === 'doctors') await api.delete(`/hospitals/${hospitalId}/doctors/${itemId}`);
    else await api.delete(`/hospitals/${hospitalId}/ambulances/${itemId}`);
    fetchItems(hospitalId, tab);
  };

  const linkedIds = new Set(items.map((i) => i._id));
  const available = allItems.filter((i) => !linkedIds.has(i._id));

  if (tab === 'services') return (
    <div className="space-y-4">
      {!showServiceForm ? (
        <button onClick={() => setShowServiceForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: '#2B3EE6' }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </button>
      ) : (
        <form onSubmit={handleAddService} className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-700">New Service</p>
            <button type="button" onClick={() => { setShowServiceForm(false); setSvcForm(emptyServiceForm); setIconFile(null); setIconPreview(''); }}
              className="text-xs text-gray-400 hover:text-gray-600">✕ Cancel</button>
          </div>
          {svcError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{svcError}</p>}

          {/* Icon Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Service Icon <span className="text-gray-300">(optional)</span></label>
            <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors bg-white">
              {iconPreview
                ? <img src={iconPreview} alt="icon" className="w-10 h-10 rounded-lg object-cover" />
                : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl">🏥</div>}
              <span className="text-xs text-gray-400">{iconFile ? iconFile.name : 'Click to upload icon image'}</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setIconFile(f); setIconPreview(URL.createObjectURL(f)); } }} />
            </label>
          </div>

          {/* Name & Short Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Service Name<span className="text-red-400 ml-0.5">*</span></label>
              <input placeholder="e.g. Cardiology" value={svcForm.name}
                onChange={(e) => setSvcForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Short Title <span className="text-gray-300">(optional)</span></label>
              <input placeholder="e.g. Heart Care" value={svcForm.shortTitle}
                onChange={(e) => setSvcForm((p) => ({ ...p, shortTitle: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white" />
            </div>
          </div>

          {/* About */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">About Service <span className="text-gray-300">(optional)</span></label>
            <textarea placeholder="Brief description of this service..." value={svcForm.about} rows={3}
              onChange={(e) => setSvcForm((p) => ({ ...p, about: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none bg-white" />
          </div>

          {/* What We Offer */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">What We Offer <span className="text-gray-300">(optional)</span></label>
            <div className="flex gap-2 mb-2">
              <input placeholder="Add an offer point..." value={svcForm.offerInput}
                onChange={(e) => setSvcForm((p) => ({ ...p, offerInput: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOffer(); } }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white" />
              <button type="button" onClick={handleAddOffer}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: '#2B3EE6' }}>Add</button>
            </div>
            {svcForm.offers.length > 0 && (
              <div className="space-y-1.5">
                {svcForm.offers.map((o, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl">
                    <span className="text-sm text-gray-700">✓ {o}</span>
                    <button type="button" onClick={() => handleRemoveOffer(i)}
                      className="text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Doctors */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Available Doctors <span className="text-gray-300">(optional)</span></label>
            {allItems.length === 0
              ? <p className="text-xs text-gray-300">No doctors found</p>
              : <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {allItems.map((d) => (
                    <label key={d._id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                      svcForm.doctors.includes(d._id) ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}>
                      <input type="checkbox" className="hidden" checked={svcForm.doctors.includes(d._id)}
                        onChange={() => toggleDoctor(d._id)} />
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        svcForm.doctors.includes(d._id) ? 'bg-blue-500' : 'border border-gray-300'
                      }`}>
                        {svcForm.doctors.includes(d._id) && (
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-700 truncate">{d.userId?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400 truncate">{d.specialization}</span>
                    </label>
                  ))}
                </div>
            }
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2B3EE6' }}>
            {loading ? 'Saving...' : 'Save Service'}
          </button>
        </form>
      )}

      {/* Service List */}
      <div className="space-y-3">
        {items.length === 0 && !showServiceForm && <p className="text-xs text-gray-300 text-center py-6">No services added yet</p>}
        {items.map((item) => (
          <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {item.iconUrl
                  ? <img src={item.iconUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 text-lg shrink-0">🏥</div>}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  {item.shortTitle && <p className="text-xs text-blue-500">{item.shortTitle}</p>}
                </div>
              </div>
              <button onClick={() => handleRemove(item._id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0">Remove</button>
            </div>
            {item.about && <p className="text-xs text-gray-500 mt-2 ml-13">{item.about}</p>}
            {item.whatWeOffer?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.whatWeOffer.map((o: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-lg">✓ {o}</span>
                ))}
              </div>
            )}
            {item.availableDoctors?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.availableDoctors.map((d: any) => (
                  <span key={d._id} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg">👨‍⚕️ {d.userId?.name || 'Doctor'}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700">
          <option value="">Select {tab === 'doctors' ? 'Doctor' : 'Ambulance'}</option>
          {available.map((i) => (
            <option key={i._id} value={i._id}>
              {tab === 'doctors' ? `${i.userId?.name || 'Unknown'} — ${i.specialization}` : `${i.ambulanceName} (${i.vehicleNumber})`}
            </option>
          ))}
        </select>
        <button onClick={handleAdd} disabled={loading}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
          style={{ background: '#2B3EE6' }}>Add</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-gray-300 text-center py-6">No {tab} added yet</p>}
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <div>
              {tab === 'doctors' && <p className="text-sm font-medium text-gray-700">{item.userId?.name || 'Unknown'} <span className="text-xs text-gray-400 ml-1">{item.specialization}</span></p>}
              {tab === 'ambulances' && <p className="text-sm font-medium text-gray-700">{item.ambulanceName} <span className="text-xs text-gray-400 ml-1">{item.vehicleNumber}</span></p>}
            </div>
            <button onClick={() => handleRemove(item._id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editHospital, setEditHospital] = useState<any>(null);
  const [viewHospital, setViewHospital] = useState<any>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState('');
  const [viewTab, setViewTab] = useState<'doctors' | 'ambulances' | 'services'>('doctors');
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let logoUrl, coverUrl;
      if (logoFile) {
        try {
          const fd = new FormData(); fd.append('image', logoFile);
          const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          logoUrl = data.url;
        } catch { /* skip image upload if fails */ }
      }
      if (coverFile) {
        try {
          const fd = new FormData(); fd.append('image', coverFile);
          const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          coverUrl = data.url;
        } catch { /* skip image upload if fails */ }
      }
      const { data } = await api.post('/hospitals', {
        name: form.name, contact: form.contact, address: form.address,
        division: form.division || undefined,
        district: form.district || undefined,
        upazila: form.upazila || undefined,
        location: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
        logo: logoUrl, coverImage: coverUrl,
      });
      setHospitals((prev) => [...prev, data]);
      setShowModal(false);
      setForm(emptyForm);
      setLogoFile(null); setLogoPreview('');
      setCoverFile(null); setCoverPreview('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.fieldErrors ? JSON.stringify(err.response?.data?.errors?.fieldErrors) : 'Failed to add hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this hospital?')) return;
    await api.delete(`/hospitals/${id}`);
    setHospitals((prev) => prev.filter((h) => h._id !== id));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let logoUrl = editHospital.logo;
      let coverUrl = editHospital.coverImage;
      if (editLogoFile) {
        try {
          const fd = new FormData(); fd.append('image', editLogoFile);
          const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          logoUrl = data.url;
        } catch {}
      }
      if (editCoverFile) {
        try {
          const fd = new FormData(); fd.append('image', editCoverFile);
          const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          coverUrl = data.url;
        } catch {}
      }
      const { data } = await api.put(`/hospitals/${editHospital._id}`, {
        name: editHospital.name,
        contact: editHospital.contact,
        address: editHospital.address,
        division: editHospital.division,
        district: editHospital.district,
        upazila: editHospital.upazila,
        logo: logoUrl,
        coverImage: coverUrl,
      });
      setHospitals((prev) => prev.map((h) => h._id === data._id ? data : h));
      setEditHospital(null);
      setEditLogoFile(null); setEditLogoPreview('');
      setEditCoverFile(null); setEditCoverPreview('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true); setError(''); setForm(emptyForm);
    setLogoFile(null); setLogoPreview('');
    setCoverFile(null); setCoverPreview('');
  };

  const addBtn = (
    <button onClick={openModal}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: '#2B3EE6' }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add Hospital
    </button>
  );

  return (
    <AdminLayout title="Hospital" action={addBtn}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Hospitals', value: hospitals.length, color: 'bg-blue-50 text-blue-600', icon: '🏥' },
          { label: 'With Contact', value: hospitals.filter((h) => h.contact).length, color: 'bg-green-50 text-green-600', icon: '📞' },
          { label: 'With Address', value: hospitals.filter((h) => h.address).length, color: 'bg-orange-50 text-orange-500', icon: '📍' },
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

      {/* Hospital List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['', 'Name', 'Contact', 'Address', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hospitals.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-300 text-sm">No hospitals found</td></tr>
            )}
            {hospitals.map((h) => (
              <tr key={h._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  {(h as any).logo
                    ? <img src={(h as any).logo} alt={h.name} className="w-9 h-9 rounded-lg object-cover" />
                    : <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 text-sm font-bold">{h.name?.[0]}</div>}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{h.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{h.contact}</td>
                <td className="px-5 py-3.5 text-gray-500">{h.address}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setViewTab('doctors'); setViewHospital(h); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      View
                    </button>
                    <button onClick={() => { setEditHospital({ ...h, division: (h as any).division || '', district: (h as any).district || '', upazila: (h as any).upazila || '' }); setEditLogoFile(null); setEditLogoPreview(''); setEditCoverFile(null); setEditCoverPreview(''); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(h._id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Add Hospital</h2>
                <button onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                {/* Row 1: Images */}
                <div className="grid grid-cols-2 gap-3">
                  <ImageUpload label="Hospital Logo" preview={logoPreview}
                    onChange={(f, p) => { setLogoFile(f); setLogoPreview(p); }} />
                  <ImageUpload label="Cover Image" preview={coverPreview}
                    onChange={(f, p) => { setCoverFile(f); setCoverPreview(p); }} />
                </div>

                {/* Row 2: Division, District, Upazila */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Division<span className="text-red-400 ml-0.5">*</span></label>
                    <select value={form.division} onChange={set('division')} required className={`${inputCls} text-gray-700`}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>District<span className="text-red-400 ml-0.5">*</span></label>
                    <select value={form.district} onChange={set('district')} required={!!form.division} disabled={!form.division}
                      className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select District</option>
                      {getDistricts(form.division).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Upazila</label>
                    <select value={form.upazila} onChange={set('upazila')} disabled={!form.district}
                      className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select Upazila</option>
                      {getUpazilas(form.division, form.district).map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 3: Name, Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hospital Name<span className="text-red-400 ml-0.5">*</span></label>
                    <input placeholder="Hospital Name" value={form.name} onChange={set('name')} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact<span className="text-red-400 ml-0.5">*</span></label>
                    <input placeholder="Phone / Email" value={form.contact} onChange={set('contact')} required className={inputCls} />
                  </div>
                </div>

                {/* Row 4: Address, Lat/Lng */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
                    <textarea placeholder="Full address" value={form.address} onChange={set('address')} required rows={3}
                      className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Google Maps Coordinates <span className="text-gray-300">(optional)</span></label>
                    <input placeholder="Latitude" value={form.lat} onChange={set('lat')} type="number" step="any" className={`${inputCls} mb-3`} />
                    <input placeholder="Longitude" value={form.lng} onChange={set('lng')} type="number" step="any" className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1.5">Google Maps → right click → copy coordinates</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                    style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Hospital'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewHospital && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {viewHospital.logo
                    ? <img src={viewHospital.logo} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
                    : <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 font-bold">{viewHospital.name?.[0]}</div>}
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">{viewHospital.name}</h2>
                    <p className="text-xs text-gray-400">{[viewHospital.division, viewHospital.district, viewHospital.upazila].filter(Boolean).join(' › ')}</p>
                  </div>
                </div>
                <button onClick={() => { setViewHospital(null); setViewTab('doctors'); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 pt-4">
                {(['doctors', 'ambulances', 'services'] as const).map((t) => (
                  <button key={t} onClick={() => setViewTab(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                      viewTab === t ? 'text-white' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    style={viewTab === t ? { background: '#2B3EE6' } : {}}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="px-6 py-4">
                <HospitalTabContent hospitalId={String(viewHospital._id)} tab={viewTab} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editHospital && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Edit Hospital</h2>
                <button onClick={() => setEditHospital(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
                {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}

                {/* Images */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hospital Logo</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden" style={{ minHeight: 80 }}>
                      {editLogoPreview || editHospital.logo ? (
                        <img src={editLogoPreview || editHospital.logo} alt="logo" className="w-full h-24 object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 py-4">
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-xs text-gray-400">Upload Logo</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditLogoFile(f); setEditLogoPreview(URL.createObjectURL(f)); } }} />
                    </label>
                  </div>
                  <div>
                    <label className={labelCls}>Cover Image</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden" style={{ minHeight: 80 }}>
                      {editCoverPreview || editHospital.coverImage ? (
                        <img src={editCoverPreview || editHospital.coverImage} alt="cover" className="w-full h-24 object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 py-4">
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-xs text-gray-400">Upload Cover</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditCoverFile(f); setEditCoverPreview(URL.createObjectURL(f)); } }} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Division</label>
                    <select value={editHospital.division} onChange={(e) => setEditHospital((p: any) => ({ ...p, division: e.target.value, district: '', upazila: '' }))}
                      className={`${inputCls} text-gray-700`}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>District</label>
                    <select value={editHospital.district} disabled={!editHospital.division}
                      onChange={(e) => setEditHospital((p: any) => ({ ...p, district: e.target.value, upazila: '' }))}
                      className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select District</option>
                      {getDistricts(editHospital.division).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Upazila</label>
                    <select value={editHospital.upazila} disabled={!editHospital.district}
                      onChange={(e) => setEditHospital((p: any) => ({ ...p, upazila: e.target.value }))}
                      className={`${inputCls} text-gray-700 disabled:opacity-40`}>
                      <option value="">Select Upazila</option>
                      {getUpazilas(editHospital.division, editHospital.district).map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hospital Name<span className="text-red-400 ml-0.5">*</span></label>
                    <input value={editHospital.name} onChange={(e) => setEditHospital((p: any) => ({ ...p, name: e.target.value }))} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact<span className="text-red-400 ml-0.5">*</span></label>
                    <input value={editHospital.contact} onChange={(e) => setEditHospital((p: any) => ({ ...p, contact: e.target.value }))} required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
                  <textarea value={editHospital.address} onChange={(e) => setEditHospital((p: any) => ({ ...p, address: e.target.value }))} required rows={2}
                    className={`${inputCls} resize-none`} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                    style={{ background: '#2B3EE6' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditHospital(null)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
