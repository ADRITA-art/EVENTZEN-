import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { createBooking } from '../../api/bookings';
import { isPositiveInteger } from '../../utils/validation';

export default function BookNowModal({ event, onClose, onSuccess }) {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxSeats = event.ticketAvailable || 0;
  const totalPrice = seats * (event.ticketPrice || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPositiveInteger(seats) || seats > maxSeats) {
      setError(`Please enter between 1 and ${maxSeats} seats.`);
      return;
    }
    setLoading(true);
    try {
      await createBooking(event.id, seats);
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Booking failed. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Book Tickets" onClose={onClose}>
      {/* Event summary */}
      <div
        style={{
          background: 'var(--color-surface-low)', borderRadius: '8px',
          padding: '1rem', marginBottom: '1.25rem',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{event.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#434655' }}>
          {event.eventDate} · {event.venueName}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#434655', marginTop: '0.25rem' }}>
          ₹{event.ticketPrice?.toLocaleString()} per ticket · {maxSeats} seats available
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffdad6', color: '#93000a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.375rem' }}>
            Number of Seats
          </label>
          <input
            id="book-seats"
            type="number"
            min={1}
            max={maxSeats}
            value={seats}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              if (Number.isNaN(parsed)) {
                setSeats(1);
                return;
              }
              setSeats(Math.max(1, Math.min(maxSeats, parsed)));
            }}
            className="input-field"
          />
          <p style={{ fontSize: '0.75rem', color: '#737686', marginTop: '0.25rem' }}>Max {maxSeats} seats</p>
        </div>

        {/* Total price display */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#dce1ff', borderRadius: '8px', padding: '0.875rem 1rem',
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E3A8A' }}>Total Amount</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A' }}>
            ₹{totalPrice.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading || maxSeats === 0} className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
