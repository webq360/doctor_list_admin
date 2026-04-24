'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'admin') {
        setError('Access denied. Admins only.');
        return;
      }
      Cookies.set('token', data.token, { expires: 7 });
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: 'Manage Doctors',
      desc: 'Approve and control all doctor profiles',
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: 'Manage Hospitals',
      desc: 'Add, edit and remove hospital listings',
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics',
      desc: 'Track appointments and platform stats',
    },
  ];

  return (
    <div className="min-h-screen flex" suppressHydrationWarning>

      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex w-[55%] flex-col items-center justify-center relative overflow-hidden px-16"
        style={{ background: 'linear-gradient(160deg, #3347F0 0%, #2B3EE6 100%)' }}
      >
        {/* Big decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="absolute -bottom-28 -right-16 w-[420px] h-[420px] rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }} />

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="14" r="8" fill="white" />
                <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16"
                  stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="36" cy="33" r="5.5" stroke="white" strokeWidth="2.5" fill="none" />
                <line x1="39.9" y1="36.9" x2="43" y2="40"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-white text-3xl font-bold tracking-tight">Doctor List</h1>
            <p className="text-blue-200 text-sm mt-1.5">Super Admin Control Panel</p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 rounded-2xl px-5 py-4"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F6FA] px-6">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#2B3EE6' }}>
              <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="11" r="6" fill="white" />
                <path d="M6 31c0-6.627 5.373-12 12-12s12 5.373 12 12"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-800">Doctor List</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-9">

            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-400 text-sm mt-1 mb-8">Sign in to your admin account</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-[#2B3EE6] transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="admin@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-[#2B3EE6] transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-300"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="text-gray-300 hover:text-gray-500 transition-colors">
                    {showPass ? (
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] mt-2"
                style={{ background: 'linear-gradient(135deg, #4158F5 0%, #2B3EE6 100%)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>

            </form>

            <p className="text-center text-xs text-gray-300 mt-6">
              Admin access only. Unauthorized access is prohibited.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
