import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../../api/venues';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import PaginationControls from '../../components/ui/PaginationControls';
import {
  isNonNegativeNumber,
  isPositiveInteger,
  isRequiredText,
  toTrimmed,
} from '../../utils/validation';

const VENUE_TYPES = ['HALL', 'BANQUET', 'OUTDOOR', 'CONFERENCE_ROOM'];

const emptyForm = {
  name: '', state: '', city: '', country: '', pincode: '', address: '',
  type: 'HALL', capacity: '', description: '', amenities: '',
  pricePerHour: '', rating: '', isActive: true,
};

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', venue?: {} }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0 });

  const load = async (nextPage = page, nextSize = size) => {
    setLoading(true);
    try {
      const r = await getVenues({ page: nextPage, size: nextSize });
      setVenues(r.data.content);
      setPagination({ totalElements: r.data.totalElements, totalPages: r.data.totalPages });
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(page, size); }, [page, size]);

  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (v) => {
    setForm({ ...emptyForm, ...v, capacity: String(v.capacity), pricePerHour: String(v.pricePerHour), rating: String(v.rating || '') });
    setModal({ mode: 'edit', venue: v });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isRequiredText(form.name)) {
      setMsg({ type: 'error', text: 'Venue name is required.' });
      return;
    }
    if (!isRequiredText(form.city)) {
      setMsg({ type: 'error', text: 'City is required.' });
      return;
    }
    if (!isRequiredText(form.state)) {
      setMsg({ type: 'error', text: 'State is required.' });
      return;
    }
    if (!isRequiredText(form.country)) {
      setMsg({ type: 'error', text: 'Country is required.' });
      return;
    }
    if (!isPositiveInteger(form.capacity)) {
      setMsg({ type: 'error', text: 'Capacity must be a positive whole number.' });
      return;
    }
    if (!isNonNegativeNumber(form.pricePerHour)) {
      setMsg({ type: 'error', text: 'Price per hour must be 0 or greater.' });
      return;
    }
    if (toTrimmed(form.rating) && !isNonNegativeNumber(form.rating)) {
      setMsg({ type: 'error', text: 'Rating must be a number between 0 and 5.' });
      return;
    }
    if (toTrimmed(form.rating) && Number(form.rating) > 5) {
      setMsg({ type: 'error', text: 'Rating cannot be greater than 5.' });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      name: toTrimmed(form.name),
      state: toTrimmed(form.state),
      city: toTrimmed(form.city),
      country: toTrimmed(form.country),
      pincode: toTrimmed(form.pincode),
      address: toTrimmed(form.address),
      description: toTrimmed(form.description),
      amenities: toTrimmed(form.amenities),
      capacity: Number(form.capacity),
      pricePerHour: Number(form.pricePerHour),
      rating: toTrimmed(form.rating) ? Number(form.rating) : undefined,
    };
    try {
      if (modal.mode === 'create') await createVenue(payload);
      else await updateVenue(modal.venue.id, payload);
      setMsg({ type: 'success', text: `Venue ${modal.mode === 'create' ? 'created' : 'updated'} successfully.` });
      setModal(null);
      load(page, size);
    } catch (err) {
      const m = err.response?.data?.message || err.response?.data || 'Failed to save venue.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error saving venue.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete venue "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteVenue(id);
      setMsg({ type: 'success', text: `Venue "${name}" deleted.` });
      load(page, size);
    } catch (err) {
      const m = err.response?.data || 'Failed to delete venue.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error deleting.' });
    } finally { setDeletingId(null); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Venue Management</h1>
          <p style={{ color: '#434655', fontSize: '0.9rem' }}>{venues.length} venues</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Venue
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {venues.map((v) => (
            <div key={v.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{v.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#434655', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                    <MapPin size={12} /> {v.city}, {v.state}
                  </div>
                </div>
                <span style={{ background: '#dce1ff', color: '#1E3A8A', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{v.type}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#434655', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '1rem' }}>
                <span>Capacity: <strong>{v.capacity?.toLocaleString()}</strong></span>
                <span>Price/hr: <strong>₹{v.pricePerHour?.toLocaleString()}</strong></span>
                {v.rating && <span>Rating: <strong>{v.rating} ⭐</strong></span>}
                <span>Status: <strong style={{ color: v.isActive ? '#15803d' : '#93000a' }}>{v.isActive ? 'Active' : 'Inactive'}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(v)} className="btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(v.id, v.name)} disabled={deletingId === v.id} className="btn-danger" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Trash2 size={13} /> {deletingId === v.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
          {venues.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#737686' }}>
              <MapPin size={36} style={{ margin: '0 auto 0.75rem', color: '#c3c6d7' }} />
              No venues yet. Add one to get started.
            </div>
          )}
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

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Add Venue' : 'Edit Venue'} onClose={() => setModal(null)} maxWidth="560px">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <F label="Venue Name *" id="v-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grand Hall" />
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.3rem' }}>Type *</label>
                <select id="v-type" required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                  {VENUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <F label="City *" id="v-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Bengaluru" />
              <F label="State *" id="v-state" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Karnataka" />
              <F label="Country *" id="v-country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="India" />
              <F label="Pincode" id="v-pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="560001" />
              <F label="Capacity *" id="v-capacity" type="number" required min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="500" />
              <F label="Price / Hour (₹) *" id="v-price" type="number" required min={0} step="0.01" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} placeholder="2500" />
              <F label="Rating (1-5)" id="v-rating" type="number" min={1} max={5} step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="4.5" />
            </div>
            <F label="Address" id="v-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="MG Road" />
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.3rem' }}>Description</label>
              <textarea id="v-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Short description" style={{ resize: 'vertical' }} />
            </div>
            <F label="Amenities (comma-separated)" id="v-amenities" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="AC, Parking, WiFi" />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#434655' }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Create Venue' : 'Save Changes'}
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
