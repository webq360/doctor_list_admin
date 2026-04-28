'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { Appointment } from '@/types';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-500',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-600' },
  completed: { bg: 'bg-green-50', text: 'text-green-600' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-500' },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
  const [statusChangeModal, setStatusChangeModal] = useState<{ appointmentId: string; newStatus: string } | null>(null);
  const [statusChangeMessage, setStatusChangeMessage] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments/all');
      setAppointments(response.data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, message?: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status, statusChangeMessage: message });
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: status as Appointment['status'], statusChangeMessage: message } : a)));
      setStatusChangeModal(null);
      setStatusChangeMessage('');
      if (viewAppointment?._id === id) {
        setViewAppointment({ ...viewAppointment, status: status as Appointment['status'], statusChangeMessage: message });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update appointment status');
    }
  };

  const filteredAppointments = appointments.filter(a => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const patientMatch = a.patientId?.name?.toLowerCase().includes(search);
      const doctorMatch = a.doctorId?.userId?.name?.toLowerCase().includes(search);
      const hospitalMatch = (a as any).hospitalId?.name?.toLowerCase().includes(search);
      if (!patientMatch && !doctorMatch && !hospitalMatch) return false;
    }

    // Status filter
    if (statusFilter && a.status !== statusFilter) return false;

    // Date filter
    if (dateFilter && a.date !== dateFilter) return false;

    return true;
  });

  const stats = [
    { label: 'Total Appointments', value: filteredAppointments.length, color: 'bg-blue-50 text-blue-600', icon: '📅' },
    { label: 'Pending', value: filteredAppointments.filter(a => a.status === 'pending').length, color: 'bg-amber-50 text-amber-600', icon: '⏳' },
    { label: 'Confirmed', value: filteredAppointments.filter(a => a.status === 'confirmed').length, color: 'bg-blue-50 text-blue-600', icon: '✅' },
    { label: 'Completed', value: filteredAppointments.filter(a => a.status === 'completed').length, color: 'bg-green-50 text-green-600', icon: '🎉' },
    { label: 'Cancelled', value: filteredAppointments.filter(a => a.status === 'cancelled').length, color: 'bg-red-50 text-red-500', icon: '❌' },
  ];

  return (
    <AdminLayout title="Appointments">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 flex items-center gap-3 ${s.color}`}>
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 p-4 bg-white rounded-2xl border border-gray-100">
        <div className="grid grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by patient, doctor, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
          />
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter || dateFilter) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDateFilter('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Patient', 'Doctor', 'Hospital', 'Date', 'Time', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-300 text-sm">
                  {(searchTerm || statusFilter || dateFilter) ? 'No appointments found matching your filters' : 'No appointments found'}
                </td>
              </tr>
            )}
            {filteredAppointments.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-700">{a.patientId?.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.doctorId?.userId?.name}</td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{(a as any).hospitalId?.name || '—'}</td>
                <td className="px-5 py-3.5 text-gray-500">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-gray-500">{a.time}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusStyle[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewAppointment(a)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      View
                    </button>
                    <select
                      value={a.status}
                      onChange={(e) => {
                        if (e.target.value !== a.status) {
                          setStatusChangeModal({ appointmentId: a._id, newStatus: e.target.value });
                        }
                        e.target.value = a.status;
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Appointment Details</h2>
                <button
                  onClick={() => setViewAppointment(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Appointment Booker Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Appointment Booked By</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {viewAppointment.patientId?.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {viewAppointment.patientId?.phone || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment For Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Patient Details</p>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-blue-600">Appointment Type: </span>
                      <span className="text-sm text-blue-900 font-semibold">{viewAppointment.patientType || 'Myself'}</span>
                    </div>
                    
                    {viewAppointment.patientType === 'Others' ? (
                      <div className="space-y-2 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Patient Name</label>
                            <div className="text-sm text-blue-900 font-medium">{viewAppointment.patientName || '—'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Mobile Number</label>
                            <div className="text-sm text-blue-900 font-medium font-mono">{viewAppointment.patientMobile || '—'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Age</label>
                            <div className="text-sm text-blue-900 font-medium">{viewAppointment.patientAge ? `${viewAppointment.patientAge} years` : '—'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Gender</label>
                            <div className="text-sm text-blue-900 font-medium">{viewAppointment.patientGender || '—'}</div>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-blue-600 mb-1">Address</label>
                            <div className="text-sm text-blue-900">{viewAppointment.patientAddress || '—'}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-3">
                        <p className="text-sm text-blue-700 font-medium">Appointment for the user themselves</p>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Age</label>
                            <div className="text-sm text-blue-900 font-medium">{viewAppointment.patientAge ? `${viewAppointment.patientAge} years` : '—'}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-600 mb-1">Gender</label>
                            <div className="text-sm text-blue-900 font-medium">{viewAppointment.patientGender || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Doctor Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Doctor Name</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium">
                        {viewAppointment.doctorId?.userId?.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Specialization</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {viewAppointment.doctorId?.specializations?.[0] || viewAppointment.doctorId?.specialization || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Experience</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {viewAppointment.doctorId?.experience || 0} years
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Consultation Fee</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium">
                        ৳{viewAppointment.doctorId?.fees}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Departments</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50">
                        {viewAppointment.doctorId?.departments && viewAppointment.doctorId.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {viewAppointment.doctorId.departments.map((dept: any, i: number) => (
                              <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {typeof dept === 'string' ? dept : dept.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No departments assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Schedule */}
                {(() => {
                  // Get hospital-specific schedule if available
                  const appointmentHospitalId = (viewAppointment as any).hospitalId?._id;
                  const appointmentHospitalName = (viewAppointment as any).hospitalId?.name;
                  
                  const hospitalSchedule = appointmentHospitalId && viewAppointment.doctorId?.hospitalSchedules?.find(
                    (hs: any) => (typeof hs.hospitalId === 'string' ? hs.hospitalId : hs.hospitalId?._id) === appointmentHospitalId
                  );
                  
                  const scheduleToShow = hospitalSchedule?.schedule?.length > 0 
                    ? hospitalSchedule.schedule 
                    : viewAppointment.doctorId?.schedule;

                  return scheduleToShow && scheduleToShow.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Doctor Schedule
                      </p>
                      
                      {/* Hospital Info */}
                      <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-1">Hospital:</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {appointmentHospitalName || 'Not specified'}
                        </p>
                        {hospitalSchedule && (
                          <p className="text-xs text-blue-600 mt-1">Hospital-specific schedule</p>
                        )}
                        {!hospitalSchedule && (
                          <p className="text-xs text-blue-600 mt-1">Using global schedule</p>
                        )}
                      </div>

                      {/* Schedule Table */}
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Day</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Start Time</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">End Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scheduleToShow.map((s: any, i: number) => (
                              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-700 font-medium">{s.day}</td>
                                <td className="px-3 py-2 text-gray-600">{s.startTime || '—'}</td>
                                <td className="px-3 py-2 text-gray-600">{s.endTime || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Appointment Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Appointment Details</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium">
                        {new Date(viewAppointment.date).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium">
                        {viewAppointment.time}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Serial Number</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-mono font-medium">
                        {viewAppointment.serialNumber || '—'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <div className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium capitalize ${statusColors[viewAppointment.status].bg} ${statusColors[viewAppointment.status].text}`}>
                        {viewAppointment.status}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Change Status</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value !== viewAppointment.status) {
                            setStatusChangeModal({ appointmentId: viewAppointment._id, newStatus: e.target.value });
                          }
                          e.target.value = viewAppointment.status;
                        }}
                        value={viewAppointment.status}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hospital */}
                {(viewAppointment as any).hospitalId && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hospital Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hospital Name</label>
                        <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium">
                          {(viewAppointment as any).hospitalId?.name}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                        <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                          {(viewAppointment as any).hospitalId?.address || '—'}
                        </div>
                      </div>
                      {(viewAppointment as any).hospitalId?.contactPersons && (viewAppointment as any).hospitalId.contactPersons.length > 0 ? (
                        (viewAppointment as any).hospitalId.contactPersons.map((contact: any, idx: number) => (
                          <div key={idx} className="col-span-2 p-3 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-xs font-semibold text-green-700 mb-2">Contact Person {idx + 1}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-green-600 font-medium">Name</p>
                                <p className="text-sm text-green-900 font-medium">{contact.name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-green-600 font-medium">Designation</p>
                                <p className="text-sm text-green-900">{contact.designation}</p>
                              </div>
                              <div>
                                <p className="text-xs text-green-600 font-medium">Mobile</p>
                                <p className="text-sm text-green-900 font-mono">{contact.mobile}</p>
                              </div>
                              {contact.whatsapp && (
                                <div>
                                  <p className="text-xs text-green-600 font-medium">WhatsApp</p>
                                  <p className="text-sm text-green-900 font-mono">{contact.whatsapp}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-sm text-gray-500">No contact persons available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewAppointment.notes && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 whitespace-pre-wrap">
                      {viewAppointment.notes}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setViewAppointment(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusChangeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">
                  {statusChangeModal.newStatus === 'confirmed' && 'Confirm Appointment'}
                  {statusChangeModal.newStatus === 'completed' && 'Mark as Completed'}
                  {statusChangeModal.newStatus === 'cancelled' && 'Cancel Appointment'}
                  {statusChangeModal.newStatus === 'pending' && 'Mark as Pending'}
                </h2>
                <button
                  onClick={() => {
                    setStatusChangeModal(null);
                    setStatusChangeMessage('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {statusChangeModal.newStatus === 'confirmed' && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Serial Number:</span> {viewAppointment?.serialNumber}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {statusChangeModal.newStatus === 'confirmed' && 'Confirmation Message'}
                    {statusChangeModal.newStatus === 'completed' && 'Completion Message'}
                    {statusChangeModal.newStatus === 'cancelled' && 'Cancellation Reason'}
                    {statusChangeModal.newStatus === 'pending' && 'Message'}
                  </label>
                  <p className="text-xs text-gray-400 mb-2">This message will be sent to the patient</p>
                  <textarea
                    placeholder={
                      statusChangeModal.newStatus === 'confirmed' ? 'e.g., Your appointment has been confirmed. Please arrive 10 minutes early.' :
                      statusChangeModal.newStatus === 'completed' ? 'e.g., Thank you for visiting. Take care!' :
                      statusChangeModal.newStatus === 'cancelled' ? 'e.g., Appointment cancelled due to doctor unavailability.' :
                      'Enter message for patient'
                    }
                    value={statusChangeMessage}
                    onChange={(e) => setStatusChangeMessage(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => updateStatus(statusChangeModal.appointmentId, statusChangeModal.newStatus, statusChangeMessage)}
                    disabled={!statusChangeMessage.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
                    style={{ background: '#2B3EE6' }}
                  >
                    {statusChangeModal.newStatus === 'confirmed' && 'Send Confirmation'}
                    {statusChangeModal.newStatus === 'completed' && 'Mark Completed'}
                    {statusChangeModal.newStatus === 'cancelled' && 'Cancel Appointment'}
                    {statusChangeModal.newStatus === 'pending' && 'Update Status'}
                  </button>
                  <button
                    onClick={() => {
                      setStatusChangeModal(null);
                      setStatusChangeMessage('');
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
