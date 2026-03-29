import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react';
import { login as loginApi } from '../../api/auth';
import { getMe } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPassword, passwordRuleText } from '../../utils/validation';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = form.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(form.password)) {
      setError(passwordRuleText);
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi(normalizedEmail, form.password);
      const { token, role } = res.data;
      // Fetch profile immediately
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      const meRes = await getMe();
      login(token, role, meRes.data);
      navigate(role === 'ADMIN' ? '/admin/users' : '/events', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Invalid credentials. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #3650a0 50%, #10B981 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <img src="/logo.png" alt="EventZen Logo" style={{ width: 36, height: 36, borderRadius: '10px' }} />
          <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#1E3A8A' }}>
            EventZen
          </span>
        </div>
        <p style={{ color: '#434655', fontSize: '0.875rem', marginBottom: '2rem' }}>Sign in to your account</p>

        {error && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#ffdad6', color: '#93000a', borderRadius: '8px',
              padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.375rem' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#737686' }} />
              <input
                id="login-email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                autoComplete="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.375rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#737686' }} />
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                autoComplete="current-password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#434655' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1E3A8A', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
