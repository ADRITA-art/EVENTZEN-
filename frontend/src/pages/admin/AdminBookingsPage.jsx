import { useState, useEffect } from 'react';
import { Ticket, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import {
  getAllBookings, updateBookingStatus, getEventBookingSummary,
} from '../../api/bookings';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import PaginationControls from '../../components/ui/PaginationControls';

const STATUS_OPTIONS = ['CONFIRMED', 'CANCELLED'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [summaryModal, setSummaryModal] = useState(null); // { eventId, eventName }
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterEvent, setFilterEvent] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0 });

  const load = async (nextPage = page, nextSize = size) => {
    setLoading(true);
    try {
      const r = await getAllBookings({ page: nextPage, size: nextSize });
      setBookings(r.data.content);
      setPagination({ totalElements: r.data.totalElements, totalPages: r.data.totalPages });
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(page, size); }, [page, size]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateBookingStatus(id, status);
      setMsg({ type: 'success', text: `Booking #${id} status updated to ${status}.` });
      load(page, size);
    } catch (err) {
      const m = err.response?.data?.message || err.response?.data || 'Failed to update status.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error updating status.' });
    } finally { setUpdatingId(null); }
  };

  const openSummary = async (eventId, eventName) => {
    setSummaryModal({ eventId, eventName });
    setSummary(null);
    setSummaryLoading(true);
    try {
      const r = await getEventBookingSummary(eventId);
      setSummary(r.data);
    } catch (_) {}
    setSummaryLoading(false);
  };

  // Unique event names for filter
  const eventNames = [...new Set(bookings.map((b) => b.eventName))].sort();
  const filtered = filterEvent ? bookings.filter((b) => b.eventName === filterEvent) : bookings;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Booking Management</h1>
          <p style={{ color: '#434655', fontSize: '0.9rem' }}>{bookings.length} total bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            id="booking-filter-event"
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="input-field"
            style={{ width: '220px' }}
          >
            <option value="">All Events</option>
            {eventNames.map((n) => <option key={n}>{n}</option>)}
          </select>
          <button onClick={load} className="btn-secondary" style={{ padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: msg.type === 'success' ? '#dcfce7' : '#ffdad6', color: msg.type === 'success' ? '#15803d' : '#93000a', borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner size={48} /></div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-high)' }}>
                {['#', 'User', 'Event', 'Date', 'Seats', 'Total', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#434655', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(195,198,215,0.3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: '#737686' }}>{b.id}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{b.userName}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>
                    <button
                      onClick={() => openSummary(b.eventId, b.eventName)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E3A8A', fontWeight: 600, textDecoration: 'underline', fontSize: '0.875rem', padding: 0 }}
                    >
                      {b.eventName}
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655', whiteSpace: 'nowrap' }}>{b.eventDate}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.numberOfSeats}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{b.totalPrice?.toLocaleString()}</td>
                  <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <select
                      id={`booking-status-${b.id}`}
                      value={b.status}
                      disabled={updatingId === b.id}
                      onChange={(e) => handleStatusChange(b.id, e.target.value)}
                      className="input-field"
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', width: '120px' }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#737686' }}>
                  <Ticket size={36} style={{ margin: '0 auto 0.75rem', color: '#c3c6d7', display: 'block' }} />
                  No bookings found.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <PaginationControls
          page={page}
          size={size}
          totalElements={pagination.totalElements}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onSizeChange={(nextSize) => {
            setSize(nextSize);
            setPage(0);
          }}
        />
      )}

      {/* Event Booking Summary Modal */}
      {summaryModal && (
        <Modal title={`Booking Summary — ${summaryModal.eventName}`} onClose={() => setSummaryModal(null)} maxWidth="380px">
          {summaryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
          ) : summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { label: 'Max Capacity', value: summary.maxCapacity, color: '#1E3A8A' },
                { label: 'Booked Seats', value: summary.totalBookedSeats, color: '#93000a' },
                { label: 'Remaining Seats', value: summary.remainingSeats, color: '#15803d' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-low)', borderRadius: '8px', padding: '0.875rem 1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#434655', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</span>
                </div>
              ))}
              {/* Occupancy bar */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#434655', marginBottom: '0.35rem' }}>
                  <span>Occupancy</span>
                  <span>{summary.maxCapacity > 0 ? Math.round((summary.totalBookedSeats / summary.maxCapacity) * 100) : 0}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg,#1E3A8A,#3650a0)',
                    width: `${summary.maxCapacity > 0 ? Math.min(100, Math.round((summary.totalBookedSeats / summary.maxCapacity) * 100)) : 0}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#737686', textAlign: 'center' }}>Could not load summary.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
