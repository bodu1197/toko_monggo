'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseClient } from '../components/SupabaseClientProvider';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  const checkRecoveryToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setError('Link reset password tidak valid atau sudah kadaluarsa.');
        return;
      }

      // Additional validation: Check session type
      if (session.user.recovery_sent_at) {
        const recoveryTime = new Date(session.user.recovery_sent_at).getTime();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // Check if recovery link is older than 1 hour
        if (now - recoveryTime > oneHour) {
          setError('Link reset password sudah kadaluarsa. Silakan minta link baru.');
          return;
        }
      }

      setIsValidToken(true);
    } catch (error) {
      console.error('Token check error:', error);
      setError('Terjadi kesalahan. Silakan minta link reset baru.');
    }
  }, [supabase, setError, setIsValidToken]);

  useEffect(() => {
    // Check if user has valid recovery token
    checkRecoveryToken();
  }, [checkRecoveryToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter!');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok!');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      alert('Kata sandi berhasil diubah! Silakan login dengan kata sandi baru.');
      router.push('/login');
    } catch (error) {
      console.error('Password update error:', error);
      setError(error.message || 'Gagal mengubah kata sandi');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken && error) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center p-5">
        <div className="w-full max-w-[500px]">
          <div className="bg-[#1f2937] border border-[#374151] rounded-2xl p-10 text-center">
            <div className="text-[64px] mb-6">⚠️</div>
            <h2 className="text-[24px] font-semibold text-[#f9fafb] mb-3">
              Link Tidak Valid
            </h2>
            <p className="text-[15px] text-[#9ca3af] mb-6 leading-relaxed">
              {error}
            </p>
            <button
              className="w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px"
              onClick={() => router.push('/recover')}
            >
              Minta Link Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] grid md:grid-cols-2">
      {/* Left Side - Branding (PC only) */}
      <div className="hidden md:flex items-center justify-center p-12 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]">
        <div className="max-w-[500px]">
          <Link href="/" className="no-underline text-inherit">
            <h1 className="text-[42px] font-bold text-white mb-8 cursor-pointer">🛍️ TokoMonggo</h1>
          </Link>
          <h2 className="text-[32px] font-bold text-white mb-4">Buat Kata Sandi Baru</h2>
          <p className="text-[17px] text-white/90 mb-8 leading-relaxed">
            Masukkan kata sandi baru untuk akun Anda. Pastikan kata sandi kuat dan mudah diingat.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-white text-xl">✓</span>
              <span className="text-white/90 text-[15px]">Minimal 8 Karakter</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-xl">✓</span>
              <span className="text-white/90 text-[15px]">Kombinasi Huruf & Angka</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-xl">✓</span>
              <span className="text-white/90 text-[15px]">Aman & Terenkripsi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex items-center justify-center p-5 md:p-12">
        <div className="w-full max-w-[480px]">
          <div className="bg-[#1f2937] border border-[#374151] rounded-2xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-[28px] font-bold text-[#f9fafb] mb-2">Reset Kata Sandi</h2>
              <p className="text-[15px] text-[#9ca3af]">
                Masukkan kata sandi baru Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-3 md:p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm mb-5">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-[#9ca3af] mb-2">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] pr-12"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#f9fafb] transition-colors bg-transparent border-none cursor-pointer p-0 text-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-[13px] text-[#9ca3af] mt-2">
                  Gunakan minimal 8 karakter dengan kombinasi huruf dan angka
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#9ca3af] mb-2">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    required
                    className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280] pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#f9fafb] transition-colors bg-transparent border-none cursor-pointer p-0 text-lg"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {password && confirmPassword && (
                <div className={`p-3 md:p-4 rounded-lg text-sm ${
                  password === confirmPassword
                    ? 'bg-green-500/10 border border-green-500 text-green-500'
                    : 'bg-red-500/10 border border-red-500 text-red-500'
                }`}>
                  {password === confirmPassword ? '✓ Kata sandi cocok' : '✗ Kata sandi tidak cocok'}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memproses...
                  </>
                ) : (
                  'Reset Kata Sandi'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
