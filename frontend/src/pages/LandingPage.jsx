import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff, #dce1ff)',
      fontFamily: 'Manrope, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <img src="/logo.png" alt="EventZen Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '0.5rem' }}>EventZen</h1>
        <p style={{ fontSize: '1.25rem', color: '#434655', marginBottom: '2rem', fontWeight: 600 }}>
          Event Management Made Zen
        </p>
        <button 
          onClick={() => navigate('/login')}
          style={{
            background: '#1E3A8A', color: '#fff', border: 'none', padding: '1rem 2rem', 
            fontSize: '1.1rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(30, 58, 138, 0.3)', transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Get Started / Login
        </button>
      </div>
    </div>
  );
}
