import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, Ticket, User, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/events',      icon: CalendarDays, label: 'Events' },
  { to: '/my-bookings', icon: Ticket,       label: 'My Bookings' },
  { to: '/profile',     icon: User,         label: 'Profile' },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface)' }}>
      {/* Top Nav */}
      <nav
        className="glass"
        style={{
          position: 'sticky', top: 0, zIndex: 40,
          borderBottom: '1px solid rgba(195,198,215,0.3)',
          padding: '0 2.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="EventZen Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#1E3A8A', lineHeight: '1.2' }}>
              EventZen
            </span>
            <span style={{ fontSize: '0.65rem', color: '#434655', fontWeight: 600, letterSpacing: '0.02em' }}>
              Event Management Made Zen
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', borderRadius: '8px', textDecoration: 'none',
                fontSize: '0.9rem', fontWeight: 500,
                color: isActive ? '#1E3A8A' : '#434655',
                background: isActive ? '#dce1ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <span style={{ fontSize: '0.875rem', color: '#434655' }}>
              Hi, <strong>{user.name}</strong>
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#434655', fontSize: '0.875rem', fontWeight: 500,
              padding: '0.5rem 0.75rem', borderRadius: '8px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Page */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
