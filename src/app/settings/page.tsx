'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    api.get('/users/me').then((r) => {
      setProfile({ name: r.data.name, email: r.data.email, phone: r.data.phone });
    }).catch(() => {});
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true); setProfileError(''); setProfileSuccess('');
    try {
      await api.put('/users/me', profile);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('New passwords do not match'); return;
    }
    if (passwords.newPassword.length < 6) {
      setPassError('Password must be at least 6 characters'); return;
    }
    setPassLoading(true); setPassError(''); setPassSuccess('');
    try {
      await api.put('/users/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPassSuccess('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(''), 3000);
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Failed to change password');
    } finally { setPassLoading(false); }
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-6">

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Profile Information</h2>
              <p className="text-xs text-gray-400">Update your account details</p>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileError && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{profileError}</p>}
            {profileSuccess && <p className="text-xs text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">{profileSuccess}</p>}
            <div>
              <label className={labelCls}>Full Name</label>
              <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" required className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="Email address" type="email" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone number" required className={inputCls} />
              </div>
            </div>
            <div className="pt-1">
              <button type="submit" disabled={profileLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: '#2B3EE6' }}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="text-orange-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Change Password</h2>
              <p className="text-xs text-gray-400">Keep your account secure</p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passError && <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{passError}</p>}
            {passSuccess && <p className="text-xs text-green-600 bg-green-50 px-4 py-2.5 rounded-xl">{passSuccess}</p>}
            <div>
              <label className={labelCls}>Current Password</label>
              <input value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} type="password" placeholder="Enter current password" required className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>New Password</label>
                <input value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} type="password" placeholder="New password" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input value={passwords.confirmPassword} onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))} type="password" placeholder="Confirm password" required className={inputCls} />
              </div>
            </div>
            <div className="pt-1">
              <button type="submit" disabled={passLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: '#2B3EE6' }}>
                {passLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
}
