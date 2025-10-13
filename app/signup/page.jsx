'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import '../login/login.css';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
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

  // Generate avatar URL using DiceBear API (free avatar generation service)
  const generateAvatar = (name) => {
    const seed = encodeURIComponent(name || Math.random().toString());
    // Using "avataaars" style - cartoon-style avatars
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok!');
      return;
    }

    if (formData.password.length < 8) {
      setError('Kata sandi minimal 8 karakter!');
      return;
    }

    setLoading(true);

    try {
      // Generate avatar URL
      const avatarUrl = generateAvatar(formData.name);

      // Create auth user with metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: 'https://tokomonggo.com/login',
          data: {
            full_name: formData.name,
            avatar_url: avatarUrl,
          },
        },
      });

      if (signUpError) {
        // Log full error details
        console.error('=== SIGNUP ERROR DETAILS ===');
        console.error('Message:', signUpError.message);
        console.error('Status:', signUpError.status);
        console.error('Full error:', JSON.stringify(signUpError, null, 2));
        console.error('===========================');

        // Better error messages
        if (signUpError.message?.includes('Database error')) {
          console.error('🚨 DATABASE NOT CONFIGURED!');
          console.error('📝 Please run: supabase/migrations/00_complete_tokomonggo_schema.sql');
          console.error('📖 See: URGENT_FIX_DATABASE.md for instructions');
          throw new Error('⚠️ Database belum dikonfigurasi! Buka file URGENT_FIX_DATABASE.md untuk instruksi.');
        }
        throw signUpError;
      }

      if (authData?.user) {
        // Profile is automatically created by database trigger (handle_new_user)
        // If trigger is properly configured, no manual action needed

        alert('✅ Pendaftaran berhasil!\n\n📧 Email verifikasi telah dikirim dari Supabase Auth ke ' + formData.email + '\n\nSilakan cek inbox atau folder spam Anda untuk verifikasi akun.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);

      // User-friendly error messages
      let errorMessage = error.message || 'Terjadi kesalahan saat mendaftar';

      if (error.message?.includes('User already registered')) {
        errorMessage = 'Email sudah terdaftar! Silakan login atau gunakan email lain.';
      } else if (error.message?.includes('Database belum dikonfigurasi')) {
        errorMessage = error.message; // Keep our custom message
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://tokomonggo.com/',
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
          redirectTo: 'https://tokomonggo.com/',
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Apple signup error:', error);
      setError('Gagal mendaftar dengan Apple');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding (PC only) */}
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-logo">🛍️ TokoMonggo</h1>
            <h2 className="brand-title">Bergabung Bersama Kami!</h2>
            <p className="brand-description">
              Mulai jual beli barang bekas dengan mudah dan aman. Dapatkan pengalaman terbaik di platform marketplace terpercaya Indonesia.
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Daftar Gratis</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Proses Cepat</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Data Aman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="form-header">
              <h2 className="form-title">Buat Akun Baru</h2>
              <p className="form-subtitle">
                Sudah punya akun?{' '}
                <Link href="/login" className="link-primary">
                  Masuk sekarang
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="error-message" style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>
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
                <div className="password-input-wrapper">
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
                    className="password-toggle"
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
                <div className="password-input-wrapper">
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
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-wrapper">
                  <input type="checkbox" required />
                  <span style={{ fontSize: '13px' }}>
                    Saya setuju dengan{' '}
                    <a href="#" className="link-primary">
                      Syarat & Ketentuan
                    </a>{' '}
                    dan{' '}
                    <a href="#" className="link-primary">
                      Kebijakan Privasi
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Memproses...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </button>
            </form>

            <div className="divider">
              <span>atau daftar dengan</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="btn btn-social google"
                onClick={handleGoogleSignup}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="btn btn-social apple"
                onClick={handleAppleSignup}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="27" height="27" fill="currentColor">
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
