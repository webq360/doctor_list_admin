'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Hospital } from '@/types';
import { DIVISIONS, getDistricts, getUpazilas } from '@/lib/bd-locations';

const emptyForm = { 
  name: '', 
  address: '', 
  division: '', 
  district: '', 
  upazila: '', 
  lat: '', 
  lng: '' 
};

const emptyContactPerson = {
  name: '',
  designation: '',
  mobile: '',
  whatsapp: '',
  isPublished: false,
  isForPatient: false,
  isForDoctorList: false,
};

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
const SHIFTS = ['Morning', 'Evening'] as const;

type Shift = typeof SHIFTS[number];

interface ShiftSchedule {
  shift: Shift;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  shifts: ShiftSchedule[];
}

// ── Schedule Manager for a doctor at a specific hospital ──
function ScheduleManager({ hospitalId, doctorId, doctorName }: { hospitalId: string; doctorId: string; doctorName: string }) {
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/hospitals/${hospitalId}/doctors/${doctorId}/schedule`);
      // Convert old format to new format if needed
      if (data.schedule && Array.isArray(data.schedule)) {
        const converted: DaySchedule[] = data.schedule.map((s: any) => {
          if (s.shifts) {
            // New format
            return s as DaySchedule;
          } else {
            // Old format - convert to new
            return {
              day: s.day,
              shifts: [{
                shift: 'Morning' as Shift,
                startTime: s.startTime || '09:00',
                endTime: s.endTime || '17:00',
              }]
            };
          }
        });
        setSchedule(converted);
      } else {
        setSchedule([]);
      }
    } catch { setSchedule([]); }
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => {
      const exists = prev.find((s) => s.day === day);
      if (exists) {
        return prev.filter((s) => s.day !== day);
      }
      return [...prev, { 
        day, 
        shifts: [{ shift: 'Morning', startTime: '08:00', endTime: '12:00' }] 
      }];
    });
  };

  const addShift = (day: string) => {
    setSchedule((prev) => prev.map((s) => {
      if (s.day !== day) return s;
      
      // Determine next shift to add
      const existingShifts = s.shifts.map(sh => sh.shift);
      let nextShift: Shift = 'Morning';
      let defaultStart = '08:00';
      let defaultEnd = '12:00';
      
      if (!existingShifts.includes('Morning')) {
        nextShift = 'Morning';
        defaultStart = '08:00';
        defaultEnd = '12:00';
      } else if (!existingShifts.includes('Evening')) {
        nextShift = 'Evening';
        defaultStart = '16:00';
        defaultEnd = '20:00';
      } else {
        return s; // All shifts added
      }
      
      return {
        ...s,
        shifts: [...s.shifts, { shift: nextShift, startTime: defaultStart, endTime: defaultEnd }]
      };
    }));
  };

  const removeShift = (day: string, shiftIndex: number) => {
    setSchedule((prev) => prev.map((s) => {
      if (s.day !== day) return s;
      return {
        ...s,
        shifts: s.shifts.filter((_, idx) => idx !== shiftIndex)
      };
    }));
  };

  const updateShift = (day: string, shiftIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) => prev.map((s) => {
      if (s.day !== day) return s;
      return {
        ...s,
        shifts: s.shifts.map((sh, idx) => 
          idx === shiftIndex ? { ...sh, [field]: value } : sh
        )
      };
    }));
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
                <p className="text-xs text-gray-500">Select days and add shifts (Morning, Evening). Patients will see these times when booking.</p>
                {DAYS.map((day) => {
                  const daySchedule = schedule.find((s) => s.day === day);
                  const active = !!daySchedule;
                  return (
                    <div key={day} className={`rounded-xl border transition-colors ${active ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      {/* Day Header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-100">
                        <button type="button" onClick={() => toggleDay(day)}
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-blue-500' : 'border border-gray-300 bg-white'}`}>
                          {active && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${active ? 'text-blue-800' : 'text-gray-500'}`}>{day}</span>
                        {active && daySchedule.shifts.length < 2 && (
                          <button
                            type="button"
                            onClick={() => addShift(day)}
                            className="text-xs px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1">
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Shift
                          </button>
                        )}
                      </div>
                      
                      {/* Shifts */}
                      {active && daySchedule.shifts.length > 0 && (
                        <div className="p-3 space-y-2">
                          {daySchedule.shifts.map((shift, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-blue-100">
                              <div className="flex-shrink-0">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  shift.shift === 'Morning' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {shift.shift === 'Morning' ? '🌅' : '🌆'} {shift.shift}
                                </span>
                              </div>
                              <input 
                                type="time" 
                                value={shift.startTime}
                                onChange={(e) => updateShift(day, idx, 'startTime', e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white w-24" 
                              />
                              <span className="text-xs text-gray-400">to</span>
                              <input 
                                type="time" 
                                value={shift.endTime}
                                onChange={(e) => updateShift(day, idx, 'endTime', e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 bg-white w-24" 
                              />
                              {daySchedule.shifts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeShift(day, idx)}
                                  className="ml-auto text-red-500 hover:bg-red-50 rounded p-1 transition-colors">
                                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
      // Save ourService text separately - not to individual services
      // We'll store it in the first service or create a special entry
      if (items.length > 0) {
        // Update only the first service with ourService text
        await api.put(`/hospitals/${hospitalId}/services/${items[0]._id}`, {
          name: items[0].name,
          about: items[0].about,
          ourService: ourServicesText,
          serviceImageUrl: items[0].serviceImageUrl,
        });
      }
      setOurServicesSaved(true);
      setTimeout(() => setOurServicesSaved(false), 2500);
    } catch { /* silent */ }
    finally { setOurServicesSaving(false); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    // Title and description are now optional
    if (!svcForm.name.trim() && !svcForm.about.trim() && !serviceImageFile) {
      return setSvcError('Please provide at least a title, description, or image');
    }
    setSvcError(''); setSvcSaving(true);
    try {
      let serviceImageUrl;
      if (serviceImageFile) {
        const fd = new FormData(); fd.append('image', serviceImageFile);
        const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        serviceImageUrl = data.url;
      }
      await api.post(`/hospitals/${hospitalId}/services`, {
        name: svcForm.name || 'Untitled Service',
        about: svcForm.about || undefined,
        ourService: undefined, // Don't save ourService text to individual services
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
    // Title and description are now optional
    if (!editForm.name.trim() && !editForm.about.trim() && !editImageFile && !editItem.serviceImageUrl) {
      return setEditError('Please provide at least a title, description, or image');
    }
    setEditError(''); setEditSaving(true);
    try {
      let serviceImageUrl = editItem.serviceImageUrl;
      if (editImageFile) {
        const fd = new FormData(); fd.append('image', editImageFile);
        const { data } = await api.post('/upload/hospital', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        serviceImageUrl = data.url;
      }
      await api.put(`/hospitals/${hospitalId}/services/${editItem._id}`, {
        name: editForm.name || 'Untitled Service',
        about: editForm.about || undefined,
        ourService: editItem._id === items[0]?._id ? ourServicesText : undefined, // Only save ourService to first service
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Title</label>
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Title</label>
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
              {item.about && (
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{item.about}</p>
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
  const [viewTab, setViewTab] = useState<'details' | 'doctors' | 'ambulances' | 'services'>('details');
  const [form, setForm] = useState(emptyForm);
  const [contactPersons, setContactPersons] = useState<typeof emptyContactPerson[]>([{ ...emptyContactPerson }]);
  const [editContactPersons, setEditContactPersons] = useState<typeof emptyContactPerson[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterUpazila, setFilterUpazila] = useState('');

  useEffect(() => {
    api.get('/hospitals?includeInactive=true').then((r) => setHospitals(r.data)).catch(() => {});
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
      // Validate at least one contact person
      const validContacts = contactPersons.filter(cp => cp.name.trim() && cp.designation.trim() && cp.mobile.trim());
      if (validContacts.length === 0) {
        setError('At least one contact person is required');
        setLoading(false);
        return;
      }

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
        name: form.name, 
        address: form.address,
        division: form.division || undefined,
        district: form.district || undefined,
        upazila: form.upazila || undefined,
        location: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined,
        contactPersons: validContacts,
        logo: logoUrl, 
        coverImage: coverUrl,
      });
      setHospitals((prev) => [...prev, data]);
      setShowModal(false);
      setForm(emptyForm);
      setContactPersons([{ ...emptyContactPerson }]);
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

  const toggleStatus = async (id: string) => {
    try {
      const { data } = await api.patch(`/hospitals/${id}/toggle-status`);
      setHospitals((prev) => prev.map((h) => h._id === id ? data : h));
    } catch (err: any) {
      console.error('Toggle status error:', err.response?.data || err.message);
      alert(`Failed to toggle status: ${err.response?.data?.message || err.message}`);
    }
  };

  const toggleShowInHome = async (id: string) => {
    try {
      const { data } = await api.patch(`/hospitals/${id}/toggle-show-in-home`);
      setHospitals((prev) => prev.map((h) => h._id === id ? data : h));
    } catch (err: any) {
      console.error('Toggle show in home error:', err.response?.data || err.message);
      alert(`Failed to toggle: ${err.response?.data?.message || err.message}`);
    }
  };

  const togglePopular = async (id: string) => {
    try {
      const hospital = hospitals.find(h => h._id === id);
      if (!hospital) return;
      const { data } = await api.patch(`/hospitals/${id}/popular`, { isPopular: !hospital.isPopular });
      setHospitals((prev) => prev.map((h) => h._id === id ? data.hospital : h));
    } catch (err: any) {
      console.error('Toggle popular error:', err.response?.data || err.message);
      alert(`Failed to toggle: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Validate at least one contact person
      const validContacts = editContactPersons.filter(cp => cp.name.trim() && cp.designation.trim() && cp.mobile.trim());
      if (validContacts.length === 0) {
        setError('At least one contact person is required');
        setLoading(false);
        return;
      }

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
        address: editHospital.address,
        division: editHospital.division,
        district: editHospital.district,
        upazila: editHospital.upazila,
        contactPersons: validContacts,
        logo: logoUrl,
        coverImage: coverUrl,
        callActive: editHospital.callActive,
        bookAppointmentActive: editHospital.bookAppointmentActive,
      });
      setHospitals((prev) => prev.map((h) => h._id === data._id ? data : h));
      setEditHospital(null);
      setEditContactPersons([]);
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
    setContactPersons([{ ...emptyContactPerson }]);
    setLogoFile(null); setLogoPreview('');
    setCoverFile(null); setCoverPreview('');
  };

  // Filter hospitals based on search and location
  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivision = !filterDivision || (h as any).division === filterDivision;
    const matchesDistrict = !filterDistrict || (h as any).district === filterDistrict;
    const matchesUpazila = !filterUpazila || (h as any).upazila === filterUpazila;
    return matchesSearch && matchesDivision && matchesDistrict && matchesUpazila;
  });

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { ...emptyContactPerson }]);
  };

  const removeContactPerson = (index: number) => {
    if (contactPersons.length > 1) {
      setContactPersons(contactPersons.filter((_, i) => i !== index));
    }
  };

  const updateContactPerson = (index: number, field: keyof typeof emptyContactPerson, value: string) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
  };

  const addEditContactPerson = () => {
    setEditContactPersons([...editContactPersons, { ...emptyContactPerson }]);
  };

  const removeEditContactPerson = (index: number) => {
    if (editContactPersons.length > 1) {
      setEditContactPersons(editContactPersons.filter((_, i) => i !== index));
    }
  };

  const updateEditContactPerson = (index: number, field: keyof typeof emptyContactPerson, value: string) => {
    const updated = [...editContactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setEditContactPersons(updated);
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
      <div className="grid grid-cols-3 gap-4 mb-6" suppressHydrationWarning>
        {[
          { label: 'Total Hospitals', value: hospitals.length, color: 'bg-blue-50 text-blue-600', icon: '🏥' },
          { label: 'With Contact', value: hospitals.filter((h) => (h as any).contactMobile).length, color: 'bg-green-50 text-green-600', icon: '📞' },
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

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4" suppressHydrationWarning>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-1">
            <input
              type="text"
              placeholder="Search hospital name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          
          {/* Division Filter */}
          <div>
            <select
              value={filterDivision}
              onChange={(e) => {
                setFilterDivision(e.target.value);
                setFilterDistrict('');
                setFilterUpazila('');
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700"
            >
              <option value="">All Divisions</option>
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          {/* District Filter */}
          <div>
            <select
              value={filterDistrict}
              onChange={(e) => {
                setFilterDistrict(e.target.value);
                setFilterUpazila('');
              }}
              disabled={!filterDivision}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">All Districts</option>
              {getDistricts(filterDivision).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          
          {/* Upazila Filter */}
          <div>
            <select
              value={filterUpazila}
              onChange={(e) => setFilterUpazila(e.target.value)}
              disabled={!filterDistrict}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">All Upazilas</option>
              {getUpazilas(filterDivision, filterDistrict).map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        
        {/* Clear Filters */}
        {(searchQuery || filterDivision || filterDistrict || filterUpazila) && (
          <div className="mt-3 flex items-center justify-between" suppressHydrationWarning>
            <p className="text-xs text-gray-500">
              Showing {filteredHospitals.length} of {hospitals.length} hospitals
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDivision('');
                setFilterDistrict('');
                setFilterUpazila('');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Hospital List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['', 'Name', 'Location', 'Contact Person', 'Mobile', 'Status', 'Popular', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHospitals.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-300 text-sm">
                {hospitals.length === 0 ? 'No hospitals found' : 'No hospitals match your filters'}
              </td></tr>
            )}
            {filteredHospitals.map((h) => (
              <tr key={h._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  {(h as any).logo
                    ? <img src={(h as any).logo} alt={h.name} className="w-9 h-9 rounded-lg object-cover" />
                    : <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 text-sm font-bold">{h.name?.[0]}</div>}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{h.name}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  {[h.division, h.district, h.upazila].filter(Boolean).join(', ') || '-'}
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {(h as any).contactPersons && (h as any).contactPersons.length > 0 ? (
                    <div className="space-y-1">
                      {(h as any).contactPersons.slice(0, 2).map((cp: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium">{cp.name}</span>
                          {(h as any).contactPersons.length > 2 && idx === 1 && (
                            <span className="text-gray-400 ml-1">+{(h as any).contactPersons.length - 2} more</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (h as any).contactPersonName || '-'}
                </td>
                <td className="px-5 py-3.5 text-gray-500">
                  {(h as any).contactPersons && (h as any).contactPersons.length > 0 
                    ? (h as any).contactPersons[0].mobile 
                    : (h as any).contactMobile || '-'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    h.status === 'paused' 
                      ? 'bg-gray-100 text-gray-600' 
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {h.status === 'paused' ? '⏸ Paused' : '✓ Active'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => togglePopular(h._id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      h.isPopular
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="14" height="14" fill={h.isPopular ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {h.isPopular ? 'Popular' : 'Not Popular'}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setViewTab('details'); setViewHospital(h); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      View
                    </button>
                    <button 
                      onClick={() => toggleStatus(h._id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        h.status === 'paused'
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {h.status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={() => { 
                      const contacts = (h as any).contactPersons && (h as any).contactPersons.length > 0 
                        ? (h as any).contactPersons 
                        : [{ 
                            name: (h as any).contactPersonName || '', 
                            designation: (h as any).contactPersonDesignation || '', 
                            mobile: (h as any).contactMobile || '', 
                            whatsapp: (h as any).contactWhatsapp || '' 
                          }];
                      setEditHospital({ 
                        ...h, 
                        division: (h as any).division || '', 
                        district: (h as any).district || '', 
                        upazila: (h as any).upazila || ''
                      }); 
                      setEditContactPersons(contacts.filter((c: any) => c.name || c.mobile));
                      setEditLogoFile(null); setEditLogoPreview(''); 
                      setEditCoverFile(null); setEditCoverPreview(''); 
                    }}
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

                {/* Row 3: Hospital Name */}
                <div>
                  <label className={labelCls}>Hospital Name<span className="text-red-400 ml-0.5">*</span></label>
                  <input placeholder="Hospital Name" value={form.name} onChange={set('name')} required className={inputCls} />
                </div>

                {/* Row 4: Contact Persons */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Contact Persons <span className="text-red-400">*</span></label>
                    <button
                      type="button"
                      onClick={addContactPerson}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Person
                    </button>
                  </div>
                  
                  {contactPersons.map((person, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Contact Person #{index + 1}</span>
                        {contactPersons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContactPerson(index)}
                            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Name<span className="text-red-400 ml-0.5">*</span></label>
                          <input
                            placeholder="e.g. Dr. Ahmed"
                            value={person.name}
                            onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Designation<span className="text-red-400 ml-0.5">*</span></label>
                          <input
                            placeholder="e.g. Director, Manager"
                            value={person.designation}
                            onChange={(e) => updateContactPerson(index, 'designation', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Mobile Number<span className="text-red-400 ml-0.5">*</span></label>
                          <input
                            placeholder="01XXXXXXXXX"
                            value={person.mobile}
                            onChange={(e) => updateContactPerson(index, 'mobile', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>WhatsApp Number</label>
                          <input
                            placeholder="01XXXXXXXXX (optional)"
                            value={person.whatsapp}
                            onChange={(e) => updateContactPerson(index, 'whatsapp', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      {/* Toggle Options */}
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Visibility Options</p>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={person.isPublished || false}
                              onChange={(e) => {
                                const updated = [...contactPersons];
                                updated[index] = { ...updated[index], isPublished: e.target.checked };
                                setContactPersons(updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-xs text-gray-700">Published</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={person.isForPatient || false}
                              onChange={(e) => {
                                const updated = [...contactPersons];
                                updated[index] = { ...updated[index], isForPatient: e.target.checked };
                                setContactPersons(updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-green-600"
                            />
                            <span className="text-xs text-gray-700">For Patient</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={person.isForDoctorList || false}
                              onChange={(e) => {
                                const updated = [...contactPersons];
                                updated[index] = { ...updated[index], isForDoctorList: e.target.checked };
                                setContactPersons(updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-orange-600"
                            />
                            <span className="text-xs text-gray-700">For Doctor List</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Row 5: Address, Lat/Lng */}
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
                {(['details', 'doctors', 'ambulances', 'services'] as const).map((t) => (
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
                {viewTab === 'details' ? (
                  <div className="space-y-4">
                    {/* Cover Image */}
                    {viewHospital.coverImage && (
                      <div className="rounded-xl overflow-hidden">
                        <img src={viewHospital.coverImage} alt="Cover" className="w-full h-48 object-cover" />
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Hospital Name</p>
                          <p className="font-medium text-gray-800">{viewHospital.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                            viewHospital.status === 'paused' 
                              ? 'bg-gray-100 text-gray-600' 
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {viewHospital.status === 'paused' ? '⏸ Paused' : '✓ Active'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Address</p>
                          <p className="text-gray-700">{viewHospital.address}</p>
                        </div>
                        {viewHospital.division && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Division</p>
                            <p className="text-gray-700">{viewHospital.division}</p>
                          </div>
                        )}
                        {viewHospital.district && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">District</p>
                            <p className="text-gray-700">{viewHospital.district}</p>
                          </div>
                        )}
                        {viewHospital.upazila && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Upazila</p>
                            <p className="text-gray-700">{viewHospital.upazila}</p>
                          </div>
                        )}
                        {viewHospital.location?.lat && viewHospital.location?.lng && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Coordinates</p>
                            <p className="text-gray-700 font-mono text-xs">
                              {viewHospital.location.lat}, {viewHospital.location.lng}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Persons */}
                    <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Contact Persons
                      </h3>
                      {viewHospital.contactPersons && viewHospital.contactPersons.length > 0 ? (
                        <div className="space-y-3">
                          {viewHospital.contactPersons.map((cp: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">{cp.name}</p>
                                  <p className="text-xs text-gray-500">{cp.designation}</p>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">#{idx + 1}</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span>{cp.mobile}</span>
                                </div>
                                {cp.whatsapp && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    <span>{cp.whatsapp}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No contact persons added</p>
                      )}
                    </div>

                    {/* Toggle Options for Contact Persons */}
                    {viewHospital.contactPersons && viewHospital.contactPersons.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Contact Person Visibility
                        </h3>
                        <p className="text-xs text-gray-500">Edit contact person to change visibility settings</p>
                        <div className="space-y-2">
                          {viewHospital.contactPersons.map((cp: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
                              <p className="text-sm font-semibold text-gray-800 mb-2">{cp.name}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  cp.isPublished ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                                  </svg>
                                  {cp.isPublished ? 'Published' : 'Not Published'}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  cp.isForPatient ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                  </svg>
                                  {cp.isForPatient ? 'For Patient' : 'Not for Patient'}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  cp.isForDoctorList ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                  </svg>
                                  {cp.isForDoctorList ? 'For Doctor List' : 'Not for Doctor List'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <HospitalTabContent hospitalId={String(viewHospital._id)} tab={viewTab} />
                )}
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
                    <label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
                    <input value={editHospital.address} onChange={(e) => setEditHospital((p: any) => ({ ...p, address: e.target.value }))} required className={inputCls} />
                  </div>
                </div>

                {/* Contact Persons */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Contact Persons <span className="text-red-400">*</span></label>
                    <button
                      type="button"
                      onClick={addEditContactPerson}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Person
                    </button>
                  </div>
                  
                  {editContactPersons.map((person, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Contact Person #{index + 1}</span>
                        {editContactPersons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditContactPerson(index)}
                            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Name<span className="text-red-400 ml-0.5">*</span></label>
                          <input
                            value={person.name}
                            onChange={(e) => updateEditContactPerson(index, 'name', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Designation<span className="text-red-400 ml-0.5">*</span></label>
                          <input
                            value={person.designation}
                            onChange={(e) => updateEditContactPerson(index, 'designation', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Mobile Number<span className="text-red-400 ml-0.5">*</span></label>
                          <input
                            value={person.mobile}
                            onChange={(e) => updateEditContactPerson(index, 'mobile', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>WhatsApp Number</label>
                          <input
                            value={person.whatsapp}
                            onChange={(e) => updateEditContactPerson(index, 'whatsapp', e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      {/* Toggle Options */}
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Visibility Options</p>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={person.isPublished || false}
                              onChange={(e) => {
                                const updated = [...editContactPersons];
                                updated[index] = { ...updated[index], isPublished: e.target.checked };
                                setEditContactPersons(updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-xs text-gray-700">Published</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={person.isForPatient || false}
                              onChange={(e) => {
                                const updated = [...editContactPersons];
                                updated[index] = { ...updated[index], isForPatient: e.target.checked };
                                setEditContactPersons(updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-green-600"
                            />
                            <span className="text-xs text-gray-700">For Patient</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={person.isForDoctorList || false}
                              onChange={(e) => {
                                const updated = [...editContactPersons];
                                updated[index] = { ...updated[index], isForDoctorList: e.target.checked };
                                setEditContactPersons(updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-orange-600"
                            />
                            <span className="text-xs text-gray-700">For Doctor List</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className={labelCls}>Address<span className="text-red-400 ml-0.5">*</span></label>
                  <textarea value={editHospital.address} onChange={(e) => setEditHospital((p: any) => ({ ...p, address: e.target.value }))} required rows={2}
                    className={`${inputCls} resize-none`} />
                </div>

                {/* Hospital Active Status Toggles */}
                <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
                  <p className="text-sm font-semibold text-gray-700">Hospital Services Status</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editHospital.callActive !== false}
                        onChange={(e) => setEditHospital((p: any) => ({ ...p, callActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Call Active</p>
                        <p className="text-xs text-gray-500">Allow patients to call this hospital</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editHospital.bookAppointmentActive !== false}
                        onChange={(e) => setEditHospital((p: any) => ({ ...p, bookAppointmentActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-green-600"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Book Appointment Active</p>
                        <p className="text-xs text-gray-500">Allow patients to book appointments</p>
                      </div>
                    </label>
                  </div>
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
