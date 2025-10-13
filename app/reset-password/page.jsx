'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/ssr';
import '../login/login.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
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
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-form-wrapper" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="auth-form-container">
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>⚠️</div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  Link Tidak Valid
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '24px',
                  lineHeight: '1.6'
                }}>
                  {error}
                </p>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => router.push('/recover')}
                >
                  Minta Link Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding (PC only) */}
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-logo">🛍️ TokoMonggo</h1>
            <h2 className="brand-title">Buat Kata Sandi Baru</h2>
            <p className="brand-description">
              Masukkan kata sandi baru untuk akun Anda. Pastikan kata sandi kuat dan mudah diingat.
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Minimal 8 Karakter</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Kombinasi Huruf & Angka</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Aman & Terenkripsi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            <div className="form-header">
              <h2 className="form-title">Reset Kata Sandi</h2>
              <p className="form-subtitle">
                Masukkan kata sandi baru Anda
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
                <label htmlFor="password" className="form-label">
                  Kata Sandi Baru
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    className="form-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginTop: '8px'
                }}>
                  Gunakan minimal 8 karakter dengan kombinasi huruf dan angka
                </p>
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

              {password && confirmPassword && (
                <div style={{
                  padding: '12px 16px',
                  background: password === confirmPassword
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${password === confirmPassword ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  color: password === confirmPassword ? '#10b981' : '#ef4444'
                }}>
                  {password === confirmPassword ? '✓ Kata sandi cocok' : '✗ Kata sandi tidak cocok'}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className={`btn btn-primary btn-full ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
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
