'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseClient } from '../components/SupabaseClientProvider';
import { isValidEmail, getSafeErrorMessage, rateLimiter } from '../utils/security';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Rate limiting check - 5 attempts per 15 minutes
    const rateLimitKey = `login_${email}`;
    if (!rateLimiter.isAllowed(rateLimitKey, 5, 900000)) {
      const resetTime = Math.ceil(rateLimiter.getResetTime(rateLimitKey) / 1000 / 60);
      setError(`Terlalu banyak percobaan login. Silakan coba lagi dalam ${resetTime} menit.`);
      return;
    }

    // Validate email format
    const sanitizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(sanitizedEmail)) {
      setError('Format email tidak valid');
      return;
    }

    if (!password || password.length < 1) {
      setError('Password harus diisi');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (signInError) throw signInError;

      if (data?.user) {
        // Reset rate limit on successful login
        rateLimiter.reset(rateLimitKey);

        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);

      // Use safe error message - don't reveal if email exists or not
      const safeMessage = getSafeErrorMessage(error);

      // Generic message for login errors to prevent user enumeration
      if (error.message?.includes('Invalid login credentials') ||
          error.message?.includes('Email not confirmed')) {
        setError('Email atau kata sandi salah');
      } else {
        setError(safeMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      setError('Gagal masuk dengan Google');
    }
  };

  // Apple Login - Disabled for now
  // const handleAppleLogin = async () => {
  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider: 'apple',
  //       options: {
  //         redirectTo: `${window.location.origin}/auth/callback`,
  //       },
  //     });
  //     if (error) throw error;
  //   } catch (error) {
  //     console.error('Apple login error:', error);
  //     setError('Gagal masuk dengan Apple');
  //   }
  // };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[#111827]">
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-[1200px] w-full bg-[#1f2937] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* Left Side - Branding (Desktop only) */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#4b5563] to-[#374151] p-12 xl:p-[60px] flex-col justify-center text-white">
          <div className="max-w-[450px]">
            <Link href="/" className="no-underline text-white">
              <h1 className="text-5xl mb-6 cursor-pointer">🛍️ Toko Monggo</h1>
            </Link>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Selamat Datang Kembali!</h2>
            <p className="text-base leading-relaxed opacity-90 mb-10">
              Platform marketplace terpercaya untuk jual beli barang bekas berkualitas di Indonesia
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Transaksi Aman</span>
              </div>
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Harga Terbaik</span>
              </div>
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Mudah Digunakan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-10 md:p-12 xl:p-[60px] flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h2 className="text-3xl md:text-[32px] font-bold mb-3 text-[#f9fafb]">Masuk ke Akun</h2>
              <p className="text-[15px] text-[#9ca3af]">
                Belum punya akun?{' '}
                <Link href="/signup" className="text-[#4b5563] font-semibold hover:text-[#374151] hover:underline">
                  Daftar sekarang
                </Link>
              </p>
            </div>

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
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-[#9ca3af] mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#111827] border border-[#374151] text-[#f9fafb] py-3 px-4 rounded-lg text-sm transition-all outline-none font-[inherit] focus:border-[#4b5563] focus:shadow-[0_0_0_3px_rgba(75,85,99,0.1)] placeholder:text-[#6b7280]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-xl p-2 text-[#6b7280] transition-colors duration-300 hover:text-[#f9fafb]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#9ca3af]">
                  <input type="checkbox" className="w-auto cursor-pointer" />
                  <span>Ingat saya</span>
                </label>
                <Link href="/recover" className="text-[#4b5563] font-semibold text-sm hover:text-[#374151] hover:underline">
                  Lupa kata sandi?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-[#4b5563] text-white hover:bg-[#374151] hover:-translate-y-px ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <div className="relative text-center my-8">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#374151]"></div>
              <span className="relative bg-[#1f2937] px-4 text-[#6b7280] text-sm">atau masuk dengan</span>
            </div>

            <div className="w-full">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#374151] border border-[#4b5563] text-[#f9fafb] font-medium rounded-lg transition-all duration-300 hover:bg-[#111827] hover:border-[#4b5563]"
                onClick={handleGoogleLogin}
              >
                <svg className="text-[#4285F4] font-bold" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              {/* Apple Login - Disabled
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 bg-[#374151] border border-[#4b5563] text-[#f9fafb] font-medium rounded-lg transition-all duration-300 hover:bg-[#111827] hover:border-[#4b5563]"
                onClick={handleAppleLogin}
              >
                <svg className="text-white w-[27px] h-[27px] text-[27px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
              */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
