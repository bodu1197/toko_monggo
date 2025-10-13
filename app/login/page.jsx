'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './login.css';
import { useSupabaseClient } from '../components/SupabaseClientProvider';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabaseClient(); // Get the client instance here
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data?.user) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Email atau kata sandi salah');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://tokomonggo.com/',
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      setError('Gagal masuk dengan Google');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'https://tokomonggo.com/',
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Apple login error:', error);
      setError('Gagal masuk dengan Apple');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding (PC only) */}
        <div className="auth-brand">
          <div className="brand-content">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 className="brand-logo" style={{ cursor: 'pointer' }}>🛍️ TokoMonggo</h1>
            </Link>
            <h2 className="brand-title">Selamat Datang Kembali!</h2>
            <p className="brand-description">
              Platform marketplace terpercaya untuk jual beli barang bekas berkualitas di Indonesia
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Transaksi Aman</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Harga Terbaik</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Mudah Digunakan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="form-header">
              <h2 className="form-title">Masuk ke Akun</h2>
              <p className="form-subtitle">
                Belum punya akun?{' '}
                <Link href="/signup" className="link-primary">
                  Daftar sekarang
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
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input type="checkbox" />
                  <span>Ingat saya</span>
                </label>
                <Link href="/recover" className="link-primary">
                  Lupa kata sandi?
                </Link>
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
                  'Masuk'
                )}
              </button>
            </form>

            <div className="divider">
              <span>atau masuk dengan</span>
            </div>

            <div className="social-login">
              <button
                type="button"
                className="btn btn-social google"
                onClick={handleGoogleLogin}
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
                onClick={handleAppleLogin}
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
