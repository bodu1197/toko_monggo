'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import '../login/login.css';

export default function RecoverPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
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
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding (PC only) */}
        <div className="auth-brand">
          <div className="brand-content">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 className="brand-logo" style={{ cursor: 'pointer' }}>🛍️ TokoMonggo</h1>
            </Link>
            <h2 className="brand-title">Lupa Kata Sandi?</h2>
            <p className="brand-description">
              Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan link untuk mereset kata sandi Anda.
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Aman & Terpercaya</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Proses Cepat</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Email Terenkripsi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Recovery Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="form-header">
              <h2 className="form-title">Reset Kata Sandi</h2>
              <p className="form-subtitle">
                Ingat kata sandi?{' '}
                <Link href="/login" className="link-primary">
                  Masuk sekarang
                </Link>
              </p>
            </div>

            {success ? (
              <div className="success-container" style={{
                textAlign: 'center',
                padding: '40px 20px'
              }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '24px'
                }}>
                  ✉️
                </div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  Email Terkirim!
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '24px',
                  lineHeight: '1.6'
                }}>
                  Kami telah mengirimkan link reset password ke <strong>{email}</strong>.
                  <br />
                  Silakan cek inbox atau folder spam Anda.
                </p>
                <div style={{
                  padding: '16px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}>
                    💡 Link akan kadaluarsa dalam 1 jam
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => router.push('/login')}
                >
                  Kembali ke Login
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  style={{ marginTop: '12px' }}
                >
                  Kirim Ulang Email
                </button>
              </div>
            ) : (
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
                    autoFocus
                  />
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginTop: '8px'
                  }}>
                    Masukkan email yang terdaftar di akun Anda
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Link Reset'
                  )}
                </button>

                <div style={{
                  marginTop: '24px',
                  textAlign: 'center'
                }}>
                  <Link href="/login" className="link-primary">
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
