export function Stars({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(5, rating)) * 20;
  return (
    <span role="img" aria-label={`Note : ${rating.toFixed(1)} sur 5`} style={{ position: 'relative', display: 'inline-block', letterSpacing: '-1px', color: 'var(--border-highlight)' }}>
      ★★★★★
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, width: `${pct}%`, overflow: 'hidden', color: 'var(--rating-star)' }}>
        ★★★★★
      </span>
    </span>
  );
}
