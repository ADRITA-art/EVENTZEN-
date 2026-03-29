import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { register } from '../../api/auth';

const ROLES = ['CUSTOMER', 'ADMIN'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Registration failed.';
      setError(typeof msg === 'string' ? msg : 'Registration failed.');
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
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <img src="/logo.png" alt="EventZen Logo" style={{ width: 36, height: 36, borderRadius: '10px' }} />
          <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#1E3A8A' }}>
            EventZen
          </span>
        </div>
        <p style={{ color: '#434655', fontSize: '0.875rem', marginBottom: '2rem' }}>Create your account</p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffdad6', color: '#93000a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { id: 'reg-name',     label: 'Full Name',    type: 'text',     icon: User,  key: 'name',     placeholder: 'Alice Smith' },
            { id: 'reg-email',    label: 'Email',        type: 'email',    icon: Mail,  key: 'email',    placeholder: 'alice@example.com' },
            { id: 'reg-password', label: 'Password',     type: 'password', icon: Lock,  key: 'password', placeholder: 'Min 6 characters' },
          ].map(({ id, label, type, icon: Icon, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.375rem' }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#737686' }} />
                <input
                  id={id}
                  type={type}
                  required
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input-field"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>
          ))}

          {/* Role Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.5rem' }}>
              Account Type
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  style={{
                    flex: 1, padding: '0.625rem', borderRadius: '8px',
                    border: `2px solid ${form.role === r ? '#1E3A8A' : '#c3c6d7'}`,
                    background: form.role === r ? '#dce1ff' : 'white',
                    color: form.role === r ? '#1E3A8A' : '#434655',
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r === 'CUSTOMER' ? '🎟 Customer' : '⚙️ Admin'}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#434655' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1E3A8A', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
