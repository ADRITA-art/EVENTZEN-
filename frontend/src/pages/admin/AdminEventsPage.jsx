import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CalendarDays, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllEvents, createEvent, updateEvent, cancelEvent } from '../../api/events';
import { getVenues } from '../../api/venues';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';

const emptyForm = {
  name: '', description: '', eventDate: '', startTime: '', endTime: '',
  venueId: '', ticketPrice: '', maxCapacity: '',
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // The capacity of the currently selected venue (for dynamic cap)
  const selectedVenue = venues.find((v) => String(v.id) === String(form.venueId));
  const maxForCapacity = selectedVenue ? selectedVenue.capacity : undefined;

  const load = async () => {
    setLoading(true);
    try {
      const [er, vr] = await Promise.all([getAllEvents(), getVenues()]);
      setEvents(er.data);
      setVenues(vr.data);
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (ev) => {
    setForm({
      name: ev.name, description: ev.description || '',
      eventDate: ev.eventDate, startTime: ev.startTime?.slice(0, 5),
      endTime: ev.endTime?.slice(0, 5), venueId: String(ev.venueId),
      ticketPrice: String(ev.ticketPrice), maxCapacity: String(ev.maxCapacity),
    });
    setModal({ mode: 'edit', event: ev });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      venueId: Number(form.venueId),
      ticketPrice: Number(form.ticketPrice),
      maxCapacity: Number(form.maxCapacity),
    };
    try {
      if (modal.mode === 'create') await createEvent(payload);
      else await updateEvent(modal.event.id, payload);
      setMsg({ type: 'success', text: `Event ${modal.mode === 'create' ? 'created' : 'updated'}.` });
      setModal(null);
      load();
    } catch (err) {
      const m = err.response?.data?.message || err.response?.data || 'Failed to save event.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error saving event.' });
    } finally { setSaving(false); }
  };

  const handleCancel = async (id, name) => {
    if (!window.confirm(`Cancel event "${name}"?`)) return;
    setCancellingId(id);
    try {
      await cancelEvent(id);
      setMsg({ type: 'success', text: `Event "${name}" cancelled.` });
      load();
    } catch (err) {
      const m = err.response?.data || 'Failed to cancel event.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error.' });
    } finally { setCancellingId(null); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Event Management</h1>
          <p style={{ color: '#434655', fontSize: '0.9rem' }}>{events.length} events</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Event
        </button>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-high)' }}>
                {['Event', 'Date', 'Venue', 'Capacity', 'Price', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: '#434655', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={ev.id} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(195,198,215,0.3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{ev.name}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655', whiteSpace: 'nowrap' }}>{ev.eventDate}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655' }}>{ev.venueName}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {ev.ticketAvailable}<span style={{ color: '#737686' }}>/{ev.maxCapacity}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{ev.ticketPrice?.toLocaleString()}</td>
                  <td style={{ padding: '0.875rem 1rem' }}><StatusBadge status={ev.status} /></td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(ev)} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      {ev.status !== 'CANCELLED' && ev.status !== 'COMPLETED' && (
                        <button onClick={() => handleCancel(ev.id, ev.name)} disabled={cancellingId === ev.id} className="btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Trash2 size={12} /> {cancellingId === ev.id ? '…' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#737686' }}>No events. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Create Event' : 'Edit Event'} onClose={() => setModal(null)} maxWidth="560px">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <F label="Event Name *" id="ev-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tech Fest 2026" />
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.3rem' }}>Description</label>
              <textarea id="ev-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
              <F label="Date *" id="ev-date" type="date" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              <F label="Start Time *" id="ev-start" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              <F label="End Time *" id="ev-end" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            {/* Venue Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.3rem' }}>Venue *</label>
              <select id="ev-venue" required value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value, maxCapacity: '' })} className="input-field">
                <option value="">— Select a venue —</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.city}) – Cap: {v.capacity}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <F
                label={`Max Capacity *${maxForCapacity ? ` (max ${maxForCapacity})` : ''}`}
                id="ev-capacity"
                type="number" required min={1}
                max={maxForCapacity || undefined}
                value={form.maxCapacity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm({ ...form, maxCapacity: maxForCapacity ? String(Math.min(val, maxForCapacity)) : e.target.value });
                }}
                placeholder={maxForCapacity ? `Up to ${maxForCapacity}` : 'Select venue first'}
              />
              <F label="Ticket Price (₹) *" id="ev-price" type="number" required min={0} step="0.01" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} placeholder="1500" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const F = ({ label, id, ...rest }) => (
  <div>
    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
    <input id={id} className="input-field" {...rest} />
  </div>
);
