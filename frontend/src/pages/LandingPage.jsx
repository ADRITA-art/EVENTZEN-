import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingHeader } from '../components/FloatingHeader';

const AccordionItem = ({ item, isActive, onMouseEnter }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      style={{
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: 'pointer',
        height: '480px',
        width: isActive ? '400px' : '58px',
        borderRadius: '28px',
        background: '#000',
        transition: 'width 0.7s cubic-bezier(0.25,1,0.5,1)',
        boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x480/1e293b/ffffff?text=EventZen'; }}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          filter: isActive ? 'brightness(0.9)' : 'grayscale(100%) brightness(0.3)',
          opacity: isActive ? 1 : 0.4,
          transition: 'filter 0.6s ease, opacity 0.6s ease',
        }}
      />

      {/* bottom gradient when active */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }} />

      {/* extra dark coat when inactive */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        opacity: isActive ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }} />

      {/* Active label + description */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
        pointerEvents: isActive ? 'auto' : 'none',
      }}>
        <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'inherit' }}>
          {item.title}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'inherit' }}>
          {item.description}
        </span>
      </div>

      {/* Collapsed vertical label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: '28px',
        opacity: isActive ? 0 : 1,
        transition: 'opacity 0.25s ease',
        pointerEvents: isActive ? 'none' : 'auto',
      }}>
        <span style={{
          color: '#fff', fontWeight: 600, fontSize: '0.75rem',
          letterSpacing: '0.1em', whiteSpace: 'nowrap',
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          fontFamily: 'inherit',
        }}>
          {item.title}
        </span>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [accordionItems, setAccordionItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const loadFeatures = async () => {
      try {
        const response = await fetch('/landing-features.json');
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!ignore && Array.isArray(payload)) {
          setAccordionItems(payload);
        }
      } catch (_error) {
        // Keep the page usable even if the data file cannot be read.
      }
    };

    loadFeatures();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #e0e7ff 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      <FloatingHeader />

      {/* ── HERO SECTION ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        paddingTop: '80px', /* space for existing fixed navbar */
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 72px',
          display: 'flex',
          alignItems: 'center',
          gap: '80px',
          boxSizing: 'border-box',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{
            flexShrink: 0,
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}>

            {/* Eyebrow badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '999px',
              padding: '7px 16px',
              marginBottom: '32px',
            }}>
              <span style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'inline-block',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1d4ed8', letterSpacing: '0.02em' }}>
                Event management, reimagined
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              margin: '0 0 0 0',
              padding: 0,
            }}>
              Plan, Manage<br />& Scale Events
            </h1>
            <h1 style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: '#2563eb',
              margin: '6px 0 0 0',
              padding: 0,
            }}>
              Seamlessly.
            </h1>

            {/* Accent rule */}
            <div style={{
              width: '44px',
              height: '3px',
              borderRadius: '99px',
              background: '#2563eb',
              opacity: 0.3,
              marginTop: '28px',
              marginBottom: '20px',
            }} />

            {/* Body copy */}
            <p style={{
              fontSize: '1rem',
              lineHeight: 1.75,
              color: '#64748b',
              margin: 0,
              padding: 0,
              maxWidth: '360px',
            }}>
              Manage venues, vendors, bookings, and budgets — all in one powerful platform built for modern event planning.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '40px',
            }}>
              <button
                onClick={() => navigate('/register')}
                onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '14px 26px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(15,23,42,0.25)',
                  transition: 'background 0.2s, transform 0.15s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Create Your Account
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/login')}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '14px 26px',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Log In
              </button>
            </div>

            {/* Trust line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginTop: '28px',
            }}>
              {['No credit card required', '14-day free trial', 'Instant setup'].map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>{text}</span>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT COLUMN (accordion) ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minWidth: 0,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
            }}>
              {accordionItems.map((item, index) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isActive={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}