const STATUS_CONFIG = {
  ACTIVE:    { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  SOLD_OUT:  { bg: '#ffdad6', color: '#93000a', label: 'Sold Out' },
  CANCELLED: { bg: '#fef9c3', color: '#a16207', label: 'Cancelled' },
  COMPLETED: { bg: '#e5e7eb', color: '#374151', label: 'Completed' },
  CONFIRMED: { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        display: 'inline-block',
      }}
    >
      {config.label}
    </span>
  );
}
