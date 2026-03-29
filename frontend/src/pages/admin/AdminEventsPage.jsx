import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CalendarDays, AlertCircle, CheckCircle, Truck, DollarSign, Info } from 'lucide-react';
import { getAllEvents, createEvent, updateEvent, cancelEvent, getEventVendors, attachVendorsToEvent, removeVendorFromEvent } from '../../api/events';
import { getVenues } from '../../api/venues';
import { getAllVendors } from '../../api/vendors';
import { getBudgetByEvent, setBudgetForEvent, getExpensesByEvent, addExpense, deleteExpense } from '../../api/budget';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';

const emptyForm = {
  name: '', description: '', eventDate: '', startTime: '', endTime: '',
  venueId: '', ticketPrice: '', maxCapacity: '',
};
const emptyVendorForm = { vendorId: '', purpose: '', cost: '' };
const emptyExpenseForm = { description: '', amount: '' };
const emptyBudgetForm = { totalBudget: '' };

const Tooltip = ({ text, children, align = 'center' }) => {
  const alignStyle = align === 'right' ? { right: '-5px', transform: 'none' } :
                     { left: '50%', transform: 'translateX(-50%)' };
  const arrowStyle = align === 'right' ? { right: '10px' } :
                     { left: '50%', transform: 'translateX(-50%)' };
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }} className="group">
      {children}
      <div 
        className="opacity-0 invisible group-hover:opacity-100 group-hover:visible"
        style={{
           position: 'absolute', bottom: '100%', ...alignStyle,
           marginBottom: '6px', padding: '6px 10px', background: '#191c1e', color: '#fff',
           fontSize: '0.75rem', borderRadius: '6px', width: 'max-content', maxWidth: '240px',
           textAlign: align === 'right' ? 'right' : 'center', transition: 'all 0.2s ease', zIndex: 100,
           lineHeight: '1.4', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
           pointerEvents: 'none'
        }}>
        {text}
        <div style={{ position: 'absolute', top: '100%', border: '5px solid transparent', borderTopColor: '#191c1e', ...arrowStyle }} />
      </div>
    </div>
  );
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  
  const [vendorModal, setVendorModal] = useState(null);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  
  const [budgetModal, setBudgetModal] = useState(null);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [budgetForm, setBudgetForm] = useState(emptyBudgetForm);
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const selectedVenue = venues.find((v) => String(v.id) === String(form.venueId));
  const maxForCapacity = selectedVenue ? selectedVenue.capacity : undefined;

  const load = async () => {
    setLoading(true);
    try {
      const [er, vr, venR] = await Promise.all([getAllEvents(), getVenues(), getAllVendors()]);
      setEvents(er.data);
      setVenues(vr.data);
      setAllVendors(venR.data);
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

  const openVendors = async (ev) => {
     setVendorModal({ event: ev, vendors: [] });
     try {
       const r = await getEventVendors(ev.id);
       setVendorModal({ event: ev, vendors: r.data });
     } catch (err) {
       setMsg({ type: 'error', text: 'Failed to fetch event vendors.' });
     }
  };

  const handleAddVendor = async (e) => {
     e.preventDefault();
     setSaving(true);
     try {
       const payload = {
          vendors: [{
             vendorId: Number(vendorForm.vendorId),
             purpose: vendorForm.purpose,
             cost: Number(vendorForm.cost)
          }]
       };
       await attachVendorsToEvent(vendorModal.event.id, payload);
       const r = await getEventVendors(vendorModal.event.id);
       setVendorModal({ ...vendorModal, vendors: r.data });
       setVendorForm(emptyVendorForm);
     } catch(err) {
        setMsg({ type: 'error', text: 'Failed to assign vendor.' });
     } finally { setSaving(false); }
  };

  const handleRemoveVendor = async (vendorId) => {
     try {
       await removeVendorFromEvent(vendorModal.event.id, vendorId);
       const r = await getEventVendors(vendorModal.event.id);
       setVendorModal({ ...vendorModal, vendors: r.data });
     } catch(err) {
       setMsg({ type: 'error', text: 'Failed to remove vendor.' });
     }
  };

  const openBudgetView = async (ev) => {
     setBudgetModal({ event: ev, budget: null, expenses: [] });
      setBudgetForm(emptyBudgetForm);
     try {
       // Using Promise.allSettled or try/catch individual because budget service might be missing a budget initially
       const [bReq, eReq] = await Promise.allSettled([
           getBudgetByEvent(ev.id),
           getExpensesByEvent(ev.id)
       ]);
       const bData = bReq.status === 'fulfilled' ? bReq.value.data : null;
       const eData = eReq.status === 'fulfilled' ? eReq.value.data : [];
       setBudgetModal({ event: ev, budget: bData, expenses: eData });
       setBudgetForm({ totalBudget: bData?.totalBudget ? String(bData.totalBudget) : '' });
     } catch (err) {
       setMsg({ type: 'error', text: 'Failed to fetch budget details.' });
     }
  };

  const handleSetBudget = async (e) => {
     e.preventDefault();
     if (!budgetForm.totalBudget) {
       setMsg({ type: 'error', text: 'Enter total budget before saving.' });
       return;
     }

     setSaving(true);
     try {
       await setBudgetForEvent(budgetModal.event.id, Number(budgetForm.totalBudget));
       const [bReq, eReq] = await Promise.allSettled([
         getBudgetByEvent(budgetModal.event.id),
         getExpensesByEvent(budgetModal.event.id)
       ]);
       const bData = bReq.status === 'fulfilled' ? bReq.value.data : null;
       const eData = eReq.status === 'fulfilled' ? eReq.value.data : [];
       setBudgetModal({ ...budgetModal, budget: bData, expenses: eData });
       setBudgetForm({ totalBudget: bData?.totalBudget ? String(bData.totalBudget) : budgetForm.totalBudget });
     } catch (err) {
       setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to set total budget.' });
     } finally {
       setSaving(false);
     }
  };

  const handleAddExpense = async (e) => {
     e.preventDefault();
     setSaving(true);
     try {
        await addExpense({
           eventId: budgetModal.event.id,
           description: expenseForm.description,
           amount: Number(expenseForm.amount)
        });
        const [bReq, eReq] = await Promise.allSettled([
           getBudgetByEvent(budgetModal.event.id),
           getExpensesByEvent(budgetModal.event.id)
       ]);
       const bData = bReq.status === 'fulfilled' ? bReq.value.data : null;
       const eData = eReq.status === 'fulfilled' ? eReq.value.data : [];
       setBudgetModal({ ...budgetModal, budget: bData, expenses: eData });
       setExpenseForm(emptyExpenseForm);
     } catch(err) {
        setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add expense.' });
     } finally { setSaving(false); }
  };

  const handleRemoveExpense = async (expenseId) => {
     try {
       await deleteExpense(expenseId);
       const [bReq, eReq] = await Promise.allSettled([
           getBudgetByEvent(budgetModal.event.id),
           getExpensesByEvent(budgetModal.event.id)
       ]);
       const bData = bReq.status === 'fulfilled' ? bReq.value.data : null;
       const eData = eReq.status === 'fulfilled' ? eReq.value.data : [];
       setBudgetModal({ ...budgetModal, budget: bData, expenses: eData });
     } catch(err) {
       setMsg({ type: 'error', text: 'Failed to remove expense.' });
     }
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
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(ev)} className="btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      
                      <button onClick={() => openVendors(ev)} className="btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe' }}>
                        <Truck size={12} /> Vendors
                      </button>

                      <button onClick={() => openBudgetView(ev)} className="btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>
                        <DollarSign size={12} /> Budget
                      </button>

                      {ev.status !== 'CANCELLED' && ev.status !== 'COMPLETED' && (
                        <button onClick={() => handleCancel(ev.id, ev.name)} disabled={cancellingId === ev.id} className="btn-danger" style={{ padding: '0.35rem 0.5rem', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

      {vendorModal && (
        <Modal title={`Manage Vendors: ${vendorModal.event.name}`} onClose={() => setVendorModal(null)} maxWidth="640px">
          {vendorModal.vendors.length > 0 ? (
            <div style={{ marginBottom: '1.5rem', background: '#f7f9fb', borderRadius: '8px', padding: '1rem', border: '1px solid #e1e4ed' }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Assigned Vendors</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {vendorModal.vendors.map(v => (
                     <div key={v.vendorId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e1e4ed' }}>
                        <div>
                           <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.vendorName}</div>
                           <div style={{ fontSize: '0.75rem', color: '#737686' }}>{v.purpose} — ₹{v.cost?.toLocaleString()}</div>
                        </div>
                        <button onClick={() => handleRemoveVendor(v.vendorId)} className="btn-danger" style={{ padding: '0.2rem 0.4rem' }}>
                           <Trash2 size={12} />
                        </button>
                     </div>
                  ))}
               </div>
            </div>
          ) : (
             <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#737686', fontStyle: 'italic', marginBottom: '1rem' }}>No vendors attached to this event yet.</div>
          )}

          <form onSubmit={handleAddVendor} style={{ borderTop: '1px solid #e1e4ed', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Attach New Vendor</h3>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.3rem' }}>Select Vendor *</label>
              <select required value={vendorForm.vendorId} onChange={(e) => setVendorForm({ ...vendorForm, vendorId: e.target.value })} className="input-field">
                <option value="">— Choose —</option>
                {allVendors.filter(av => !vendorModal.vendors.some(evv => evv.vendorId === av.id)).map(av => (
                   <option key={av.id} value={av.id}>{av.name} ({av.serviceType})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.875rem' }}>
              <F label="Purpose *" required value={vendorForm.purpose} onChange={(e) => setVendorForm({ ...vendorForm, purpose: e.target.value })} placeholder="e.g. Stage Decoration" />
              <F label="Cost (₹) *" type="number" required min={0} step="0.01" value={vendorForm.cost} onChange={(e) => setVendorForm({ ...vendorForm, cost: e.target.value })} />
            </div>
            <button type="submit" disabled={saving || !vendorForm.vendorId} className="btn-primary" style={{ padding: '0.625rem', marginTop: '0.5rem' }}>
              {saving ? 'Adding...' : 'Attach Vendor'}
            </button>
          </form>
        </Modal>
      )}

      {budgetModal && (
        <Modal title={`Budget: ${budgetModal.event.name}`} onClose={() => setBudgetModal(null)} maxWidth="640px">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
             <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>
                   💰 Total Budget
                   <Tooltip text="The maximum amount allocated for this event. Set by the admin as a spending limit."><Info size={14} color="#0284c7" /></Tooltip>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0c4a6e' }}>₹{budgetModal.budget?.totalBudget ? Number(budgetModal.budget.totalBudget).toLocaleString() : '0.00'}</div>
             </div>
             <div style={{ padding: '1rem', background: '#fdf4ff', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#a21caf', textTransform: 'uppercase', marginBottom: '4px' }}>
                   📊 Estimated Cost
                   <Tooltip text="The projected cost based on venue and planned vendor expenses. This is an estimate and may change."><Info size={14} color="#c026d3" /></Tooltip>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#701a75' }}>₹{budgetModal.budget?.estimatedCost ? Number(budgetModal.budget.estimatedCost).toLocaleString() : '0.00'}</div>
             </div>
             <div style={{ padding: '1rem', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', marginBottom: '4px' }}>
                   💸 Actual Cost
                   <Tooltip text="The real amount spent so far, calculated from all recorded expenses."><Info size={14} color="#ea580c" /></Tooltip>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c2d12' }}>₹{budgetModal.budget?.actualCost ? Number(budgetModal.budget.actualCost).toLocaleString() : '0.00'}</div>
             </div>
             <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: '4px' }}>
                   📉 Remaining
                   <Tooltip align="right" text="The remaining amount available to spend. Calculated as total budget minus actual cost."><Info size={14} color="#16a34a" /></Tooltip>
                </div>
               <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d' }}>₹{budgetModal.budget?.remainingBudget ? Number(budgetModal.budget.remainingBudget).toLocaleString() : '0.00'}</div>
             </div>
          </div>

           <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
             <div style={{ flex: 1, padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '4px' }}>
                   💵 Revenue
                   <Tooltip text="The total earnings from confirmed bookings for this event."><Info size={14} color="#2563eb" /></Tooltip>
               </div>
               <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>₹{budgetModal.budget?.revenue ? Number(budgetModal.budget.revenue).toLocaleString() : '0.00'}</div>
             </div>
             <div style={{ flex: 1, padding: '1rem', background: '#ecfeff', borderRadius: '8px', border: '1px solid #a5f3fc' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0e7490', textTransform: 'uppercase', marginBottom: '4px' }}>
                   📈 Profit
                   <Tooltip align="right" text="The net gain or loss. Calculated as revenue minus actual cost."><Info size={14} color="#0891b2" /></Tooltip>
               </div>
               <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#164e63' }}>
                 <span style={{ color: Number(budgetModal.budget?.profit) < 0 ? '#991b1b' : '#164e63' }}>
                   ₹{budgetModal.budget?.profit ? Number(budgetModal.budget.profit).toLocaleString() : '0.00'}
                 </span>
               </div>
             </div>
           </div>

           <div style={{ marginBottom: '1.5rem', background: '#fff', borderRadius: '8px', padding: '1rem', border: '1px solid #e1e4ed' }}>
               <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: '#191c1e' }}>Budget Utilization Overview</h3>
               
               <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600, color: '#434655' }}>
                    <span>Actual vs Estimated Cost</span>
                    <span>
                      {Number(budgetModal.budget?.actualCost || 0).toLocaleString()} / {Number(budgetModal.budget?.estimatedCost || 0).toLocaleString()} (est)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#fee2e2', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                     <div style={{ 
                       position: 'absolute', top: 0, left: 0, height: '100%', background: '#dc2626', borderRadius: '8px',
                       width: `${Math.min(((Number(budgetModal.budget?.actualCost || 0) / (Number(budgetModal.budget?.estimatedCost || 1) || 1)) * 100).toFixed(1), 100)}%` 
                     }} />
                  </div>
               </div>

               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600, color: '#434655' }}>
                    <span>Total Limit Used</span>
                    <span>
                      {Number(budgetModal.budget?.totalBudget) > 0 ? `${((Number(budgetModal.budget?.actualCost || 0) / Number(budgetModal.budget?.totalBudget)) * 100).toFixed(1)}% limit used` : "No limit set"}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#e0f2fe', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                     <div style={{ 
                       position: 'absolute', top: 0, left: 0, height: '100%', 
                       background: (Number(budgetModal.budget?.actualCost || 0) > Number(budgetModal.budget?.totalBudget || 0) && Number(budgetModal.budget?.totalBudget || 0) > 0) ? '#dc2626' : '#0369a1',
                       borderRadius: '8px',
                       width: `${Number(budgetModal.budget?.totalBudget) > 0 ? Math.min(((Number(budgetModal.budget?.actualCost || 0) / Number(budgetModal.budget?.totalBudget)) * 100).toFixed(1), 100) : 0}%` 
                     }} />
                  </div>
               </div>
           </div>

           <form onSubmit={handleSetBudget} style={{ borderTop: '1px solid #e1e4ed', borderBottom: '1px solid #e1e4ed', padding: '1rem 0', display: 'grid', gridTemplateColumns: '2fr auto', gap: '0.875rem', alignItems: 'end', marginBottom: '1.5rem' }}>
            <F label="Set Planned Budget (₹)" type="number" required min={0} step="0.01" value={budgetForm.totalBudget} onChange={(e) => setBudgetForm({ totalBudget: e.target.value })} />
            <button type="submit" disabled={saving} className="btn-secondary" style={{ padding: '0.625rem 0.9rem' }}>
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
           </form>

          <div style={{ marginBottom: '1.5rem', background: '#f7f9fb', borderRadius: '8px', padding: '1rem', border: '1px solid #e1e4ed' }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Expenses</h3>
               {budgetModal.expenses.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {budgetModal.expenses.map(exp => (
                       <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e1e4ed' }}>
                          <div>
                             <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{exp.description}</div>
                             <div style={{ fontSize: '0.75rem', color: '#737686' }}>{new Date(exp.createdAt).toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <div style={{ fontWeight: 800, color: '#93000a' }}>- ₹{Number(exp.amount).toLocaleString()}</div>
                             <button onClick={() => handleRemoveExpense(exp.id)} className="btn-danger" style={{ padding: '0.2rem 0.4rem' }}>
                                <Trash2 size={12} />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#737686', fontStyle: 'italic' }}>No expenses recorded.</div>
               )}
          </div>

          <form onSubmit={handleAddExpense} style={{ borderTop: '1px solid #e1e4ed', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Declare Expense</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.875rem' }}>
              <F label="Description *" required value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Paid XYZ Catering" />
              <F label="Amount (₹) *" type="number" required min={0.01} step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            </div>
            <button type="submit" disabled={saving || !expenseForm.description || !expenseForm.amount} className="btn-primary" style={{ padding: '0.625rem', marginTop: '0.5rem' }}>
              {saving ? 'Adding...' : 'Add Expense'}
            </button>
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
