export default function Spinner({ size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `4px solid #c3c6d7`,
        borderTopColor: '#3650a0',
        borderRadius: '50%',
      }}
      className="animate-spin"
    />
  );
}
