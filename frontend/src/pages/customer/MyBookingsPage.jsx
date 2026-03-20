import { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { getMyBookings, cancelBooking } from '../../api/bookings';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    try {
      await cancelBooking(id);
      setMsg({ type: 'success', text: 'Booking cancelled successfully.' });
      load();
    } catch (err) {
      const m = err.response?.data || 'Failed to cancel booking.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error cancelling booking.' });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#191c1e', marginBottom: '0.25rem' }}>My Bookings</h1>
      <p style={{ color: '#434655', marginBottom: '2rem' }}>Manage your event reservations</p>

      {msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: msg.type === 'success' ? '#dcfce7' : '#ffdad6',
          color: msg.type === 'success' ? '#15803d' : '#93000a',
          borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} /> {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Spinner size={48} />
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#434655' }}>
          <Ticket size={48} style={{ margin: '0 auto 1rem', color: '#c3c6d7' }} />
          <p style={{ fontWeight: 600 }}>No bookings yet</p>
          <p style={{ fontSize: '0.875rem' }}>Head to Events to book your first ticket!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((b) => (
            <div key={b.id} className="card animate-fade-in" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{b.eventName}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#434655' }}>
                      <Calendar size={13} color="#3650a0" /> {b.eventDate} · {b.startTime?.slice(0, 5)} – {b.endTime?.slice(0, 5)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#434655' }}>
                      <Ticket size={13} color="#3650a0" /> {b.numberOfSeats} seat{b.numberOfSeats > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    Total: <strong>₹{b.totalPrice?.toLocaleString()}</strong>
                    <span style={{ color: '#737686', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                      (₹{b.pricePerTicket?.toLocaleString()} × {b.numberOfSeats})
                    </span>
                  </div>
                </div>

                {b.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancellingId === b.id}
                    className="btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', alignSelf: 'center' }}
                  >
                    {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
