/** Loading placeholder shown while the dataset fetches. Purely decorative — hidden from AT. */
export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton-card"
      className="animate-soft-pulse rounded-2xl border border-line bg-white p-4 shadow-soft"
    >
      <div className="h-4 w-1/3 rounded-full bg-line" />
      <div className="mt-3 h-3 w-2/3 rounded-full bg-line" />
      <div className="mt-2 h-3 w-1/2 rounded-full bg-line" />
    </div>
  );
}
