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

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// ── Schedule Manager for a doctor at a specific hospital ──
function ScheduleManager({ hospitalId, doctorId, doctorName }: { hospitalId: string; doctorId: string; doctorName: string }) {
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/hospitals/${hospitalId}/doctors/${doctorId}/schedule`);
      setSchedule(data.schedule || []);
    } catch { setSchedule([]); }
  };

  const toggleDay = (day: string) => {
    setSchedule((p) => {
      const exists = p?.find((s) => s.day === day);
      if (exists) return p.filter((s) => s.day !== day);
      return [...(p || []), { day, startTime: '09:00', endTime: '17:00' }];
    });
  };

  const updateTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((p) => p.map((s) => s.day === day ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/hospitals/${hospitalId}/doctors/${doctorId}/schedule`, { schedule });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <>
      <button onClick={() => { setOpen(true); load(); }}
        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
        Schedule
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-start justify-center p-6 py-10">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Appointment Schedule</p>
                  <p className="text-xs text-gray-400 mt-0.5">{doctorName} — at this hospital</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs text-gray-500">Select days and set appointment hours. Patients will see these times when booking at this hospital.</p>
                {DAYS.map((day) => {
                  const entry = schedule?.find((s) => s.day === day);
                  const active = !!entry;
                  return (
                    <div key={day} className={`rounded-xl border transition-colors ${active ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button type="button" onClick={() => toggleDay(day)}
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-blue-500' : 'border border-gray-300 bg-white'}`}>
                          {active && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${active ? 'text-blue-800' : 'text-gray-500'}`}>{day}</span>
                        {active && (
                          <div className="flex items-center gap-2">
                            <input type="time" value={entry.startTime}
                              onChange={(e) => updateTime(day, 'startTime', e.target.value)}
                              className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white" />
                            <span className="text-xs text-gray-400">to</span>
                            <input type="time" value={entry.endTime}
                              onChange={(e) => updateTime(day, 'endTime', e.target.value)}
                              className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                    style={{ background: saved ? '#22c55e' : '#2B3EE6' }}>
                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Schedule'}
                  </button>
                  <button onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const emptyServiceForm = { name: '', about: '', ourServiceText: '' };
const emptyEditForm = { id: '', name: '', about: '' };

function HospitalTabContent({ hospitalId, tab }: { hospitalId: string; tab: 'doctors' | 'ambulances' | 'services' }) {
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  // Our Services global text
  const [ourServicesText, setOurServicesText] = useState('');
  const [ourServicesSaving, setOurServicesSaving] = useState(false);
  const [ourServicesSaved, setOurServicesSaved] = useState(false);

  // Add service form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [svcForm, setSvcForm] = useState(emptyServiceForm);
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [serviceImagePreview, setServiceImagePreview] = useState('');
  const [svcError, setSvcError] = useState('');
  const [svcSaving, setSvcSaving] = useState(false);

  // Edit service
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchItems = (hid: string, t: string) =>
    api.get(`/hospitals/${hid}/${t}`).then((r) => {
      setItems(r.data);
      // Load existing ourService text from first service that has it
      if (t === 'services' && Array.isArray(r.data)) {
        const existing = Array.isArray(r.data) ? r.data.find((s: any) => s.ourService?.trim()) : undefined;
        if (existing) setOurServicesText(existing.ourService);
      }
    }).catch(() => setItems([]));

  useEffect(() => {
    setItems([]); setSelected('');
    setShowServiceForm(false); setSvcForm(emptyServiceForm);
    setServiceImageFile(null); setServiceImagePreview('');
    setSvcError('');
    setEditItem(null); setEditForm(emptyEditForm);
    setEditImageFile(null); setEditImagePreview('');
    setOurServicesSaved(false);
    fetchItems(hospitalId, tab);
    if (tab === 'doctors') api.get('/doctors').then((r) => setAllItems(r.data)).catch(() => {});
    else if (tab === 'ambulances') api.get('/ambulance').then((r) => setAllItems(r.data)).catch(() => {});
  }, [tab, hospitalId]);

  const handleSaveOurServices = async () => {
    if (!ourServicesText.trim()) return;
    setOurServicesSaving(true);
    try {
      // Save ourService text to all existing services, or create a placeholder if none exist
      if (items.length > 0) {
        await Promise.all(
          items.map((item) =>
            api.put(`/hospitals/${hospitalId}/services/${item._id}`, {
              name: item.name,
              about: item.about,
              ourService: ourServicesText,
              serviceImageUrl: item.serviceImageUrl,
            })
          )
        );
        fetchItems(hospitalId, tab);
      }
      setOurServicesSaved(true);
      setTimeout(() => setOurServicesSaved(false), 2500);
    } catch { /* silent */ }
    finally { setOurServicesSaving(false); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.name.trim()) return setSvcError('Service title is required');
    setSvcError(''); setSvcSaving(true);
    try {
      let serviceImageUrl;
      if (serviceImageFile) {
        const fd = new FormData(); fd.append('image', serviceImageFile);
        const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        serviceImageUrl = data.url;
      }
      await api.post(`/hospitals/${hospitalId}/services`, {
        name: svcForm.name,
        about: svcForm.about || undefined,
        ourService: ourServicesText || undefined,
        serviceImageUrl,
      });
      setSvcForm(emptyServiceForm);
      setServiceImageFile(null); setServiceImagePreview('');
      setShowServiceForm(false);
      fetchItems(hospitalId, tab);
    } catch { setSvcError('Failed to save service'); }
    finally { setSvcSaving(false); }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setEditError('Service title is required');
    setEditError(''); setEditSaving(true);
    try {
      let serviceImageUrl = editItem.serviceImageUrl;
      if (editImageFile) {
        const fd = new FormData(); fd.append('image', editImageFile);
        const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        serviceImageUrl = data.url;
      }
      await api.put(`/hospitals/${hospitalId}/services/${editItem._id}`, {
        name: editForm.name,
        about: editForm.about || undefined,
        ourService: ourServicesText || editItem.ourService || undefined,
        serviceImageUrl,
      });
      setEditItem(null); setEditForm(emptyEditForm);
      setEditImageFile(null); setEditImagePreview('');
      fetchItems(hospitalId, tab);
    } catch { setEditError('Failed to update service'); }
    finally { setEditSaving(false); }
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
    <div className="space-y-5">

      {/* ── Our Services Global Text Field ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-blue-500" />
          <p className="text-sm font-semibold text-gray-800">Our Services</p>
        </div>
        <textarea
          rows={4}
          placeholder="Write about your hospital's services here. This text will appear in the app under 'Our Services'..."
          value={ourServicesText}
          onChange={(e) => { setOurServicesText(e.target.value); setOurServicesSaved(false); }}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors resize-none text-gray-700 placeholder-gray-300"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">This content shows at the top of the Services section in the app</p>
          <button
            onClick={handleSaveOurServices}
            disabled={ourServicesSaving || !ourServicesText.trim() || items.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
            style={{ background: ourServicesSaved ? '#22c55e' : '#2B3EE6' }}>
            {ourServicesSaving ? (
              <span>Saving...</span>
            ) : ourServicesSaved ? (
              <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Saved</>
            ) : (
              <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save</>
            )}
          </button>
        </div>
        {items.length === 0 && ourServicesText.trim() && (
          <p className="text-xs text-amber-500">Add at least one service first to save this text</p>
        )}
      </div>

      {/* ── Add New Service Button / Form ── */}
      {!showServiceForm && !editItem ? (
        <button
          onClick={() => { setShowServiceForm(true); setSvcError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#2B3EE6' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Service
        </button>
      ) : showServiceForm ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">New Service</p>
            <button type="button"
              onClick={() => { setShowServiceForm(false); setSvcForm(emptyServiceForm); setServiceImageFile(null); setServiceImagePreview(''); setSvcError(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition-colors text-lg">✕</button>
          </div>
          <form onSubmit={handleAddService} className="p-5 space-y-4">
            {svcError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{svcError}</p>}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Title <span className="text-red-400">*</span></label>
              <input placeholder="e.g. X-Ray, Cardiology, MRI..."
                value={svcForm.name} onChange={(e) => setSvcForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Description</label>
              <textarea placeholder="Describe this service. Longer than 7 lines → 'Read More' in app..."
                value={svcForm.about} rows={5} onChange={(e) => setSvcForm((p) => ({ ...p, about: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Image</label>
              <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50" style={{ minHeight: 110 }}>
                {serviceImagePreview ? (
                  <div className="relative w-full">
                    <img src={serviceImagePreview} alt="preview" className="w-full object-cover" style={{ maxHeight: 160 }} />
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
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setServiceImageFile(f); setServiceImagePreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={svcSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: '#2B3EE6' }}>
                {svcSaving ? 'Saving...' : 'Save Service'}
              </button>
              <button type="button"
                onClick={() => { setShowServiceForm(false); setSvcForm(emptyServiceForm); setServiceImageFile(null); setServiceImagePreview(''); setSvcError(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : editItem ? (
        /* ── Edit Service Form ── */
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-blue-50">
            <p className="text-sm font-semibold text-gray-800">Edit Service</p>
            <button type="button"
              onClick={() => { setEditItem(null); setEditForm(emptyEditForm); setEditImageFile(null); setEditImagePreview(''); setEditError(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-100 transition-colors text-lg">✕</button>
          </div>
          <form onSubmit={handleUpdateService} className="p-5 space-y-4">
            {editError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{editError}</p>}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Title <span className="text-red-400">*</span></label>
              <input placeholder="e.g. X-Ray, Cardiology, MRI..."
                value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Description</label>
              <textarea placeholder="Describe this service..."
                value={editForm.about} rows={5} onChange={(e) => setEditForm((p) => ({ ...p, about: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Image</label>
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
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: '#2B3EE6' }}>
                {editSaving ? 'Updating...' : 'Update Service'}
              </button>
              <button type="button"
                onClick={() => { setEditItem(null); setEditForm(emptyEditForm); setEditImageFile(null); setEditImagePreview(''); setEditError(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* ── Service List ── */}
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
                  <button
                    onClick={() => { setEditItem(item); setEditForm({ id: item._id, name: item.name, about: item.about || '' }); setEditImageFile(null); setEditImagePreview(''); setEditError(''); setShowServiceForm(false); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleRemove(item._id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium">
                    Delete
                  </button>
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

      {/* ── Empty State ── */}
      {items.length === 0 && !showServiceForm && !editItem && (
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
          <div key={item._id} className="bg-gray-50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                {tab === 'doctors' && <p className="text-sm font-medium text-gray-700">{item.userId?.name || 'Unknown'} <span className="text-xs text-gray-400 ml-1">{item.specialization}</span></p>}
                {tab === 'ambulances' && <p className="text-sm font-medium text-gray-700">{item.ambulanceName} <span className="text-xs text-gray-400 ml-1">{item.vehicleNumber}</span></p>}
              </div>
              <div className="flex items-center gap-2">
                {tab === 'doctors' && (
                  <ScheduleManager hospitalId={hospitalId} doctorId={item._id} doctorName={item.userId?.name || 'Doctor'} />
                )}
                <button onClick={() => handleRemove(item._id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Remove</button>
              </div>
            </div>
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
