import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, MapPin, CalendarDays, Ticket, User, LogOut, Zap, LayoutDashboard, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin/users',    icon: Users,         label: 'Users' },
  { to: '/admin/venues',   icon: MapPin,        label: 'Venues' },
  { to: '/admin/vendors',  icon: Truck,         label: 'Vendors' },
  { to: '/admin/events',   icon: CalendarDays,  label: 'Events' },
  { to: '/admin/bookings', icon: Ticket,        label: 'Bookings' },
  { to: '/admin/profile',  icon: User,          label: 'Profile' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '240px', flexShrink: 0,
          background: 'var(--color-surface-card)',
          borderRight: '1px solid rgba(195,198,215,0.3)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          padding: '1.5rem 1rem',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg,#1E3A8A,#3650a0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.125rem', color: '#1E3A8A' }}>
            EventZen
          </span>
        </div>

        {/* Admin badge */}
        <div
          style={{
            background: '#dce1ff', color: '#1E3A8A', borderRadius: '6px',
            padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            display: 'inline-block', marginBottom: '1.5rem',
          }}
        >
          Admin Panel
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.875rem', borderRadius: '8px',
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                color: isActive ? '#1E3A8A' : '#434655',
                background: isActive ? '#dce1ff' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid rgba(195,198,215,0.3)', paddingTop: '1rem' }}>
          {user && (
            <div style={{ fontSize: '0.8rem', color: '#434655', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
              <div style={{ fontWeight: 600, color: '#191c1e' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem' }}>{user.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#93000a', fontSize: '0.875rem', fontWeight: 500,
              padding: '0.5rem 0.875rem', borderRadius: '8px',
              transition: 'background 0.15s ease', width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#ffdad6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
