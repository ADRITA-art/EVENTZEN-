import { useState } from 'react';
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/users';
import { changePassword } from '../../api/auth';
import { isValidPassword, passwordRuleText } from '../../utils/validation';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState(null);

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile(name);
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      const msg = err.response?.data || 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: typeof msg === 'string' ? msg : 'Error updating profile.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (!isValidPassword(pwForm.newPassword)) {
      setPwMsg({ type: 'error', text: passwordRuleText });
      return;
    }
    setLoading(true);
    try {
      await changePassword(pwForm.oldPassword, pwForm.newPassword);
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      const msg = err.response?.data || 'Failed to change password.';
      setPwMsg({ type: 'error', text: typeof msg === 'string' ? msg : 'Error changing password.' });
    } finally {
      setLoading(false);
    }
  };

  const Alert = ({ msg }) => !msg ? null : (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: msg.type === 'success' ? '#dcfce7' : '#ffdad6',
      color: msg.type === 'success' ? '#15803d' : '#93000a',
      borderRadius: '8px', padding: '0.75rem 1rem',
      fontSize: '0.875rem', marginBottom: '1rem',
    }}>
      {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg.text}
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', color: '#191c1e' }}>My Profile</h1>
      <p style={{ color: '#434655', marginBottom: '2rem', fontSize: '0.9rem' }}>Manage your account details</p>

      {/* Profile info card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1E3A8A,#3650a0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={28} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
            <div style={{ color: '#434655', fontSize: '0.875rem' }}>{user?.email}</div>
            <span style={{
              background: '#dce1ff', color: '#1E3A8A', borderRadius: '4px',
              padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{user?.role}</span>
          </div>
        </div>

        <Alert msg={profileMsg} />
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            id="profile-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            className="input-field"
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.625rem 1.25rem', whiteSpace: 'nowrap' }}>
            Save Name
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Lock size={18} color="#1E3A8A" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Change Password</h2>
        </div>
        <Alert msg={pwMsg} />
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { id: 'old-pw', label: 'Current Password', key: 'oldPassword' },
            { id: 'new-pw', label: 'New Password (min 6 chars)', key: 'newPassword' },
          ].map(({ id, label, key }) => (
            <div key={key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.375rem' }}>
                {label}
              </label>
              <input
                id={id}
                type="password"
                required
                value={pwForm[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                className="input-field"
              />
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem' }}>
            {loading ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
