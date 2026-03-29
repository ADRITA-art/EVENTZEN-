import React, { useState } from 'react';
import { MenuIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function FloatingHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { label: 'Features', href: '#' },
    { label: 'Pricing', href: '#' },
    { label: 'About', href: '#' },
  ];

  return (
    <header
      className={cn(
        'mx-auto w-full max-w-3xl rounded-lg border shadow',
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
    >
      <nav className="mx-auto flex items-center justify-between" style={{ padding: '0.75rem 1rem' }}>
        <div 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', transition: 'background 0.1s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <img src="/logo.png" alt="EventZen Logo" style={{ width: 24, height: 24, borderRadius: '6px' }} />
          <p style={{ fontFamily: 'Manrope, monospace, sans-serif', fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1E3A8A' }}>EventZen</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="hidden-mobile">
          {links.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              style={{ color: '#475569', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
            >
              {link.label}
            </a>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{
              padding: '6px 16px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0f172a',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            Login
          </button>
          
          <button
            onClick={() => setOpen(!open)}
            style={{
              padding: '8px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'var(--mobile-menu-display, none)'
            }}
            className="mobile-only"
          >
            <MenuIcon size={16} />
          </button>
        </div>
      </nav>

      {open && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {links.map((link) => (
              <a key={link.label} href={link.href} style={{ color: '#434655', textDecoration: 'none', fontWeight: 500, padding: '0.5rem 0' }}>
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => { setOpen(false); navigate('/login'); }}
              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setOpen(false); navigate('/register'); }}
              style={{ padding: '8px', border: 'none', borderRadius: '8px', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-only { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </header>
  );
}
