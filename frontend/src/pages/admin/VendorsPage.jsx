import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllVendors, createVendor, updateVendor, deleteVendor } from '../../api/vendors';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import PaginationControls from '../../components/ui/PaginationControls';
import { isValidEmail, isValidPhone } from '../../utils/validation';
import { isNonNegativeNumber, isRequiredText, toTrimmed } from '../../utils/validation';

const emptyForm = {
  name: '',
  serviceType: '',
  contactPerson: '',
  phone: '',
  email: '',
  price: '',
  isActive: true,
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
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
      const { data } = await getAllVendors({ page: nextPage, size: nextSize });
      setVendors(data.content);
      setPagination({ totalElements: data.totalElements, totalPages: data.totalPages });
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(page, size); }, [page, size]);

  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (v) => {
    setForm({
      name: v.name,
      serviceType: v.serviceType,
      contactPerson: v.contactPerson,
      phone: v.phone,
      email: v.email,
      price: v.price?.toString() || '',
      isActive: v.isActive,
    });
    setModal({ mode: 'edit', vendor: v });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const normalizedName = toTrimmed(form.name);
    const normalizedServiceType = toTrimmed(form.serviceType);
    const normalizedContactPerson = toTrimmed(form.contactPerson);
    const normalizedPhone = toTrimmed(form.phone);
    const normalizedEmail = toTrimmed(form.email).toLowerCase();

    if (!isRequiredText(normalizedName)) {
      setMsg({ type: 'error', text: 'Vendor name is required.' });
      return;
    }
    if (!isRequiredText(normalizedServiceType)) {
      setMsg({ type: 'error', text: 'Service type is required.' });
      return;
    }
    if (!isRequiredText(normalizedContactPerson)) {
      setMsg({ type: 'error', text: 'Contact person is required.' });
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      setMsg({ type: 'error', text: 'Please enter a valid phone number (10-20 digits, optional +, spaces, (), -).' });
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setMsg({ type: 'error', text: 'Please enter a valid vendor email address.' });
      return;
    }
    if (!isNonNegativeNumber(form.price)) {
      setMsg({ type: 'error', text: 'Base price must be 0 or greater.' });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      name: normalizedName,
      serviceType: normalizedServiceType,
      contactPerson: normalizedContactPerson,
      phone: normalizedPhone,
      email: normalizedEmail,
      price: Number(form.price),
    };
    try {
      if (modal.mode === 'create') await createVendor(payload);
      else await updateVendor(modal.vendor.id, payload);
      setMsg({ type: 'success', text: `Vendor ${modal.mode === 'create' ? 'created' : 'updated'}.` });
      setModal(null);
      load(page, size);
    } catch (err) {
      const m = err.response?.data?.message || err.response?.data || 'Failed to save vendor.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error saving vendor.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete vendor "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteVendor(id);
      setMsg({ type: 'success', text: `Vendor "${name}" deleted.` });
      load(page, size);
    } catch (err) {
      const m = err.response?.data || 'Failed to delete vendor.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error.' });
    } finally { setDeletingId(null); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Vendor Directory</h1>
          <p style={{ color: '#434655', fontSize: '0.9rem' }}>{vendors.length} vendors available</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Vendor
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
                {['Name', 'Service Type', 'Contact Person', 'Phone', 'Email', 'Base Price', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.73rem', fontWeight: 700, color: '#434655', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendors.map((v, i) => (
                <tr key={v.id} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(195,198,215,0.3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{v.name}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655' }}>
                    <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {v.serviceType}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655' }}>{v.contactPerson}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655' }}>{v.phone}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#434655' }}>{v.email}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{v.price?.toLocaleString()}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem' }}>
                    {v.isActive ? <span style={{ color: '#15803d', fontWeight: 600 }}>Active</span> : <span style={{ color: '#93000a', fontWeight: 600 }}>Inactive</span>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(v)} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(v.id, v.name)} disabled={deletingId === v.id} className="btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Trash2 size={12} /> {deletingId === v.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#737686' }}>No vendors. Add one above.</td></tr>
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

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Add Vendor' : 'Edit Vendor'} onClose={() => setModal(null)} maxWidth="560px">
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <F label="Vendor Name *" id="v-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Awesome Catering" />
            <F label="Service Type *" id="v-type" required value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="Catering" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <F label="Contact Person *" id="v-contact" required value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              <F label="Phone *" id="v-phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <F label="Email *" id="v-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <F label="Base Price (₹) *" id="v-price" type="number" required min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
               <input type="checkbox" id="v-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
               <label htmlFor="v-active" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Is Active Vendor</label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Add Vendor' : 'Save Changes'}
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
