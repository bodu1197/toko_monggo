'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseClient } from '../components/SupabaseClientProvider';
import { sanitizeInput, validatePassword, isValidEmail, getSafeErrorMessage, rateLimiter } from '../utils/security';

export default function SignupPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const generateAvatar = (name) => {
    const seed = encodeURIComponent(name || Math.random().toString());
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Rate limiting check
    const rateLimitKey = `signup_${formData.email}`;
    if (!rateLimiter.isAllowed(rateLimitKey, 3, 300000)) { // 3 attempts per 5 minutes
      const resetTime = Math.ceil(rateLimiter.getResetTime(rateLimitKey) / 1000 / 60);
      setError(`Terlalu banyak percobaan. Silakan coba lagi dalam ${resetTime} menit.`);
      return;
    }

    // Validate and sanitize inputs
    const sanitizedName = sanitizeInput(formData.name);
    const sanitizedEmail = formData.email.trim().toLowerCase();

    if (!sanitizedName || sanitizedName.length < 2) {
      setError('Nama minimal 2 karakter');
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      setError('Format email tidak valid');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok!');
      return;
    }

    setLoading(true);

    try {
      const avatarUrl = generateAvatar(sanitizedName);

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: sanitizedName,
            avatar_url: avatarUrl,
          },
        },
      });

      if (signUpError) {
        console.error('=== SIGNUP ERROR DETAILS ===');
        console.error('Message:', signUpError.message);
        console.error('Status:', signUpError.status);
        console.error('Full error:', JSON.stringify(signUpError, null, 2));
        console.error('===========================');

        if (signUpError.message?.includes('Database error')) {
          console.error('🚨 DATABASE NOT CONFIGURED!');
          console.error('📝 Please run: supabase/migrations/00_complete_tokomonggo_schema.sql');
          console.error('📖 See: URGENT_FIX_DATABASE.md for instructions');
          throw new Error('⚠️ Database belum dikonfigurasi! Buka file URGENT_FIX_DATABASE.md untuk instruksi.');
        }
        throw signUpError;
      }

      if (authData?.user) {
        // Reset rate limit on success
        rateLimiter.reset(rateLimitKey);

        alert('✅ Pendaftaran berhasil!\n\n📧 Email verifikasi telah dikirim dari Supabase Auth ke ' + sanitizedEmail + '\n\nSilakan cek inbox atau folder spam Anda untuk verifikasi akun.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);

      // Use safe error message to prevent information disclosure
      const safeMessage = getSafeErrorMessage(error);

      // Override with specific messages for known cases
      if (error.message?.includes('User already registered')) {
        setError('Email sudah terdaftar! Silakan login atau gunakan email lain.');
      } else if (error.message?.includes('Database belum dikonfigurasi')) {
        setError('Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.');
      } else {
        setError(safeMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Gagal mendaftar dengan Google');
    }
  };

  const handleAppleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Apple signup error:', error);
      setError('Gagal mendaftar dengan Apple');
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
            <h2 className="text-4xl font-bold mb-4 leading-tight">Bergabung Bersama Kami!</h2>
            <p className="text-base leading-relaxed opacity-90 mb-10">
              Mulai jual beli barang bekas dengan mudah dan aman. Dapatkan pengalaman terbaik di platform marketplace terpercaya Indonesia.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Daftar Gratis</span>
              </div>
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Proses Cepat</span>
              </div>
              <div className="flex items-center gap-3 text-base font-medium">
                <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">✓</span>
                <span>Data Aman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="p-10 md:p-12 xl:p-[60px] flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h2 className="text-3xl md:text-[32px] font-bold mb-3 text-[#f9fafb]">Buat Akun Baru</h2>
              <p className="text-[15px] text-[#9ca3af]">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-[#4b5563] font-semibold hover:text-[#374151] hover:underline">
                  Masuk sekarang
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-8">
              {error && (
                <div className="p-3 px-4 bg-[rgba(239,68,68,0.1)] border border-[#ef4444] rounded-lg text-[#ef4444] text-sm mb-5">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nama Anda"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    required
                    className="form-input"
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

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ketik ulang kata sandi"
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-xl p-2 text-[#6b7280] transition-colors duration-300 hover:text-[#f9fafb]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#9ca3af]">
                  <input type="checkbox" required className="w-auto cursor-pointer" />
                  <span className="text-[13px]">
                    Saya setuju dengan{' '}
                    <a href="#" className="text-[#4b5563] font-semibold hover:text-[#374151] hover:underline">
                      Syarat & Ketentuan
                    </a>{' '}
                    dan{' '}
                    <a href="#" className="text-[#4b5563] font-semibold hover:text-[#374151] hover:underline">
                      Kebijakan Privasi
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary btn-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm"></span>
                    Memproses...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            <div className="relative text-center my-8">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#374151]"></div>
              <span className="relative bg-[#1f2937] px-4 text-[#6b7280] text-sm">atau daftar dengan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 bg-[#374151] border border-[#4b5563] text-[#f9fafb] font-medium rounded-lg transition-all duration-300 hover:bg-[#111827] hover:border-[#4b5563]"
                onClick={handleGoogleSignup}
              >
                <svg className="text-[#4285F4] font-bold" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-3 bg-[#374151] border border-[#4b5563] text-[#f9fafb] font-medium rounded-lg transition-all duration-300 hover:bg-[#111827] hover:border-[#4b5563]"
                onClick={handleAppleSignup}
              >
                <svg className="text-white w-[27px] h-[27px] text-[27px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
