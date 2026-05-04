'use client';
import { useState } from 'react';
import { Doctor } from '@/types';

interface DoctorViewModalProps {
  doctor: Doctor;
  onClose: () => void;
  onEdit: (doctor: Doctor) => void;
}

const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

export default function DoctorViewModal({ doctor, onClose, onEdit }: DoctorViewModalProps) {
  const [activeTab, setActiveTab] = useState(0); // 0=Details, 1=Diseases, 2=Education

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="min-h-full flex items-start justify-center p-6 py-10">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <h2 className="text-base font-semibold text-gray-800">view-Doctor Details and Edit</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profile Header */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{doctor.userId?.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {doctor.isApproved ? (
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-green-50 text-green-600">Approved</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600">Pending</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="px-6 pb-3">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setActiveTab(0)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Diseases
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 2 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Education/Experience
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Details Tab */}
            {activeTab === 0 && (
              <>
                {/* Account Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {doctor.userId?.name || '—'}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {doctor.userId?.phone || '—'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>BMDC Number</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-mono">
                        {doctor.bmdcNumber || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Specialization</p>
                  <div className="min-h-[50px] border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    {(doctor.specializations?.length ? doctor.specializations : [doctor.specialization]).filter(Boolean).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(doctor.specializations?.length ? doctor.specializations : [doctor.specialization]).filter(Boolean).map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No specializations added</p>
                    )}
                  </div>
                </div>

                {/* Professional Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Professional Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Experience (years)</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700">
                        {doctor.experience || 0} years
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Consultation Fee (৳)</label>
                      <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-semibold">
                        ৳{doctor.fees}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hospital Assignment */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hospital Assignment</p>
                  <div className="min-h-[80px] border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    {(doctor.hospitalIds?.length || doctor.hospitalId) ? (
                      <div className="space-y-2">
                        {doctor.hospitalIds?.length ? (
                          doctor.hospitalIds.map((h, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-100">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">{h.name}</p>
                                <p className="text-xs text-gray-400">Multiple hospitals assigned</p>
                              </div>
                            </div>
                          ))
                        ) : doctor.hospitalId ? (
                          <div className="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-100">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">{doctor.hospitalId.name}</p>
                              <p className="text-xs text-gray-400">Primary hospital</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No hospitals assigned</p>
                    )}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Locations</p>
                  <div className="min-h-[50px] border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    {((doctor as any).locations && (doctor as any).locations.length > 0) ? (
                      <div className="space-y-2">
                        {(doctor as any).locations.map((loc: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-1">
                                {loc.division && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{loc.division}</span>}
                                {loc.district && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">{loc.district}</span>}
                                {loc.upazila && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{loc.upazila}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (doctor.location?.division || doctor.location?.district || doctor.location?.upazila) ? (
                      <div className="flex flex-wrap gap-1">
                        {doctor.location?.division && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">{doctor.location.division}</span>}
                        {doctor.location?.district && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">{doctor.location.district}</span>}
                        {doctor.location?.upazila && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{doctor.location.upazila}</span>}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No locations added</p>
                    )}
                  </div>
                </div>

                {/* Departments */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Departments</p>
                  <div className="min-h-[50px] border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    {doctor.departments?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {doctor.departments.map((dept, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                            {dept.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No departments assigned</p>
                    )}
                  </div>
                </div>

                {/* About */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">About Doctor</p>
                  <div className="min-h-[80px] border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    {doctor.bio ? (
                      <div 
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}
                        dangerouslySetInnerHTML={{ __html: doctor.bio }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400">No bio provided</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Diseases Tab */}
            {activeTab === 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Diseases Information</p>
                {(doctor as any).diseasesTitle || (doctor as any).diseasesDescription ? (
                  <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    {(doctor as any).diseasesTitle && (
                      <h3 className="text-base font-bold text-gray-800 mb-3">{(doctor as any).diseasesTitle}</h3>
                    )}
                    {(doctor as any).diseasesDescription && (
                      <div 
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}
                        dangerouslySetInnerHTML={{ __html: (doctor as any).diseasesDescription }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl px-4 py-8 bg-gray-50 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">No diseases information added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click Edit to add diseases information</p>
                  </div>
                )}
              </div>
            )}

            {/* Education/Experience Tab */}
            {activeTab === 2 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Education/Experience Information</p>
                {(doctor as any).educationExperience && (doctor as any).educationExperience.length > 0 ? (
                  <div className="space-y-3">
                    {(doctor as any).educationExperience.map((edu: any, i: number) => (
                      <div key={i} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">{edu.title}</p>
                            <div 
                              className="text-xs text-gray-600 mt-2 prose prose-sm max-w-none"
                              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}
                              dangerouslySetInnerHTML={{ __html: edu.description }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl px-4 py-8 bg-gray-50 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-sm text-gray-400">No education/experience information added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click Edit to add education/experience entries</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-5">
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button 
                onClick={() => {
                  onClose();
                  onEdit(doctor);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" 
                style={{ background: '#2B3EE6' }}
              >
                Edit Doctor
              </button>
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
