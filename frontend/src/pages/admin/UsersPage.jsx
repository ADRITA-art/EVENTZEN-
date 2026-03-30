import { useState, useEffect } from 'react';
import { Users, Trash2, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { getAllUsers, deleteUser } from '../../api/users';
import Spinner from '../../components/ui/Spinner';
import PaginationControls from '../../components/ui/PaginationControls';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0 });

  const load = async (nextPage = page, nextSize = size) => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page: nextPage, size: nextSize });
      setUsers(res.data.content);
      setPagination({
        totalElements: res.data.totalElements,
        totalPages: res.data.totalPages,
      });
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(page, size); }, [page, size]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteUser(id);
      setMsg({ type: 'success', text: `User "${name}" deleted.` });
      load(page, size);
    } catch (err) {
      const m = err.response?.data || 'Failed to delete user.';
      setMsg({ type: 'error', text: typeof m === 'string' ? m : 'Error deleting user.' });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>User Management</h1>
          <p style={{ color: '#434655', fontSize: '0.9rem' }}>{users.length} registered users</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#737686' }} />
          <input
            id="user-search"
            type="text"
            placeholder="Search users…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2rem', width: '240px' }}
          />
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
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-high)' }}>
                {['ID', 'Name', 'Email', 'Role', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#434655', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(195,198,215,0.3)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#737686' }}>{u.id}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#434655' }}>{u.email}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      background: u.role === 'ADMIN' ? '#dce1ff' : '#dcfce7',
                      color: u.role === 'ADMIN' ? '#1E3A8A' : '#15803d',
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={deletingId === u.id}
                      className="btn-danger"
                      style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Trash2 size={14} />
                      {deletingId === u.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#737686' }}>
              <Users size={36} style={{ margin: '0 auto 0.75rem', color: '#c3c6d7' }} />
              No users match your search.
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
    </div>
  );
}
