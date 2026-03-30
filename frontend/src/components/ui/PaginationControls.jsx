export default function PaginationControls({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  onSizeChange,
}) {
  const hasData = totalElements > 0;
  const start = hasData ? page * size + 1 : 0;
  const end = hasData ? Math.min((page + 1) * size, totalElements) : 0;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginTop: '1rem',
      }}
    >
      <div style={{ fontSize: '0.82rem', color: '#434655' }}>
        Showing {start}-{end} of {totalElements}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="page-size" style={{ fontSize: '0.8rem', color: '#434655' }}>
          Rows:
        </label>
        <select
          id="page-size"
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="input-field"
          style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: '84px' }}
        >
          {[5, 10, 20, 50].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          onClick={() => onPageChange(Math.max(page - 1, 0))}
          disabled={page <= 0}
        >
          Prev
        </button>

        <span style={{ fontSize: '0.82rem', color: '#434655', minWidth: '90px', textAlign: 'center' }}>
          Page {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </span>

        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          onClick={() => onPageChange(page + 1)}
          disabled={totalPages === 0 || page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
