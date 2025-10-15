'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseClient } from '../components/SupabaseClientProvider';

export default function RecoverPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Gagal mengirim email reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[#111827]">
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-[1200px] w-full bg-[#1f2937] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* Left Side - Branding (Desktop only) */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#4b5563] to-[#374151] p-12 xl:p-[60px] flex-col justify-center text-white">
          <div className="max-w-[450px]">
            <Link href="/" className="no-underline text-white">
              <h1 className="text-5xl mb-6 cursor-pointer">🛍️ Toko Monggo</h1>
            </Link>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Lupa Kata Sandi?</h2>
            <p className="text-base leading-relaxed opacity-90 mb-10">
              Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan link untuk mereset kata sandi Anda.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Aman & Terpercaya</span>
              </div>
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Proses Cepat</span>
              </div>
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Email Terenkripsi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Recovery Form */}
        <div className="p-10 md:p-12 xl:p-[60px] flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h2 className="text-3xl md:text-[32px] font-bold mb-3 text-[#f9fafb]">Reset Kata Sandi</h2>
              <p className="text-[15px] text-[#9ca3af]">
                Ingat kata sandi?{' '}
                <Link href="/login" className="text-[#4b5563] font-semibold hover:text-[#374151] hover:underline">
                  Masuk sekarang
                </Link>
              </p>
            </div>

            {success ? (
              <div className="text-center py-10 px-5">
                <div className="text-[64px] mb-6">
                  ✉️
                </div>
                <h3 className="text-[22px] font-semibold text-[#f9fafb] mb-3">
                  Email Terkirim!
                </h3>
                <p className="text-[15px] text-[#9ca3af] mb-6 leading-relaxed">
                  Kami telah mengirimkan link reset password ke <strong>{email}</strong>.
                  <br />
                  Silakan cek inbox atau folder spam Anda.
                </p>
                <div className="p-4 bg-[rgba(99,102,241,0.1)] border border-[#4b5563] rounded-lg mb-6">
                  <p className="text-[13px] text-[#9ca3af] m-0">
                    💡 Link akan kadaluarsa dalam 1 jam
                  </p>
                </div>
                <button
                  className="w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px"
                  onClick={() => router.push('/login')}
                >
                  Kembali ke Login
                </button>
                <button
                  className="w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px mt-3"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                >
                  Kirim Ulang Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mb-8">
                {error && (
                  <div className="p-3 px-4 bg-[rgba(239,68,68,0.1)] border border-[#ef4444] rounded-lg text-[#ef4444] text-sm mb-5">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
                    autoFocus
                  />
                  <p className="text-[13px] text-[#9ca3af] mt-2">
                    Masukkan email yang terdaftar di akun Anda
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Link Reset'
                  )}
                </button>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-[#4b5563] font-semibold hover:text-[#374151] hover:underline">
                    ← Kembali ke Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
