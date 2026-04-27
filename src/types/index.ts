export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin' | 'ambulance_user';
  isActive: boolean;
}

export interface AmbulanceRequest {
  _id: string;
  patientId: User;
  pickupLocation: { lat: number; lng: number; address: string };
  status: 'pending' | 'bidding' | 'accepted' | 'completed' | 'cancelled';
  acceptedBidId?: AmbulanceBid;
  notes?: string;
  createdAt: string;
}

export interface AmbulanceBid {
  _id: string;
  requestId: string;
  ambulanceUserId: User;
  hospitalId: Hospital;
  estimatedTime: number;
  estimatedDistance: number;
  fare: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Doctor {
  _id: string;
  userId: User;
  bmdcNumber: string;
  specialization?: string;
  specializations: string[];
  experience: number;
  fees: number;
  bio: string;
  isApproved: boolean;
  hospitalId?: Hospital;
  hospitalIds?: Hospital[];
  profileImage?: string;
  location?: { division?: string; district?: string; upazila?: string };
  schedule: { day: string; startTime: string; endTime: string }[];
}

export interface Hospital {
  _id: string;
  name: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  location?: { lat: number; lng: number };
  contactPersons?: Array<{
    name: string;
    designation: string;
    mobile: string;
    whatsapp?: string;
  }>;
  status?: 'active' | 'paused';
  showInHome?: boolean;  // New field
  // Legacy fields for backward compatibility
  contactPersonName?: string;
  contactPersonDesignation?: string;
  contactMobile?: string;
  contactWhatsapp?: string;
  contact?: string;
  logo?: string;
  coverImage?: string;
}

export interface Appointment {
  _id: string;
  patientId: User;
  doctorId: Doctor;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
}

export interface Ambulance {
  _id: string;
  ambulanceName: string;
  driverName: string;
  phone: string;
  email?: string;
  vehicleNumber: string;
  ambulanceType: 'AC' | 'Non-AC';
  address: string;
  status: 'available' | 'busy' | 'inactive';
  hospitalId?: Hospital;
  userId?: User;
  driverImage?: string;
  ambulanceImage?: string;
  documents?: {
    drivingLicence?: string;
    nid?: string;
    carDocument?: string;
  };
}
