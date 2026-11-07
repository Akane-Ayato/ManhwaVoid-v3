export default function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const key = type.toLowerCase().replace(/[^a-z]/g, '');
  return (
    <span className={`type-badge type-${key}`}>
      <i aria-hidden="true" />
      {type}
    </span>
  );
}
